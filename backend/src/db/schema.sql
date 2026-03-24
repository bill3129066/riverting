CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  onchain_agent_id INTEGER,
  curator_wallet TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'defi',
  curator_rate_per_second INTEGER NOT NULL,
  skill_config_json TEXT NOT NULL,
  metadata_uri TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  onchain_session_id INTEGER,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  user_wallet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  total_rate INTEGER NOT NULL,
  curator_rate INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_steps (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  seq INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  seq INTEGER NOT NULL,
  proof_hash TEXT NOT NULL,
  metadata_uri TEXT,
  tx_hash TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS curator_earnings (
  id TEXT PRIMARY KEY,
  curator_wallet TEXT NOT NULL,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  session_id TEXT NOT NULL REFERENCES sessions(id),
  earned_amount INTEGER NOT NULL,
  paid_out INTEGER NOT NULL DEFAULT 0,
  payout_tx_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS query_sales (
  id TEXT PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  route TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  receipt_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
