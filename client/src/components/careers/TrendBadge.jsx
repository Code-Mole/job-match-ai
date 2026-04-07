import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getTrendConfig } from "../../data/careersData";

export default function TrendBadge({ trend, size = "md" }) {
  const cfg = getTrendConfig(trend);
  const Icon =
    trend === "Increasing"
      ? TrendingUp
      : trend === "Decreasing"
        ? TrendingDown
        : Minus;

  return (
    <span
      className={`
      inline-flex items-center gap-1.5 font-semibold rounded-full border
      ${cfg.bg} ${cfg.text} ${cfg.border}
      ${size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"}
    `}
    >
      <Icon size={size === "sm" ? 10 : 11} />
      {cfg.label}
    </span>
  );
}
