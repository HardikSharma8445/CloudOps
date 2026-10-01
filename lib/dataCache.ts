/**
 * Client-side request layer for the dashboard.
 *
 * Solves three concrete problems that made the UI feel unresponsive:
 *
 * 1. Duplicate concurrent requests. React StrictMode double-invokes effects in
 *    dev, and rapid clicks / the refresh interval could fire the same request
 *    several times over. `inflight` collapses identical concurrent requests
 *    into a single network call.
 *
 * 2. Refetching on every navigation. This module lives in module scope, so the
 *    cache survives client-side route changes. Going EC2 -> Overview -> EC2
 *    reads from memory instead of hitting the server again.
 *
 * 3. Stale responses overwriting fresh ones. Callers get a monotonically
 *    increasing request id they can use to ignore out-of-order responses.
 */

type CacheEntry<T> = {
  data: T;
  /** epoch ms when this entry was stored */
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/** How long a cached client-side response stays fresh. */
export const CLIENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (was 1 minute)

let requestCounter = 0;

/** Monotonic token used by callers to discard out-of-order responses. */
export function nextRequestId(): number {
  return ++requestCounter;
}

export type FetchOptions = {
  /** Skip the cache and force a network round trip. */
  force?: boolean;
  /** Override the default TTL for this key. */
  ttl?: number;
};

/**
 * Fetch JSON with caching and in-flight deduplication.
 *
 * Concurrent calls for the same `key` share one network request. A cached
 * value newer than `ttl` is returned without touching the network.
 */
export async function fetchJson<T>(
  key: string,
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { force = false, ttl = CLIENT_CACHE_TTL } = options;

  if (!force) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.data as T;
    }

    // Someone else is already fetching this exact key - join them instead of
    // opening a second connection.
    const pending = inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const request = (async () => {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as T;

      // Only cache successful payloads so a transient failure does not get
      // pinned in memory for the whole TTL.
      const ok =
        response.ok &&
        (typeof data !== "object" ||
          data === null ||
          (data as { success?: boolean }).success !== false);

      if (ok) {
        cache.set(key, { data, timestamp: Date.now() });
      }

      return data;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}

/** Drop a cached key (or everything) so the next read goes to the network. */
export function invalidate(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
