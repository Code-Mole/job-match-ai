/**
 * Stable content fingerprint for cross-provider deduplication.
 */
export function contentFingerprint(job) {
  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s|.-]/g, "");
  return `${norm(job.title)}|${norm(job.company)}|${norm(job.location)}`;
}
