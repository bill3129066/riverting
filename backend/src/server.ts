import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { agentsRoutes } from './api/agents.routes.js';
import { sessionsRoutes } from './api/sessions.routes.js';
import { curatorRoutes } from './api/curator.routes.js';
import { queriesRoutes } from './api/queries.routes.js';
import { skillsRoutes } from './api/skills.routes.js';
import { initDb } from './db/init.js';
import { SessionOrchestrator } from './services/orchestrator/sessionOrchestrator.js';
import { EventWatcher } from './services/onchain/eventWatcher.js';
import { ProofRelayer } from './services/proof/proofRelayer.js';
import { TimeoutWatcher } from './services/proof/timeoutWatcher.js';
import { sseHub } from './services/realtime/sseHub.js';
import { instanceManager } from './services/instance/instanceManager.js';

const app = new Hono();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002').split(',').map(s => s.trim())

app.use('*', cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Payment', 'Last-Event-ID', 'X-Wallet-Address', 'X-Signature', 'X-Timestamp'],
}));

initDb();

export const orchestrator = new SessionOrchestrator();
const eventWatcher = new EventWatcher(orchestrator);
const proofRelayer = new ProofRelayer();
const timeoutWatcher = new TimeoutWatcher();

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/agents', agentsRoutes);
app.route('/api/sessions', sessionsRoutes);
app.route('/api/curator', curatorRoutes);
app.route('/api/queries', queriesRoutes);
app.route('/queries', queriesRoutes); // x402 canonical path
app.route('/api/skills', skillsRoutes);

const port = parseInt(process.env.PORT || '3001');
serve({ fetch: app.fetch, port }, async () => {
  console.log(`Backend running on http://localhost:${port}`);
  eventWatcher.start();
  await proofRelayer.start();
  timeoutWatcher.start();
  sseHub.startPingLoop();
});

export { instanceManager, app };
