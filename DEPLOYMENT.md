# Deploying LuxPrima to your Server

To deploy LuxPrima to another server on your network, follow these steps:

## 1. Prerequisites
Ensure your server has the following installed:
- **Docker** and **Docker Compose**
- **Git** (to pull the codebase)

## 2. Transfer the Code
You can either clone the repository directly on the server or transfer the files via SSH/SCP:
```bash
# Example if using SCP
scp -r ./LuxPrima user@your-server-ip:~/LuxPrima
```

## 3. Configuration
The application is already configured to run on port **8081**. 

> [!TIP]
> If you plan to use a custom LLM (like Local Llama) running on your server, ensure you use `host.docker.internal` or the server's private IP in the **Settings** page.

## 4. Launch & Update
Navigate to the project directory on your server and run:
```bash
# Force a clean rebuild of the backend to bypass caching issues
sudo docker compose build --no-cache backend
sudo docker compose build frontend
sudo docker compose up -d
```
    *This command identifies changes, rebuilds only the necessary parts, and restarts the containers without deleting your data.*

---
### Important Notes for Server Deployment:
- **Data Persistence**: Your settings and reports are saved in the `luxprima_data` volume. These will persist across restarts.
- **Auto-Restart**: The application is configured with `restart: always`, meaning it will **automatically start** whenever your server reboots or if the containers crash.
- **Port 8000**: The backend API remains on port 8000. Ensure this is accessible if you plan to connect external tools to the API.

## Troubleshooting: Docker Permissions
If you see a "permission denied" error when running docker commands:
1.  **Use Sudo**: Prefix your commands with `sudo` (e.g., `sudo docker compose up`).
2.  **Add User to Docker Group** (Recommended): To run docker without sudo, execute:
    ```bash
    sudo usermod -aG docker $USER
    ```
    *Note: You will need to log out and back in for this to take effect.*

## Troubleshooting: Network / Build Timeouts
> [!IMPORTANT]
> **Primary Suspect: MTU Mismatch**
> If `ping` works but `npm install` or `pip install` hangs/times out, your server likely has a non-standard MTU (common on Cloud VPCs). 
> 1. Run `ip addr | grep mtu` on your server.
> 2. If you see a number less than 1500 (e.g., 1450), add it to `/etc/docker/daemon.json`: `{ "mtu": 1400 }`
> 3. Restart docker: `sudo systemctl restart docker`.

If you still see `ETIMEDOUT` or `ReadTimeoutError`:

1.  **Use Host Networking**: Force the build to use your server's native network:
    ```bash
    sudo docker compose build --network=host
    sudo docker compose up -d
    ```
2.  **Verify Internal DNS**: Test if a container can resolve names:
    ```bash
    sudo docker run --rm alpine nslookup google.com
    ```
3.  **Firewall Check**: Ensure the Docker bridge isn't blocked:
    ```bash
    sudo ufw allow in on docker0
    ```
