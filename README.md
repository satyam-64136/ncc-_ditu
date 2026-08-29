# DIT University NCC — 29 UK Battalion Website

Flask website with a Postgres database and image storage on Supabase
(free tier), deployed on Render. No ORM — raw SQL queries via `psycopg2`.

---

## 🚀 Setup

This app needs a Supabase project (free) for its database and image storage
before it will run — **see [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for
the full step-by-step**, including the SQL to run, the storage bucket to
create, and which environment variables to set on Render.

Once that's done:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy .env.example → .env and fill in your Supabase values
cp .env.example .env

# 3. Run
python app.py

# 4. Open browser
http://localhost:5000
```

---

## 🔐 Admin Panel

**URL:** `http://localhost:5000/command-center/login`

Default credentials (seeded by `supabase_schema.sql`):
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change this password after your first login. The admin URL is
> intentionally not linked from the public nav or footer beyond a
> small shield icon.

---

## 📁 Project Structure

```
ncc-_ditu-main/
├── app.py                      # Flask app + all routes (raw SQL via psycopg2)
├── supabase_schema.sql         # Run once in Supabase SQL Editor — creates tables + RLS
├── supabase_seed_data.sql      # Optional — carries over existing sample data
├── supabase_storage_policies.sql  # Run once — allows uploads to the image bucket
├── SUPABASE_SETUP.md           # Full setup walkthrough
├── requirements.txt
├── .env.example                # Copy to .env for local dev
├── database.sql                # OLD SQLite schema — kept for reference only
├── app_sqlite_backup.py.bak    # OLD SQLite version of app.py — reference only
│
├── templates/
│   ├── base.html               # Nav + footer layout
│   ├── _icons.html             # Shared SVG icon macros
│   ├── index.html              # Home page
│   ├── about.html
│   ├── cadets.html              # Merged Cadets + Command Structure page
│   ├── achievements.html
│   ├── alumni.html
│   ├── gallery.html
│   ├── events.html
│   └── admin/
│       ├── base.html            # Admin sidebar layout
│       ├── login.html
│       ├── dashboard.html
│       ├── cadets.html
│       ├── cadet_form.html
│       ├── events.html
│       ├── event_form.html
│       ├── gallery.html
│       ├── attendance.html
│       └── att_records.html
│
└── static/
    ├── css/
    │   ├── main.css             # Full design system (light theme)
    │   └── admin.css            # Admin panel styles
    ├── js/
    │   └── main.js              # Nav, reveal-on-scroll, lightbox, button interactions
    └── img/
        ├── ncc-crest.png        # NCC shield crest (background removed)
        └── dit-ncc-logo.png     # DIT × NCC lockup logo
```

Cadet photos and gallery images are **no longer stored under `static/uploads/`**
— they're uploaded to a Supabase Storage bucket and referenced by URL.

---

## 🗄️ Database Tables

| Table          | Purpose                        |
|----------------|---------------------------------|
| `admin_users`  | Admin login accounts            |
| `cadets`       | Active cadet roster             |
| `rank_holders` | SUO, UO, CSM, CPL, SGT           |
| `alumni`       | Past cadets                     |
| `achievements` | Awards and honours              |
| `events`       | Parades, camps, announcements   |
| `gallery`      | Photo gallery with categories   |
| `attendance`   | Fall-in attendance records      |

All queries use raw SQL via `psycopg2` — no ORM. See `supabase_schema.sql`
for the full schema and `app.py` for every query.

---

## 🎨 Design

Light, professional theme with the three NCC wing colours (Army red, Navy,
Air Force sky blue) used as accents rather than dominant colours — see
`static/css/main.css` for the full token system.

---

## 🔒 Security Notes

1. `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, and `SECRET_KEY` are read
   from environment variables — never hardcoded. Set real values in Render's
   dashboard, and keep your local `.env` out of git (already gitignored).
2. Change the admin password after your first login.
3. RLS policies on the Supabase tables and storage bucket are intentionally
   open — the real security boundary is Flask's own admin-login check, since
   the app connects with a trusted server-side connection, not a
   browser-exposed key. See `SUPABASE_SETUP.md` for the reasoning.
4. Set `debug=False` in production (already the default).
5. Use a WSGI server (gunicorn) in production: `gunicorn app:app`.

---

*Built for DIT University NCC · 29 UK Battalion · Dehradun, Uttarakhand*
