import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

/**
 * Custom fetch with a per-request timeout.
 * This is now purely a network safety-net — lock contention is handled
 * architecturally in AuthContext (single onAuthStateChange listener,
 * no manual getSession() call).
 *
 * Regular API calls get a 15 s timeout.
 * Storage uploads (POST/PUT to /storage/v1/object/) get 120 s so large
 * image/video uploads don't get aborted prematurely.
 */
const fetchWithTimeout = (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const method = (init?.method || 'GET').toUpperCase();
  const isStorageUpload =
    url.includes('/storage/v1/object/') && (method === 'POST' || method === 'PUT');
  const timeout = isStorageUpload ? 120_000 : 15_000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Propagate caller-provided AbortSignal
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
