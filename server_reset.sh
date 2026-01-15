#!/bin/bash

# LuxPrima Server Reset Script
# Use this to cleanly redeploy the application on the server.

echo "🛑 Stopping existing containers..."
sudo docker compose down

echo "🧹 Cleaning up local artifacts that might pollute the build..."
rm -rf frontend/dist
rm -rf frontend/node_modules
rm -rf backend/__pycache__
rm -rf backend/venv

echo "🗑️  Pruning Docker build cache..."
sudo docker system prune -f

echo "🏗️  Rebuilding with --no-cache..."
sudo docker compose build --no-cache

echo "🚀 Starting LuxPrima..."
sudo docker compose up -d

echo "✅ Done! Please refresh your browser (Ctrl+F5 or Cmd+Shift+R)."
echo "   Look for 'STANDALONE_SERVER_V2' in the bottom-left sidebar."
