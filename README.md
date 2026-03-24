# smartlink-mvp

SmartLink MVP containing:
- `frontend`: Next.js 15 + TypeScript + Tailwind UI (landing, quiz, results, admin mockup)
- `backend`: Node.js API starter

## Project Structure
- `frontend/`
- `backend/`

## Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Build frontend:
```bash
cd frontend
npm run build
npm start
```

## Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

Build/check backend:
```bash
cd backend
npm run start
```

## Deployment Notes (Vercel)
- Deploy `frontend` as a Vercel project.
- Keep backend as separate service (or serverless functions later).
- Set required environment variables in Vercel dashboard before production deploy.
