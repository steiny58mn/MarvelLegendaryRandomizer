/**
 * API Configuration and Utilities for Marvel Legendary Randomizer
 * Manages custom backend C# API addresses, environment fallbacks, connection verification,
 * and database updates via legendary/updatedb.
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
 * 3. Fallback to https://api.frostpointlabs.com
 */
export function getEffectiveApiUrl(): string {
  const stored = getStoredApiUrl();
  if (stored) return stored;
  const envUrl = getDefaultApiUrl();
  if (envUrl) return envUrl;
  return 'https://api.frostpointlabs.com';
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
  isCorsError?: boolean;
  dataSummary?: {
    heroesCount?: number;
    mastermindsCount?: number;
    villainsCount?: number;
    schemesCount?: number;
    expansionsCount?: number;
  };
}

export interface UpdateDbResult {
  success: boolean;
  message: string;
  fileName?: string;
  counts?: {
    expansions?: number;
    heroes?: number;
    masterminds?: number;
    villains?: number;
    henchmen?: number;
    schemes?: number;
  };
}

/**
 * Fetches card data directly from the backend database API.
 * Candidate endpoints: /legendary/cards, /api/cards, /cards.
 * Never uses or falls back to local static JSON.
 */
export async function fetchCardsFromApi(
  customBaseUrl?: string,
  signal?: AbortSignal
): Promise<{ data: any; endpoint: string }> {
  const base = customBaseUrl !== undefined ? normalizeApiUrl(customBaseUrl) : getEffectiveApiUrl();

  // If base points directly to a full endpoint path (e.g. ends with /cards or /sync)
  const paths = base && (base.endsWith('/cards') || base.endsWith('/sync'))
    ? ['']
    : CARD_ENDPOINT_CANDIDATES;

  let lastError: any = null;

  // Try configured backend paths
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
            lastError = new Error(`Endpoint returned non-JSON content type (${contentType}). Ensure the URL points to your API backend.`);
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
            return { data, endpoint: fullUrl };
          } else if (data && typeof data === 'object') {
            return { data, endpoint: fullUrl };
          }
        }
        lastError = new Error(`HTTP ${response.status} from ${fullUrl}`);
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error(`Unable to fetch card data from the API (${base}). Please ensure the database API is running.`);
}

/**
 * Tests connection to the provided API base URL across candidate paths.
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
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, endpoint } = await fetchCardsFromApi(targetBase, controller.signal);
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
        ? `Successfully connected to Remote Database at ${endpoint}!`
        : `Connected to API at ${endpoint} (Backend returned 0 records).`,
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
        message: 'Connection timed out after 10 seconds. Please verify server status and network connectivity.',
      };
    }

    const errStr = (err?.message || '').toLowerCase();
    const isCors = err?.name === 'TypeError' || errStr.includes('fetch') || errStr.includes('network') || errStr.includes('cors');

    if (isCors) {
      return {
        success: false,
        isCorsError: true,
        message: `Cross-Origin (CORS) Block: The browser could not receive the response from ${targetBase} because the backend is missing 'Access-Control-Allow-Origin' headers.`,
      };
    }

    return {
      success: false,
      message: err.message || 'Unable to connect to the specified API address.',
    };
  }
}

/**
 * Uploads a cards-data.json file to the backend API endpoint `legendary/updatedb`
 * to update the card database.
 */
export async function uploadCardsDataToApi(
  file: File | Blob,
  fileName: string = 'cards-data.json',
  customBaseUrl?: string
): Promise<UpdateDbResult> {
  const endpoint = buildApiEndpoint('/legendary/updatedb', customBaseUrl);
  const formData = new FormData();
  formData.append('file', file, fileName);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    let resultJson: any = null;
    try {
      resultJson = await response.json();
    } catch {
      // response might not be JSON
    }

    if (!response.ok) {
      const errMsg =
        resultJson?.message ||
        resultJson?.error ||
        `Server responded with HTTP ${response.status} (${response.statusText})`;
      return {
        success: false,
        message: errMsg,
      };
    }

    return {
      success: resultJson?.success ?? true,
      message: resultJson?.message || 'Legendary database populated successfully from JSON file.',
      fileName: resultJson?.fileName || fileName,
      counts: resultJson?.counts,
    };
  } catch (err: any) {
    const errStr = (err?.message || '').toLowerCase();
    const isCors = err?.name === 'TypeError' || errStr.includes('fetch') || errStr.includes('network') || errStr.includes('cors');

    return {
      success: false,
      message: isCors
        ? `Failed to reach API at ${endpoint}. Check your network connection or CORS configuration.`
        : err.message || 'An error occurred while uploading cards-data.json to the API.',
    };
  }
}
