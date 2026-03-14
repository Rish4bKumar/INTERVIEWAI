# InterviewAI - AI-Powered Interview Preparation Platform

An intelligent interview preparation platform with real-time AI interviewer, resume analysis, and performance feedback.

## Project Structure v  

```
.
├── Frontend/          # React + Vite frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── ...           # Frontend configs
├── supabase/         # Backend - Supabase edge functions
│   └── functions/    # Serverless functions
└── README.md
```

## Prerequisites

- Node.js 18+ and npm/yarn/bun
- Supabase CLI (optional, for local edge functions)

## Local Development Setup in Cursor

### 1. Clone and Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Frontend Setup

```bash
# Navigate to Frontend directory
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

### 3. Backend (Supabase Edge Functions)

The backend uses Supabase edge functions which are already deployed to:
`https://jvnsfrhcfkolsbbvkpmr.supabase.co/functions/v1/`

**To run edge functions locally (optional):**

```bash
# Install Supabase CLI
npm install -g supabase

# From project root, start Supabase
supabase start

# Serve edge functions locally
supabase functions serve
```

## Environment Variables

Frontend environment variables are in `Frontend/.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

## Features

- 🎤 **AI Interview Practice** - Real-time AI-powered interview sessions
- 📄 **Resume Analysis** - Upload and analyze your resume
- 📊 **Performance Metrics** - Track eye contact, speech patterns, and responses
- 🎯 **Job-Specific Training** - Tailored interviews for different roles
- 🔊 **Voice Assistant** - Speak naturally with the AI interviewer

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI Components
- React Query
- React Router

**Backend:**
- Supabase Edge Functions (Deno)
- AI Gateway (Google Gemini 2.5 Flash)

## Building for Production

```bash
cd Frontend
npm run build
```

Build output will be in `Frontend/dist/`

## Deployment

Deploy the built application to your preferred hosting platform (Vercel, Netlify, AWS, etc.).
