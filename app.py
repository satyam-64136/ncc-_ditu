import sqlite3, os, csv, io
from datetime import datetime
from functools import wraps
from flask import (Flask, render_template, request, redirect, url_for,
                   flash, session, Response, g)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'ditu-ncc-29uk-ultra-secret-2025'

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(BASE_DIR, 'ncc.db')
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
ALLOWED    = {'png','jpg','jpeg','gif','webp'}

# ── DB ──────────────────────────────────────────────────────────
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db: db.close()

def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv  = cur.fetchall()
    return (rv[0] if rv else None) if one else rv

def execute(sql, args=()):
    db  = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid

def allowed_file(f):
    return '.' in f and f.rsplit('.',1)[1].lower() in ALLOWED

def save_file(file, subfolder):
    if file and allowed_file(file.filename):
        fn  = f"{int(datetime.now().timestamp())}_{secure_filename(file.filename)}"
        dst = os.path.join(UPLOAD_DIR, subfolder)
        os.makedirs(dst, exist_ok=True)
        file.save(os.path.join(dst, fn))
        return fn
    return None

def admin_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if not session.get('admin_id'):
            return redirect(url_for('admin_login'))
        return f(*a, **kw)
    return dec

# ── PUBLIC ROUTES ────────────────────────────────────────────────
@app.route('/')
def index():
    cc = query("SELECT COUNT(*) c FROM cadets WHERE active=1", one=True)['c']
    ac = query("SELECT COUNT(*) c FROM alumni",                one=True)['c']
    ec = query("SELECT COUNT(*) c FROM events",                one=True)['c']
    up = query("SELECT * FROM events WHERE event_date>=date('now') ORDER BY event_date LIMIT 3")
    return render_template('index.html', cadets_count=cc, alumni_count=ac,
                           events_count=ec, upcoming=up)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/cadets')
def cadets():
    cat    = request.args.get('cat','')
    search = request.args.get('q','')
    sql    = "SELECT * FROM cadets WHERE active=1"
    args   = []
    if cat:
        sql  += " AND category=?"; args.append(cat)
    if search:
        sql  += " AND (name LIKE ? OR rank LIKE ?)"; args += [f'%{search}%',f'%{search}%']
    sql += " ORDER BY category, rank DESC, name"
    all_cadets = query(sql, args)

    seniors = [c for c in all_cadets if c['category'] == 'Senior']
    buddies = [c for c in all_cadets if c['category'] == 'Buddy']
    return render_template('cadets.html', seniors=seniors, buddies=buddies,
                           active_cat=cat, search=search)

@app.route('/rank-holders')
def rank_holders():
    holders = query("SELECT * FROM rank_holders ORDER BY sort_order")
    return render_template('rank_holders.html', holders=holders)

@app.route('/achievements')
def achievements():
    items = query("SELECT * FROM achievements ORDER BY year DESC")
    return render_template('achievements.html', items=items)

@app.route('/gallery')
def gallery():
    cat = request.args.get('category','all')
    imgs = (query("SELECT * FROM gallery WHERE category=? ORDER BY uploaded_at DESC",[cat])
            if cat!='all' else
            query("SELECT * FROM gallery ORDER BY uploaded_at DESC"))
    cats = query("SELECT DISTINCT category FROM gallery ORDER BY category")
    return render_template('gallery.html', imgs=imgs, cats=cats, active_cat=cat)

@app.route('/events')
def events():
    upcoming = query("SELECT * FROM events WHERE event_date>=date('now') ORDER BY event_date")
    past     = query("SELECT * FROM events WHERE event_date<date('now') ORDER BY event_date DESC LIMIT 10")
    return render_template('events.html', upcoming=upcoming, past=past)

@app.route('/alumni')
def alumni():
    return render_template('alumni.html',
        alumni=query("SELECT * FROM alumni ORDER BY batch_year DESC"))

# ── ADMIN AUTH ───────────────────────────────────────────────────
@app.route('/command-center/login', methods=['GET','POST'])
def admin_login():
    if session.get('admin_id'):
        return redirect(url_for('admin_dashboard'))
    if request.method == 'POST':
        u = query("SELECT * FROM admin_users WHERE username=?",
                  [request.form['username']], one=True)
        if u and check_password_hash(u['password_hash'], request.form['password']):
            session['admin_id']   = u['id']
            session['admin_name'] = u['name']
            return redirect(url_for('admin_dashboard'))
        flash('Invalid credentials.','error')
    return render_template('admin/login.html')

@app.route('/command-center/logout')
def admin_logout():
    session.clear()
    return redirect(url_for('admin_login'))

# ── DASHBOARD ────────────────────────────────────────────────────
@app.route('/command-center')
@app.route('/command-center/dashboard')
@admin_required
def admin_dashboard():
    stats = {
        'cadets':        query("SELECT COUNT(*) c FROM cadets WHERE active=1", one=True)['c'],
        'alumni':        query("SELECT COUNT(*) c FROM alumni",                one=True)['c'],
        'events':        query("SELECT COUNT(*) c FROM events WHERE event_date>=date('now')",one=True)['c'],
        'gallery':       query("SELECT COUNT(*) c FROM gallery",               one=True)['c'],
        'att_sessions':  query("SELECT COUNT(DISTINCT date) c FROM attendance",one=True)['c'],
    }
    recent    = query("SELECT * FROM cadets ORDER BY created_at DESC LIMIT 6")
    soon      = query("SELECT * FROM events WHERE event_date>=date('now') ORDER BY event_date LIMIT 5")
    att_dates = query("""
        SELECT date,
               COUNT(*)                                             AS total,
               SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)   AS present_count,
               SUM(CASE WHEN status='absent'  THEN 1 ELSE 0 END)   AS absent_count,
               SUM(CASE WHEN status='late'    THEN 1 ELSE 0 END)   AS late_count,
               MAX(fallin_type)                                     AS fallin_type
        FROM attendance
        GROUP BY date ORDER BY date DESC LIMIT 10
    """)
    return render_template('admin/dashboard.html',
        stats=stats, recent=recent, soon=soon, att_dates=att_dates)

# ── CADETS CRUD ──────────────────────────────────────────────────
@app.route('/command-center/cadets')
@admin_required
def admin_cadets():
    return render_template('admin/cadets.html',
        cadets=query("SELECT * FROM cadets ORDER BY category, name"))

@app.route('/command-center/cadets/add', methods=['GET','POST'])
@admin_required
def admin_add_cadet():
    if request.method == 'POST':
        photo = save_file(request.files.get('photo'),'cadets')
        execute("""INSERT INTO cadets
                   (name,rank,roll_number,batch,branch,chest_number,bio,
                    ncc_year,category,is_rank_holder,rank_position,photo,active)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,1)""",
            [request.form['name'], request.form['rank'],
             request.form.get('roll_number'), request.form['batch'],
             request.form.get('branch'), request.form.get('chest_number'),
             request.form.get('bio'), request.form.get('ncc_year',''),
             request.form.get('category','Senior'),
             1 if request.form.get('is_rank_holder') else 0,
             request.form.get('rank_position'), photo])
        flash('Cadet added!','success')
        return redirect(url_for('admin_cadets'))
    return render_template('admin/cadet_form.html', cadet=None)

@app.route('/command-center/cadets/edit/<int:cid>', methods=['GET','POST'])
@admin_required
def admin_edit_cadet(cid):
    cadet = query("SELECT * FROM cadets WHERE id=?",[cid],one=True)
    if not cadet: flash('Not found.','error'); return redirect(url_for('admin_cadets'))
    if request.method == 'POST':
        photo = save_file(request.files.get('photo'),'cadets') or cadet['photo']
        execute("""UPDATE cadets SET name=?,rank=?,roll_number=?,batch=?,branch=?,
                   chest_number=?,bio=?,ncc_year=?,category=?,is_rank_holder=?,
                   rank_position=?,photo=?,active=? WHERE id=?""",
            [request.form['name'], request.form['rank'],
             request.form.get('roll_number'), request.form['batch'],
             request.form.get('branch'), request.form.get('chest_number'),
             request.form.get('bio'), request.form.get('ncc_year',''),
             request.form.get('category','Senior'),
             1 if request.form.get('is_rank_holder') else 0,
             request.form.get('rank_position'), photo,
             1 if request.form.get('active') else 0, cid])
        flash('Cadet updated!','success')
        return redirect(url_for('admin_cadets'))
    return render_template('admin/cadet_form.html', cadet=cadet)

@app.route('/command-center/cadets/delete/<int:cid>', methods=['POST'])
@admin_required
def admin_delete_cadet(cid):
    execute("DELETE FROM cadets WHERE id=?",[cid])
    flash('Cadet removed.','success')
    return redirect(url_for('admin_cadets'))

# ── EVENTS CRUD ──────────────────────────────────────────────────
@app.route('/command-center/events')
@admin_required
def admin_events():
    return render_template('admin/events.html',
        events=query("SELECT * FROM events ORDER BY event_date DESC"))

@app.route('/command-center/events/add', methods=['GET','POST'])
@admin_required
def admin_add_event():
    if request.method == 'POST':
        execute("INSERT INTO events(title,description,event_type,event_date,location) VALUES(?,?,?,?,?)",
            [request.form['title'], request.form.get('description'),
             request.form.get('event_type'), request.form['event_date'],
             request.form.get('location')])
        flash('Event added!','success')
        return redirect(url_for('admin_events'))
    return render_template('admin/event_form.html', event=None)

@app.route('/command-center/events/delete/<int:eid>', methods=['POST'])
@admin_required
def admin_delete_event(eid):
    execute("DELETE FROM events WHERE id=?",[eid])
    flash('Event deleted.','success')
    return redirect(url_for('admin_events'))

# ── GALLERY ──────────────────────────────────────────────────────
@app.route('/command-center/gallery')
@admin_required
def admin_gallery():
    return render_template('admin/gallery.html',
        imgs=query("SELECT * FROM gallery ORDER BY uploaded_at DESC"))

@app.route('/command-center/gallery/upload', methods=['POST'])
@admin_required
def admin_upload():
    fn = save_file(request.files.get('image'),'gallery')
    if fn:
        execute("INSERT INTO gallery(filename,caption,category,year) VALUES(?,?,?,?)",
            [fn, request.form.get('caption'),
             request.form.get('category','events'),
             int(request.form.get('year', datetime.now().year))])
        flash('Image uploaded!','success')
    return redirect(url_for('admin_gallery'))

@app.route('/command-center/gallery/delete/<int:gid>', methods=['POST'])
@admin_required
def admin_delete_gallery(gid):
    execute("DELETE FROM gallery WHERE id=?",[gid])
    flash('Image removed.','success')
    return redirect(url_for('admin_gallery'))

# ── ATTENDANCE ───────────────────────────────────────────────────
# Storage: attendance table (id, cadet_id FK, date, status, fallin_type, notes, marked_at)
# One row per cadet per date — UNIQUE(cadet_id, date)
# Dashboard queries: GROUP BY date with SUM(CASE...) for present/absent/late counts
# Records page: JOIN cadets, filter by date/cadet/status, sortable

@app.route('/command-center/attendance')
@admin_required
def admin_attendance():
    date_str   = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    cadets_all = query("SELECT * FROM cadets WHERE active=1 ORDER BY category, rank DESC, name")
    existing   = {r['cadet_id']:r for r in
                  query("SELECT * FROM attendance WHERE date=?",[date_str])}
    history    = query("""
        SELECT date, COUNT(*) total,
               SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) p,
               SUM(CASE WHEN status='absent'  THEN 1 ELSE 0 END) a
        FROM attendance GROUP BY date ORDER BY date DESC LIMIT 15
    """)
    return render_template('admin/attendance.html',
        cadets=cadets_all, date=date_str, existing=existing, history=history)

@app.route('/command-center/attendance/mark', methods=['POST'])
@admin_required
def admin_mark_attendance():
    date_str    = request.form['date']
    fallin_type = request.form.get('fallin_type','Morning Fallin')
    for c in query("SELECT id FROM cadets WHERE active=1"):
        status = request.form.get(f'status_{c["id"]}','absent')
        ex = query("SELECT id FROM attendance WHERE cadet_id=? AND date=?",
                   [c['id'],date_str], one=True)
        if ex:
            execute("UPDATE attendance SET status=?,fallin_type=? WHERE id=?",
                    [status,fallin_type,ex['id']])
        else:
            execute("INSERT INTO attendance(cadet_id,date,status,fallin_type) VALUES(?,?,?,?)",
                    [c['id'],date_str,status,fallin_type])
    flash('Fallin attendance saved!','success')
    return redirect(url_for('admin_attendance', date=date_str))

# Full attendance records page — filter by date, cadet, status
@app.route('/command-center/attendance/records')
@admin_required
def admin_att_records():
    f_date   = request.args.get('date','')
    f_cadet  = request.args.get('cadet','')
    f_status = request.args.get('status','')

    all_dates = query("""
        SELECT date,
               COUNT(*)                                             AS total,
               SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)   AS present_count,
               SUM(CASE WHEN status='absent'  THEN 1 ELSE 0 END)   AS absent_count,
               SUM(CASE WHEN status='late'    THEN 1 ELSE 0 END)   AS late_count,
               MAX(fallin_type)                                     AS fallin_type
        FROM attendance GROUP BY date ORDER BY date DESC
    """)

    # Build detail query with optional filters
    sql  = """SELECT c.name, c.rank, c.chest_number, c.roll_number, c.category,
                     a.status, a.fallin_type, a.marked_at, a.date, a.id AS att_id
              FROM attendance a JOIN cadets c ON c.id=a.cadet_id WHERE 1=1"""
    args = []
    if f_date:   sql += " AND a.date=?";     args.append(f_date)
    if f_cadet:  sql += " AND c.name LIKE ?"; args.append(f'%{f_cadet}%')
    if f_status: sql += " AND a.status=?";   args.append(f_status)
    sql += " ORDER BY a.date DESC, c.category, c.name LIMIT 200"
    detail_rows = query(sql, args)

    # Stats for selected date
    stats = None
    if f_date and detail_rows:
        total   = len(detail_rows)
        present = sum(1 for r in detail_rows if r['status']=='present')
        late    = sum(1 for r in detail_rows if r['status']=='late')
        absent  = sum(1 for r in detail_rows if r['status']=='absent')
        stats   = {'total':total,'present':present,'late':late,'absent':absent,
                   'pct': round(present/total*100) if total else 0}

    cadets_list = query("SELECT id,name FROM cadets WHERE active=1 ORDER BY name")
    return render_template('admin/att_records.html',
        all_dates=all_dates, detail_rows=detail_rows,
        f_date=f_date, f_cadet=f_cadet, f_status=f_status,
        stats=stats, cadets_list=cadets_list)

@app.route('/command-center/attendance/edit/<int:att_id>', methods=['POST'])
@admin_required
def admin_edit_attendance(att_id):
    execute("UPDATE attendance SET status=? WHERE id=?",
            [request.form.get('status'), att_id])
    flash('Record updated.','success')
    return redirect(url_for('admin_att_records',
        date=request.form.get('redirect_date',''),
        cadet=request.form.get('redirect_cadet',''),
        status=request.form.get('redirect_status','')))

@app.route('/command-center/attendance/export')
@admin_required
def admin_export():
    f_date = request.args.get('date','')
    if f_date:
        rows  = query("""SELECT a.date,c.name,c.rank,c.roll_number,c.category,
                                a.status,a.fallin_type
                         FROM attendance a JOIN cadets c ON c.id=a.cadet_id
                         WHERE a.date=? ORDER BY c.category,c.name""", [f_date])
        fname = f"fallin_{f_date}.csv"
    else:
        rows  = query("""SELECT a.date,c.name,c.rank,c.roll_number,c.category,
                                a.status,a.fallin_type
                         FROM attendance a JOIN cadets c ON c.id=a.cadet_id
                         ORDER BY a.date DESC,c.category,c.name""")
        fname = "fallin_attendance_all.csv"
    buf = io.StringIO()
    w   = csv.writer(buf)
    w.writerow(['Date','Name','Rank','Roll No','Category','Status','Fallin Type'])
    for r in rows: w.writerow(list(r))
    buf.seek(0)
    return Response(buf, mimetype='text/csv',
        headers={'Content-Disposition': f'attachment;filename={fname}'})

# ── DB INIT ──────────────────────────────────────────────────────
def init_db():
    with app.app_context():
        db = get_db()
        with open(os.path.join(BASE_DIR,'database.sql'), encoding='utf-8') as f:
            db.executescript(f.read())
        db.commit()
        if not db.execute("SELECT id FROM admin_users WHERE username='admin'").fetchone():
            db.execute("INSERT INTO admin_users(username,password_hash,name) VALUES(?,?,?)",
                ('admin', generate_password_hash('admin123'), 'NCC Admin'))
            db.commit()

if __name__ == '__main__':
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
