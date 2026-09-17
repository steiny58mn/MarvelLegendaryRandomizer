/**
 * Global in-memory cache and prefetching service for card images
 */

const PREFETCH_CACHE = new Set<string>();

export function getOptimizedImageUrl(rawUrl: string, width = 540, quality = 75): string {
  if (!rawUrl) return '';
  // If it is already a weserv / wsrv proxy URL, return as-is
  if (rawUrl.includes('images.weserv.nl') || rawUrl.includes('wsrv.nl')) return rawUrl;
  return `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}&w=${width}&q=${quality}&output=webp`;
}

export function prefetchImageUrl(rawUrl: string, width = 540, quality = 75): void {
  if (!rawUrl || typeof Image === 'undefined') return;
  const optimized = getOptimizedImageUrl(rawUrl, width, quality);
  if (PREFETCH_CACHE.has(optimized)) return;

  PREFETCH_CACHE.add(optimized);
  const img = new Image();
  img.decoding = 'async';
  img.src = optimized;
}

export function isImagePrecached(rawUrl: string, width = 540, quality = 75): boolean {
  const optimized = getOptimizedImageUrl(rawUrl, width, quality);
  return PREFETCH_CACHE.has(optimized);
}
