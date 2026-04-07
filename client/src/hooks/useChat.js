import { useState, useCallback, useRef } from "react";
import axios from "axios";

// Rule-based responses for demo — replaced by real AI in production
const RULE_RESPONSES = {
  "find jobs|job matches|matching jobs": (ctx) =>
    `Based on your profile, here are your top matches:\n\n${
      ctx.jobs
        ?.slice(0, 4)
        .map(
          (j, i) =>
            `${i + 1}. **${j.title} at ${j.company}** — ${j.matchScore ?? 80 - i * 7}% match`,
        )
        .join("\n") ||
      "• **Senior Frontend Dev at Stripe** — 92% match\n• **Full Stack Engineer at Vercel** — 85% match\n• **React Developer at Linear** — 78% match\n• **UI Engineer at Figma** — 71% match"
    }\n\nWant me to explain any of these matches in detail?`,

  "skill|learn|improve|missing": (ctx) =>
    `Based on your profile and top job requirements, here are the highest-impact skills to learn:\n\n1. **GraphQL** — required by 3 of your top matches\n2. **Jest / Testing** — mentioned in 4 job descriptions\n3. **Docker** — fast-growing requirement across all roles\n4. **AWS** — unlocks 40% more senior positions\n\nShall I build a full learning path for any of these?`,

  "career path|progression|grow|advance": () =>
    `Based on your React + TypeScript background, two strong paths stand out:\n\n**Path A — Frontend Specialist**\nJunior Dev → Senior Dev → Staff Engineer\n$60k → $130k → $200k+\n*Timeline: 6–8 years*\n\n**Path B — Full Stack Engineer**\nFrontend → Full Stack → Tech Lead → Engineering Manager\n$90k → $150k → $250k+\n*Timeline: 7–10 years*\n\nPath B pays ~15% more at peak but requires adding Node.js, databases, and system design. Which path interests you?`,

  "compare|versus|vs|difference": () =>
    `Here's a quick comparison of the two most popular paths for your profile:\n\n| | Frontend | Full Stack |\n|---|---|---|\n| Avg salary | $115k | $130k |\n| Demand trend | Increasing | Increasing |\n| Remote friendly | ✓ Yes | ✓ Yes |\n| Time to senior | 4–5 yrs | 5–7 yrs |\n| Breadth required | Moderate | High |\n\n**Verdict:** Full Stack pays ~13% more and has more open roles, but requires significantly broader knowledge. Your current React + TypeScript skills give you a strong foundation for either.`,

  "salary|pay|earn|money|compensation": () =>
    `Here are current salary ranges for your top matched roles:\n\n• **Senior Frontend Developer** — $120k–$150k\n• **Full Stack Engineer** — $130k–$160k\n• **React Developer (Mid)** — $110k–$140k\n• **UI Engineer** — $125k–$155k\n• **ML Engineer** — $150k–$200k\n\nSalaries vary significantly by location. Remote roles from US companies typically pay 10–20% more than local equivalents in other markets.`,

  "resume|cv|upload|parse": () =>
    `To get the most accurate job matches, upload your CV from the **Dashboard** page. I can:\n\n• Extract your skills automatically\n• Update your match scores in real time\n• Identify skill gaps against specific roles\n• Generate a personalised learning path\n\nSupported formats: **PDF**, **DOCX**, and **TXT** (max 10MB).`,

  "hello|hi|hey|help|start": () =>
    `Hi there! I'm your AI Career Assistant. Here's what I can help you with:\n\n• 🔍 **Find jobs** matching your skills\n• 📊 **Analyse skill gaps** for specific roles\n• 🗺️ **Map career paths** and progressions\n• 💰 **Compare salaries** across roles\n• 📚 **Recommend courses** to close skill gaps\n\nWhat would you like to explore first?`,
};

const FALLBACK = `That's a great question! I'm still learning about your specific situation. Here's what I'd suggest:\n\n1. **Upload your CV** on the Dashboard for personalised matches\n2. **Check the Skills page** for your gap analysis\n3. **Browse the Careers page** for market salary data\n\nIs there something specific about job matching, skills, or career paths I can help with?`;

function getRuleBasedResponse(message, context) {
  const lower = message.toLowerCase();
  for (const [pattern, fn] of Object.entries(RULE_RESPONSES)) {
    if (pattern.split("|").some((p) => lower.includes(p))) {
      return fn(context);
    }
  }
  return FALLBACK;
}

export const SUGGESTED_PROMPTS = [
  { id: "p1", text: "Find jobs matching my skills", icon: "🔍" },
  { id: "p2", text: "What skills should I learn?", icon: "📚" },
  { id: "p3", text: "Suggest a career path", icon: "🗺️" },
  { id: "p4", text: "Compare Frontend vs Full Stack", icon: "⚖️" },
  { id: "p5", text: "What salary should I expect?", icon: "💰" },
  { id: "p6", text: "How do I improve my CV?", icon: "📄" },
];

export function useChat(context = {}) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm your AI Career Assistant. I can help you find jobs, analyse skill gaps, map career paths, and compare roles.\n\nWhat would you like to explore?`,
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;

      const userMsg = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        // Try the real AI endpoint first (Step 11 wires Claude here)
        // For now falls through to rule-based response
        let response;
        try {
          const { data } = await axios.post(
            "/api/ai/chat",
            {
              message: text.trim(),
              history: messages
                .slice(-6)
                .map((m) => ({ role: m.role, content: m.content })),
              context,
            },
            { timeout: 8000 },
          );
          response = data.reply;
        } catch {
          // AI service unavailable — use rule-based fallback
          // Small artificial delay makes it feel like it's "thinking"
          await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
          response = getRuleBasedResponse(text, context);
        }

        const assistantMsg = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, context],
  );

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "Chat cleared. How can I help you?",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return { messages, loading, error, sendMessage, clearChat };
}
