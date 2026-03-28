# Riverting — Work Log

**Project**: X Layer OnchainOS AI Hackathon  
**Team**: 2 devs

---

## 2026-03-28 — Backend Deployment (GCE + Cloudflare Tunnel)

### Goal

Deploy backend (Hono + Bun + SQLite) to GCP so the Vercel frontend can talk to it over HTTPS. Hackathon-grade — fast, cheap, works.

### Decision

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend | Vercel | Next.js native, zero config |
| Backend | GCE e2-micro | Free tier, SQLite stays as-is, zero code changes |
| Database | SQLite (on VM) | Already works, init.ts seeds demo data |
| HTTPS | Cloudflare Quick Tunnel | No domain needed, auto HTTPS, free |

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

5. **Systemd services** (auto-restart + boot-start)
   - `riverting-backend.service` — runs `bun run src/server.ts` with env from `.env`
   - `cloudflared-tunnel.service` — Quick Tunnel to localhost:3001

6. **Verification**
   - Health check: `{"status":"ok"}` via both direct IP and tunnel
   - API test: `/api/agents` returns full agent list
   - Memory: 461MB/955MB + 2GB swap available

### Deployment Info

| Key | Value |
|-----|-------|
| GCP Project | `xlayer-hackathon` |
| VM Name | `riverting-backend` |
| Zone | `us-central1-a` |
| External IP | *(see GCP Console)* |
| Tunnel URL | *(see `journalctl -u cloudflared-tunnel \| grep trycloudflare`)* |
| Backend Port | 3001 |
| DB File | `~/riverting/backend/demo.db` |

### Vercel Frontend Config

Set this env var on Vercel:
```
NEXT_PUBLIC_API_URL=https://<your-tunnel-subdomain>.trycloudflare.com
```

### Operations Cheatsheet

```bash
# SSH into VM
gcloud compute ssh riverting-backend --zone=us-central1-a

# Check service status
sudo systemctl status riverting-backend
sudo systemctl status cloudflared-tunnel

# View logs
journalctl -u riverting-backend -f
journalctl -u cloudflared-tunnel -f

# Get current tunnel URL (changes on restart)
journalctl -u cloudflared-tunnel | grep trycloudflare

# Update code
cd ~/riverting && git pull && cd backend && bun install
sudo systemctl restart riverting-backend

# Restart tunnel (will get new URL — update Vercel env var)
sudo systemctl restart cloudflared-tunnel

# Full restart
sudo systemctl restart riverting-backend cloudflared-tunnel
```

### Known Limitations

1. **Quick Tunnel URL is ephemeral** — changes if cloudflared restarts or VM reboots. Must update Vercel `NEXT_PUBLIC_API_URL` when it changes.
2. **SSE may be buffered** — Cloudflare Quick Tunnel can buffer HTTP streaming responses. If streaming salary / live agent timeline is laggy, switch to DuckDNS + Caddy for native HTTPS.
3. **SQLite is local** — no replication, no backup. If VM disk dies, re-run `bun run src/db/init.ts` to re-seed.
4. **e2-micro is weak** — 1GB RAM. Fine for demo with a few concurrent users. Will OOM under heavy load.
