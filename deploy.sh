#!/bin/bash

# FoodieLocal Deployment Script
echo "🚀 Starting deployment to GitHub Pages..."

# Navigate to frontend directory
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Deploy to GitHub Pages
echo "🌐 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌍 Your site will be available at: https://jacobashirwad07.github.io/FoodieLocal/"
echo "⏰ It may take a few minutes for changes to appear."