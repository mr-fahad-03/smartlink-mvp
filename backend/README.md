# SmartLink Backend (Node.js + Supabase/PostgreSQL)

SmartLink backend for:
- lead capture + lead quality pricing
- expert ranking (score + fairness + cooldown)
- introductions + review token flow
- private feedback + public review moderation
- role-based admin control tower (RBAC + immutable audit logs)
- AI profile optimizer draft endpoint

## Setup

1. Install deps:
```bash
cd backend
npm install
```

2. Env:
```bash
cp .env.example .env
```

3. Fill required `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (required for JWT user validation)
- `SUPABASE_SERVICE_ROLE_KEY` (recommended for admin writes)
- `REVIEW_TOKEN_SECRET`

4. Start backend:
```bash
npm run dev
```

## Auth Security Controls (Candy Update)

This backend now exposes `POST /api/auth/*` endpoints for:
- registration (`/register`) for `client` and `expert`
- password login (`/login/password`)
- social login start (`/login/social`) + social session exchange (`/login/social/exchange`)
- MFA (TOTP + email OTP fallback)
- email verification resend
- password change with password-history checks
- refresh/logout/revoke-all session management

Required auth env vars:
- `APP_JWT_SECRET`
- `APP_ENCRYPTION_SECRET`
- `HCAPTCHA_SECRET` (or use `captchaToken=dev-bypass` in non-production)
- `AUTH_REQUIRE_EMAIL_VERIFICATION` (`true` in production; set `false` for local testing without email delivery)

Recommended defaults:
- `ADMIN_IDLE_TIMEOUT_MINUTES=20`
- `PASSWORD_MIN_LENGTH=8`
- `PASSWORD_MAX_LENGTH=12`
- `PASSWORD_HISTORY_DEPTH=5`
- `AUTH_LOCK_THRESHOLD=5`

## Fix 500 Errors (Missing Tables)

If you see errors like:
- `Failed to create lead submission`
- `Could not find the table 'public.lead_submissions'`
- `Failed to load ranking configuration`

it means your Supabase schema has not been applied yet.

### Option A: SQL Editor (recommended)
1. Open Supabase dashboard for your project.
2. Go to SQL Editor.
3. Paste and run `backend/sql/supabase_schema.sql`.

### Option B: Bootstrap script (if you have `psql`)
1. Get DB URI from Supabase: `Project Settings -> Database -> Connection string (URI)`.
2. Add it in `.env` as `SUPABASE_DB_URL=postgresql://...`.
3. Run:
```bash
npm run db:bootstrap
```

## API Endpoints

- `GET /api/health`
- `POST /api/leads`
- `POST /api/matches/recommend`
- `POST /api/introduction-requests`
- `POST /api/feedback/private`
- `POST /api/reviews/public`
- `PATCH /api/reviews/:id/moderate` (admin)
- `POST /api/reviews/:id/respond` (admin)
- `POST /api/experts/:id/optimize-profile` (admin JWT + permission)

### Admin RBAC endpoints (`Authorization: Bearer <supabase_jwt>`)
- `GET /api/admin/me`
- `GET /api/admin/roles` (`super_admin`)
- `POST /api/admin/roles/assign` (`super_admin`)
- `POST /api/admin/roles/revoke` (`super_admin`)
- `GET /api/admin/expert-applications` (`auditor+`)
- `POST /api/admin/expert-applications/:id/:action`
  Actions: `request_info`, `recommend`, `approve`, `reject`, `flag`
- `PATCH /api/admin/experts/:id/state` (`admin+`)
- `POST /api/admin/lead-assignments` (`admin+`, moderator restricted)
- `GET /api/admin/lead-assignments` (`report viewers`)
- `GET /api/admin/ranking-config` (`super_admin`)
- `PATCH /api/admin/ranking-config` (`super_admin`)
- `GET /api/admin/pricing-settings` (`super_admin`)
- `PATCH /api/admin/pricing-settings` (`super_admin`)
- `PATCH /api/admin/reviews/:id/moderate` (`admin+`)
- `GET /api/admin/reports/summary` (`auditor+`)
- `GET /api/admin/audit-logs` (`auditor+`)

## Supabase Schema Notes (Apply in Supabase SQL Editor)

Ensure these tables/fields exist:
- `experts`: ranking + tier + exposure + performance fields
- `lead_submissions`: `selected_category`, `primary_issue`, `preferred_support_type`, `intent_type`, `lead_quality_tag`, `lead_price_usd`, `pricing_band`
- `ranking_config`: active config row with scoring/cooldown controls
- `private_match_feedback`: include `expert_id`, `match_helpful_rating`, `feedback_reason`
- `expert_reviews`: public review + moderation + expert response fields
- `review_tokens`: `token_hash`, `expires_at`, `used_at`
- `expert_impression_events`
- `introduction_requests`
- `expert_profile_optimizer_drafts` (for AI profile suggestions as draft)
- `platform_metrics_events` (non-blocking metrics events)
- `admin_user_roles` (role assignment per Supabase Auth user id)
- `admin_audit_logs` (immutable append-only admin activity log)
- `expert_applications` (application queue lifecycle)
- `lead_assignments` (manual lead routing history)
- `platform_settings` (pricing config)

Quick start:
1. Open Supabase SQL Editor for your project.
2. Run [`backend/sql/supabase_schema.sql`](./sql/supabase_schema.sql).
3. Seed the `experts` table with initial records before testing `/api/matches/recommend`.
4. You can use [`backend/sql/seed_experts.sql`](./sql/seed_experts.sql) to load the mock expert IDs used by frontend (`exp_ana_khan`, `exp_daniel_cho`, `exp_sofia_ramirez`).
5. Seed the first super admin role using [`backend/sql/seed_admin_roles.sql`](./sql/seed_admin_roles.sql) after creating auth user in Supabase Auth.
6. (Optional) Seed expert applications using [`backend/sql/seed_expert_applications.sql`](./sql/seed_expert_applications.sql).

Recommended indexes:
- `experts(category_tags, matching_visibility)`
- `experts(impressions_7d, top3_shown_24h_count)`
- `review_tokens(token_hash, used_at, expires_at)`

## Quick API Test Commands

```bash
# Health
curl http://localhost:5000/api/health

# Ranking config (admin)
curl -H "x-admin-key: YOUR_ADMIN_API_KEY" http://localhost:5000/api/admin/ranking-config

# Lead create
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "fullName":"Test User",
    "workEmail":"test@example.com",
    "location":"Nassau, New Providence",
    "selectedCategory":"Operations",
    "primaryIssue":"Fixing a problem in my business",
    "preferredSupportType":"Do it for me",
    "urgencyPreference":"Right now (urgent)",
    "budgetPreference":"Medium ($150-$500)",
    "assessmentId":"asmt_test_001"
  }'

# Match recommend
curl -X POST http://localhost:5000/api/matches/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "selectedCategory":"Operations",
    "location":"Nassau, New Providence",
    "urgencyPreference":"Right now (urgent)",
    "budgetPreference":"Medium ($150-$500)",
    "assessmentId":"asmt_test_001"
  }'
```
