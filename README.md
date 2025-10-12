# Pixel Flow

A modern SaaS platform for stock images, AI generation, and design tools.

## 🚀 Features

- **Stock Images**: Download from multiple sources (Shutterstock, Adobe Stock, Freepik, etc.)
- **AI Generation**: Create unique artwork with AI-powered image generation
- **Background Removal**: Remove backgrounds from images with AI precision
- **File Management**: Organize and manage your visual content
- **Credit System**: Pay-as-you-go with credit packages

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Storage**: Cloudflare R2 (S3-compatible)
- **Queue**: BullMQ with Redis
- **Payments**: Stripe
- **Email**: SendGrid
- **Deployment**: Vercel (Frontend) + Railway (Backend)

## 📁 Project Structure

```
pixel-flow/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # Express.js backend API
├── packages/
│   ├── database/            # Prisma schema and database utilities
│   ├── types/              # Shared TypeScript types
│   ├── ui/                 # Shared UI components
│   ├── eslint-config/      # ESLint configuration
│   └── typescript-config/  # TypeScript configuration
├── docs/                   # Documentation
└── .cursorrules           # Cursor AI development guidelines
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Redis instance
- Cloudflare R2 account
- Stripe account
- SendGrid account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pixel-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   cd packages/database
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/pixelflow"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# JWT
JWT_SECRET="your_jwt_secret_min_32_chars"
JWT_EXPIRES_IN="7d"

# nehtw API
NEHTW_API_KEY="your_nehtw_api_key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_50="price_..."
STRIPE_PRICE_ID_200="price_..."
STRIPE_PRICE_ID_500="price_..."

# Cloudflare R2
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="pixelflow-files"
R2_PUBLIC_URL="https://files.pixelflow.com"

# SendGrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@pixelflow.com"

# Frontend
FRONTEND_URL="http://localhost:3000"

# App
NODE_ENV="development"
PORT="3001"
```

## 📚 Development

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all applications
- `npm run lint` - Lint all packages
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Database Management

```bash
# Generate Prisma client
cd packages/database
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## 🏗 Architecture

### Frontend (Next.js)
- **App Router**: Modern Next.js routing with server components
- **Authentication**: NextAuth.js v5 with Google OAuth and email/password
- **State Management**: Zustand for client state, React Query for server state
- **UI Components**: shadcn/ui with Tailwind CSS
- **Type Safety**: Full TypeScript coverage

### Backend (Express.js)
- **API Routes**: RESTful endpoints with proper HTTP status codes
- **Authentication**: JWT-based auth with middleware
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis for performance optimization
- **Queue System**: BullMQ for background job processing
- **File Storage**: Cloudflare R2 for cost-effective storage

### Database Schema
- **Users**: Authentication, credits, storage limits
- **Orders**: Stock downloads, AI generation, background removal
- **Files**: File metadata, storage keys, organization
- **Transactions**: Credit purchases, spending, refunds
- **Audit Logs**: Security and compliance tracking

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/me` - Get current user

### Stock Images
- `GET /api/stock/sites` - Get available stock sites
- `GET /api/stock/info` - Get stock image info
- `POST /api/stock/order` - Order stock download
- `GET /api/stock/status/:taskId` - Check order status
- `GET /api/stock/download/:taskId` - Get download link

### AI Generation
- `POST /api/ai/generate` - Create AI generation
- `GET /api/ai/result/:jobId` - Get generation result
- `POST /api/ai/action` - Perform AI action (vary/upscale)

### Files
- `GET /api/files` - List user files
- `POST /api/files/upload` - Upload file
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/:id/download` - Download file

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Database
- Use Railway PostgreSQL for development
- Use Railway PostgreSQL for production
- Set up database backups

## 📊 Monitoring

- **Error Tracking**: Sentry for error monitoring
- **Analytics**: Vercel Analytics for performance
- **Logging**: Winston for structured logging
- **Uptime**: BetterUptime for uptime monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@pixelflow.com or join our Discord community.

## 🗺 Roadmap

- [ ] Batch background removal
- [ ] Advanced file filters and search
- [ ] Prompt library expansion
- [ ] Usage analytics dashboard
- [ ] Team workspaces
- [ ] Mobile app (PWA)
- [ ] API access for developers

---

Built with ❤️ by the Pixel Flow team