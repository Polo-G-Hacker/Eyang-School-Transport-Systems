import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize the database.');
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.resolve(scriptDir, '../../database');
const client = new pg.Client({ connectionString: databaseUrl });

async function executeFile(filePath) {
  const sql = await fs.readFile(filePath, 'utf8');
  console.log(`Applying ${path.basename(filePath)}...`);
  await client.query(sql);
}

try {
  await client.connect();
  await executeFile(path.join(databaseDir, 'schema.sql'));

  const migrationDir = path.join(databaseDir, 'migrations');
  const migrations = (await fs.readdir(migrationDir))
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const migration of migrations) {
    await executeFile(path.join(migrationDir, migration));
  }

  await executeFile(path.join(databaseDir, 'seed.sql'));
  console.log('Database initialization complete.');
} finally {
  await client.end();
}
