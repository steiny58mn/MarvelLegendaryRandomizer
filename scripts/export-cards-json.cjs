/**
 * Utility script to validate, format, and prepare the Legendary card dataset JSON
 * for the C# backend API importer.
 * 
 * Usage:
 *   node scripts/export-cards-json.cjs
 *   node scripts/export-cards-json.cjs --sync [API_URL]
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicCardsPath = path.join(rootDir, 'public', 'cards-data.json');
const distCardsPath = path.join(rootDir, 'dist', 'cards-data.json');

console.log('Reading card data from', publicCardsPath);
const raw = fs.readFileSync(publicCardsPath, 'utf8');
const data = JSON.parse(raw);

// Summary metrics
const stats = {
  expansions: Array.isArray(data.expansions) ? data.expansions.length : 0,
  heroes: Array.isArray(data.heroes) ? data.heroes.length : 0,
  masterminds: Array.isArray(data.masterminds) ? data.masterminds.length : 0,
  villains: Array.isArray(data.villains) ? data.villains.length : 0,
  henchmen: Array.isArray(data.henchmen) ? data.henchmen.length : 0,
  schemes: Array.isArray(data.schemes) ? data.schemes.length : 0,
};

console.log('--- Legendary Card Dataset Summary ---');
console.log(`Expansions:  ${stats.expansions}`);
console.log(`Heroes:      ${stats.heroes}`);
console.log(`Masterminds: ${stats.masterminds}`);
console.log(`Villains:    ${stats.villains}`);
console.log(`Henchmen:    ${stats.henchmen}`);
console.log(`Schemes:     ${stats.schemes}`);
console.log('--------------------------------------');

// Re-serialize formatted JSON
const formattedJson = JSON.stringify(data, null, 2);
fs.writeFileSync(publicCardsPath, formattedJson, 'utf8');
console.log('✓ Successfully formatted and validated public/cards-data.json');

// Ensure dist directory exists and sync file
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(distCardsPath, formattedJson, 'utf8');
  console.log('✓ Synced to dist/cards-data.json');
}

// Optional: Direct API sync if requested
const args = process.argv.slice(2);
if (args.includes('--sync')) {
  const syncIndex = args.indexOf('--sync');
  const apiUrl = (args[syncIndex + 1] || process.env.VITE_API_URL || 'https://api.frostpointlabs.com').replace(/\/+$/, '');
  const syncEndpoint = `${apiUrl}/legendary/cards/sync`;

  console.log(`\nDispatching card dataset to API: ${syncEndpoint} ...`);
  fetch(syncEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      console.log(`Response: HTTP ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.log('Body:', body);
    })
    .catch((err) => {
      console.error('API Sync Error:', err.message);
    });
}
