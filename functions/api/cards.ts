// Cloudflare Pages Functions endpoint for /api/cards
export async function onRequestGet(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const dataUrl = new URL('/cards-data.json', url.origin);

  try {
    const res = await fetch(dataUrl.toString());
    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }
    return new Response(JSON.stringify({ error: 'Data not found' }), { status: 404 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
