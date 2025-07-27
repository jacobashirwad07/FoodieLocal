#!/bin/bash

echo "🚀 Pushing FoodieLocal to GitHub and deploying..."

# Check if we're in a git repository
if ! git status &> /dev/null; then
    echo "📁 Initializing git repository..."
    git init
    git remote add origin https://github.com/jacobashirwad07/FoodieLocal.git
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📦 Adding all files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy FoodieLocal - Hyperlocal Food Delivery App with Order Management"

# Push to main branch
echo "🌐 Pushing to GitHub main branch..."
git branch -M main
git push -u origin main

# Navigate to frontend and deploy
echo "🔨 Building and deploying frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the project
echo "🏗️ Building the project..."
npm run build

# Deploy to GitHub Pages
echo "🚀 Deploying to GitHub Pages..."
npm run deploy

echo "✅ Deployment complete!"
echo "🌍 Your site will be available at: https://jacobashirwad07.github.io/FoodieLocal/"
echo "⏰ It may take a few minutes for changes to appear."
echo "📋 Don't forget to enable GitHub Pages in your repository settings!"