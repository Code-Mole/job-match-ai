import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

// Accepted file types
const ACCEPTED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ACCEPTED_EXT = ".pdf, .docx, .txt";

export default function CVUpload({ onUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const processFile = useCallback(
    async (f) => {
      if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(pdf|docx|txt)$/i)) {
        setErrorMsg("Please upload a PDF, DOCX, or TXT file.");
        setStatus("error");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        // 10MB limit
        setErrorMsg("File must be under 10MB.");
        setStatus("error");
        return;
      }

      setFile(f);
      setStatus("uploading");
      setErrorMsg("");

      // Simulate upload progress (will be replaced by real API in Step 9)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 80));
        setProgress(i);
      }

      try {
        // Placeholder — real upload logic added in Step 9
        await new Promise((r) => setTimeout(r, 400));
        setStatus("success");
        onUpload?.(f);
      } catch {
        setStatus("error");
        setErrorMsg("Upload failed. Please try again.");
      }
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setErrorMsg("");
  };

  // ── Success state ────────────────────────────────────────
  if (status === "success") {
    return (
      <div
        className="
        relative rounded-2xl p-6
        bg-emerald-50 dark:bg-emerald-900/20
        border border-emerald-200 dark:border-emerald-800/50
        flex items-center gap-4
      "
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
          <CheckCircle
            size={24}
            className="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
            CV uploaded successfully!
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5 truncate">
            {file?.name}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            AI analysis complete — job matches updated below.
          </p>
        </div>
        <button
          onClick={reset}
          className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // ── Upload in progress ───────────────────────────────────
  if (status === "uploading") {
    return (
      <div className="rounded-2xl p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <FileText size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate">
              {file?.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Analyzing with AI…
            </p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {progress}%
          </span>
        </div>
        <div className="h-1.5 bg-blue-200 dark:bg-blue-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // ── Idle / Error state ───────────────────────────────────
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl p-8 text-center cursor-pointer
        border-2 border-dashed transition-all duration-200
        ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-600/10 scale-[1.01]"
            : status === "error"
              ? "border-red-300 dark:border-red-700/50 bg-red-50 dark:bg-red-900/10"
              : "border-slate-300 dark:border-white/12 bg-white dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-500/50 dark:hover:bg-blue-600/5"
        }
      `}
      onClick={() => document.getElementById("cv-file-input").click()}
    >
      <input
        id="cv-file-input"
        type="file"
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Icon */}
      <div
        className={`
        w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center
        ${
          dragOver
            ? "bg-blue-100 dark:bg-blue-600/20"
            : status === "error"
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-slate-100 dark:bg-slate-700/60"
        }
      `}
      >
        {status === "error" ? (
          <AlertCircle size={28} className="text-red-500" />
        ) : (
          <Upload
            size={28}
            className={
              dragOver ? "text-blue-600" : "text-slate-400 dark:text-slate-500"
            }
          />
        )}
      </div>

      {status === "error" ? (
        <>
          <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">
            {errorMsg}
          </p>
          <p className="text-xs text-red-500 dark:text-red-500">
            Click to try again
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
            {dragOver ? "Drop your CV here" : "Upload Your CV"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Drag & drop or click to browse
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-full">
            <FileText size={11} />
            PDF, DOCX, TXT — max 10MB
          </div>
        </>
      )}
    </div>
  );
}
