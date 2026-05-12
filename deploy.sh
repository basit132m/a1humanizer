#!/bin/bash
set -e

DEPLOY_DIR="/var/www/a1humanizer"
REPO_URL="https://github.com/basit132m/a1humanizer.git"
BRANCH="claude/ai-humanizer-detector-jGWs8"

echo "==> Deploying A1 Humanizer..."

# Clone or pull latest
if [ -d "$DEPLOY_DIR/.git" ]; then
  echo "==> Pulling latest changes..."
  cd "$DEPLOY_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "==> Cloning repository..."
  git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# Install dependencies
echo "==> Installing dependencies..."
npm ci --production=false

# Create .env.local if it doesn't exist
if [ ! -f "$DEPLOY_DIR/.env.local" ]; then
  echo "==> WARNING: .env.local not found! Create it manually:"
  echo "    ANTHROPIC_API_KEY=your_key_here"
  echo "    ACCESS_KEYS=key1,key2,key3"
fi

# Build
echo "==> Building..."
npm run build

# Start/restart with PM2
echo "==> Starting with PM2..."
if pm2 list | grep -q "a1humanizer"; then
  pm2 restart a1humanizer
else
  pm2 start ecosystem.config.js
fi

pm2 save
echo "==> Deploy complete! App running on port 3000."
