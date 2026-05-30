import express from "express";
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import Job from "../models/Job.js";
import { protect } from "../middleware/auth.js";
import Feedback from "../models/Feedback.js";

const router = express.Router();

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

function buildSystemPrompt(user) {
  return `You are an expert AI Career Assistant embedded in JobMatch AI, a job matching platform for every industry.

USER PROFILE:
- Name: ${user.name}
- Skills: ${user.skills?.length ? user.skills.join(", ") : "None added yet"}
- Years of experience: ${user.yearsExp || "Unknown"}
- CV uploaded: ${user.cvParsed ? "Yes" : "No"}
- Location: ${user.location || "Not specified"}

YOUR ROLE:
You help users with career decisions, job searching across sectors (not only technology), skill development, and salary negotiation. Personalise responses using the profile above.

GUIDELINES:
- Be concise, specific, and actionable
- Reference the user's actual skills when giving advice
- Use markdown: **bold** for emphasis, bullet lists for steps
- If they have no skills yet, encourage uploading a CV from the Dashboard
- Keep responses under 300 words unless asked for detail
- End with a specific follow-up question or next action`;
}

function getGroqCloudApiKey() {
  return process.env.GROQCLOUD_API_KEY || process.env.GROQ_API_KEY || null;
}

function hasAnyChatProvider() {
  return Boolean(
    process.env.OPENAI_API_KEY ||
      process.env.XAI_API_KEY ||
      getGroqCloudApiKey() ||
      (process.env.ANTHROPIC_API_KEY &&
        process.env.CHAT_PROVIDER?.toLowerCase() === "anthropic"),
  );
}

/** Ordered providers to try; Groq Cloud is appended as fallback when configured. */
function buildChatProviderChain() {
  const explicit = process.env.CHAT_PROVIDER?.toLowerCase();
  const groqKey = getGroqCloudApiKey();
  const chain = [];

  const add = (p) => {
    if (!chain.includes(p)) chain.push(p);
  };

  if (explicit === "groq" || explicit === "groqcloud") {
    if (groqKey) add("groq");
    return chain;
  }
  if (explicit === "openai" && process.env.OPENAI_API_KEY) add("openai");
  else if (explicit === "grok" && process.env.XAI_API_KEY) add("grok");
  else if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    add("anthropic");
    return chain;
  } else if (!explicit) {
    if (process.env.OPENAI_API_KEY) add("openai");
    if (process.env.XAI_API_KEY) add("grok");
  }

  if (groqKey) add("groq");

  return chain;
}

function getProviderConfig(provider) {
  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) return null;
      return {
        kind: "openai-compatible",
        label: "OpenAI",
        baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      };
    case "grok":
      if (!process.env.XAI_API_KEY) return null;
      return {
        kind: "openai-compatible",
        label: "Grok",
        baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
        apiKey: process.env.XAI_API_KEY,
        model: process.env.XAI_CHAT_MODEL || "grok-2-latest",
      };
    case "groq": {
      const apiKey = getGroqCloudApiKey();
      if (!apiKey) return null;
      return {
        kind: "openai-compatible",
        label: "Groq Cloud",
        baseUrl:
          process.env.GROQCLOUD_BASE_URL ||
          process.env.GROQ_BASE_URL ||
          "https://api.groq.com/openai/v1",
        apiKey,
        model:
          process.env.GROQCLOUD_CHAT_MODEL ||
          process.env.GROQ_CHAT_MODEL ||
          "llama-3.3-70b-versatile",
      };
    }
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) return null;
      return { kind: "anthropic", label: "Anthropic" };
    default:
      return null;
  }
}

function isBillingOrQuotaError(err) {
  const raw = (err?.message || String(err)).toLowerCase();
  return /credit balance|billing|quota|insufficient|exceeded|payment required|no credits|rate limit|429|402/.test(
    raw,
  );
}

function parseProviderError(err, provider) {
  const raw = err?.message || String(err);
  try {
    const parsed = JSON.parse(raw);
    const msg = parsed?.error?.message || parsed?.message;
    if (msg) {
      if (/credit balance|billing|quota|insufficient/i.test(msg)) {
        if (getGroqCloudApiKey()) {
          return `Your ${provider} account has no credits. Groq Cloud fallback was attempted — check GROQCLOUD_API_KEY in server/.env.`;
        }
        return `Your ${provider} account has no credits. Add GROQCLOUD_API_KEY (free tier at console.groq.com) in server/.env.`;
      }
      return msg;
    }
  } catch {
    /* not JSON */
  }
  if (/credit balance|billing|quota/i.test(raw)) {
    if (getGroqCloudApiKey()) {
      return "Primary AI provider billing issue. Verify GROQCLOUD_API_KEY is valid.";
    }
    return "AI provider billing issue. Add GROQCLOUD_API_KEY in server/.env for Groq Cloud fallback.";
  }
  return raw;
}

async function runOpenAICompatibleChat({ res, config, systemPrompt, messages }) {
  let streamed = await streamOpenAICompatible({
    res,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    systemPrompt,
    messages,
  });
  if (!streamed) {
    const text = await completeOpenAICompatible({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      systemPrompt,
      messages,
    });
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
      streamed = true;
    }
  }
  return streamed;
}

/** Try each provider in order; fall back to Groq Cloud on billing/quota errors. */
async function runChatWithFallback({ res, systemPrompt, messages }) {
  const chain = buildChatProviderChain().filter((p) => getProviderConfig(p));
  if (!chain.length) {
    throw new Error(
      "No AI provider configured. Set OPENAI_API_KEY, XAI_API_KEY, or GROQCLOUD_API_KEY in server/.env.",
    );
  }

  let lastErr;
  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    const config = getProviderConfig(provider);
    try {
      if (config.kind === "anthropic") {
        let streamed = await streamAnthropicChat({ res, systemPrompt, messages });
        if (!streamed) {
          const text = await completeAnthropicChat({ systemPrompt, messages });
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
        return;
      }
      await runOpenAICompatibleChat({ res, config, systemPrompt, messages });
      return;
    } catch (err) {
      lastErr = err;
      const canRetry = isBillingOrQuotaError(err) && i < chain.length - 1;
      if (canRetry) {
        console.warn(
          `[chat] ${config.label} failed (${err.message?.slice(0, 80)}…), trying ${chain[i + 1]}…`,
        );
        continue;
      }
      throw Object.assign(err, { provider });
    }
  }
  throw lastErr;
}

/**
 * OpenAI-compatible SSE stream (works for OpenAI + xAI Grok chat/completions).
 */
async function streamOpenAICompatible({
  res,
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  messages,
}) {
  let sent = false;
  const apiRes = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!apiRes.ok) {
    const errText = await apiRes.text().catch(() => "");
    throw new Error(errText || `${apiRes.status} ${apiRes.statusText}`);
  }

  const reader = apiRes.body?.getReader();
  if (!reader) throw new Error("No response body from model API");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const rawLine of parts) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const text = json.choices?.[0]?.delta?.content;
        if (text) {
          sent = true;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } catch {
        // ignore partial JSON lines
      }
    }
  }
  return sent;
}

async function streamAnthropicChat({ res, systemPrompt, messages }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model =
    process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

  const stream = await client.messages.stream({
    model,
    max_tokens: 800,
    system: systemPrompt,
    messages,
  });

  let sent = false;
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
      const text = chunk.delta.text;
      if (text) {
        sent = true;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
  }
  return sent;
}

/** Non-streaming fallback when SSE yields no tokens */
async function completeOpenAICompatible({ baseUrl, apiKey, model, systemPrompt, messages }) {
  const apiRes = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  if (!apiRes.ok) {
    const errText = await apiRes.text().catch(() => "");
    throw new Error(errText || `${apiRes.status} ${apiRes.statusText}`);
  }
  const json = await apiRes.json();
  return json.choices?.[0]?.message?.content || "";
}

async function completeAnthropicChat({ systemPrompt, messages }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  const msg = await client.messages.create({
    model,
    max_tokens: 800,
    system: systemPrompt,
    messages,
  });
  const block = msg.content?.find((b) => b.type === "text");
  return block?.text || "";
}

// ── POST /api/ai/chat — streaming assistant (OpenAI → Grok → Groq Cloud fallback) ──
router.post("/chat", protect, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    if (!hasAnyChatProvider()) {
      return res.status(503).json({
        message:
          "No AI provider configured. Set OPENAI_API_KEY, XAI_API_KEY, or GROQCLOUD_API_KEY in server/.env. Optional: CHAT_PROVIDER=openai|grok|groq.",
      });
    }

    const systemPrompt = buildSystemPrompt(user);
    const messages = [
      ...history.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.CLIENT_URL || "http://localhost:5173",
    );
    res.flushHeaders();

    try {
      await runChatWithFallback({ res, systemPrompt, messages });
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      const friendly = parseProviderError(err, err.provider || "AI");
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: friendly })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }
      err.message = friendly;
      err.status = err.status || 502;
      throw err;
    }
  } catch (err) {
    if (err.status === 401) {
      return res.status(401).json({
        message:
          "Invalid API key for the configured AI provider. Check your .env file.",
      });
    }
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    return res.status(status).json({
      message: err.message || "AI chat request failed.",
    });
  }
});

function jobPayloadForAi(job) {
  if (!job) return null;
  return {
    _id: String(job._id),
    title: job.title || "",
    description: job.description || "",
    skills: job.skills || [],
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    level: job.level || "",
    yearsExp: job.yearsExp ?? 0,
    industry: job.industry || "",
  };
}

// ── POST /api/ai/skill-gap ────────────────────────────────────────────────────
router.post("/skill-gap", protect, async (req, res, next) => {
  try {
    let job = req.body.job;
    const jobId = req.body.job_id || job?._id;

    if (jobId) {
      const dbJob = await Job.findById(jobId).lean();
      if (dbJob) {
        job = { ...jobPayloadForAi(dbJob), ...(job || {}) };
      }
    }

    if (!job?.title && !job?.skills?.length) {
      return res.status(400).json({
        message: "Job not found or missing job details for gap analysis.",
      });
    }

    const { data } = await axios.post(
      `${AI_URL}/skill-gap`,
      {
        user_skills: req.body.user_skills || req.user.skills || [],
        job_id: jobId ? String(jobId) : undefined,
        job: jobPayloadForAi(job),
      },
      { timeout: 20000 },
    );
    res.json(data);
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "AI service unavailable." });
    }
    if (err.response?.data?.error) {
      return res.status(err.response.status || 502).json({
        message: err.response.data.error,
      });
    }
    next(err);
  }
});

// ── POST /api/ai/parse-text ───────────────────────────────────────────────────
router.post("/parse-text", protect, async (req, res, next) => {
  try {
    const { data } = await axios.post(`${AI_URL}/parse-text`, req.body, {
      timeout: 10000,
    });
    res.json(data);
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "AI service unavailable." });
    }
    next(err);
  }
});

// ── POST /api/ai/feedback ─────────────────────────────────────────────────────
router.post("/feedback", protect, async (req, res, next) => {
  try {
    const { type, rating, comment, referenceId } = req.body;
    if (!type || !rating) {
      return res.status(400).json({ message: "type and rating required." });
    }
    await Feedback.create({
      user: req.user._id,
      type,
      rating,
      comment,
      referenceId,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
