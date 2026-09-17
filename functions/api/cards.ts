import { createClient } from '@libsql/client/web';

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

// Fetch cards dataset from Turso database
async function fetchFromTurso(tursoUrl: string, tursoAuthToken: string) {
  const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });

  // Strategy 1: JSON payload column in cards_data or cards table
  const jsonQueries = [
    "SELECT data FROM cards_data LIMIT 1",
    "SELECT json FROM cards LIMIT 1",
    "SELECT payload FROM cards_data LIMIT 1",
    "SELECT content FROM cards_data LIMIT 1",
    "SELECT value FROM kv WHERE key = 'cards_data' OR key = 'cards' LIMIT 1"
  ];

  for (const query of jsonQueries) {
    try {
      const res = await client.execute(query);
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        const val = row[Object.keys(row)[0]];
        if (typeof val === 'string') {
          return JSON.parse(val);
        }
        if (typeof val === 'object' && val !== null) {
          return val;
        }
      }
    } catch {
      // Continue trying other queries
    }
  }

  // Strategy 2: Multi-table structure (heroes, masterminds, villains, henchmen, schemes, expansions)
  try {
    const [heroesRes, mastermindsRes, villainsRes, henchmenRes, schemesRes, expansionsRes] = await Promise.all([
      client.execute("SELECT * FROM heroes").catch(() => null),
      client.execute("SELECT * FROM masterminds").catch(() => null),
      client.execute("SELECT * FROM villains").catch(() => null),
      client.execute("SELECT * FROM henchmen").catch(() => null),
      client.execute("SELECT * FROM schemes").catch(() => null),
      client.execute("SELECT * FROM expansions").catch(() => null),
    ]);

    if (heroesRes && heroesRes.rows && heroesRes.rows.length > 0) {
      const parseRow = (row: any) => {
        const item: any = { ...row };
        ['cards', 'keywords', 'teams', 'rules', 'subCards'].forEach((prop) => {
          if (typeof item[prop] === 'string') {
            try { item[prop] = JSON.parse(item[prop]); } catch { /* noop */ }
          }
        });
        return item;
      };

      return {
        heroes: (heroesRes.rows || []).map(parseRow),
        masterminds: (mastermindsRes?.rows || []).map(parseRow),
        villains: (villainsRes?.rows || []).map(parseRow),
        henchmen: (henchmenRes?.rows || []).map(parseRow),
        schemes: (schemesRes?.rows || []).map(parseRow),
        expansions: (expansionsRes?.rows || []).map(parseRow),
      };
    }
  } catch {
    // Continue
  }

  // Strategy 3: Inspect sqlite_master for potential tables
  try {
    const tablesRes = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_libsql_%'");
    if (tablesRes.rows && tablesRes.rows.length > 0) {
      for (const tRow of tablesRes.rows) {
        const tableName = tRow.name;
        try {
          const res = await client.execute(`SELECT * FROM "${tableName}" LIMIT 1`);
          if (res.rows && res.rows.length > 0) {
            const firstRow = res.rows[0];
            for (const key of Object.keys(firstRow)) {
              const cell = firstRow[key];
              if (typeof cell === 'string' && (cell.startsWith('{') || cell.startsWith('['))) {
                try {
                  const parsed = JSON.parse(cell);
                  if (parsed.heroes || parsed.masterminds || parsed.schemes) {
                    return parsed;
                  }
                } catch { /* noop */ }
              }
            }
          }
        } catch { /* noop */ }
      }
    }
  } catch { /* noop */ }

  return null;
}

// Cloudflare Pages Functions endpoint for /api/cards
export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. Check for Turso Secrets / Environment Variables in Cloudflare deployment context
  const tursoUrl = env?.TURSO_DATABASE_URL || env?.TURSO_URL || env?.TURSO_DB_URL;
  const tursoAuthToken = env?.TURSO_AUTH_TOKEN || env?.TURSO_TOKEN;

  if (tursoUrl) {
    try {
      const tursoData = await fetchFromTurso(tursoUrl, tursoAuthToken || '');
      if (tursoData) {
        const enriched = enrichExpansions(tursoData);
        return new Response(JSON.stringify(enriched), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
            'X-Data-Source': 'turso',
          },
        });
      }
    } catch (err: any) {
      console.warn('Failed to retrieve cards from Turso, falling back to static asset:', err?.message);
    }
  }

  // 2. Fallback to static cards-data.json asset
  const dataUrl = new URL('/cards-data.json', url.origin);

  try {
    const res = await fetch(dataUrl.toString());
    if (res.ok) {
      const data = await res.json();
      const enriched = enrichExpansions(data);
      return new Response(JSON.stringify(enriched), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
          'X-Data-Source': 'static',
        },
      });
    }
    return new Response(JSON.stringify({ error: 'Data not found' }), { status: 404 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
