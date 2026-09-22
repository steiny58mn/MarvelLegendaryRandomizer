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
      return {
        id,
        name: info.name,
        universe: info.universe,
        boxType: info.boxType
      };
    });
  }
  return parsed;
}

// Cloudflare Pages Functions endpoint for /api/cards
export async function onRequestGet(context: any) {
  const { env } = context;

  // 1. Check for backend API URL configured in Cloudflare environment
  const apiBase = (env?.VITE_API_URL || env?.API_URL || env?.BACKEND_API_URL || 'https://api.frostpointlabs.com').replace(/\/+$/, '');

  let lastError: any = null;

  for (const endpointPath of ['/legendary/cards', '/api/cards', '/cards']) {
    try {
      const apiRes = await fetch(`${apiBase}${endpointPath}`, {
        headers: { Accept: 'application/json' },
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && (Array.isArray(data.heroes) || Array.isArray(data.masterminds) || Array.isArray(data.schemes))) {
          const enriched = enrichExpansions(data);
          return new Response(JSON.stringify(enriched), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60, s-maxage=300',
              'X-Data-Source': 'csharp-api',
            },
          });
        }
      } else {
        lastError = new Error(`HTTP ${apiRes.status} from ${apiBase}${endpointPath}`);
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Failed to retrieve cards from API (${apiBase}${endpointPath}):`, err?.message);
    }
  }

  // Code should never use static cards-data.json; return explicit error if API is unreachable
  return new Response(
    JSON.stringify({
      error: lastError?.message || 'Failed to reach Legendary API database backend.',
      apiBase,
    }),
    {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
