/**
 * Deduplicate job documents by externalId, _id, or title+company+location.
 */
export function dedupeJobs(jobs = []) {
  const seen = new Set();
  const out = [];

  for (const job of jobs) {
    if (!job) continue;
    const id = job._id?.toString?.() || job.externalId;
    const fp = `${(job.title || "").toLowerCase().trim()}|${(job.company || "").toLowerCase().trim()}|${(job.location || "").toLowerCase().trim()}`;
    const key = job.externalId || id || fp;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (fp) seen.add(fp);
    out.push(job);
  }

  return out;
}
