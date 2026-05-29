# MaxCinema

Premium streaming platform prototype built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion and Supabase-ready architecture.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Main Routes

- `/` landing page
- `/login` and `/register`
- `/browse`
- `/movie/[slug]`
- `/watch/[id]`
- `/favorites`
- `/continue-watching`
- `/profile`
- `/admin`
- `/admin/movies`
- `/admin/movies/new`
- `/admin/movies/[id]/edit`

## Architecture

- `src/app` App Router pages and route states
- `src/components/ui` reusable primitives
- `src/components/layout` Cinema OS shell
- `src/components/movie` catalog, rails, hero and details
- `src/components/player` immersive player surface
- `src/components/admin` admin content form
- `src/lib/supabase` Supabase clients and auth helpers
- `src/lib/mux` future playback URL helpers
- `src/services` mock content service
- `src/hooks`, `src/types`, `src/utils`, `src/styles`
- `supabase/schema.sql` initial Postgres schema and RLS policies

## Supabase

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run `supabase/schema.sql` in your Supabase project SQL editor when the backend is ready.

The same SQL is also available as a migration at:

```text
supabase/migrations/20260529143000_initial_maxcinema.sql
```

Without Supabase env vars, the app runs in mock/demo mode so the visual product can be reviewed locally.

After running the SQL:

1. Create a user through `/register`.
2. In Supabase SQL editor, promote your profile once. You can edit and run `supabase/promote-admin.sql`, or run:

```sql
update public.profiles
set role = 'admin'
where user_id = '<YOUR_AUTH_USER_ID>';
```

3. Use `/admin/movies/new` to create real catalog records and upload assets to the public `media` bucket.

The app currently keeps mock fallbacks for local visual review. Once the production catalog is populated, the same screens read from Supabase automatically.

Check local env setup with:

```bash
npm run check:supabase
```
