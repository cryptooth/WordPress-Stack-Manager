# WordPress Stack Manager

This repository contains the configuration and tools to provision a Docker-based WordPress hosting server.

## Directory Structure
```text
.
├── setup.sh                # The main automation script
├── manager/                # The custom Node.js WP Manager
├── sites/                  # Directory where WP sites live
│   └── template/           # The master template for new sites
├── portainer/              # Portainer configuration
└── npm/                    # Nginx Proxy Manager configuration
```

## Requirements
*   **OS**: Ubuntu 20.04 or 22.04 LTS (Fresh Install Recommended)
*   **Resources**: Minimum 1 vCPU / 2GB RAM
*   **Ports**:
    *   `80` & `443`: Web Traffic (NPM)
    *   `81`: Nginx Proxy Manager Admin
    *   `9000`: Portainer
    *   `3000`: Stack Manager UI
    *   `22xx`: SFTP Ports (Auto-assigned starting from 2201)

## How to Install on a New Server

1.  **Prepare the Repo**:
    *   Upload all these files to a GitHub repository (private recommended).

2.  **On the VPS/Server**:
    *   Login via SSH.
    *   Run the following commands:

```bash
# 1. Download the setup script (or clone the whole repo)
git clone https://github.com/cryptooth/WordPress-Stack-Manager.git ~/docker

# 2. Go to the directory
cd ~/docker

# 3. Make script executable
chmod +x setup.sh

# 4. Run it
./setup.sh
```


## Security Configuration
**IMPORTANT**: The default configuration uses insecure passwords. You must change them before using in production.

1.  **WP Manager Password**:
    *   Edit `manager/docker-compose.yml`
    *   Change `ADMIN_PASSWORD` value.
    *   Run `cd ~/docker/manager && docker compose up -d` to apply.

## Components
*   **Portainer**: Exposed on Port `9000`. Used for container management.
*   **Nginx Proxy Manager**: Exposed on Port `81`. Used to route domains to containers.
*   **WP Manager**: Exposed on Port `3000` (localhost only by default unless tunneled, check docker-compose).
    *   *Note*: The current `manager/docker-compose.yml` binds to `127.0.0.1:3000`. If you want to access it remotely during initial setup, you might need to change it to `3000:3000` temporarily or use an SSH Tunnel:
    *   `ssh -L 3000:localhost:3000 user@your-server-ip`
