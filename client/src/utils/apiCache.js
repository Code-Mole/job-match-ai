const cache = new Map();

/**
 * In-memory GET cache — avoids refetching on every route change.
 */
export async function cachedGet(url, ttlMs = 60_000, fetcher = null) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.data;
  }

  const axios = (await import("axios")).default;
  const { data } = fetcher ? await fetcher() : await axios.get(url);
  cache.set(url, { data, at: Date.now() });
  return data;
}

export function invalidateCache(prefix = "") {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key);
  }
}
