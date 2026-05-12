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

# Warn if .env.local is missing
if [ ! -f "$DEPLOY_DIR/.env.local" ]; then
  echo ""
  echo "  ⚠  WARNING: .env.local not found! Create it before starting:"
  echo "     ANTHROPIC_API_KEY=sk-ant-..."
  echo "     ADMIN_KEY=your-secret-admin-key"
  echo "     ACCESS_KEYS=optional-legacy-keys"
  echo ""
fi

# Ensure data directory exists for key storage
mkdir -p "$DEPLOY_DIR/data"

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
echo ""
echo "==> Deploy complete! App running on port 3000."
echo "==> Visit: https://a1humanizer.site"
