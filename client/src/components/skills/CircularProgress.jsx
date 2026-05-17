import { useEffect, useRef, useState } from "react";

/**
 * Animated circular progress ring.
 *
 * Props:
 *   score      — number 0–100
 *   size       — svg size in px (default 180)
 *   strokeWidth — ring thickness (default 12)
 *   label      — text below the percentage
 *   sublabel   — smaller text below label
 *   animate    — whether to animate on mount (default true)
 */
export default function CircularProgress({
  score = 0,
  size = 180,
  strokeWidth = 12,
  label = "Overall Match",
  sublabel = "",
  animate = true,
}) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const animRef = useRef(null);

  // Animate the number counting up
  useEffect(() => {
    if (!animate) {
      setDisplayed(score);
      return;
    }
    const duration = 1000; // ms
    const start = performance.now();
    const from = displayed;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (score - from) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayed / 100) * circumference;
  const center = size / 2;

  // Color thresholds
  const color =
    displayed >= 70
      ? "#10b981" // emerald
      : displayed >= 45
        ? "#f59e0b" // amber
        : "#ef4444"; // red

  const trackColor = "var(--tw-ring-color, #e2e8f0)";

  // Glow intensity scales with score
  const glowOpacity = (displayed / 100) * 0.3;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Subtle outer glow ring */}
          <circle
            cx={center}
            cy={center}
            r={radius + strokeWidth / 2 + 4}
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity={glowOpacity}
          />

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress arc — rotated so it starts at top */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: "stroke-dashoffset 0.05s" }}
          />

          {/* Centre: percentage */}
          <text
            x={center}
            y={center - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.18}
            fontWeight="700"
            fontFamily="Syne, system-ui, sans-serif"
            fill={color}
          >
            {displayed}%
          </text>

          {/* Centre: "readiness" label */}
          <text
            x={center}
            y={center + size * 0.12}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.07}
            fontFamily="DM Sans, system-ui, sans-serif"
            className="fill-slate-500 dark:fill-slate-400"
            fill="currentColor"
          >
            readiness
          </text>
        </svg>
      </div>

      {/* Label below ring */}
      {label && (
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">
          {label}
        </p>
      )}
      {sublabel && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 text-center">
          {sublabel}
        </p>
      )}
    </div>
  );
}
