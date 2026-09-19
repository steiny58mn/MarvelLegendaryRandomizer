// Expansion name and metadata mapping
const EXPANSION_METADATA: Record<string, { name: string; universe: string; boxType: string }> = {
  'base': { name: 'Core Set', universe: 'Marvel', boxType: 'Core' },
  'dark-city': { name: 'Dark City', universe: 'Marvel', boxType: 'Big Box' },
  'villains': { name: 'Villains', universe: 'Marvel', boxType: 'Core' },
  'fantastic-four': { name: 'Fantastic Four', universe: 'Marvel', boxType: 'Small Box' },
  'paint-the-town-red': { name: 'Paint the Town Red', universe: 'Marvel', boxType: 'Small Box' },
  'guardians-of-the-galaxy': { name: 'Guardians of the Galaxy', universe: 'Marvel', boxType: 'Small Box' },
  'secret-wars-1': { name: 'Secret Wars, Vol. 1', universe: 'Marvel', boxType: 'Big Box' },
  'secret-wars-2': { name: 'Secret Wars, Vol. 2', universe: 'Marvel', boxType: 'Big Box' },
  'captain-america-75': { name: 'Captain America 75th Anniversary', universe: 'Marvel', boxType: 'Small Box' },
  'fear-itself': { name: 'Fear Itself', universe: 'Marvel', boxType: 'Small Box' },
  'civil-war': { name: 'Civil War', universe: 'Marvel', boxType: 'Big Box' },
  'deadpool': { name: 'Deadpool', universe: 'Marvel', boxType: 'Small Box' },
  'x-men': { name: 'X-Men', universe: 'Marvel', boxType: 'Big Box' },
  'noir': { name: 'Noir', universe: 'Marvel', boxType: 'Small Box' },
  'dimensions': { name: 'Dimensions', universe: 'Marvel', boxType: 'Small Box' },
  'champions': { name: 'Champions', universe: 'Marvel', boxType: 'Small Box' },
  'venom': { name: 'Venom', universe: 'Marvel', boxType: 'Small Box' },
  'shield': { name: 'S.H.I.E.L.D.', universe: 'Marvel', boxType: 'Small Box' },
  'weapon-x': { name: 'Weapon X', universe: 'Marvel', boxType: 'Small Box' },
  'heroes-of-asgard': { name: 'Heroes of Asgard', universe: 'Marvel', boxType: 'Small Box' },
  'black-panther': { name: 'Black Panther and the Illuminati', universe: 'Marvel', boxType: 'Small Box' },
  'messiah-complex': { name: 'Messiah Complex', universe: 'Marvel', boxType: 'Small Box' },
  'realm-of-kings': { name: 'Realm of Kings', universe: 'Marvel', boxType: 'Small Box' },
  'revelations': { name: 'Revelations', universe: 'Marvel', boxType: 'Small Box' },
  'ant-man': { name: 'Ant-Man', universe: 'Marvel', boxType: 'Small Box' },
  'black-widow': { name: 'Black Widow', universe: 'Marvel', boxType: 'Small Box' },
  'ant-man-and-wasp': { name: 'Ant-Man and the Wasp', universe: 'Marvel', boxType: 'Small Box' },
  'what-if': { name: 'What If...?', universe: 'Marvel', boxType: 'Core' },
  'into-the-cosmos': { name: 'Into the Cosmos', universe: 'Marvel', boxType: 'Small Box' },
  'new-mutants': { name: 'New Mutants', universe: 'Marvel', boxType: 'Small Box' },
  'marvel-2099': { name: 'Marvel 2099', universe: 'Marvel', boxType: 'Small Box' },
  'mcu-gotg': { name: 'MCU Guardians of the Galaxy', universe: 'Marvel', boxType: 'Small Box' },
  'midnight-sons': { name: 'Midnight Sons', universe: 'Marvel', boxType: 'Small Box' },
  'doctor-strange': { name: 'Doctor Strange and the Shadows of Nightmare', universe: 'Marvel', boxType: 'Small Box' },
  'world-war-hulk': { name: 'World War Hulk', universe: 'Marvel', boxType: 'Big Box' },
  'annihilation': { name: 'Annihilation', universe: 'Marvel', boxType: 'Small Box' },
  'spider-man-homecoming': { name: 'Spider-Man Homecoming', universe: 'Marvel', boxType: 'Small Box' },
  'mcu-phase-1': { name: 'MCU Phase 1', universe: 'Marvel', boxType: 'Core' },
  'infinity-saga': { name: 'The Infinity Saga', universe: 'Marvel', boxType: 'Big Box' },
  'second-edition': { name: 'Core Set (2nd Edition)', universe: 'Marvel', boxType: 'Core' },
  'promo': { name: 'Promos', universe: 'Marvel', boxType: 'Promo' }
};

function enrichExpansions(parsed: any) {
  if (!parsed) return parsed;
  if (!parsed.expansions || parsed.expansions.length === 0) {
    const expIds = new Set<string>();
    ['heroes', 'masterminds', 'villains', 'henchmen', 'schemes'].forEach(key => {
      if (Array.isArray(parsed[key])) {
        parsed[key].forEach((card: any) => {
          if (card.expansion) expIds.add(card.expansion);
        });
      }
    });

    parsed.expansions = Array.from(expIds).map(id => {
      const info = EXPANSION_METADATA[id] || {
        name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        universe: 'Marvel',
        boxType: 'Small Box'
      };
      return {\n        id,\n        name: info.name,\n        universe: info.universe,\n        boxType: info.boxType\n      };\n    });\n  }\n  return parsed;\n}\n\n// Cloudflare Pages Functions endpoint for /api/cards\nexport async function onRequestGet(context: any) {\n  const { request, env } = context;\n  const url = new URL(request.url);\n\n  // 1. Check for backend API URL configured in Cloudflare environment\n  const apiBase = (env?.VITE_API_URL || env?.API_URL || env?.BACKEND_API_URL || '').replace(/\\/+$/, '');\n\n  if (apiBase) {\n    for (const endpointPath of ['/legendary/cards', '/api/cards', '/cards']) {\n      try {\n        const apiRes = await fetch(`${apiBase}${endpointPath}`, {\n          headers: { Accept: 'application/json' },\n        });\n\n        if (apiRes.ok) {\n          const data = await apiRes.json();\n          if (data && (Array.isArray(data.heroes) || Array.isArray(data.masterminds) || Array.isArray(data.schemes))) {\n            const enriched = enrichExpansions(data);\n            return new Response(JSON.stringify(enriched), {\n              status: 200,\n              headers: {\n                'Content-Type': 'application/json',\n                'Cache-Control': 'public, max-age=60, s-maxage=300',\n                'X-Data-Source': 'csharp-api',\n              },\n            });\n          }\n        }\n      } catch (err: any) {\n        console.warn(`Failed to retrieve cards from API (${apiBase}${endpointPath}):`, err?.message);\n      }\n    }\n  }\n\n  // 2. Fallback to static cards-data.json asset\n  const dataUrl = new URL('/cards-data.json', url.origin);\n\n  try {\n    const res = await fetch(dataUrl.toString());\n    if (res.ok) {\n      const data = await res.json();\n      const enriched = enrichExpansions(data);\n      return new Response(JSON.stringify(enriched), {\n        status: 200,\n        headers: {\n          'Content-Type': 'application/json',\n          'Cache-Control': 'public, max-age=300, s-maxage=3600',\n          'X-Data-Source': 'static',\n        },\n      });\n    }\n    return new Response(JSON.stringify({ error: 'Data not found' }), { status: 404 });\n  } catch (err: any) {\n    return new Response(JSON.stringify({ error: err.message }), { status: 500 });\n  }\n}\n"}
```