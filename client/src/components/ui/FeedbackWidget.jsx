import { useState, useEffect } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { useToast } from "./Toast";

export default function FeedbackWidget({
  type,
  referenceId,
  prompt = "Was this helpful?",
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);
  const { showToast } = useToast();

  // Check if this item was already rated, to avoid asking twice
  useEffect(() => {
    if (!referenceId) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(
          `/api/feedback/mine/${type}/${referenceId}`,
        );
        if (data.feedback) {
          setRating(data.feedback.rating);
          setSubmitted(true);
        }
      } catch (_) {
        /* ignore */
      } finally {
        setChecking(false);
      }
    })();
  }, [type, referenceId]);

  const submit = async (selectedRating) => {
    setRating(selectedRating);
    try {
      await axios.post("/api/feedback", {
        type,
        referenceId,
        rating: selectedRating,
        comment,
      });
      setSubmitted(true);
      showToast("Thanks for your feedback.", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to submit feedback.",
        "error",
      );
    }
  };

  if (checking) return null;

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span>Thanks for your feedback</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={12}
              className={
                n <= rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {prompt}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => submit(n)}
            className="p-0.5"
          >
            <Star
              size={14}
              className={
                (hover || rating) >= n
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-300 dark:text-slate-600 hover:text-amber-300"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}
