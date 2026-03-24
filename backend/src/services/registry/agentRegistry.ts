import { getDb } from '../../db/client.js';
import type { AgentRow, CreateAgentInput, UpdateAgentInput, AgentStats } from '../../types/index.js';

export function listActiveAgents(): AgentRow[] {
  return getDb().prepare('SELECT * FROM agents WHERE active = 1 ORDER BY created_at DESC').all() as AgentRow[];
}

export function getAgentById(id: number): AgentRow | undefined {
  return (getDb().prepare('SELECT * FROM agents WHERE id = $id').get({ $id: id }) as AgentRow) ?? undefined;
}

export function createAgent(input: CreateAgentInput): AgentRow {
  const db = getDb();
  db.prepare(`
    INSERT INTO agents (curator_wallet, name, description, category, curator_rate_per_second, skill_config_json, metadata_uri)
    VALUES ($curatorWallet, $name, $description, $category, $curatorRatePerSecond, $skillConfigJson, $metadataUri)
  `).run({
    $curatorWallet: input.curatorWallet,
    $name: input.name,
    $description: input.description,
    $category: input.category,
    $curatorRatePerSecond: input.curatorRatePerSecond,
    $skillConfigJson: input.skillConfigJson,
    $metadataUri: input.metadataUri ?? null,
  });

  const row = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
  return getAgentById(row.id)!;
}

export function updateAgent(id: number, input: UpdateAgentInput): AgentRow | undefined {
  const existing = getAgentById(id);
  if (!existing) return undefined;

  const db = getDb();
  db.prepare(`
    UPDATE agents SET
      name = $name,
      description = $description,
      category = $category,
      curator_rate_per_second = $curatorRatePerSecond,
      skill_config_json = $skillConfigJson,
      metadata_uri = $metadataUri
    WHERE id = $id
  `).run({
    $id: id,
    $name: input.name ?? existing.name,
    $description: input.description ?? existing.description,
    $category: input.category ?? existing.category,
    $curatorRatePerSecond: input.curatorRatePerSecond ?? existing.curator_rate_per_second,
    $skillConfigJson: input.skillConfigJson ?? existing.skill_config_json,
    $metadataUri: input.metadataUri ?? existing.metadata_uri,
  });

  return getAgentById(id);
}

export function deactivateAgent(id: number): boolean {
  const db = getDb();
  db.prepare('UPDATE agents SET active = 0 WHERE id = $id').run({ $id: id });
  const agent = getAgentById(id);
  return agent !== undefined && agent.active === 0;
}

export function getAgentStats(_id: number): AgentStats {
  return { sessionCount: 0, totalEarned: 0 };
}
