/**
 * Supabase Authentication URL and Callback utilities.
 * Handles dynamic redirect URL resolution for both local development and production,
 * and parses confirmation callback hashes/query params.
 */

export interface AuthCallbackInfo {
  isCallback: boolean;
  isError: boolean;
  errorCode?: string;
  errorDescription?: string;
  type?: string;
  hasToken: boolean;
}

/**
 * Resolves the appropriate redirect URL for Supabase authentication callbacks.
 * Priority:
 * 1. Current window.location.origin (dynamic for both local development and deployed domains)
 * 2. Optional VITE_SITE_URL or VITE_APP_URL environment variable if set
 * 3. Production deployed app URL: https://unithai-parts.ai.studio
 */
export function getAuthRedirectUrl(): string {
  // If explicitly configured via environment variable
  const envUrl = (
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_APP_URL ||
    ''
  ).trim();

  // If in browser, use current window origin dynamically
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.includes('undefined')) {
      return origin;
    }
  }

  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // Deployed production URL
  return 'https://unithai-parts.ai.studio';
}

/**
 * Parses authentication URL parameters from both hash (#...) and query search (?...)
 */
export function parseAuthUrlCallback(): AuthCallbackInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const search = window.location.search.startsWith('?')
      ? window.location.search.substring(1)
      : window.location.search;

    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);

    const getParam = (name: string): string | null => {
      return hashParams.get(name) || searchParams.get(name);
    };

    const error = getParam('error');
    const errorCode = getParam('error_code');
    const errorDescription = getParam('error_description');
    const type = getParam('type');
    const accessToken = getParam('access_token');
    const code = getParam('code');

    if (!error && !errorCode && !type && !accessToken && !code) {
      return null;
    }

    return {
      isCallback: true,
      isError: Boolean(error || errorCode),
      errorCode: errorCode || error || undefined,
      errorDescription: errorDescription
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : undefined,
      type: type || undefined,
      hasToken: Boolean(accessToken || code),
    };
  } catch (e) {
    console.error('Error parsing auth URL callback:', e);
    return null;
  }
}

/**
 * Clears authentication parameters (hash and query error/tokens) from the current URL bar
 * so the user's browser stays on a clean URL.
 */
export function clearAuthUrlParams() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  try {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch (err) {
    console.error('Error clearing auth URL params:', err);
  }
}
