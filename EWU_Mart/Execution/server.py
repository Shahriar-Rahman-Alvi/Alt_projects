#!/usr/bin/env python3
"""
EWUMart Backend Server
======================
Flask REST API + SQLite storage + static file serving.

Run:  python3 server.py
URL:  http://localhost:5500
DB:   execution/ewumart.db  (auto-created on first run)
"""

import os, json, hashlib, sqlite3
from datetime import date, datetime
from flask import Flask, jsonify, request, send_from_directory, g
from flask_cors import CORS

# ── Config ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'ewumart.db')

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)

# ── DB Connection ─────────────────────────────────────────────────────────────
def get_db():
    if '_db' not in g:
        g._db = sqlite3.connect(DB_PATH)
        g._db.row_factory = sqlite3.Row
    return g._db

@app.teardown_appcontext
def close_db(_):
    db = g.pop('_db', None)
    if db: db.close()

def q(sql, args=()):
    """Run SELECT → list of dicts."""
    return [dict(r) for r in get_db().execute(sql, args).fetchall()]

def q1(sql, args=()):
    """Run SELECT → single dict or None."""
    r = get_db().execute(sql, args).fetchone()
    return dict(r) if r else None

def mut(sql, args=()):
    """Run INSERT/UPDATE/DELETE → lastrowid."""
    db  = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur.lastrowid

def hp(pw):
    """SHA-256 hash a password string."""
    return hashlib.sha256(pw.encode()).hexdigest()

def today_str():
    return date.today().isoformat()

def now_time():
    return datetime.now().strftime('%I:%M %p')

# ── Row Transformers (DB column names → frontend field names) ─────────────────
def prod_row(r):
    r = dict(r)
    r['desc'] = r.pop('descr', '')
    try:    r['reps'] = json.loads(r.get('reps') or '[]')
    except: r['reps'] = []
    return r

def msg_row(r):
    r = dict(r)
    r['from'] = r.pop('src', 0)
    r['to']   = r.pop('dst', 0)
    return r

def txn_row(r):
    r = dict(r)
    r['sid'] = r.pop('seller', 0)
    return r

def rev_row(r):
    r = dict(r)
    r['by']  = r.pop('by_u', 0)
    r['for'] = r.pop('for_u', 0)
    return r

def rep_row(r):
    r = dict(r)
    r['by'] = r.pop('by_u', 0)
    return r

# ── Schema ────────────────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  fname TEXT    NOT NULL,
  lname TEXT    DEFAULT '',
  email TEXT    UNIQUE NOT NULL,
  pw    TEXT    NOT NULL,
  dept  TEXT    DEFAULT '',
  sem   TEXT    DEFAULT '',
  sid   TEXT    DEFAULT '',
  role  TEXT    DEFAULT 'user',
  bio   TEXT    DEFAULT ''
);
CREATE TABLE IF NOT EXISTS products (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  sid    INTEGER NOT NULL,
  title  TEXT    NOT NULL,
  course TEXT    DEFAULT '',
  cat    TEXT    DEFAULT 'Other',
  price  REAL    DEFAULT 0,
  type   TEXT    DEFAULT 'Sell',
  status TEXT    DEFAULT 'Active',
  cond   TEXT    DEFAULT 'Good',
  descr  TEXT    DEFAULT '',
  em     TEXT    DEFAULT '📦',
  date   TEXT    DEFAULT '',
  reps   TEXT    DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS messages (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  src  INTEGER NOT NULL,
  dst  INTEGER NOT NULL,
  text TEXT    NOT NULL,
  time TEXT    DEFAULT ''
);
CREATE TABLE IF NOT EXISTS transactions (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  pid    INTEGER NOT NULL,
  bid    INTEGER NOT NULL,
  seller INTEGER NOT NULL,
  amt    REAL    DEFAULT 0,
  status TEXT    DEFAULT 'Pending',
  date   TEXT    DEFAULT ''
);
CREATE TABLE IF NOT EXISTS reviews (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  by_u  INTEGER NOT NULL,
  for_u INTEGER NOT NULL,
  stars INTEGER DEFAULT 5,
  text  TEXT    DEFAULT '',
  date  TEXT    DEFAULT ''
);
CREATE TABLE IF NOT EXISTS reports (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  by_u   INTEGER NOT NULL,
  pid    INTEGER NOT NULL,
  rsn    TEXT    DEFAULT '',
  dtl    TEXT    DEFAULT '',
  status TEXT    DEFAULT 'Pending',
  date   TEXT    DEFAULT ''
);
"""

def seed(db):
    """Insert demo data on first run."""
    users = [
        (1,'Ibna','Jiam',   'ibna@ewubd.edu',  hp('1234'),  'CSE',   'Spring 2025','2021-1-60-001','user', 'CSE student.'),
        (2,'Nadia','Islam', 'nadia@ewubd.edu', hp('1234'),  'EEE',   'Summer 2025','2022-3-45-010','user', 'Loves electronics.'),
        (3,'Admin','EWU',   'admin@ewubd.edu', hp('admin'), 'Admin', '—',           'ADMIN-001',    'admin','Admin.'),
        (4,'Rafi','Hossain','rafi@ewubd.edu',  hp('1234'),  'BBA',   'Fall 2025',  '2020-2-10-055','user', 'Business student.'),
    ]
    db.executemany("INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?,?,?,?,?)", users)

    prods = [
        (1,4,'Data Structures & Algorithms (Cormen)','CSE 301','Textbooks',     650, 'Sell','Active','Good',    '4th ed, minor highlights.',      '📚','2025-04-01','[]'),
        (2,2,'EEE 202 Lab Report Set',               'EEE 202','Notes & Reports',200, 'Sell','Active','Like New','Complete EEE 202 lab reports.',  '📓','2025-03-28','[]'),
        (3,4,'Scientific Calculator FX-991EX',       'MAT 101','Electronics',   1200,'Sell','Sold', 'Like New','Casio FX-991EX, one semester.',  '🔢','2025-03-20','[]'),
        (4,2,'Looking for Business Communication Book','ENG 201','Textbooks',   300, 'Want','Active','Any',     'Bovee edition, any condition.',   '🔍','2025-04-02','[]'),
        (5,1,'CSE 115 Programming Lab Notes',        'CSE 115','Notes & Reports',150,'Sell','Active','Good',    'Hand-written, all labs covered.','💻','2025-04-03','[]'),
        (6,4,'Organic Chemistry Textbook (Clayden)', 'CHE 101','Textbooks',     800, 'Sell','Active','Fair',    'Some annotations.',              '🧪','2025-03-25','[]'),
    ]
    db.executemany("INSERT OR IGNORE INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", prods)

    msgs = [
        (1,2,1,"Hi! Are the CSE 115 notes still available?","10:32 AM"),
        (2,1,2,"Yes! Come pick them up anytime.","10:45 AM"),
        (3,2,1,"Great, I'll come tomorrow afternoon.","10:47 AM"),
        (4,4,1,"Hey, interested in your notes!","Yesterday"),
    ]
    db.executemany("INSERT OR IGNORE INTO messages VALUES (?,?,?,?,?)", msgs)

    db.execute("INSERT OR IGNORE INTO transactions VALUES (1,3,1,4,1200,'Completed','2025-03-22')")
    db.execute("INSERT OR IGNORE INTO transactions VALUES (2,5,2,1,150,'Pending','2025-04-03')")

    db.execute("INSERT OR IGNORE INTO reviews VALUES (1,2,1,5,'Super fast and friendly! Item exactly as described.','2025-03-24')")
    db.execute("INSERT OR IGNORE INTO reviews VALUES (2,4,1,4,'Good seller, item in great condition.','2025-03-18')")

    db.execute("INSERT OR IGNORE INTO reports VALUES (1,1,6,'Fraudulent listing','Price seems inflated.','Pending','2025-04-01')")
    db.commit()

def init_db():
    """Create schema and seed on first run."""
    db = sqlite3.connect(DB_PATH)
    db.executescript(SCHEMA)
    if not db.execute("SELECT 1 FROM users LIMIT 1").fetchone():
        seed(db)
    db.close()
    print(f"✅ Database ready: {DB_PATH}")

# ══════════════════════════════════════════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════════════════════════════════════════

# ── Bootstrap — load everything for a user in one request ─────────────────────
@app.route('/api/init/<int:uid>')
def api_init(uid):
    """Return all data needed to boot the app for a given user."""
    return jsonify({
        'users':    q("SELECT * FROM users"),
        'products': [prod_row(r) for r in q("SELECT * FROM products")],
        'msgs':     [msg_row(r)  for r in q("SELECT * FROM messages WHERE src=? OR dst=?", (uid, uid))],
        'txns':     [txn_row(r)  for r in q("SELECT * FROM transactions WHERE bid=? OR seller=?", (uid, uid))],
        'reviews':  [rev_row(r)  for r in q("SELECT * FROM reviews WHERE for_u=?", (uid,))],
        'reports':  [rep_row(r)  for r in q("SELECT * FROM reports")],
    })

# ── Auth ──────────────────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def api_login():
    d  = request.get_json()
    em = (d.get('email') or '').strip()
    pw = d.get('pw') or ''
    u  = q1("SELECT * FROM users WHERE email=? AND pw=?", (em, hp(pw)))
    if not u:
        return jsonify({'error': 'Invalid email or password.'}), 401
    return jsonify(u)

@app.route('/api/register', methods=['POST'])
def api_register():
    d    = request.get_json()
    fn   = (d.get('fname') or '').strip()
    ln   = (d.get('lname') or '').strip()
    em   = (d.get('email') or '').strip()
    pw   = d.get('pw') or ''
    dept = d.get('dept') or ''
    sem  = d.get('sem')  or ''
    sid  = d.get('sid')  or ''

    if not fn or not em or not pw or not dept or not sem:
        return jsonify({'error': 'Please fill all required fields.'}), 400
    if len(pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400
    if q1("SELECT 1 FROM users WHERE email=?", (em,)):
        return jsonify({'error': 'Email already registered.'}), 409

    uid = mut("INSERT INTO users (fname,lname,email,pw,dept,sem,sid,role,bio) VALUES (?,?,?,?,?,?,?,'user','')",
              (fn, ln, em, hp(pw), dept, sem, sid))
    return jsonify(q1("SELECT * FROM users WHERE id=?", (uid,))), 201

# ── Users ─────────────────────────────────────────────────────────────────────
@app.route('/api/users')
def api_users():
    return jsonify(q("SELECT * FROM users"))

@app.route('/api/users/<int:uid>', methods=['PUT'])
def api_update_user(uid):
    d    = request.get_json()
    fn   = d.get('fname', '')
    ln   = d.get('lname', '')
    dept = d.get('dept', '')
    sem  = d.get('sem', '')
    bio  = d.get('bio', '')
    mut("UPDATE users SET fname=?,lname=?,dept=?,sem=?,bio=? WHERE id=?",
        (fn, ln, dept, sem, bio, uid))
    return jsonify(q1("SELECT * FROM users WHERE id=?", (uid,)))

@app.route('/api/users/<int:uid>/role', methods=['PUT'])
def api_set_role(uid):
    """Admin: promote or demote a user's role."""
    d    = request.get_json()
    role = d.get('role', 'user')
    if role not in ('user', 'admin'):
        return jsonify({'error': 'Invalid role'}), 400
    mut("UPDATE users SET role=? WHERE id=?", (role, uid))
    return jsonify(q1("SELECT * FROM users WHERE id=?", (uid,)))

# ── Products ──────────────────────────────────────────────────────────────────
@app.route('/api/products')
def api_products():
    return jsonify([prod_row(r) for r in q("SELECT * FROM products")])

@app.route('/api/products', methods=['POST'])
def api_create_product():
    d   = request.get_json()
    pid = mut(
        "INSERT INTO products (sid,title,course,cat,price,type,status,cond,descr,em,date,reps) VALUES (?,?,?,?,?,?,'Active',?,?,?,?,?)",
        (d['sid'], d['title'], d.get('course',''), d.get('cat','Other'), d.get('price',0),
         d.get('type','Sell'), d.get('cond','Good'), d.get('desc',''),
         d.get('em','📦'), today_str(), '[]')
    )
    return jsonify(prod_row(q1("SELECT * FROM products WHERE id=?", (pid,)))), 201

@app.route('/api/products/<int:pid>', methods=['PUT'])
def api_update_product(pid):
    d = request.get_json()
    mut("UPDATE products SET title=?,course=?,cat=?,price=?,type=?,status=?,cond=?,descr=?,em=? WHERE id=?",
        (d.get('title',''), d.get('course',''), d.get('cat','Other'), d.get('price',0),
         d.get('type','Sell'), d.get('status','Active'), d.get('cond','Good'),
         d.get('desc',''), d.get('em','📦'), pid))
    return jsonify(prod_row(q1("SELECT * FROM products WHERE id=?", (pid,))))

@app.route('/api/products/<int:pid>', methods=['DELETE'])
def api_delete_product(pid):
    mut("DELETE FROM products WHERE id=?", (pid,))
    return jsonify({'ok': True})

# ── Messages ──────────────────────────────────────────────────────────────────
@app.route('/api/messages/<int:uid>')
def api_messages(uid):
    return jsonify([msg_row(r) for r in q("SELECT * FROM messages WHERE src=? OR dst=?", (uid, uid))])

@app.route('/api/messages', methods=['POST'])
def api_send_message():
    d   = request.get_json()
    mid = mut("INSERT INTO messages (src,dst,text,time) VALUES (?,?,?,?)",
              (d['from'], d['to'], d['text'], now_time()))
    return jsonify(msg_row(q1("SELECT * FROM messages WHERE id=?", (mid,)))), 201

# ── Transactions ──────────────────────────────────────────────────────────────
@app.route('/api/transactions/<int:uid>')
def api_transactions(uid):
    return jsonify([txn_row(r) for r in q("SELECT * FROM transactions WHERE bid=? OR seller=?", (uid, uid))])

@app.route('/api/transactions', methods=['POST'])
def api_create_transaction():
    d   = request.get_json()
    tid = mut("INSERT INTO transactions (pid,bid,seller,amt,status,date) VALUES (?,?,?,?,'Pending',?)",
              (d['pid'], d['bid'], d['sid'], d['amt'], today_str()))
    mut("UPDATE products SET status='Sold' WHERE id=?", (d['pid'],))
    return jsonify(txn_row(q1("SELECT * FROM transactions WHERE id=?", (tid,)))), 201

# ── Reviews ───────────────────────────────────────────────────────────────────
@app.route('/api/reviews/<int:uid>')
def api_reviews(uid):
    return jsonify([rev_row(r) for r in q("SELECT * FROM reviews WHERE for_u=?", (uid,))])

# ── Reports ───────────────────────────────────────────────────────────────────
@app.route('/api/reports')
def api_reports():
    return jsonify([rep_row(r) for r in q("SELECT * FROM reports")])

@app.route('/api/reports', methods=['POST'])
def api_create_report():
    d   = request.get_json()
    rid = mut("INSERT INTO reports (by_u,pid,rsn,dtl,status,date) VALUES (?,?,?,?,'Pending',?)",
              (d['by'], d['pid'], d.get('rsn',''), d.get('dtl',''), today_str()))
    return jsonify(rep_row(q1("SELECT * FROM reports WHERE id=?", (rid,)))), 201

@app.route('/api/reports/<int:rid>', methods=['PUT'])
def api_update_report(rid):
    d = request.get_json()
    mut("UPDATE reports SET status=? WHERE id=?", (d.get('status','Pending'), rid))
    return jsonify(rep_row(q1("SELECT * FROM reports WHERE id=?", (rid,))))

# ── Static Files ──────────────────────────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def static_files(path):
    if not path:
        path = 'index.html'
    return send_from_directory(BASE_DIR, path)

# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("\n🛒  EWUMart backend  →  http://localhost:5500\n")
    app.run(host='0.0.0.0', port=5500, debug=False, use_reloader=False)
