const SERVER_FETCH_TIMEOUT_MS = 5_000;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/**
 * Server-side reads must not hold a render worker forever when the API is down.
 * The caller still owns the fallback behavior; this helper only bounds the
 * wait and preserves Next's cache options.
 */
export async function fetchWithTimeout(
  input: string,
  init: NextFetchInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SERVER_FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
