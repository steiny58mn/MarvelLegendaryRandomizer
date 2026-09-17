import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { createClient } from '@libsql/client';

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json());

// Proxy remote card artwork to avoid iFrame CSP/CORS/Referrer blocking in browser frames
app.get('/api/card-image', (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return res.status(400).send('Invalid image URL');
  }

  try {
    https.get(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    }, (proxyRes) => {
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        return res.status(proxyRes.statusCode).send('Failed to fetch remote image');
      }

      const contentType = proxyRes.headers['content-type'] || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      
      proxyRes.pipe(res);
    }).on('error', (err) => {
      console.error('Error fetching image proxy:', err.message);
      res.status(502).send('Gateway Error fetching image');
    });
  } catch (err: any) {
    res.status(500).send('Server Error: ' + err.message);
  }
});

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
        if (typeof val === 'string') return JSON.parse(val);
        if (typeof val === 'object' && val !== null) return val;
      }
    } catch {
      // Continue
    }
  }

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

  return null;
}

// API routes
app.get('/api/cards', async (req, res) => { 
  res.setHeader('Cache-Control', 'no-store');

  // 1. Try Turso Database if environment variables / secrets are configured
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || process.env.TURSO_DB_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_TOKEN;

  if (tursoUrl) {
    try {
      const tursoData = await fetchFromTurso(tursoUrl, tursoAuthToken || '');
      if (tursoData) {
        const enriched = enrichExpansions(tursoData);
        res.setHeader('X-Data-Source', 'turso');
        return res.json(enriched);
      }
    } catch (err: any) {
      console.warn('Failed to query Turso, falling back to static asset:', err?.message);
    }
  }

  // 2. Static JSON fallback
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'cards-data.json');
    if (fs.existsSync(jsonPath)) {
      const fileData = fs.readFileSync(jsonPath, 'utf8');
      const parsed = JSON.parse(fileData);
      const enriched = enrichExpansions(parsed);
      res.setHeader('X-Data-Source', 'static');
      return res.json(enriched);
    } else {
      throw new Error('Static fallback file not found');
    }
  } catch (error) {
    console.error('Failed to fetch cards data:', error);
    res.status(500).json({ error: 'Failed to fetch cards data' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
