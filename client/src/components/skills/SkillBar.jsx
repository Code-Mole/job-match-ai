import { CheckCircle2, Circle, Plus } from "lucide-react";

/**
 * A single skill row showing:
 *  - Status dot (have / missing / learning)
 *  - Skill name
 *  - Animated progress bar
 *  - Percentage or "Add" button
 */
export default function SkillBar({
  skill,
  proficiency = 0, // 0–100
  status = "missing", // 'have' | 'missing' | 'learning'
  onAdd,
  priority,
}) {
  const config = {
    have: {
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
      pct: "text-emerald-600 dark:text-emerald-400",
      label: null,
    },
    missing: {
      dot: "bg-amber-400",
      bar: "bg-amber-400",
      pct: "text-amber-600 dark:text-amber-400",
      label:
        priority === "high"
          ? {
              text: "High priority",
              cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700/50",
            }
          : priority === "medium"
            ? {
                text: "Medium",
                cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-700/50",
              }
            : null,
    },
    learning: {
      dot: "bg-blue-500",
      bar: "bg-blue-500",
      pct: "text-blue-600 dark:text-blue-400",
      label: {
        text: "In progress",
        cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700/50",
      },
    },
  }[status];

  return (
    <div className="flex items-center gap-3 group">
      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />

      {/* Skill name */}
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 w-36 flex-shrink-0 truncate">
        {skill}
      </span>

      {/* Priority / in-progress badge */}
      {config.label && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${config.label.cls}`}
        >
          {config.label.text}
        </span>
      )}

      {/* Progress bar — flex-1 fills remaining space */}
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
          style={{ width: `${proficiency}%` }}
        />
      </div>

      {/* Percentage or Add button */}
      {status === "missing" && onAdd ? (
        <button
          onClick={() => onAdd(skill)}
          className="
            flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400
            opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0
            hover:text-blue-700 font-medium
          "
        >
          <Plus size={12} /> Add
        </button>
      ) : (
        <span
          className={`text-xs font-bold w-8 text-right flex-shrink-0 ${config.pct}`}
        >
          {proficiency > 0 ? `${proficiency}%` : "0%"}
        </span>
      )}
    </div>
  );
}
