export default function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
        ✦
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.9s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
