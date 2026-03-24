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

// --- Skills ---

export interface SkillRow {
  id: string;
  agent_id: number | null;
  creator_wallet: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  user_prompt_template: string | null;
  model: string;
  temperature: number;
  max_tokens: number;
  tools_json: string | null;
  input_schema_json: string | null;
  price_per_run: number;
  rate_per_second: number | null;
  execution_mode: string;
  active: number;
  run_count: number;
  avg_rating: number | null;
  metadata_uri: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillInput {
  creatorWallet: string;
  name: string;
  description: string;
  category?: string;
  systemPrompt: string;
  userPromptTemplate?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  toolsJson?: string;
  inputSchemaJson?: string;
  pricePerRun?: number;
  ratePerSecond?: number;
  executionMode?: string;
  metadataUri?: string;
  agentId?: number;
}

export interface UpdateSkillInput {
  creatorWallet: string;
  name?: string;
  description?: string;
  category?: string;
  systemPrompt?: string;
  userPromptTemplate?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  toolsJson?: string;
  inputSchemaJson?: string;
  pricePerRun?: number;
  ratePerSecond?: number;
  executionMode?: string;
  metadataUri?: string;
}

export interface SkillExecutionRow {
  id: string;
  skill_id: string;
  user_wallet: string;
  session_id: string | null;
  input_json: string | null;
  output_text: string | null;
  output_metadata_json: string | null;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  amount_charged: number;
  created_at: string;
  completed_at: string | null;
}
