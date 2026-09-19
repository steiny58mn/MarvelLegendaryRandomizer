/**
 * API Configuration and Utilities for Marvel Legendary Randomizer
 * Manages custom backend C# API addresses, environment fallbacks, and connection verification.
 */

export const STORAGE_API_URL_KEY = 'legendary_api_url';

/**
 * Normalizes an API base URL (removes trailing slashes, whitespace).
 */
export function normalizeApiUrl(url?: string | null): string {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

/**
 * Retrieves the user-configured API URL from LocalStorage, if present.
 */
export function getStoredApiUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_API_URL_KEY);
    return stored ? normalizeApiUrl(stored) : '';
  } catch {
    return '';
  }
}

/**
 * Saves or clears the custom API base URL in LocalStorage.
 */
export function setStoredApiUrl(url: string): void {
  try {
    const clean = normalizeApiUrl(url);
    if (!clean) {
      localStorage.removeItem(STORAGE_API_URL_KEY);
    } else {
      localStorage.setItem(STORAGE_API_URL_KEY, clean);
    }
  } catch (e) {
    console.error('Failed to save API URL to localStorage:', e);
  }
}

/**
 * Gets the default environment API URL configured during build/deployment.
 */
export function getDefaultApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL || '';
  return normalizeApiUrl(envUrl);
}

/**
 * Resolves the effective API base URL:
 * 1. User-defined custom setting in localStorage
 * 2. VITE_API_URL environment variable / default backend URL
 * 3. Empty string (relative /api path for same-origin or bundled static data)
 */
export function getEffectiveApiUrl(): string {
  const stored = getStoredApiUrl();
  if (stored) return stored;
  return getDefaultApiUrl();
}

/**
 * Common endpoint paths for Marvel Legendary card datasets
 */
export const CARD_ENDPOINT_CANDIDATES = [
  '/legendary/cards',
  '/api/cards',
  '/cards',
];

/**
 * Builds a full URL for a given API endpoint path.
 */
export function buildApiEndpoint(endpointPath: string, customBaseUrl?: string): string {
  const base = customBaseUrl !== undefined ? normalizeApiUrl(customBaseUrl) : getEffectiveApiUrl();
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  if (!base) {
    return cleanPath;
  }
  return `${base}${cleanPath}`;
}

export interface ApiTestResult {
  success: boolean;
  message: string;
  endpointUsed?: string;
  statusCode?: number;
  dataSummary?: {
    heroesCount?: number;
    mastermindsCount?: number;
    villainsCount?: number;
    schemesCount?: number;
    expansionsCount?: number;
  };
}

export interface ApiDiagnosticInfo {
  deployedEnvUrl: string;
  storedOverrideUrl: string;
  effectiveBaseUrl: string;
  candidateEndpoints: string[];
  currentOrigin: string;
  environmentMode: string;
}

/**
 * Gathers runtime diagnostic info about API URLs and build settings.
 */
export function getApiDiagnosticInfo(): ApiDiagnosticInfo {
  return {
    deployedEnvUrl: getDefaultApiUrl() || '(Not set - VITE_API_URL was empty during build)',
    storedOverrideUrl: getStoredApiUrl() || '(None - using default/local database)',
    effectiveBaseUrl: getEffectiveApiUrl() || '(Local bundled dataset / same origin)',
    candidateEndpoints: CARD_ENDPOINT_CANDIDATES,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    environmentMode: (import.meta as any).env?.MODE || 'production',
  };
}

/**
 * Fetches card data trying standard endpoint candidates in order (/legendary/cards, /api/cards, /cards).
 * Gracefully falls back to bundled static /cards-data.json if remote endpoints are unavailable.
 */
export async function fetchCardsFromApi(
  customBaseUrl?: string,
  signal?: AbortSignal,
  allowStaticFallback: boolean = true
): Promise<{ data: any; endpoint: string; isFallback?: boolean }> {
  const base = customBaseUrl !== undefined ? normalizeApiUrl(customBaseUrl) : getEffectiveApiUrl();

  // If base points directly to a full endpoint path (e.g. ends with /cards or /sync)
  const paths = base && (base.endsWith('/cards') || base.endsWith('/sync') || base.endsWith('.json'))
    ? ['']
    : CARD_ENDPOINT_CANDIDATES;

  let lastError: any = null;

  // Try configured backend paths if base URL exists or relative endpoints
  if (base || paths.length > 0) {
    for (const p of paths) {
      const fullUrl = p ? buildApiEndpoint(p, base) : base;
      try {
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal,
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          
          // Guard against HTML error / SPA fallback pages (<!doctype html>)
          if (contentType && !contentType.includes('application/json') && !contentType.includes('text/json')) {
            lastError = new Error(`Endpoint returned non-JSON content type (${contentType}). Ensure the URL points to your API backend and not the static frontend host.`);
            continue;
          }

          let data: any;
          try {
            data = await response.json();
          } catch (jsonErr: any) {
            lastError = new Error(`Server returned invalid JSON from ${fullUrl}: ${jsonErr.message}`);
            continue;
          }

          if (data && (Array.isArray(data.heroes) || Array.isArray(data.masterminds) || Array.isArray(data.schemes) || Array.isArray(data.expansions))) {
            return { data, endpoint: fullUrl, isFallback: false };
          } else if (data && typeof data === 'object') {
            return { data, endpoint: fullUrl, isFallback: false };
          }
        }
        lastError = new Error(`HTTP ${response.status} from ${fullUrl}`);
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  // If remote candidates failed and static fallback is allowed, load bundled /cards-data.json
  if (allowStaticFallback) {
    try {
      const fallbackUrl = '/cards-data.json';
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data && (Array.isArray(data.heroes) || Array.isArray(data.masterminds) || Array.isArray(data.schemes) || Array.isArray(data.expansions))) {
          return { data, endpoint: fallbackUrl, isFallback: true };
        }
      }
    } catch (fallbackErr: any) {
      console.warn('Fallback /cards-data.json load failed:', fallbackErr);
    }
  }

  throw lastError || new Error('All card endpoint candidates failed and fallback database could not be loaded.');
}

/**
 * Tests connection to the provided API base URL across candidate paths (without static fallback).
 */
export async function testApiEndpoint(baseUrl?: string): Promise<ApiTestResult> {
  const targetBase = baseUrl !== undefined ? normalizeApiUrl(baseUrl) : getEffectiveApiUrl();

  if (!targetBase && !baseUrl) {
    return {
      success: false,
      message: 'No API address provided. Please enter your backend API URL (e.g. https://api.frostpointlabs.com).',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Disable static fallback when testing API so test reports true status of remote backend
    const { data, endpoint } = await fetchCardsFromApi(targetBase, controller.signal, false);
    clearTimeout(timeoutId);

    const heroesCount = Array.isArray(data?.heroes) ? data.heroes.length : 0;
    const mastermindsCount = Array.isArray(data?.masterminds) ? data.masterminds.length : 0;
    const villainsCount = Array.isArray(data?.villains) ? data.villains.length : 0;
    const schemesCount = Array.isArray(data?.schemes) ? data.schemes.length : 0;
    const expansionsCount = Array.isArray(data?.expansions) ? data.expansions.length : 0;
    const totalItems = heroesCount + mastermindsCount + villainsCount + schemesCount + expansionsCount;

    return {
      success: true,
      endpointUsed: endpoint,
      message: totalItems > 0
        ? `Successfully connected to API at ${endpoint}!`
        : `Connected to API at ${endpoint} (Backend currently returned 0 card records).`,
      dataSummary: {
        heroesCount,
        mastermindsCount,
        villainsCount,
        schemesCount,
        expansionsCount,
      },
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out after 8 seconds. Please verify server address and CORS settings.',
      };
    }
    return {
      success: false,
      message: err.message || 'Unable to connect to the specified API address.',
    };
  }
}
