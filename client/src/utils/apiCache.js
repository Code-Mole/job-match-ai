const cache = new Map();

/**
 * In-memory GET cache — avoids refetching on every route change.
 */
export async function cachedGet(url, ttlMs = 60_000, fetcher = null, cacheKey = null) {
  const key = cacheKey || url;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return hit.data;
  }

  const axios = (await import("axios")).default;
  const { data } = fetcher ? await fetcher() : await axios.get(url);
  cache.set(key, { data, at: Date.now() });
  return data;
}

export function invalidateCache(prefix = "") {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key);
  }
}
