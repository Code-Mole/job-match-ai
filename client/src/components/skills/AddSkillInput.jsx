import { useState, useRef, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { SKILL_SUGGESTIONS } from "../../data/skillsData";

export default function AddSkillInput({
  existingSkills = [],
  onAdd,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSugg] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // Filter suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      setSugg([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const filtered = SKILL_SUGGESTIONS.filter(
      (s) => s.toLowerCase().includes(q) && !existingSkills.includes(s),
    ).slice(0, 8);
    setSugg(filtered);
    setOpen(filtered.length > 0);
  }, [query, existingSkills]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (skill) => {
    onAdd(skill);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      // Allow adding custom skills not in the suggestions list
      handleSelect(query.trim());
    }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setOpen(true)}
            placeholder="Type a skill name and press Enter…"
            disabled={disabled}
            className="input-field pl-9 text-sm"
          />
        </div>
        <button
          onClick={() => query.trim() && handleSelect(query.trim())}
          disabled={!query.trim() || disabled}
          className="btn-primary px-4 py-2.5 flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Suggestions dropdown */}
      {open && (
        <div
          className="
          absolute top-full left-0 right-0 mt-1 z-20
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-white/10
          rounded-xl shadow-xl shadow-slate-900/10
          overflow-hidden
        "
        >
          {suggestions.map((skill) => (
            <button
              key={skill}
              onClick={() => handleSelect(skill)}
              className="
                w-full text-left px-4 py-2.5 text-sm
                text-slate-700 dark:text-slate-300
                hover:bg-blue-50 dark:hover:bg-blue-900/20
                hover:text-blue-700 dark:hover:text-blue-400
                transition-colors first:rounded-t-xl last:rounded-b-xl
              "
            >
              {skill}
            </button>
          ))}
          {query.trim() &&
            !suggestions.find(
              (s) => s.toLowerCase() === query.toLowerCase(),
            ) && (
              <button
                onClick={() => handleSelect(query.trim())}
                className="
                w-full text-left px-4 py-2.5 text-sm border-t
                border-slate-100 dark:border-white/5
                text-blue-600 dark:text-blue-400
                hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
              "
              >
                <Plus size={13} className="inline mr-1" />
                Add "{query.trim()}" as custom skill
              </button>
            )}
        </div>
      )}
    </div>
  );
}
