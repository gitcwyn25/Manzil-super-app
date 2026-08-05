# Manzil API on Oracle Cloud Always Free — runbook

Replaces Railway hosting. Stack on one Ampere A1 VM: Caddy (auto-TLS) → NestJS API (arm64 container) → Redis. DB/storage stay on Supabase. Cost: $0/month, no expiry.

## 1. Oracle signup (once)

- Sign up at <https://www.oracle.com/cloud/free/> (card needed for identity only; Always Free never charges).
- **Home region is permanent** — pick `eu-frankfurt-1` or `me-jeddah-1` (good latency to Tashkent, usually has A1 capacity).

## 2. Create the VM (console)

1. Compute → Instances → Create instance.
2. Image: **Ubuntu 24.04 (aarch64)**. Shape: **VM.Standard.A1.Flex — 2 OCPU / 12 GB** (well inside Always Free; leaves headroom to grow to 4/24).
3. Networking: create/select a public VCN + subnet, **assign a public IPv4**.
4. SSH keys: paste the public key printed by the migration operator (or generate your own).
5. After create: Networking → VCN → Security List → add **ingress 0.0.0.0/0 TCP 80 and 443**.
6. (Recommended) Reserve the public IP: Instance → attached VNIC → IPv4 → edit → **Reserved public IP**, so the address survives reboots.
7. If A1 shows "Out of capacity": try again later or the other AD — capacity refreshes frequently.

## 3. DuckDNS (once)

- <https://www.duckdns.org> → sign in → create subdomain (e.g. `manzil-api`) → set its IP to the VM's public IP.
- No token needed on the server (the IP is static/reserved).

## 4. Bootstrap the VM

```bash
scp -r infra/oracle ubuntu@<VM_IP>:~/manzil
ssh ubuntu@<VM_IP>
cd ~/manzil && bash bootstrap.sh
# log out & in (docker group), then:
cp .env.example .env && nano .env   # fill from the Railway variables
docker compose pull && docker compose up -d
```

Verify: `https://<subdomain>.duckdns.org/v1/health` → `{"data":{"ok":true,...}}` with a valid certificate.

## 5. CI/CD

`.github/workflows/deploy-api-oracle.yml` builds the arm64 image to GHCR and SSH-deploys on push to main. Repo secrets required:

- `ORACLE_VM_HOST` — the VM public IP or duckdns hostname
- `ORACLE_VM_SSH_KEY` — private key matching the VM's authorized key

GHCR visibility: the package must be public OR the VM logs in with a read token (`docker login ghcr.io`).

## 6. Cutover (zero downtime)

1. Oracle URL verified green (health + home/search/categories/businesses).
2. Vercel → project env → set `NEXT_PUBLIC_API_URL=https://<subdomain>.duckdns.org/v1` → redeploy web.
3. Watch for a day; Railway service stays as instant rollback (flip the env var back).
4. Then delete the Railway service/project to end billing.

## Notes

- `trust proxy: 1` in main.ts is correct here too: Caddy is exactly one hop.
- Redis on the VM gives the API a real cache + shared throttle buckets for the first time (Railway ran `cache: memory`).
- The Split-by-Role design (docs/superpowers/specs/2026-08-05-split-by-role-api-design.md) maps cleanly later: roles become extra `api` services in this compose file with `MANZIL_SERVICE_ROLE` set — same one-image model, no Railway dependency.
