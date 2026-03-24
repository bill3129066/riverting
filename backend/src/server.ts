import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { agentsRoutes } from './api/agents.routes.js';
import { initDb } from './db/init.js';

const app = new Hono();

initDb();

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/agents', agentsRoutes);

const port = parseInt(process.env.PORT || '3001');
serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on http://localhost:${port}`);
});

export default app;
