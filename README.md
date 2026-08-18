# Eos private space

Eos is a private React + Vite companion app. GitHub OAuth is handled by Supabase, and the browser calls the Eos API with the resulting access token.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_EOS_API_URL`.
3. Add `http://localhost:5173` to Supabase Auth redirect URLs.
4. Run `npm run dev`.

## Deployment

Set the same three `VITE_` variables in Vercel, then redeploy. Add the Vercel production URL to Supabase Auth redirect URLs and to the Render service's `CORS_ORIGINS` list.

Only the Supabase URL, anon key, and public Render API URL belong in Vercel. Keep AI keys, OAuth secrets, and Supabase service-role keys in their provider dashboards.
