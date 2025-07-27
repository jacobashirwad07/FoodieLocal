#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting manual deployment to GitHub Pages...');

try {
  // Change to frontend directory
  process.chdir('frontend');
  
  // Check if we're in a git repository
  try {
    execSync('git status', { stdio: 'ignore' });
  } catch (error) {
    console.log('📁 Initializing git repository...');
    execSync('git init');
    execSync('git remote add origin https://github.com/jacobashirwad07/FoodieLocal.git');
  }

  // Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Build the project
  console.log('🔨 Building the project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Deploy using gh-pages
  console.log('🌐 Deploying to GitHub Pages...');
  execSync('npx gh-pages -d dist', { stdio: 'inherit' });

  console.log('✅ Deployment complete!');
  console.log('🌍 Your site will be available at: https://jacobashirwad07.github.io/FoodieLocal/');
  console.log('⏰ It may take a few minutes for changes to appear.');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Make sure you have git configured with your GitHub credentials');
  console.log('2. Ensure you have push access to the repository');
  console.log('3. Check that the repository exists: https://github.com/jacobashirwad07/FoodieLocal');
  console.log('4. Try running: git remote -v (to check remote URL)');
  process.exit(1);
}