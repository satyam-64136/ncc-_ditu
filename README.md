# DIT University NCC — 29 UK Battalion Website

Modern military-themed Flask + SQLite website.
**No ORM — raw SQL queries only.**

---

## 🚀 Quick Start (3 steps)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the app (auto-creates DB + seeds data on first run)
python app.py

# 3. Open browser
http://localhost:5000
```

That's it. SQLite database (`ncc.db`) is created automatically.

---

## 🔐 Admin Panel

**URL:** `http://localhost:5000/command-center/login`

Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

> ⚠️ Change password before going live. The admin URL is intentionally obscured.

---

## 📁 Project Structure

```
ncc_site/
├── app.py                   # Flask app + all routes (raw SQL)
├── database.sql             # SQLite schema
├── requirements.txt
├── README.md
├── ncc.db                   # Created automatically on first run
│
├── templates/
│   ├── base.html            # Nav + footer layout
│   ├── index.html           # Home with Three.js scene
│   ├── about.html
│   ├── cadets.html
│   ├── rank_holders.html
│   ├── achievements.html
│   ├── alumni.html
│   ├── gallery.html
│   ├── events.html
│   └── admin/
│       ├── base.html        # Admin sidebar layout
│       ├── login.html
│       ├── dashboard.html
│       ├── cadets.html
│       ├── cadet_form.html
│       ├── events.html
│       ├── event_form.html
│       ├── gallery.html
│       └── attendance.html
│
└── static/
    ├── css/
    │   ├── main.css         # Full design system
    │   └── admin.css        # Admin panel styles
    ├── js/
    │   ├── main.js          # UI interactions + animations
    │   └── parade.js        # Three.js 3D parade ground
    └── uploads/
        ├── cadets/          # Cadet photos
        └── gallery/         # Gallery images
```

---

## 🗄️ Database Tables

| Table         | Purpose                          |
|---------------|----------------------------------|
| `admin_users` | Admin login accounts             |
| `cadets`      | Active + past cadet roster       |
| `rank_holders`| SUO, JUO, CSM, CQMS etc.        |
| `alumni`      | Past cadets                      |
| `achievements`| Awards and honours               |
| `events`      | Parades, camps, announcements    |
| `gallery`     | Photo gallery with categories    |
| `attendance`  | Fall-in attendance records       |

All queries use Python's built-in `sqlite3` module with raw SQL — no ORM.

---

## 🎨 Design Features

- **Bebas Neue** display font + **Exo 2** body + **Share Tech Mono** for code/labels
- Dark green `#0b1a10` / matte black `#04080a` / gold `#c8a030` palette
- Glassmorphism cards with animated border glow on hover
- Scan-line texture overlay for authenticity
- **Three.js 3D parade ground** — marching cadets, waving India flag, mouse-reactive camera
- **Day/Night toggle** — switches sky, lighting, stars in real-time
- GSAP scroll reveals + stagger animations
- Cadet cards with 3D tilt effect
- Animated rotating medals on achievements page
- Gallery lightbox with category filtering
- Rank holder cards with glowing insignia + tooltip

---

## 🔒 Security Notes

1. Change `app.secret_key` in `app.py` before production
2. Change admin password via the DB or add a change-password route
3. The admin URL `/command-center/login` is not linked publicly
4. Set `debug=False` in production
5. Use a WSGI server (gunicorn) for production: `gunicorn app:app`

---

*Built for DIT University NCC · 29 UK Battalion · Dehradun, Uttarakhand*
