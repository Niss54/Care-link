# CareLink Clinical Portal
A modern Electronic Health Record (EHR) and clinical management system
built with React + TypeScript + Vite + TailwindCSS.
## Features
- Patient management with vitals tracking
- Appointment scheduling and calendar
- Clinical analytics dashboard
- AI-powered patient triage (Gemini AI)
- Google OAuth + Supabase authentication
- Secure, HIPAA-compliant data architecture
## Tech Stack
- Frontend: React 19, TypeScript, Vite, TailwindCSS v4
- Auth + Database: Supabase (PostgreSQL + Auth)
- AI: Google Gemini 2.5 Flash (via Netlify Functions)
- Deployment: Netlify
- Icons: Lucide React, Material Symbols
## Setup
1. cp .env.example .env.local
2. Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY
3. npm install
4. npm run dev
