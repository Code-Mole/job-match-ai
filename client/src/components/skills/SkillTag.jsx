import { X } from "lucide-react";

export default function SkillTag({ skill, onRemove, variant = "default" }) {
  const styles = {
    default:
      "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50",
    success:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
    warning:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50",
  }[variant];

  return (
    <span
      className={`
      inline-flex items-center gap-1.5 text-xs font-medium
      px-2.5 py-1 rounded-full border transition-all
      ${styles}
    `}
    >
      {skill}
      {onRemove && (
        <button
          onClick={() => onRemove(skill)}
          className="hover:opacity-60 transition-opacity ml-0.5"
          aria-label={`Remove ${skill}`}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}
