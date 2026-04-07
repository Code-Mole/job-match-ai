import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles, MessageSquare } from "lucide-react";
import AppLayout from "../../components/layouts/AppLayout";
import MessageBubble from "../../components/assistant/MessageBubble";
import TypingIndicator from "../../components/assistant/TypingIndicator";
import PromptChip from "../../components/assistant/PromptChip";
import { useChat, SUGGESTED_PROMPTS } from "../../hooks/useChat";
import { useAuth } from "../../context/AuthContext";

export default function AssistantPage() {
  const { user } = useAuth();
  const context = { userName: user?.name, skills: user?.skills };
  const { messages, loading, error, sendMessage, clearChat } = useChat(context);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-6">
        {/* ── Page header ──────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-slate-50 mb-1">
                AI Career Assistant
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Ask me anything about your career, skills, or job matches.
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-white/10 transition-all"
          >
            <Trash2 size={14} /> Clear chat
          </button>
        </div>

        {/* ── Chat window ──────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/8 overflow-hidden min-h-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                  Ask me about job matches, skill gaps, career paths, or salary
                  information.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            {error && (
              <div className="text-center text-sm text-red-500 dark:text-red-400 py-2">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <PromptChip
                  key={prompt.id}
                  prompt={prompt}
                  onClick={sendMessage}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Input row */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your career… (Enter to send)"
                  disabled={loading}
                  rows={1}
                  className="
                    w-full px-4 py-3 rounded-xl text-sm resize-none
                    bg-slate-100 dark:bg-slate-800
                    border border-slate-200 dark:border-white/8
                    text-slate-900 dark:text-slate-100
                    placeholder-slate-400 dark:placeholder-slate-500
                    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                    transition-all disabled:opacity-60
                    max-h-32 overflow-y-auto
                  "
                  style={{ lineHeight: "1.5" }}
                  onInput={(e) => {
                    // Auto-grow textarea
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                  }}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="
                  w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center flex-shrink-0
                  transition-all active:scale-95 shadow-lg shadow-blue-500/25
                "
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} className="text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
