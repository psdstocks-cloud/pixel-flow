# Railway Deployment Guide for Pixel Flow

## 🚂 **Railway Backend Deployment**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
```

### **Step 3: Create New Project**
```bash
railway init
# Select "Deploy from GitHub repo"
# Choose your pixel-flow repository
```

### **Step 4: Add Database Services**
```bash
# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis
```

### **Step 5: Set Environment Variables**
```bash
# Basic configuration
railway variables set NODE_ENV=production
railway variables set PORT=3001

# JWT Configuration
railway variables set JWT_SECRET=your-jwt-secret-here
railway variables set JWT_EXPIRES_IN=7d

# API Keys
railway variables set NEHTW_API_KEY=your-nehtw-api-key
railway variables set STRIPE_SECRET_KEY=your-stripe-secret-key
railway variables set STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Cloudflare R2
railway variables set R2_ACCOUNT_ID=your-r2-account-id
railway variables set R2_ACCESS_KEY_ID=your-r2-access-key-id
railway variables set R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
railway variables set R2_BUCKET_NAME=pixelflow-files
railway variables set R2_PUBLIC_URL=https://files.pixelflow.com

# SendGrid
railway variables set SENDGRID_API_KEY=your-sendgrid-api-key
railway variables set SENDGRID_FROM_EMAIL=noreply@pixelflow.com

# Frontend URL (set after Vercel deployment)
railway variables set FRONTEND_URL=https://your-vercel-app.vercel.app
```

### **Step 6: Deploy to Railway**
```bash
railway up
```

### **Step 7: Run Database Migrations**
```bash
# Connect to Railway service
railway connect

# Run migrations
railway run npx prisma migrate deploy

# Seed database
railway run npx prisma db seed
```

## 🔧 **Troubleshooting Railway Deployment**

### **Issue 1: Package Not Found Error**
If you get `@pixel-flow/ui@*' is not in this registry`:

**Solution**: The Dockerfile is now configured to handle the monorepo structure properly. Make sure you're using the `railway-dockerfile` in the root directory.

### **Issue 2: Build Timeout**
If the build takes too long:

**Solution**: 
1. Check the `.dockerignore` file to exclude unnecessary files
2. Use the optimized Dockerfile with proper layer caching
3. Consider using Railway's Nixpacks instead of Dockerfile

### **Issue 3: Database Connection Issues**
If you can't connect to the database:

**Solution**:
1. Check that PostgreSQL service is running
2. Verify `DATABASE_URL` is set correctly
3. Run `railway variables` to see all environment variables

### **Issue 4: Redis Connection Issues**
If Redis connection fails:

**Solution**:
1. Check that Redis service is running
2. Verify `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` are set
3. Test connection with `railway run redis-cli ping`

## 📊 **Monitoring Your Railway Deployment**

### **View Logs**
```bash
railway logs
```

### **Check Service Status**
```bash
railway status
```

### **View Environment Variables**
```bash
railway variables
```

### **Connect to Database**
```bash
railway connect postgres
```

## 🔄 **Updating Your Deployment**

### **Redeploy After Code Changes**
```bash
git add .
git commit -m "Update deployment"
git push origin main
# Railway will automatically redeploy
```

### **Manual Redeploy**
```bash
railway up --detach
```

## 🚨 **Common Railway Commands**

```bash
# View all services
railway status

# View logs
railway logs

# Connect to service
railway connect

# Set environment variable
railway variables set KEY=value

# View environment variables
railway variables

# Deploy
railway up

# Open Railway dashboard
railway open
```

## 📝 **Environment Variables Reference**

### **Required Variables**
- `NODE_ENV=production`
- `PORT=3001`
- `JWT_SECRET` (generate with `openssl rand -base64 32`)
- `DATABASE_URL` (auto-set by Railway PostgreSQL)
- `REDIS_HOST` (auto-set by Railway Redis)
- `REDIS_PORT` (auto-set by Railway Redis)
- `REDIS_PASSWORD` (auto-set by Railway Redis)

### **API Keys (Get from respective services)**
- `NEHTW_API_KEY` - From nehtw.com
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe Webhooks
- `R2_ACCOUNT_ID` - From Cloudflare R2
- `R2_ACCESS_KEY_ID` - From Cloudflare R2
- `R2_SECRET_ACCESS_KEY` - From Cloudflare R2
- `SENDGRID_API_KEY` - From SendGrid

### **URLs (Set after deployment)**
- `FRONTEND_URL` - Your Vercel app URL
- `R2_PUBLIC_URL` - Your R2 public URL

## 🎯 **Next Steps After Railway Deployment**

1. **Get your Railway URL**: `railway domain`
2. **Set up Vercel frontend** with the Railway backend URL
3. **Configure Stripe webhooks** to point to your Railway URL
4. **Set up monitoring** with Railway's built-in metrics
5. **Test the API endpoints** to ensure everything works

Your Railway backend should now be successfully deployed! 🚀
