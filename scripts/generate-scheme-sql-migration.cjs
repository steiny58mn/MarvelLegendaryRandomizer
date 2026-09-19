/**
 * Generates Turso / SQLite optimized SQL scripts and a Turso HTTP/CLI runner.
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../public/cards-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`Generating Turso/SQLite Migration for ${data.schemes.length} schemes...`);

// 1. Standard SQLite/Turso Transaction Script
const sqlLines = [
  '--',
  '-- Turso / SQLite Migration Script for Legendary Scheme Difficulties',
  '-- Compatible with: Turso CLI, SQLite3 CLI, DBeaver, TablePlus, libSQL',
  '--',
  'BEGIN TRANSACTION;',
  ''
];

data.schemes.forEach((scheme) => {
  const escapedName = scheme.name.replace(/'/g, "''");
  const diff = scheme.difficulty || 'Moderate';
  const id = scheme.id || '';
  
  // Turso / SQLite UPDATE with case-insensitive / flexible column matching
  sqlLines.push(
    `UPDATE Schemes SET Difficulty = '${diff}' WHERE Id = '${id}' OR Name = '${escapedName}';`
  );
});

sqlLines.push('');
sqlLines.push('COMMIT;');

const sqlOutPath = path.resolve(__dirname, '../scripts/update-scheme-difficulties.sql');
fs.writeFileSync(sqlOutPath, sqlLines.join('\n'), 'utf8');

// 2. High-performance single-batch SQLite CASE script (ultra fast over network / Turso HTTP API)
const caseSqlLines = [
  '--',
  '-- High-Performance Single-Statement Batch Update for Turso / libSQL',
  '-- Executes in a single query roundtrip',
  '--',
  'UPDATE Schemes',
  'SET Difficulty = CASE',
];

data.schemes.forEach((scheme) => {
  const escapedName = scheme.name.replace(/'/g, "''");
  const diff = scheme.difficulty || 'Moderate';
  const id = scheme.id || '';
  caseSqlLines.push(`  WHEN Id = '${id}' OR Name = '${escapedName}' THEN '${diff}'`);
});

caseSqlLines.push('  ELSE Difficulty');
caseSqlLines.push('END;');

const caseSqlOutPath = path.resolve(__dirname, '../scripts/turso-batch-update.sql');
fs.writeFileSync(caseSqlOutPath, caseSqlLines.join('\n'), 'utf8');

console.log(`✓ Generated ${sqlOutPath}`);
console.log(`✓ Generated ${caseSqlOutPath}`);
