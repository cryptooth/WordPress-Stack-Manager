# WordPress Stack Manager

This repository contains the configuration and tools to provision a Docker-based WordPress hosting server.

**Automated Setup**: You don't need to install Docker or configure anything manually.
Just execute the script on a **fresh Ubuntu server** (Standard or Minimal), and it will install all dependencies (Docker, Git, etc.) and launch the stack for you.

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
*   **User**: Non-root user with `sudo` privileges (Recommended)
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

1.  **Portainer Password**:
    *   The initial password might be in the container logs.
    *   Run: `docker logs portainer` to find it (if not prompted on first login).

2.  **Nginx Proxy Manager**:
    *   Default Login: `admin@example.com` / `changeme`
    *   You will be asked to change this immediately.

3.  **WP Manager Password**:
    *   Edit `manager/docker-compose.yml`
    *   Change `ADMIN_PASSWORD` value.
    *   Run `cd ~/docker/manager && docker compose up -d` to apply.

## Components
*   **Portainer**: Exposed on Port `9000`. Used for container management.
*   **Nginx Proxy Manager**: Exposed on Port `81`. Used to route domains to containers.
*   **WP Manager**: Exposed on Port `3000` (localhost only by default unless tunneled, check docker-compose).
    *   *Note*: The current `manager/docker-compose.yml` binds to `127.0.0.1:3000`. If you want to access it remotely during initial setup, you might need to change it to `3000:3000` temporarily or use an SSH Tunnel:
    *   `ssh -L 3000:localhost:3000 user@your-server-ip`

## Docker Cheatsheet

Here are some useful commands for managing your server.

**List All Containers** (Running & Stopped)
```bash
docker ps -a
```

**View Container Logs**
```bash
# Example: Check NPM logs
docker logs nginx-proxy-manager
# Follow logs in real-time
docker logs -f wp_manager
```

**Restart a Specific Service**
```bash
cd ~/docker/manager
docker compose restart
```

**Stop & Remove a Stack** (Destructive!)
If you want to manually delete a site (e.g., `mysite.com`) completely:
```bash
# 1. Stop and remove containers
cd ~/docker/sites/mysite.com
docker compose down

# 2. (Optional) Remove data volumes (Database & WP Files will be lost!)
docker compose down -v
```

