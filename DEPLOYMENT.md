# Pixel Flow Deployment Guide

This guide covers deploying Pixel Flow to Vercel (frontend) and Railway (backend + database).

## 🚀 Vercel Deployment (Frontend)

### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- GitHub repository connected to Vercel

### Steps

1. **Deploy to Vercel**
   ```bash
   cd apps/web
   vercel --prod
   ```

2. **Set Environment Variables in Vercel Dashboard**
   ```
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DATABASE_URL=your-database-url
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   NEHTW_API_KEY=your-nehtw-api-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   R2_ACCOUNT_ID=your-r2-account-id
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_BUCKET_NAME=pixelflow-files
   R2_PUBLIC_URL=https://files.pixelflow.com
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@pixelflow.com
   BACKEND_URL=https://your-railway-app.railway.app
   ```

3. **Configure Custom Domain (Optional)**
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add your custom domain

## 🚂 Railway Deployment (Backend)

### Prerequisites
- Railway CLI installed: `npm i -g @railway/cli`
- Railway account connected

### Steps

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Create New Project**
   ```bash
   railway init
   ```

3. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

4. **Add Redis**
   ```bash
   railway add redis
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   railway variables set JWT_SECRET=your-jwt-secret
   railway variables set NEHTW_API_KEY=your-nehtw-api-key
   railway variables set STRIPE_SECRET_KEY=your-stripe-secret-key
   railway variables set STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   railway variables set R2_ACCOUNT_ID=your-r2-account-id
   railway variables set R2_ACCESS_KEY_ID=your-r2-access-key-id
   railway variables set R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   railway variables set R2_BUCKET_NAME=pixelflow-files
   railway variables set R2_PUBLIC_URL=https://files.pixelflow.com
   railway variables set SENDGRID_API_KEY=your-sendgrid-api-key
   railway variables set SENDGRID_FROM_EMAIL=noreply@pixelflow.com
   railway variables set FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

6. **Deploy to Railway**
   ```bash
   railway up
   ```

7. **Run Database Migrations**
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

## 🔧 Environment Variables Reference

### Frontend (Vercel)
- `NEXTAUTH_URL` - Your Vercel app URL
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host from Railway
- `REDIS_PORT` - Redis port (usually 6379)
- `REDIS_PASSWORD` - Redis password from Railway
- `NEHTW_API_KEY` - nehtw API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_PUBLIC_URL` - R2 public URL
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - SendGrid from email
- `BACKEND_URL` - Railway backend URL

### Backend (Railway)
- `NODE_ENV` - production
- `PORT` - 3001
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Railway)
- `REDIS_HOST` - Redis host (auto-set by Railway)
- `REDIS_PORT` - Redis port (auto-set by Railway)
- `REDIS_PASSWORD` - Redis password (auto-set by Railway)
- `JWT_SECRET` - JWT signing secret
- `NEHTW_API_KEY` - nehtw API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_PUBLIC_URL` - R2 public URL
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - SendGrid from email
- `FRONTEND_URL` - Vercel frontend URL

## 🔄 CI/CD Setup

### GitHub Actions for Automatic Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build --filter=@pixel-flow/web
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./apps/web

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build --filter=@pixel-flow/api
      - uses: bervProject/railway-deploy@v1.0.4
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_SERVICE }}
```

## 📊 Monitoring Setup

### Sentry (Error Tracking)
1. Create Sentry project
2. Add Sentry DSN to environment variables
3. Install Sentry SDK in both frontend and backend

### Vercel Analytics
1. Enable in Vercel Dashboard
2. Add analytics script to Next.js app

### Railway Monitoring
1. Use Railway's built-in metrics
2. Set up alerts for errors and downtime

## 🔐 Security Checklist

- [ ] All environment variables are set
- [ ] Database connections use SSL
- [ ] Redis connections are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] JWT secrets are strong and unique
- [ ] Stripe webhooks are verified
- [ ] File uploads are validated
- [ ] API endpoints are protected
- [ ] Error messages don't leak sensitive info

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check if database is accessible
   - Run migrations manually

3. **Environment Variables Not Loading**
   - Check variable names match exactly
   - Restart the application
   - Verify in platform dashboard

4. **CORS Errors**
   - Update FRONTEND_URL in backend
   - Check CORS configuration
   - Verify domain settings

### Support
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- GitHub Issues: Create issue in repository
