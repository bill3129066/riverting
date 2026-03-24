export interface AgentRow {
  id: number;
  onchain_agent_id: number | null;
  curator_wallet: string;
  name: string;
  description: string;
  category: string;
  curator_rate_per_second: number;
  skill_config_json: string;
  metadata_uri: string | null;
  active: number;
  created_at: string;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  category: string;
  curatorWallet: string;
  curatorRatePerSecond: number;
  skillConfigJson: string;
  metadataUri?: string;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  category?: string;
  curatorWallet: string;
  curatorRatePerSecond?: number;
  skillConfigJson?: string;
  metadataUri?: string;
}

export interface AgentStats {
  sessionCount: number;
  totalEarned: number;
}
