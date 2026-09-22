// Cloudflare Pages Function endpoint for /api/updatedb
export async function onRequestPost(context: any) {
  const { request, env } = context;

  // 1. Resolve backend API URL from Cloudflare environment variables
  const apiBase = (
    env?.VITE_API_URL ||
    env?.API_URL ||
    env?.BACKEND_API_URL ||
    'https://api.frostpointlabs.com'
  ).replace(/\/+$/, '');

  try {
    const formData = await request.formData();
    const targetUrl = `${apiBase}/legendary/updatedb`;

    const backendRes = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    const responseText = await backendRes.text();
    return new Response(responseText, {
      status: backendRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Cloudflare proxy error forwarding to ${apiBase}/legendary/updatedb: ${err?.message || err}`,
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}
