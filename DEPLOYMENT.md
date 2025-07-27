# Deployment Guide for FoodieLocal

This guide explains how to deploy the FoodieLocal frontend to GitHub Pages.

## Prerequisites

1. GitHub repository: https://github.com/jacobashirwad07/FoodieLocal
2. Node.js 18+ installed locally
3. Git configured with your GitHub account

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

The repository is configured with GitHub Actions for automatic deployment:

1. **Push to main branch**: Any push to the `main` branch will automatically trigger deployment
2. **GitHub Actions**: The workflow in `.github/workflows/deploy.yml` will:
   - Install dependencies
   - Build the project
   - Deploy to GitHub Pages

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Install gh-pages** (if not already installed):
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Build and deploy**:
   ```bash
   npm run deploy
   ```

## Configuration Details

### Vite Configuration
- **Base URL**: Set to `/FoodieLocal/` for GitHub Pages
- **Build output**: `dist/` directory
- **PWA enabled**: Service worker for offline functionality

### GitHub Pages Settings
1. Go to your repository settings
2. Navigate to "Pages" section
3. Set source to "Deploy from a branch"
4. Select `gh-pages` branch
5. Set folder to `/ (root)`

### Environment Variables
- **VITE_API_URL**: Set to your backend API URL (optional)
- **Production fallback**: Uses mock data when backend is unavailable

## Features in Production

✅ **Client-side routing**: Handled with 404.html redirect  
✅ **PWA support**: Installable app with offline capabilities  
✅ **Responsive design**: Works on all devices  
✅ **Mock data fallback**: Functions without backend  
✅ **SEO optimized**: Meta tags and descriptions  

## Accessing the Deployed Site

Once deployed, your site will be available at:
```
https://jacobashirwad07.github.io/FoodieLocal/
```

## Troubleshooting

### Common Issues:

1. **404 errors on refresh**: 
   - Ensure 404.html is in the root of gh-pages branch
   - Check that the routing script is in index.html

2. **Assets not loading**:
   - Verify the base URL in vite.config.js matches your repository name
   - Check that all asset paths are relative

3. **Build failures**:
   - Check Node.js version (should be 18+)
   - Clear node_modules and reinstall dependencies
   - Check for any TypeScript/ESLint errors

### Debugging Steps:

1. **Check GitHub Actions logs**:
   - Go to Actions tab in your repository
   - Click on the latest workflow run
   - Review build and deployment logs

2. **Test locally**:
   ```bash
   npm run build
   npm run preview
   ```

3. **Verify build output**:
   - Check that `dist/` folder contains all necessary files
   - Ensure index.html has correct asset references

## Backend Integration

Currently configured for mock data fallback. To integrate with a live backend:

1. Deploy your backend to a service like:
   - Heroku
   - Railway
   - Render
   - Vercel (for serverless)

2. Update the API_BASE_URL in `frontend/src/services/api.js`

3. Set up CORS on your backend to allow requests from your GitHub Pages domain

## Performance Optimization

The build includes:
- **Code splitting**: Automatic chunk splitting for faster loading
- **Asset optimization**: Images and CSS are minified
- **PWA caching**: Service worker caches resources for offline use
- **Gzip compression**: Smaller bundle sizes

## Security Considerations

- All sensitive data should be handled by the backend
- API keys should never be exposed in the frontend
- Use environment variables for configuration
- Implement proper authentication flows

## Monitoring

Consider adding:
- Google Analytics for usage tracking
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Web Vitals)

## Updates and Maintenance

To update the deployed site:
1. Make changes to your code
2. Commit and push to the main branch
3. GitHub Actions will automatically redeploy
4. Changes will be live within 2-5 minutes

---

For any issues or questions, please check the GitHub repository issues or create a new one.