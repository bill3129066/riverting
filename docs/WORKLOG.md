# Riverting — Work Log

**Project**: X Layer OnchainOS AI Hackathon  
**Team**: 2 devs

---

## 2026-03-28 — SSE Fix: Vercel Rewrites (replacing Cloudflare Tunnel)

### Problem

Cloudflare Quick Tunnel buffers SSE (Server-Sent Events) streaming responses — confirmed via A/B test (0 bytes through tunnel vs 136 bytes direct on VM). Root cause: CF Quick Tunnel issue [#1449](https://github.com/cloudflare/cloudflared/issues/1449). Non-streaming API calls worked fine.

### Fix

Replaced Cloudflare Tunnel with **Vercel Rewrites** as reverse proxy:

- `next.config.js` rewrites `/api/*` → `http://<VM-IP>:3001/api/*`
- Browser makes same-origin requests to Vercel (no CORS, HTTPS handled by Vercel)
- Vercel edge proxies server-to-server to the VM (HTTP, no HTTPS needed)
- SSE streams pass through without buffering

Also switched backend from `@hono/node-server` → native `Bun.serve()` (not the root cause, but correct for Bun runtime).

### Vercel Env Vars (new)

| Var | Value | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_API_URL` | *(empty string)* | Makes frontend use relative URLs → goes through rewrites |
| `BACKEND_URL` | `http://<VM-IP>:3001` | Used by next.config.js rewrites at build time |

### Removed

- `cloudflared-tunnel.service` — stopped and disabled on VM
- `cloudflared` is no longer needed

---

## 2026-03-28 — Backend Deployment (GCE)

### Goal

Deploy backend (Hono + Bun + SQLite) to GCP so the Vercel frontend can talk to it over HTTPS. Hackathon-grade — fast, cheap, works.

### Decision

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend | Vercel | Next.js native, zero config |
| Backend | GCE e2-micro | Free tier, SQLite stays as-is, zero code changes |
| Database | SQLite (on VM) | Already works, init.ts seeds demo data |
| HTTPS | Vercel Rewrites (was: Cloudflare Tunnel) | Same-origin proxy, SSE works, no domain needed |

**Alternatives considered & rejected:**
- **Cloud Run** — SQLite is ephemeral on container restart. Would need DB migration or accept data loss.
- **Firebase Functions** — Doesn't support Bun runtime. Would need massive rewrite.
- **Firestore** — Would require rewriting 20+ files of DB layer. Not worth it for hackathon.
- **asia-east1 region** — Not free tier eligible. us-central1 is free; Cloudflare Tunnel handles latency.

### What Was Done

1. **Created GCP project** `xlayer-hackathon`
   - Linked billing account
   - Enabled Compute Engine API

2. **Provisioned VM** `riverting-backend`
   - Zone: `us-central1-a` (free tier eligible)
   - Machine type: `e2-micro` (2 shared vCPU, 1GB RAM)
   - OS: Ubuntu 24.04 LTS
   - Disk: 30GB pd-standard
   - Tags: `http-server`, `https-server`
   - Firewall: TCP 80, 443, 3001 open

3. **VM setup**
   - Added 2GB swap (critical — e2-micro only has 1GB RAM, `bun install` needs headroom)
   - Installed Bun 1.3.11
   - Installed cloudflared 2026.3.0 (via Cloudflare apt repo)

4. **App deployment**
   - Cloned `bill3129066/riverting` (public repo)
   - Wrote `.env` to `backend/.env` with demo config
   - `bun install` in backend/ (20 packages, 1.3s)
   - `bun run src/db/init.ts` — seeded 17 skills + 2 agents

5. **Systemd service** (auto-restart + boot-start)
   - `riverting-backend.service` — runs `bun run src/server.ts` with env from `.env`

6. **Verification**
   - Health check: `{"status":"ok"}` via direct IP
   - API test: `/api/agents` returns full agent list
   - Memory: 461MB/955MB + 2GB swap available

### Deployment Info

| Key | Value |
|-----|-------|
| GCP Project | `xlayer-hackathon` |
| VM Name | `riverting-backend` |
| Zone | `us-central1-a` |
| External IP | *(see GCP Console)* |
| Backend Port | 3001 |
| DB File | `~/riverting/backend/demo.db` |

### Operations Cheatsheet

```bash
# SSH into VM
gcloud compute ssh riverting-backend --zone=us-central1-a

# Check service status
sudo systemctl status riverting-backend

# View logs
journalctl -u riverting-backend -f

# Update code
cd ~/riverting && git pull && cd backend && bun install
sudo systemctl restart riverting-backend
```

### Known Limitations

1. **SQLite is local** — no replication, no backup. If VM disk dies, re-run `bun run src/db/init.ts` to re-seed.
2. **e2-micro is weak** — 1GB RAM. Fine for demo with a few concurrent users. Will OOM under heavy load.
3. **Vercel Rewrites may have timeouts** — Vercel Hobby plan may timeout long-lived SSE connections. Auto-reconnect in frontend handles this.
