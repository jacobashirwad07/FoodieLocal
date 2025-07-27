@echo off
REM FoodieLocal Deployment Script for Windows

echo 🚀 Starting deployment to GitHub Pages...

REM Navigate to frontend directory
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Build the project
echo 🔨 Building the project...
npm run build

REM Deploy to GitHub Pages
echo 🌐 Deploying to GitHub Pages...
npm run deploy

echo ✅ Deployment complete!
echo 🌍 Your site will be available at: https://jacobashirwad07.github.io/FoodieLocal/
echo ⏰ It may take a few minutes for changes to appear.

pause