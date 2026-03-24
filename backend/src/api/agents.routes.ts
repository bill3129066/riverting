import { Hono } from 'hono';
import {
  listActiveAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deactivateAgent,
  getAgentStats,
} from '../services/registry/agentRegistry.js';
import type { CreateAgentInput, UpdateAgentInput } from '../types/index.js';

export const agentsRoutes = new Hono();

agentsRoutes.get('/', (c) => {
  const agents = listActiveAgents();
  return c.json(agents);
});

agentsRoutes.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);

  const agent = getAgentById(id);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  return c.json(agent);
});

agentsRoutes.post('/', async (c) => {
  const body = await c.req.json<CreateAgentInput>();

  if (!body.name || !body.description || !body.curatorWallet || !body.skillConfigJson) {
    return c.json({ error: 'Missing required fields: name, description, curatorWallet, skillConfigJson' }, 400);
  }

  const agent = createAgent({
    name: body.name,
    description: body.description,
    category: body.category || 'defi',
    curatorWallet: body.curatorWallet,
    curatorRatePerSecond: body.curatorRatePerSecond || 0,
    skillConfigJson: body.skillConfigJson,
    metadataUri: body.metadataUri,
  });

  return c.json(agent, 201);
});

agentsRoutes.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);

  const body = await c.req.json<UpdateAgentInput>();

  if (!body.curatorWallet) {
    return c.json({ error: 'curatorWallet required for authorization' }, 400);
  }

  const existing = getAgentById(id);
  if (!existing) return c.json({ error: 'Agent not found' }, 404);

  if (existing.curator_wallet !== body.curatorWallet) {
    return c.json({ error: 'Unauthorized: curatorWallet does not match' }, 403);
  }

  const updated = updateAgent(id, body);
  return c.json(updated);
});

agentsRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);

  const body = await c.req.json<{ curatorWallet: string }>();

  if (!body.curatorWallet) {
    return c.json({ error: 'curatorWallet required for authorization' }, 400);
  }

  const existing = getAgentById(id);
  if (!existing) return c.json({ error: 'Agent not found' }, 404);

  if (existing.curator_wallet !== body.curatorWallet) {
    return c.json({ error: 'Unauthorized: curatorWallet does not match' }, 403);
  }

  deactivateAgent(id);
  return c.json({ success: true, message: 'Agent deactivated' });
});

agentsRoutes.get('/:id/stats', (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid agent ID' }, 400);

  const agent = getAgentById(id);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const stats = getAgentStats(id);
  return c.json(stats);
});
