/**
 * Remove duplicate job listings (same Mongo _id or externalId, or same title+company).
 */
export function dedupeJobs(jobs = []) {
  const seen = new Set();
  const result = [];

  for (const job of jobs) {
    if (!job) continue;

    const id = job._id?.toString?.() || job._id || job.id;
    const externalId = job.externalId;
    const fingerprint = `${(job.title || "").toLowerCase().trim()}|${(job.company || "").toLowerCase().trim()}|${(job.location || "").toLowerCase().trim()}`;

    const key = externalId || id || fingerprint;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (fingerprint) seen.add(fingerprint);
    result.push(job);
  }

  return result;
}
