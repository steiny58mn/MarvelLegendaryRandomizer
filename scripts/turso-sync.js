/**
 * Turso Direct Sync Script
 * 
 * Usage:
 *   TURSO_DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="your-token" node scripts/turso-sync.js
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../public/cards-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const dbUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

async function run() {
  if (!dbUrl) {
    console.log('\n=== Turso Database Sync Instructions ===');
    console.log('To run directly from Node.js with libSQL client:');
    console.log('  npm install @libsql/client');
    console.log('  TURSO_DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="your-token" node scripts/turso-sync.js');
    console.log('\nAlternatively, run via Turso CLI:');
    console.log('  turso db shell <your-db-name> < scripts/update-scheme-difficulties.sql');
    console.log('  or for ultra-fast single query:');
    console.log('  turso db shell <your-db-name> < scripts/turso-batch-update.sql\n');
    return;
  }

  try {
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    });

    console.log(`Connecting to Turso DB: ${dbUrl}...`);

    // Build batch statements
    const stmts = data.schemes.map((s) => ({
      sql: `UPDATE Schemes SET Difficulty = ? WHERE Id = ? OR Name = ?;`,
      args: [s.difficulty || 'Moderate', s.id || '', s.name || ''],
    }));

    console.log(`Executing transaction with ${stmts.length} updates...`);
    await client.batch(stmts, 'write');

    console.log('✓ Successfully updated all scheme difficulties in Turso DB!');
  } catch (err) {
    console.error('Error updating Turso DB:', err);
  }
}

run();
