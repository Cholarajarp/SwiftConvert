# 🚀 SwiftConvert Deployment Guide

Complete guide for deploying SwiftConvert to Render and GitHub.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Render Deployment](#render-deployment)
4. [GitHub Pages (Frontend Only)](#github-pages-frontend-only)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites ✅

- GitHub account (https://github.com)
- Render account (https://render.com) - Free tier available
- Git installed locally
- Node.js 18+ installed

---

## GitHub Setup 🐙

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `SwiftConvert`
3. Description: "Modern file conversion web application"
4. Choose **Public** (recommended for free projects)
5. Click **Create repository**

### Step 2: Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: SwiftConvert application"

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/SwiftConvert.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Verify on GitHub

- Navigate to https://github.com/YOUR_USERNAME/SwiftConvert
- Confirm all files are pushed
- Check `.gitignore` is working (node_modules should not be visible)

---

## Render Deployment 🚀

### Step 1: Connect GitHub to Render

1. Go to https://dashboard.render.com
2. Sign up/Log in with GitHub
3. Click **New +** > **Web Service**
4. Select **Connect a repository**
5. Find and select `SwiftConvert`
6. Click **Connect**

### Step 2: Configure Deployment

Fill in the deployment settings:

| Setting | Value |
|---------|-------|
| **Name** | swiftconvert |
| **Environment** | Node |
| **Region** | Choose closest to you |
| **Branch** | main |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Paid for custom domain) |

### Step 3: Add Environment Variables

Click **Environment** and add:

```
NODE_ENV=production
PORT=3001
```

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically deploy
3. Watch the build logs for any errors
4. Once complete, get your deployment URL: `https://your-app-name.onrender.com`

### Step 5: Verify Deployment

```bash
# Test the API
curl https://your-app-name.onrender.com/api/health

# Should return:
# {"status":"ok","message":"Server is running"}
```

---

## GitHub Pages (Frontend Only) 📄

For deploying just the static frontend to GitHub Pages:

### Step 1: Update Vite Config

Edit `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SwiftConvert/'  // Change to your repo name
})
```

### Step 2: Build and Deploy

```bash
# Build the project
npm run build

# The dist/ folder will be ready to deploy
```

### Step 3: Create GitHub Actions Workflow

The `.github/workflows/build.yml` is already configured. Commits to main will automatically:
1. Install dependencies
2. Build the project
3. Run tests (if configured)

### Step 4: Enable GitHub Pages

1. Go to **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / folder: **/(root)** or **/ (docs)**
4. Click **Save**

Then manually push the dist folder or use:

```bash
npm install -g gh-pages
npx gh-pages -d dist
```

Your frontend will be available at: `https://YOUR_USERNAME.github.io/SwiftConvert/`

---

## Verification ✅

### After Render Deployment

1. **Visit your app URL**: `https://your-app-name.onrender.com`
2. **Check API endpoints**:
   ```bash
   curl https://your-app-name.onrender.com/api/health
   curl https://your-app-name.onrender.com/api/formats
   ```
3. **Test file upload**:
   - Use the web interface to upload a test file
   - Verify conversion works
   - Check download functionality

### After GitHub Pages Deployment

1. **Visit frontend URL**: `https://YOUR_USERNAME.github.io/SwiftConvert/`
2. **Test UI interactions** (frontend only, API won't work without backend)

---

## Common Issues & Solutions 🔧

### Issue 1: Build Fails on Render

**Error**: `npm ERR! code EWORKSPACESLINTASSIGNMENT`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Push to GitHub
git add .
git commit -m "Fix dependencies"
git push origin main
```

### Issue 2: Frontend Can't Connect to API

**Error**: `Cannot connect to backend server`

**Solution**: 
- Ensure API base URL is correct in `src/SwiftConvert.jsx`
- For Render, update to: `const API_BASE_URL = 'https://your-app-name.onrender.com'`
- Rebuild and redeploy

### Issue 3: Render App Goes to Sleep

**Solution**: 
- Free tier apps sleep after 15 minutes
- Upgrade to **Paid** plan for always-on
- Or use **cron jobs** to keep it alive

### Issue 4: Port Already in Use

**Solution**:
```bash
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

---

## Environment-Specific Configuration 🔐

### Development (.env)

```
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Production (.env.production)

```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-app-name.onrender.com
```

---

## Database Setup (Optional) 🗄️

If you want to add MongoDB for file tracking:

1. **Get MongoDB Atlas connection string**:
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Add to Render environment**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```

3. **Install MongoDB package**:
   ```bash
   npm install mongoose
   ```

---

## Performance Optimization ⚡

### Render Optimization

1. **Use Paid Plan** for better performance
2. **Add CDN** (Cloudflare) in front
3. **Enable caching** headers in Express
4. **Optimize images** in dist folder

### GitHub Pages Optimization

1. **Enable GitHub Pages caching**
2. **Minify CSS/JS** (done by Vite automatically)
3. **Use gzip compression** (automatic)
4. **Add cache headers** via .htaccess or configuration

---

## Monitoring & Logs 📊

### Render Logs

1. Go to https://dashboard.render.com
2. Click your service
3. View real-time logs
4. Set up email alerts for failures

### GitHub Actions Logs

1. Go to your repo
2. Click **Actions** tab
3. View workflow runs and logs
4. Check build status for each commit

---

## Security Checklist 🔒

- [ ] `.gitignore` excludes sensitive files
- [ ] No API keys in code or .env in git
- [ ] CORS properly configured
- [ ] Rate limiting enabled (optional)
- [ ] File upload validation enabled
- [ ] HTTPS enforced (automatic on Render)

---

## Support & Resources 📚

### Official Documentation
- Render: https://render.com/docs
- GitHub Actions: https://docs.github.com/en/actions
- Vite: https://vitejs.dev
- Express: https://expressjs.com

### Community
- GitHub Discussions: https://github.com/YOUR_USERNAME/SwiftConvert/discussions
- Stack Overflow: Tag with `swiftconvert`

---

## Next Steps 🎯

After successful deployment:

1. **Monitor performance** - Check Render dashboard daily
2. **Update code** - Push improvements to GitHub
3. **Share your app** - Send deployment URL to friends
4. **Collect feedback** - Use GitHub Discussions
5. **Plan features** - Check roadmap and add features

---

**Happy Deploying! 🚀**
