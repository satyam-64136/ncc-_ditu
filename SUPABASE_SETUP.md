# Supabase Setup — Persistent Database + Image Storage

This app now stores its data in **Postgres (via Supabase)** instead of a local
SQLite file, and cadet/gallery photos in **Supabase Storage** instead of the
local disk. This is required on Render's free tier because its filesystem is
wiped on every redeploy and after the app sleeps.

Your Supabase project: `https://oekwpysuemstwisajmlu.supabase.co`

## 1. Create the database tables

Supabase Dashboard → **SQL Editor** → New query → paste the entire contents
of `supabase_schema.sql` → **Run**.

This creates all 8 tables and seeds one admin login:
- Username: `admin`
- Password: `admin123` (change this after your first login)

## 2. (Optional) Bring over your existing data

If you want to keep the cadets/events/achievements/etc. you already have in
`ncc.db`, run `supabase_seed_data.sql` in the same SQL Editor, right after
step 1. It was generated from your current database and contains plain
`INSERT` statements — safe to skip if you'd rather start fresh.

## 3. Create the image storage bucket

Dashboard → **Storage** → **New bucket**
- Name: `ncc-media` (must match exactly — this is what `SUPABASE_BUCKET` points to)
- Public bucket: **ON** (so images actually load on your live site)

Then: SQL Editor → paste `supabase_storage_policies.sql` → **Run**.
(A public bucket lets anyone *view* files, but by default nobody can
*upload* — this script opens that up. The real security boundary is
still Flask's own admin login, same as before.)

## 4. Get your database connection string

Dashboard → **Project Settings** (gear icon) → **Database** → **Connection
string** → tab: **URI**. Pick the **Transaction pooler** variant (works
better than the direct connection on Render's free tier). It looks like:

```
postgresql://postgres.oekwpysuemstwisajmlu:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Replace `[YOUR-PASSWORD]` with your actual database password (the one you
set when creating the Supabase project — not any of the API keys). If you've
forgotten it, the same Database settings page has a "Reset database password"
button.

## 5. Set environment variables

**On Render:** Dashboard → your service → **Environment** → add:

| Key | Value |
|---|---|
| `DATABASE_URL` | the full connection string from step 4 |
| `SUPABASE_URL` | `https://oekwpysuemstwisajmlu.supabase.co` |
| `SUPABASE_KEY` | `sb_publishable_8xbVlIFxPwt6Rfh0TOMIEA_ApRPFbgi` |
| `SUPABASE_BUCKET` | `ncc-media` |
| `SECRET_KEY` | any long random string |

**Locally:** copy `.env.example` to `.env` and fill in the same values —
`app.py` loads it automatically via `python-dotenv`. Never commit `.env`
(it's already in `.gitignore`).

## 6. Deploy

Push to GitHub, Render redeploys automatically (or trigger a manual deploy).
Since the database now lives in Supabase instead of on Render's disk, your
data and uploaded images will survive every future redeploy and sleep/wake
cycle.

## What changed in the code

- `app.py` — swapped `sqlite3` for `psycopg2` (talks to Postgres), swapped
  local file saves for `supabase.storage` uploads. All routes and query
  logic are otherwise unchanged.
- `photo` / `filename` columns in `cadets`, `alumni`, and `gallery` now
  store a full public URL instead of a local filename — templates were
  updated to use that value directly as the image `src`.
- The old `init_db()` step is gone — schema creation now happens once via
  `supabase_schema.sql` in the SQL Editor rather than automatically on
  first run.
- `app_sqlite_backup.py.bak` is the original SQLite version, kept for
  reference — not used, safe to delete.
