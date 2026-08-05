#!/usr/bin/env bash
# One-shot bootstrap for a fresh OCI Ubuntu 22.04/24.04 Ampere A1 VM.
# Run as the default `ubuntu` user:  bash bootstrap.sh
set -euo pipefail

echo "==> Installing Docker Engine + compose plugin"
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"

# OCI's Ubuntu images ship an iptables INPUT chain that REJECTs everything but
# 22 — the VCN security list alone is NOT enough. Insert 80/443 before the
# reject rule and persist.
echo "==> Opening 80/443 in the instance firewall"
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y netfilter-persistent iptables-persistent
sudo netfilter-persistent save

echo "==> Done. Log out/in (for the docker group), put .env next to docker-compose.yml, then:"
echo "    docker compose pull && docker compose up -d"
