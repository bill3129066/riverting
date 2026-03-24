import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function initDb(): void {
  const db = getDb();

  const schemaPath = resolve(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM agents').get() as { cnt: number };
  if (count.cnt === 0) {
    console.log('Seeding demo agents...');
    seedAgents();
    console.log('Seeded 2 demo agents.');
  } else {
    console.log(`DB already has ${count.cnt} agent(s), skipping seed.`);
  }
}

function seedAgents(): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO agents (curator_wallet, name, description, category, curator_rate_per_second, skill_config_json, metadata_uri)
    VALUES ($curator_wallet, $name, $description, $category, $curator_rate_per_second, $skill_config_json, $metadata_uri)
  `);

  const agents = [
    {
      $curator_wallet: '0x0000000000000000000000000000000000000001',
      $name: 'DeFi Pool Analyst',
      $description: 'Analyzes DEX pool health, TVL, volume, and fee activity using OnchainOS Market API.',
      $category: 'defi',
      $curator_rate_per_second: 1000,
      $skill_config_json: JSON.stringify({
        name: 'DeFi Pool Analyst',
        analysisTemplates: ['pool-snapshot'],
        model: 'gemini-2.0-flash',
        tools: [{ type: 'onchainos-market', description: 'Fetch pool data' }],
      }),
      $metadata_uri: null,
    },
    {
      $curator_wallet: '0x0000000000000000000000000000000000000002',
      $name: 'Yield Comparator',
      $description: 'Compares yield opportunities across pools and vaults, ranking by risk-adjusted returns.',
      $category: 'defi',
      $curator_rate_per_second: 800,
      $skill_config_json: JSON.stringify({
        name: 'Yield Comparator',
        analysisTemplates: ['yield-compare'],
        model: 'gemini-2.0-flash',
        tools: [{ type: 'onchainos-market', description: 'Fetch yield data' }],
      }),
      $metadata_uri: null,
    },
  ];

  const insertMany = db.transaction(() => {
    for (const agent of agents) {
      insert.run(agent);
    }
  });

  insertMany();
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('init.ts')) {
  initDb();
  console.log('DB initialized successfully.');
}
