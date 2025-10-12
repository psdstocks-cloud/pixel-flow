# Vercel Deployment Guide for Pixel Flow

## 🚀 **Vercel Frontend Deployment**

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Deploy from Root Directory**
```bash
# Make sure you're in the root directory
cd /Users/ahmedabdelghany/pixel\ flow

# Deploy to Vercel
vercel --prod
```

### **Step 4: Configure Environment Variables**
In the Vercel dashboard, set these environment variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend URL (set after Railway deployment)
BACKEND_URL=https://your-railway-app.railway.app

# Database URL (set after Railway deployment)
DATABASE_URL=postgresql://...

# Redis Configuration (set after Railway deployment)
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# API Keys
NEHTW_API_KEY=your-nehtw-api-key
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudflare R2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=pixelflow-files
R2_PUBLIC_URL=https://files.pixelflow.com

# SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@pixelflow.com
```

## 🔧 **Troubleshooting Vercel Deployment**

### **Issue 1: "npm error Tracker 'idealTree' already exists"**
**Solution**: This happens when Vercel tries to run `npm install` multiple times. The root `vercel.json` configuration fixes this by:
- Running `npm install` once from the root
- Using workspace commands to build the web app

### **Issue 2: "Cannot find module" errors**
**Solution**: 
1. Ensure all workspace packages are properly linked
2. Check that `file:` references in package.json are correct
3. Verify the monorepo structure is intact

### **Issue 3: Build timeout**
**Solution**:
1. Check the `.vercelignore` file to exclude unnecessary files
2. Optimize the build process by using Turborepo caching
3. Consider using Vercel's build cache

## 📊 **Monitoring Your Vercel Deployment**

### **View Build Logs**
```bash
vercel logs
```

### **Check Deployment Status**
```bash
vercel ls
```

### **View Environment Variables**
```bash
vercel env ls
```

### **Set Environment Variables**
```bash
vercel env add VARIABLE_NAME
```

## 🔄 **Updating Your Deployment**

### **Redeploy After Code Changes**
```bash
git add .
git commit -m "Update deployment"
git push origin main
# Vercel will automatically redeploy
```

### **Manual Redeploy**
```bash
vercel --prod
```

## 🚨 **Common Vercel Commands**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Check status
vercel ls

# Set environment variable
vercel env add KEY

# View environment variables
vercel env ls

# Open Vercel dashboard
vercel open
```

## 📝 **Environment Variables Reference**

### **Required Variables**
- `NEXTAUTH_URL` - Your Vercel app URL
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `BACKEND_URL` - Your Railway backend URL
- `DATABASE_URL` - From Railway PostgreSQL
- `REDIS_HOST` - From Railway Redis
- `REDIS_PORT` - From Railway Redis
- `REDIS_PASSWORD` - From Railway Redis

### **API Keys (Get from respective services)**
- `NEHTW_API_KEY` - From nehtw.com
- `STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe Webhooks
- `R2_ACCOUNT_ID` - From Cloudflare R2
- `R2_ACCESS_KEY_ID` - From Cloudflare R2
- `R2_SECRET_ACCESS_KEY` - From Cloudflare R2
- `SENDGRID_API_KEY` - From SendGrid

### **URLs (Set after deployment)**
- `FRONTEND_URL` - Your Vercel app URL
- `R2_PUBLIC_URL` - Your R2 public URL

## 🎯 **Next Steps After Vercel Deployment**

1. **Get your Vercel URL**: `vercel ls`
2. **Set up Railway backend** with the Vercel frontend URL
3. **Configure Stripe webhooks** to point to your Railway URL
4. **Test the frontend** to ensure it connects to the backend
5. **Set up monitoring** with Vercel's built-in analytics

Your Vercel frontend should now be successfully deployed! 🚀
