-- ═══════════════════════════════════════════════════════════════
-- DIT UNIVERSITY NCC · 29 UK BATTALION
-- Postgres schema for Supabase
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cadets (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    rank            TEXT NOT NULL DEFAULT 'CDT',
    roll_number     TEXT UNIQUE,
    batch           TEXT NOT NULL,
    branch          TEXT,
    chest_number    TEXT,
    photo           TEXT,              -- now stores a full Supabase Storage URL
    bio             TEXT,
    ncc_year        TEXT DEFAULT '',
    category        TEXT DEFAULT 'Senior',
    is_rank_holder  INTEGER DEFAULT 0,
    rank_position   TEXT,
    active          INTEGER DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rank_holders (
    id          SERIAL PRIMARY KEY,
    rank_code   TEXT NOT NULL,
    rank_full   TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS alumni (
    id                  SERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    rank                TEXT,
    batch_year          TEXT,
    achievements        TEXT,
    current_profession  TEXT,
    photo               TEXT,          -- Supabase Storage URL
    testimonial         TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    year        INTEGER,
    category    TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    event_type  TEXT,
    event_date  DATE NOT NULL,
    location    TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery (
    id          SERIAL PRIMARY KEY,
    filename    TEXT NOT NULL,          -- now stores a full Supabase Storage URL
    caption     TEXT,
    category    TEXT DEFAULT 'events',
    year        INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- attendance: one row per cadet per date
-- status: 'present' | 'late' | 'absent'
CREATE TABLE IF NOT EXISTS attendance (
    id          SERIAL PRIMARY KEY,
    cadet_id    INTEGER NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'absent',
    fallin_type TEXT DEFAULT 'Morning Fallin',
    notes       TEXT,
    marked_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cadet_id, date)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- The Flask app is the only thing talking to this database (via a
-- direct Postgres connection using DATABASE_URL, not the anon/public
-- API key), and Flask enforces its own admin-login check before any
-- write route runs. So RLS here just needs to not get in the way of
-- that trusted server connection — it does not need to replicate
-- Flask's auth logic. We enable RLS (good practice) but keep policies
-- open, since the security boundary is the Flask app itself.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE admin_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni       ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_users','cadets','rank_holders','alumni','achievements','events','gallery','attendance']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I', t);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- SEED: default admin login (username: admin / password: admin123)
-- CHANGE THIS PASSWORD after your first login — this hash is the
-- same one used in the original SQLite seed, so it's not a secret
-- once this file is public. Generate a fresh one with:
--   python3 -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('yournewpassword'))"
-- and UPDATE admin_users SET password_hash='...' WHERE username='admin';
-- ═══════════════════════════════════════════════════════════════
INSERT INTO admin_users (username, password_hash, name)
VALUES ('admin', 'scrypt:32768:8:1$QRvDqk07HNHXacPe$61436e6762ed02d38b4e64dbc3028b86a0af507e0a998f2759b71d96b64c8dbcf1eaca890a236dda2dac5d1f06e7c4e1ce525bd7978af63d03202697fb1f27df', 'NCC Admin')
ON CONFLICT (username) DO NOTHING;
