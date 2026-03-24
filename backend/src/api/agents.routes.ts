import { Hono } from 'hono';
import {
  listActiveAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deactivateAgent,
  getAgentStats,
} from '../services/registry/agentRegistry.js';
import { requireSignature } from '../middleware/verifySignature.js';

export const agentsRoutes = new Hono();

// --- Public read routes ---

agentsRoutes.get('/', (c) => {
  return c.json(listActiveAgents());
});

agentsRoutes.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);
  const agent = getAgentById(id);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  return c.json(agent);
});

agentsRoutes.get('/:id/market-data', async (c) => {
  const { getTokenPrices } = await import('../services/data/marketAdapter.js')
  const { getCurrentBlock } = await import('../services/data/rpcAdapter.js')
  const prices = await getTokenPrices(['ETH-USDC', 'OKB-USDC'])
  const block = await getCurrentBlock()
  return c.json({ prices, block, timestamp: new Date().toISOString() })
})

agentsRoutes.get('/:id/stats', (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);
  const agent = getAgentById(id);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  return c.json(getAgentStats(id));
});

// --- Authenticated write routes ---

agentsRoutes.post('/',
  requireSignature('create-agent'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    if (!body.name || !body.description || !body.skillConfigJson) {
      return c.json({ error: 'Missing required fields: name, description, skillConfigJson' }, 400);
    }

    // Validate skillConfigJson is valid JSON
    try {
      JSON.parse(body.skillConfigJson)
    } catch {
      return c.json({ error: 'skillConfigJson must be valid JSON' }, 400);
    }

    const agent = createAgent({
      name: body.name,
      description: body.description,
      category: body.category || 'defi',
      curatorWallet: wallet, // from verified signature, not body
      curatorRatePerSecond: body.curatorRatePerSecond || 0,
      skillConfigJson: body.skillConfigJson,
      metadataUri: body.metadataUri?.slice(0, 2048),
    });

    return c.json(agent, 201);
  },
);

agentsRoutes.put('/:id',
  requireSignature('update-agent'),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);

    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    const existing = getAgentById(id);
    if (!existing) return c.json({ error: 'Agent not found' }, 404);
    if (existing.curator_wallet.toLowerCase() !== wallet) {
      return c.json({ error: 'Unauthorized: wallet does not match agent curator' }, 403);
    }

    const updated = updateAgent(id, { ...body, curatorWallet: wallet });
    return c.json(updated);
  },
);

agentsRoutes.delete('/:id',
  requireSignature('delete-agent'),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);

    const wallet: string = c.get('verifiedWallet')

    const existing = getAgentById(id);
    if (!existing) return c.json({ error: 'Agent not found' }, 404);
    if (existing.curator_wallet.toLowerCase() !== wallet) {
      return c.json({ error: 'Unauthorized: wallet does not match agent curator' }, 403);
    }

    deactivateAgent(id);
    return c.json({ success: true });
  },
);
