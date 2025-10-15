
# Pixel Flow Monorepo

This is a Turborepo monorepo containing:

- apps/web: Next.js 14 (App Router) frontend
- apps/api: Express.js (TypeScript) backend
- packages/database: Prisma client & schema

## Prerequisites
- Node.js 20+
- npm 10+

## Setup
1. Install dependencies at repo root:
   ```bash
   npm install
   ```
2. Create environment files from templates:
   - Copy `.env.example` into appropriate app envs or set envs in Vercel/Railway.
3. Dev mode (run all apps):
   ```bash
   npm run dev
   ```

## Deployment
- Frontend: Vercel (apps/web)
- Backend: Railway (apps/api)
- Database: PostgreSQL (Railway)
- Cache/Queues: Redis (Railway)

## Environments
See `.env.example` for initial variables.
