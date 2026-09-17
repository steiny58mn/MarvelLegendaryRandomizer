// Cloudflare Pages Functions middleware / handler
// If deploying as a Cloudflare Pages full-stack app, this function handles /api/card-image
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return new Response('Invalid image URL', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new Response('Failed to fetch remote image', { status: response.status });
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    return new Response(response.body, {
      status: 200,
      headers: newHeaders,
    });
  } catch (err: any) {
    return new Response('Gateway Error: ' + err.message, { status: 502 });
  }
}
