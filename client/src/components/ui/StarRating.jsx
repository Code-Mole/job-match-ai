import { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";

export default function StarRating({
  type,
  referenceId,
  label = "Rate this result",
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (rating) => {
    setSelected(rating);
    try {
      await axios.post("/api/feedback", { type, rating, referenceId });
      setSubmitted(true);
    } catch {
      /* feedback is best-effort */
    }
  };

  if (submitted)
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ Thanks for your feedback!
      </p>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={14}
              className={
                star <= (hovered || selected)
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}
