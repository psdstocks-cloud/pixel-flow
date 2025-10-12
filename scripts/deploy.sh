#!/bin/bash

# Pixel Flow Deployment Script
echo "🚀 Deploying Pixel Flow..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build all packages
echo "🔨 Building packages..."
npm run build

# Deploy frontend to Vercel
echo "🌐 Deploying frontend to Vercel..."
cd apps/web
vercel --prod --yes
cd ../..

# Deploy backend to Railway
echo "🚂 Deploying backend to Railway..."
railway up --detach

echo "✅ Deployment complete!"
echo "Frontend: https://your-app.vercel.app"
echo "Backend: https://your-app.railway.app"
