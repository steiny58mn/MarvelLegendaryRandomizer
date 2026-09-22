// Cloudflare Worker entrypoint
// Proxies API requests to the backend database to eliminate CORS issues
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // Proxy API requests to C# backend
    if (
      url.pathname === '/api/cards' ||
      url.pathname === '/api/updatedb' ||
      url.pathname.startsWith('/legendary/')
    ) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
          },
        });
      }

      const backendBase = (
        env?.API_URL ||
        env?.BACKEND_API_URL ||
        'https://api.frostpointlabs.com'
      ).replace(/\/+$/, '');

      let targetPath = url.pathname;
      if (url.pathname === '/api/cards') {
        targetPath = '/legendary/cards';
      } else if (url.pathname === '/api/updatedb') {
        targetPath = '/legendary/updatedb';
      }

      const targetUrl = `${backendBase}${targetPath}${url.search}`;

      try {
        const backendRes = await fetch(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });

        const newHeaders = new Headers(backendRes.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(backendRes.body, {
          status: backendRes.status,
          headers: newHeaders,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            error: `Proxy error forwarding to ${targetUrl}: ${err?.message || err}`,
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Serve static SPA assets
    return env.ASSETS.fetch(request);
  },
};
