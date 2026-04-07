export default function PromptChip({ prompt, onClick, disabled }) {
  return (
    <button
      onClick={() => !disabled && onClick(prompt.text)}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 text-xs font-medium
        px-3.5 py-2 rounded-full border transition-all duration-150 whitespace-nowrap
        border-slate-200 dark:border-white/10
        text-slate-600 dark:text-slate-400
        bg-white dark:bg-slate-800
        hover:border-blue-400 dark:hover:border-blue-500
        hover:text-blue-600 dark:hover:text-blue-400
        hover:bg-blue-50 dark:hover:bg-blue-900/20
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
      `}
    >
      <span>{prompt.icon}</span>
      {prompt.text}
    </button>
  );
}
