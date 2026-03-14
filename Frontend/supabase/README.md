# Backend - Supabase Edge Functions

This directory contains the backend serverless functions powered by Supabase.

## Structure

```
supabase/
├── functions/
│   └── interview-ai/    # AI interviewer edge function
│       └── index.ts
└── config.toml          # Supabase configuration
```

## Edge Functions

### interview-ai

AI-powered interview assistant that generates contextual interview questions based on the job field and conversation history.

**Endpoint:** `https://jvnsfrhcfkolsbbvkpmr.supabase.co/functions/v1/interview-ai`

**Method:** POST

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Tell me about yourself" },
    { "role": "assistant", "content": "..." }
  ],
  "jobField": "software-engineer"
}
```

**Response:**
```json
{
  "message": "Next interview question..."
}
```

## Running Locally

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Start Supabase (from project root):
```bash
supabase start
```

3. Serve functions:
```bash
supabase functions serve
```

Functions will be available at `http://localhost:54321/functions/v1/`

## Environment Variables

Edge functions have access to these secrets:
- `AI_API_KEY` - API key for AI Gateway (Google Gemini access)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Deployment

For manual deployment:
```bash
supabase functions deploy interview-ai
```

## Tech Stack

- **Runtime:** Deno
- **AI Model:** Google Gemini 2.5 Flash
- **Authentication:** Supabase Auth (JWT verification disabled for this function)
