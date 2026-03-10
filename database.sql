-- DIT UNIVERSITY NCC · 29 UK BATTALION
-- SQLite Schema | Raw SQL | No ORM

CREATE TABLE IF NOT EXISTS admin_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    name          TEXT,
    created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cadets (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    rank            TEXT    NOT NULL DEFAULT 'CDT',
    roll_number     TEXT    UNIQUE,
    batch           TEXT    NOT NULL,
    branch          TEXT,
    chest_number    TEXT,
    photo           TEXT,
    bio             TEXT,
    ncc_year        TEXT    DEFAULT '',
    category        TEXT    DEFAULT 'Senior',
    is_rank_holder  INTEGER DEFAULT 0,
    rank_position   TEXT,
    active          INTEGER DEFAULT 1,
    created_at      TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rank_holders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rank_code   TEXT NOT NULL,
    rank_full   TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS alumni (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    rank                TEXT,
    batch_year          TEXT,
    achievements        TEXT,
    current_profession  TEXT,
    photo               TEXT,
    testimonial         TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    year        INTEGER,
    category    TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    event_type  TEXT,
    event_date  TEXT NOT NULL,
    location    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gallery (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filename    TEXT NOT NULL,
    caption     TEXT,
    category    TEXT DEFAULT 'events',
    year        INTEGER,
    uploaded_at TEXT DEFAULT (datetime('now'))
);

-- attendance: one row per cadet per date
-- status: 'present' | 'late' | 'absent'
-- fallin_type: 'Morning Fallin' | 'Evening Fallin' | 'Special Fallin' | etc.
CREATE TABLE IF NOT EXISTS attendance (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cadet_id    INTEGER NOT NULL REFERENCES cadets(id) ON DELETE CASCADE,
    date        TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'absent',
    fallin_type TEXT    DEFAULT 'Morning Fallin',
    notes       TEXT,
    marked_at   TEXT    DEFAULT (datetime('now')),
    UNIQUE(cadet_id, date)
);
