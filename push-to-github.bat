@echo off
echo 🚀 Pushing FoodieLocal to GitHub and deploying...

REM Check if we're in a git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo 📁 Initializing git repository...
    git init
    git remote add origin https://github.com/jacobashirwad07/FoodieLocal.git
) else (
    echo ✅ Git repository already initialized
)

REM Add all files
echo 📦 Adding all files...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Deploy FoodieLocal - Hyperlocal Food Delivery App with Order Management"

REM Push to main branch
echo 🌐 Pushing to GitHub main branch...
git branch -M main
git push -u origin main

REM Navigate to frontend and deploy
echo 🔨 Building and deploying frontend...
cd frontend

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

REM Build the project
echo 🏗️ Building the project...
npm run build

REM Deploy to GitHub Pages
echo 🚀 Deploying to GitHub Pages...
npm run deploy

echo ✅ Deployment complete!
echo 🌍 Your site will be available at: https://jacobashirwad07.github.io/FoodieLocal/
echo ⏰ It may take a few minutes for changes to appear.
echo 📋 Don't forget to enable GitHub Pages in your repository settings!

pause