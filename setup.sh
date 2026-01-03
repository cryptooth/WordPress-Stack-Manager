#!/bin/bash

# Server Setup Script
# Usage: ./setup.sh

# Configuration
# --------------------
# If you have your files in a private repo, generate a token and put the full URL here.
# Example: https://oauth2:YOUR_TOKEN@github.com/username/repo.git
REPO_URL=""

# If false, it assumes you have already uploaded the 'docker' folder to ~/docker
CLONE_REPO=false

# --------------------

set -e

echo ">>> Starting Server Setup..."

# 1. Update and Install Prerequisites
echo ">>> Updating system and installing prerequisites..."
sudo apt-get update
sudo apt-get install -y curl git jq

# 2. Install Docker (if not installed)
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo ">>> Docker installed."
else
    echo ">>> Docker already installed."
fi

# 2.1 Refresh Group Permissions
# If user is in 'docker' group (db) but current process isn't, reload script with proper group.
if id -nG "$USER" | grep -qw "docker" && ! id -nG | grep -qw "docker"; then
    echo ">>> User found in docker group but session not updated."
    echo ">>> Reloading script with 'sg' to apply group permissions..."
    exec sg docker -c "bash $0"
fi

# 3. Setup Directory Structure
TARGET_DIR="$HOME/docker"
mkdir -p "$TARGET_DIR"

if [ -n "$REPO_URL" ] && [ "$CLONE_REPO" = true ]; then
    echo ">>> Cloning repository from $REPO_URL..."
    # Ensure dir is empty or clone into temp and move
    if [ "$(ls -A $TARGET_DIR)" ]; then
         echo "WARNING: $TARGET_DIR is not empty. Skipping clone."
    else
         git clone "$REPO_URL" "$TARGET_DIR"
    fi
fi

# 4. Start Portainer
echo ">>> Starting Portainer..."
if [ -f "$TARGET_DIR/portainer/docker-compose.yml" ]; then
    cd "$TARGET_DIR/portainer"
    docker compose up -d
else
    echo "WARNING: Portainer docker-compose.yml not found."
fi

# 5. Start Nginx Proxy Manager (NPM)
echo ">>> Starting Nginx Proxy Manager..."
# Check if NPM exists, if not create a default one (since folder was empty in inspection)
mkdir -p "$TARGET_DIR/npm"
if [ ! -f "$TARGET_DIR/npm/docker-compose.yml" ]; then
    echo ">>> Creating default NPM docker-compose.yml..."
    cat <<EOF > "$TARGET_DIR/npm/docker-compose.yml"
version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: always
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - default
      - proxy

networks:
  proxy:
    name: nginx-proxy-manager_default
EOF
fi

cd "$TARGET_DIR/npm"
docker compose up -d

# 6. Start WP Manager
echo ">>> Starting WP Manager..."
if [ -f "$TARGET_DIR/manager/docker-compose.yml" ]; then
    cd "$TARGET_DIR/manager"
    docker compose up -d --build
else
    echo "WARNING: Manager docker-compose.yml not found."
fi

# 7. Summary
IP_ADDR=$(curl -s ifconfig.me)
echo "-----------------------------------------------------"
echo "SETUP COMPLETED!"
echo "-----------------------------------------------------"
echo "Portainer:      http://$IP_ADDR:9000"
echo "NPM Admin:      http://$IP_ADDR:81  (Check logs: 'docker logs nginx-proxy-manager')"
echo "WP Manager:     http://$IP_ADDR:3000"
echo ""
echo "NOTE: If you haven't already, please secure your Portainer and NPM instances immediately."
echo "-----------------------------------------------------"
