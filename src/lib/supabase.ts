import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

/**
 * Custom fetch with a per-request timeout.
 * Prevents the SDK's internal lock from being held indefinitely when a
 * token-refresh or getSession() request hangs on a stale/expired token.
 * Without this, signInWithPassword() waits forever for the lock to release.
 */
const fetchWithTimeout = (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15 s per request

  // If the caller already provided an AbortSignal, propagate its abort too
  if (init?.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener('abort', () => controller.abort());
    }
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
});
