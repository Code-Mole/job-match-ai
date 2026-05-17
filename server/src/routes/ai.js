import express from "express";
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
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

function resolveChatProvider() {
  const explicit = process.env.CHAT_PROVIDER?.toLowerCase();
  if (explicit === "openai" || explicit === "grok" || explicit === "anthropic") {
    return explicit;
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.XAI_API_KEY) return "grok";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
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

// ── POST /api/ai/chat — streaming career assistant (OpenAI, Grok, or Claude) ──
router.post("/chat", protect, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required." });
    }

    const provider = resolveChatProvider();
    if (!provider) {
      return res.status(503).json({
        message:
          "No AI provider configured. Set OPENAI_API_KEY (ChatGPT), XAI_API_KEY (Grok), or ANTHROPIC_API_KEY (Claude). Optional: CHAT_PROVIDER=openai|grok|anthropic.",
      });
    }

    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        message: "CHAT_PROVIDER or auto-selection chose OpenAI but OPENAI_API_KEY is missing.",
      });
    }
    if (provider === "grok" && !process.env.XAI_API_KEY) {
      return res.status(503).json({
        message: "CHAT_PROVIDER or auto-selection chose Grok but XAI_API_KEY is missing.",
      });
    }
    if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        message:
          "CHAT_PROVIDER or auto-selection chose Anthropic but ANTHROPIC_API_KEY is missing.",
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
      let streamed = false;

      if (provider === "openai") {
        streamed = await streamOpenAICompatible({
          res,
          baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
          systemPrompt,
          messages,
        });
        if (!streamed) {
          const text = await completeOpenAICompatible({
            baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
            systemPrompt,
            messages,
          });
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } else if (provider === "grok") {
        streamed = await streamOpenAICompatible({
          res,
          baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
          apiKey: process.env.XAI_API_KEY,
          model: process.env.XAI_CHAT_MODEL || "grok-2-latest",
          systemPrompt,
          messages,
        });
        if (!streamed) {
          const text = await completeOpenAICompatible({
            baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
            apiKey: process.env.XAI_API_KEY,
            model: process.env.XAI_CHAT_MODEL || "grok-2-latest",
            systemPrompt,
            messages,
          });
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } else {
        streamed = await streamAnthropicChat({ res, systemPrompt, messages });
        if (!streamed) {
          const text = await completeAnthropicChat({ systemPrompt, messages });
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({
            error: err.message || "Stream interrupted.",
          })}\n\n`,
        );
        return res.end();
      }
      throw err;
    }
  } catch (err) {
    if (err.status === 401) {
      return res.status(401).json({
        message:
          "Invalid API key for the configured AI provider. Check your .env file.",
      });
    }
    next(err);
  }
});

// ── POST /api/ai/skill-gap ────────────────────────────────────────────────────
router.post("/skill-gap", protect, async (req, res, next) => {
  try {
    const { data } = await axios.post(
      `${AI_URL}/skill-gap`,
      {
        user_skills: req.user.skills || [],
        ...req.body,
      },
      { timeout: 12000 },
    );
    res.json(data);
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "AI service unavailable." });
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
