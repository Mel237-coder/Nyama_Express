# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FoodApp Cameroun is a food delivery application tailored for the Cameroonian market. It is an npm workspaces monorepo with a NestJS backend API and a Next.js 14 frontend PWA.

- **Backend**: `packages/api` — NestJS, Prisma, PostgreSQL with PostGIS, Redis, Socket.io
- **Frontend**: `apps/web` — Next.js 14 (PWA), React, TailwindCSS, Leaflet maps
- **Shared**: `packages/shared` — Types and constants shared across workspaces

## Development Commands

### Root-level (runs across workspaces)

```bash
npm install                # Install dependencies for all workspaces
npm run dev                # Start dev servers for all workspaces
npm run build              # Build all workspaces
npm run lint               # Lint all workspaces
npm run test               # Run tests in all workspaces
```

### API (`packages/api`)

```bash
# Development
npm run start:dev -w packages/api

# Database
npm run db:push -w packages/api        # Push schema changes to database (dev)
npm run db:migrate -w packages/api     # Run Prisma migrations
npm run db:generate -w packages/api    # Regenerate Prisma client
npm run db:seed -w packages/api        # Run seed script (prisma/seed.ts)
npm run db:studio -w packages/api        # Open Prisma Studio

# Testing
npm run test -w packages/api           # Run Jest tests
npm run test:watch -w packages/api     # Run Jest in watch mode
npm run test:cov -w packages/api       # Run tests with coverage
```

### Web (`apps/web`)

```bash
npm run dev -w apps/web          # Start Next.js dev server on port 3002
npm run build -w apps/web        # Build for production
npm run lint -w apps/web         # Run ESLint
```

## Local Development Setup

1. **Dependencies & Environment**
   ```bash
   npm install
   cp .env.example .env
   ```
   Edit `.env` with your API keys (Africa's Talking, MTN MoMo, Orange Money, NotchPay, Cloudinary).

2. **Infrastructure (Docker)**
   ```bash
   docker-compose up -d
   ```
   This starts PostgreSQL (port 5432), Redis (port 6379), the API (port 3001), and the web app (port 3002).

3. **Database Initialization**
   ```bash
   npm run db:push -w packages/api
   npm run db:generate -w packages/api
   ```

4. **Access**
   - Web app: http://localhost:3002
   - API: http://localhost:3001

## Architecture

### Monorepo Structure

The project uses npm workspaces. The root `package.json` defines workspaces for `apps/*` and `packages/*`.

- `packages/api/src/`: NestJS application organized by domain modules
  - `auth/`: OTP-based authentication (Africa's Talking SMS), JWT strategies and guards
  - `users/`: User management
  - `restaurants/`: Restaurant CRUD and menu management
  - `orders/`: Order lifecycle management
  - `payments/`: MTN MoMo, Orange Money, NotchPay integrations
  - `deliveries/`: Delivery assignment and tracking
  - `notifications/`: SMS and in-app notifications
  - `admin/`: Administrative operations
  - `websocket/`: Socket.io gateway for real-time delivery tracking
  - `common/sms/`: Shared SMS service (Africa's Talking)
  - `prisma/`: Prisma schema and seed script

- `apps/web/src/`: Next.js application
  - `pages/`: Next.js pages
  - `hooks/`: Custom React hooks (auth, cart, language/i18n)
  - `lib/api.ts`: API client class that wraps all backend endpoints
  - `lib/i18n.ts`: Internationalization utilities (French/English)

- `packages/shared/src/`: Shared TypeScript types and constants

### API Client Pattern

The frontend uses a centralized `ApiClient` class in `apps/web/src/lib/api.ts`. All backend communication goes through this client. It handles JWT tokens via `localStorage` and automatically attaches the `Authorization` header when a token is provided.

### Authentication Flow

1. User provides phone number → `POST /api/auth/request-otp`
2. OTP code sent via Africa's Talking SMS
3. User submits OTP → `POST /api/auth/verify-otp`
4. Backend returns access and refresh JWT tokens
5. Frontend stores tokens in `localStorage` and sends access token with every request

### Payments Architecture

The API supports multiple payment providers with a fallback strategy:
- **Primary**: MTN MoMo API and Orange Money API
- **Fallback**: NotchPay (aggregator)
- **Cash on delivery**: Supported as a payment method

Each provider has its own service (`mtn-momo.service.ts`, `orange-money` integration, `notchpay.service.ts`) coordinated by `payments.service.ts`. Webhook endpoints receive asynchronous payment confirmations.

### Real-Time Delivery Tracking

Socket.io is used for live delivery tracking:
- **Client → Server**: `order:subscribe`, `delivery:location_update`
- **Server → Client**: `order:status_changed`, `delivery:location`, `delivery:assigned`

### Database

PostgreSQL with PostGIS extension. Prisma schema is in `packages/api/prisma/schema.prisma`.

Key models: `User`, `Restaurant`, `Category`, `MenuItem`, `Order`, `OrderItem`, `Payment`, `DeliveryTracking`, `Review`, `Promotion`, `Withdrawal`, `Notification`, `TransactionLog`.

## Business Rules & Conventions

### Currency
- All monetary values are stored as integers in **Francs CFA (XAF)** without decimals.
- Example: `2500` represents 2,500 FCFA.

### Phone Numbers
- Format: `+2376xxxxxxxx` or `6xxxxxxxx` (Cameroon numbers).
- The `User.phone` field stores the full international format.

### Bilingual Support
- The application supports French (`fr`) and English (`en`).
- Database fields often have bilingual variants (e.g., `name` and `nameEn`, `description` and `descriptionEn`).
- User language preference is stored in `User.language`.

### Regulatory Compliance (ANIF/COBAC)
- All transactions are logged in the `TransactionLog` model.
- Transactions above **5,000,000 FCFA** are flagged (`aboveThreshold`).
- Logs must be retained for **5 years minimum**.
- KYC documents (CNI, passport, RCCM) are required for restaurants and delivery persons via the `Document` model.

### Platform Commission
- Configurable via `PLATFORM_COMMISSION_PERCENT` env variable (default behavior per schema/seed).
- Default delivery fee configurable via `DEFAULT_DELIVERY_FEE` env variable.

## Environment Variables

Key variables required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration
- `JWT_SECRET`, `JWT_EXPIRES_IN`: JWT signing
- `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME`: SMS OTP
- `MTN_SUBSCRIPTION_KEY`, `MTN_API_USER`, `MTN_API_KEY`, `MTN_TARGET_ENVIRONMENT`: MTN MoMo
- `ORANGE_MONEY_API_KEY`, `ORANGE_MONEY_WALLET`: Orange Money
- `NOTCHPAY_PUBLIC_KEY`: NotchPay fallback
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Image uploads
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`: Frontend API configuration
- `PLATFORM_COMMISSION_PERCENT`, `DEFAULT_DELIVERY_FEE`: Business logic

## Testing

- **API tests**: Jest (NestJS default setup). Run with `npm run test -w packages/api`.
- No test files currently exist in the `packages/api/test/` directory; the project uses the default NestJS Jest configuration.

## Important Notes

- The `prisma/seed.ts` script can be used to populate the database with initial data.
- When adding new Prisma models or fields, always run `npm run db:generate -w packages/api` to update the client.
- The `packages/api/tsconfig.json` includes path aliases `@/*` mapping to `src/*` and `@shared/*` mapping to `../shared/src/*`.
- Docker Compose mounts source directories for hot-reload in development.
