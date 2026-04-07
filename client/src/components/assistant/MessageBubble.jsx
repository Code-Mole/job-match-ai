import { useState } from "react";
import { Copy, Check } from "lucide-react";

// Renders **bold** and bullet points in the message
function renderContent(text) {
  return text.split("\n").map((line, i) => {
    // Bold text: **word**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? (
        <strong key={j} className="font-semibold">
          {part}
        </strong>
      ) : (
        part
      ),
    );
    // Table rows
    if (line.startsWith("|")) {
      return (
        <span key={i} className="block font-mono text-xs">
          {rendered}
        </span>
      );
    }
    return (
      <span key={i} className="block">
        {rendered || <br />}
      </span>
    );
  });
}

export default function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyText = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className={`flex gap-3 group ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`
        w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold
        ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
        }
      `}
      >
        {isUser ? "U" : "✦"}
      </div>

      {/* Bubble + timestamp */}
      <div
        className={`flex flex-col gap-1 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`
          relative px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/8 rounded-tl-sm"
          }
        `}
        >
          <div className="whitespace-pre-wrap">
            {renderContent(message.content)}
          </div>

          {/* Copy button — appears on hover for assistant messages */}
          {!isUser && (
            <button
              onClick={copyText}
              className="
                absolute -top-2 -right-2 w-6 h-6 rounded-lg
                bg-white dark:bg-slate-700
                border border-slate-200 dark:border-white/10
                flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity
                text-slate-500 hover:text-blue-600
                shadow-sm
              "
            >
              {copied ? (
                <Check size={11} className="text-emerald-500" />
              ) : (
                <Copy size={11} />
              )}
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 px-1">
          {timeStr}
        </span>
      </div>
    </div>
  );
}
