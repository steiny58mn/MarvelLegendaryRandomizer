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
 * 2. VITE_API_URL environment variable
 * 3. Empty string (relative /api path for same-origin or reverse proxy)
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

/**
 * Fetches card data trying standard endpoint candidates in order (/legendary/cards, /api/cards, /cards).
 */
export async function fetchCardsFromApi(customBaseUrl?: string, signal?: AbortSignal): Promise<{ data: any; endpoint: string }> {
  const base = customBaseUrl !== undefined ? normalizeApiUrl(customBaseUrl) : getEffectiveApiUrl();

  // If customBaseUrl points directly to a full endpoint path (e.g. ends with /cards)
  const paths = base && (base.endsWith('/cards') || base.endsWith('/sync'))
    ? ['']
    : CARD_ENDPOINT_CANDIDATES;

  let lastError: any = null;

  for (const p of paths) {
    const fullUrl = p ? buildApiEndpoint(p, base) : base;
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && (Array.isArray(data.heroes) || Array.isArray(data.masterminds) || Array.isArray(data.schemes) || Array.isArray(data.expansions))) {
          return { data, endpoint: fullUrl };
        }
      }
      lastError = new Error(`HTTP ${response.status} from ${fullUrl}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All card endpoint candidates failed.');
}

/**
 * Tests connection to the provided API base URL across candidate paths.
 */
export async function testApiEndpoint(baseUrl?: string): Promise<ApiTestResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const { data, endpoint } = await fetchCardsFromApi(baseUrl, controller.signal);
    clearTimeout(timeoutId);

    const heroesCount = Array.isArray(data.heroes) ? data.heroes.length : 0;
    const mastermindsCount = Array.isArray(data.masterminds) ? data.masterminds.length : 0;
    const villainsCount = Array.isArray(data.villains) ? data.villains.length : 0;
    const schemesCount = Array.isArray(data.schemes) ? data.schemes.length : 0;
    const expansionsCount = Array.isArray(data.expansions) ? data.expansions.length : 0;
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
