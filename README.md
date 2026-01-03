# WordPress Stack Manager

**The Ultimate Self-Hosted WordPress Solution**

**WordPress Stack Manager** turns any fresh Ubuntu server into a professional, automated hosting platform in minutes. It completely automates the complexities of Docker, Nginx Proxy Manager (SSL/Routing), and Portainer, giving you a turnkey solution.

🚀 **Key Features:**
*   **One-Click Server Provisioning**: Turns a blank server into a hosting powerhouse.
*   **Custom Dashboard**: Spin up new isolated WordPress sites in seconds.
*   **Automated Security**: Each site gets its own isolated containers (App, DB, PMA) and dedicated SFTP.
*   **Zero Configuration**: SSL certificates and Reverse Proxy handled via Nginx Proxy Manager.
*   **Portable & Scalable**: Modern "Infrastructure as Code" structure using named volumes.

**Setup so easy, it feels like magic.** Just run one script:

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

## How to Install on a New Server

You can use this repository directly or fork it to your own account if you want to customize the stack.

### Option 1: Quick Start (Recommended)
Run these commands on your VPS to pull the latest version of this manager:

```bash
# 1. Clone the repository
git clone https://github.com/cryptooth/WordPress-Stack-Manager.git ~/docker

# 2. Enter the directory
cd ~/docker

# 3. Make script executable
chmod +x setup.sh

# 4. Run the installer
./setup.sh
```

### Option 2: Use Your Own Fork
If you want to customize the stack (e.g. default plugins, themes in the template):
1.  Fork this repository on GitHub.
2.  Clone your own URL: `git clone https://github.com/YOUR_USERNAME/WordPress-Stack-Manager.git ~/docker`
3.  Run setup as above.


## Security Configuration
**IMPORTANT**: The default configuration uses insecure passwords. You must change them before using in production.

1.  **Portainer Password**:
    *   The initial password might be in the container logs.
    *   Run: `docker logs portainer` to find it (if not prompted on first login).

2.  **Nginx Proxy Manager**:
    *   Follow the on-screen instructions to create your admin account and password.

3.  **WordPress Stack Manager Password**:
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

