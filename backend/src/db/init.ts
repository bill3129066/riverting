import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
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

  // Seed skills from skills/ directory
  const skillCount = db.prepare('SELECT COUNT(*) as cnt FROM skills').get() as { cnt: number };
  if (skillCount.cnt === 0) {
    console.log('Seeding skills from skills/ directory...');
    const seeded = seedSkillsFromDir();
    console.log(`Seeded ${seeded} skills.`);
  } else {
    console.log(`DB already has ${skillCount.cnt} skill(s), skipping skill seed.`);
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

function seedSkillsFromDir(): number {
  const db = getDb();
  const skillsRoot = resolve(__dirname, '../../../skills');
  if (!existsSync(skillsRoot)) return 0;

  const insert = db.prepare(`
    INSERT INTO skills (id, creator_wallet, name, description, category,
      system_prompt, user_prompt_template, model, temperature, max_tokens,
      input_schema_json, price_per_run, execution_mode, metadata_uri)
    VALUES ($id, $creator, $name, $desc, $category,
      $systemPrompt, $userPromptTemplate, $model, $temperature, $maxTokens,
      $inputSchema, $price, $mode, $metadataUri)
  `);

  const CURATOR = '0x0000000000000000000000000000000000000000';
  let count = 0;

  // Look for defi-onchain-analytics
  const skillDir = resolve(skillsRoot, 'defi-onchain-analytics-main');
  if (!existsSync(skillDir)) return 0;

  // Read SKILL.md for the main system prompt
  const skillMd = readFileSync(resolve(skillDir, 'SKILL.md'), 'utf-8');

  // Parse frontmatter
  const fmMatch = skillMd.match(/^---\n([\s\S]*?)\n---/);
  const mainDesc = fmMatch
    ? (fmMatch[1].match(/description:\s*(.*)/)?.[1] || '').trim()
    : 'DeFi on-chain analytics skill';

  // Master skill — uses full SKILL.md as system prompt
  insert.run({
    $id: randomUUID(),
    $creator: CURATOR,
    $name: 'DeFi On-Chain Analytics',
    $desc: 'Full-spectrum on-chain DeFi analysis: wallet profiling, protocol assessment, DEX analytics, token metrics, contract inspection, and exploit tracing across EVM chains.',
    $category: 'defi',
    $systemPrompt: skillMd.slice(skillMd.indexOf('---', 3) + 4).trim().slice(0, 8000),
    $userPromptTemplate: 'Analyze: {{query}}\n\nChain: {{chain}}\nTarget address (if any): {{address}}',
    $model: 'gemini-2.0-flash',
    $temperature: 0.2,
    $maxTokens: 2048,
    $inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        query: { type: 'string' },
        chain: { type: 'string' },
        address: { type: 'string' },
      },
      required: ['query'],
    }),
    $price: 5000,
    $mode: 'stream',
    $metadataUri: 'https://github.com/Omnis-Labs/defi-onchain-analytics',
  });
  count++;

  // Individual pattern skills
  const patterns: Array<{ file: string; name: string; desc: string; template: string; schema: Record<string, unknown> }> = [
    {
      file: 'wallet-analytics.md',
      name: 'Wallet Profiler',
      desc: 'Profile any EVM wallet: balance snapshots, transfer history, entity clustering, funding trace, Sybil detection, and smart money signals.',
      template: 'Profile wallet {{address}} on {{chain}}.\n\nFocus: {{focus}}',
      schema: {
        type: 'object',
        properties: { address: { type: 'string' }, chain: { type: 'string' }, focus: { type: 'string' } },
        required: ['address'],
      },
    },
    {
      file: 'protocol-analytics.md',
      name: 'Protocol Analyzer',
      desc: 'Analyze DeFi protocols: TVL decomposition, admin risk assessment, oracle health, governance participation, and lending market monitoring.',
      template: 'Analyze protocol at {{address}} on {{chain}}.\n\nObjective: {{objective}}',
      schema: {
        type: 'object',
        properties: { address: { type: 'string' }, chain: { type: 'string' }, objective: { type: 'string' } },
        required: ['address'],
      },
    },
    {
      file: 'dex-analytics.md',
      name: 'DEX Analyst',
      desc: 'Analyze DEX pools: Uniswap V3 math, LP position analytics, swap volume, MEV filtering, liquidity depth, and automated market maker signals.',
      template: 'Analyze DEX pool {{address}} on {{chain}}.\n\nFocus: {{focus}}',
      schema: {
        type: 'object',
        properties: { address: { type: 'string' }, chain: { type: 'string' }, focus: { type: 'string' } },
        required: ['address'],
      },
    },
    {
      file: 'token-analytics.md',
      name: 'Token Inspector',
      desc: 'Audit token metrics: holder distribution, supply analysis (total/circulating/locked/burned), concentration metrics (Gini, HHI), and vesting schedules.',
      template: 'Inspect token {{address}} on {{chain}}.\n\nAnalysis type: {{analysis_type}}',
      schema: {
        type: 'object',
        properties: { address: { type: 'string' }, chain: { type: 'string' }, analysis_type: { type: 'string' } },
        required: ['address'],
      },
    },
    {
      file: 'clamm-vault-analytics.md',
      name: 'CLAMM Vault Analyzer',
      desc: 'Analyze concentrated liquidity vaults: rebalance decomposition, fee separation, share-price time series, HODL benchmarks, and LVR estimation.',
      template: 'Analyze CLAMM vault {{address}} on {{chain}}.\n\nTime period: {{period}}',
      schema: {
        type: 'object',
        properties: { address: { type: 'string' }, chain: { type: 'string' }, period: { type: 'string' } },
        required: ['address'],
      },
    },
    {
      file: 'contract-inspection.md',
      name: 'Contract Inspector',
      desc: 'Inspect smart contracts: proxy detection, storage layout analysis, event decoding, ABI resolution, and upgrade pattern identification.',
      template: 'Inspect contract {{address}} on {{chain}}.\n\nQuestion: {{question}}',
      schema: {
        type: 'object',
        properties: { address: { type: 'string' }, chain: { type: 'string' }, question: { type: 'string' } },
        required: ['address'],
      },
    },
  ];

  const patternsDir = resolve(skillDir, 'patterns');
  const insertMany = db.transaction(() => {
    for (const p of patterns) {
      const patternPath = resolve(patternsDir, p.file);
      if (!existsSync(patternPath)) continue;
      const content = readFileSync(patternPath, 'utf-8');
      const systemPrompt = content.slice(0, 8000);

      insert.run({
        $id: randomUUID(),
        $creator: CURATOR,
        $name: p.name,
        $desc: p.desc,
        $category: 'defi',
        $systemPrompt: systemPrompt,
        $userPromptTemplate: p.template,
        $model: 'gemini-2.0-flash',
        $temperature: 0.2,
        $maxTokens: 2048,
        $inputSchema: JSON.stringify(p.schema),
        $price: 3000,
        $mode: 'once',
        $metadataUri: 'https://github.com/Omnis-Labs/defi-onchain-analytics',
      });
      count++;
    }
  });
  insertMany();

  return count;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('init.ts')) {
  initDb();
  console.log('DB initialized successfully.');
}
