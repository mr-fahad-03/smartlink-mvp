# SmartLink MVP - AI Memory & Project Context

This file serves as a reference for AI assistants working on the SmartLink MVP project. It outlines the technology stack, project structure, core features, and important developer notes.

## 1. Project Overview

SmartLink is an MVP platform designed for:
- Lead capture and routing
- Expert ranking and matching (with cooldown & fairness)
- Introduction & review flow
- Public review moderation
- Role-Based Access Control (RBAC) admin dashboard

## 2. Architecture & Tech Stack

The repository is structured as a monorepo with separate `frontend` and `backend` directories.

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + `shadcn/ui` components
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **Routing & Pages:**
  - `/quiz`, `/results` (Lead generation flow)
  - `/expert-match`, `/expert-apply`, `/expert-profile-optimizer`
  - `/admin` (RBAC Dashboard)
  - `/auth`, `/login`
  - `/review`
  
**Frontend Commands:**
- Install: `npm install`
- Dev Server: `npm run dev`
- Build: `npm run build`

### Backend
- **Environment:** Node.js + Express
- **Database:** Supabase / PostgreSQL
- **Authentication:** Supabase Auth (JWT, Social Login, MFA)
- **Core Endpoints:**
  - `POST /api/leads` - Lead creation
  - `POST /api/matches/recommend` - Match recommendation engine
  - `/api/auth/*` - Registration, login, MFA, and session management
  - `/api/admin/*` - RBAC-protected administrative endpoints
  - `/api/reviews/*` - Review management and moderation

**Backend Commands:**
- Install: `npm install`
- Dev Server: `npm run dev`
- DB Bootstrap: `npm run db:bootstrap`

## 3. Database Schema (Supabase)

The primary tables required for the system include:
- `experts`: Ranking, tiers, exposure, and performance metrics.
- `lead_submissions`: Stores lead details (category, issue, intent, budget, price).
- `ranking_config`: Configures scoring and cooldown for expert matching.
- `expert_reviews` & `private_match_feedback`: Feedback storage.
- `admin_user_roles` & `admin_audit_logs`: For RBAC and action logging.
- `review_tokens`: Magic links for submitting reviews.

*Note: Database schemas and seed files are located in `backend/sql/`.*

## 4. Development Workflow & Rules

- **Deployment:** The frontend is meant to be deployed on Vercel. The backend runs as a separate service or serverless environment.
- **Environment Variables:** 
  - Backend requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_JWT_SECRET`, etc.
  - Frontend requires relevant `.env.local` mappings for the API URLs and Next auth.
- **Security:** Ensure `AUTHORIZATION: Bearer <token>` headers are used for admin API requests.

## 5. Typical AI Tasks
- When modifying UI, ensure changes are built with **Tailwind CSS** and adhere to the **shadcn/ui** patterns.
- When creating backend endpoints, follow the existing controller/service/route abstraction.
- For DB changes, ALWAYS reflect the changes in Supabase SQL files (`backend/sql/*`).
