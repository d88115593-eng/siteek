import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { defaultItems, defaultSettings } from './seed.js';

const dataDir = path.resolve(process.env.DATA_DIR || './data');
fs.mkdirSync(dataDir, { recursive: true });
export const publicUploadDir = path.join(dataDir, 'uploads', 'public');
export const privateUploadDir = path.join(dataDir, 'uploads', 'private');
fs.mkdirSync(publicUploadDir, { recursive: true });
fs.mkdirSync(privateUploadDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'prime.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_content_type ON content_items(type,position);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
  zipcode TEXT, address TEXT, service TEXT, details TEXT,
  preferred_contact TEXT NOT NULL DEFAULT 'sms',
  attachments TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'New',
  internal_notes TEXT NOT NULL DEFAULT '',
  scheduled_for TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_leads_status ON leads(status,created_at);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// Migrate older email-based admins in place, preserving IDs, bcrypt hashes and sessions.
// The first owner becomes "admin"; team accounts receive unique username slugs.
const oldAdminColumns = db.pragma('table_info(admins)');
if (!oldAdminColumns.some(c => c.name === 'role')) db.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'owner'");
if (!db.pragma('table_info(admins)').some(c => c.name === 'username')) {
  const legacyAdmins=db.prepare('SELECT * FROM admins ORDER BY id').all();
  const used=new Set();
  const names=legacyAdmins.map((account,index)=>{
    let base=(account.role==='owner' && !used.has('admin'))?'admin':String(account.email||'user'+account.id).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,32);
    if(base.length<3)base='user'+account.id;
    let name=base, n=2;
    while(used.has(name))name=(base.slice(0,28)+'-'+n++).slice(0,32);
    used.add(name); return name;
  });
  db.transaction(()=>{
    db.exec(`CREATE TABLE admins_upgrade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    const insert=db.prepare('INSERT INTO admins_upgrade(id,username,password_hash,role,created_at) VALUES(?,?,?,?,?)');
    legacyAdmins.forEach((a,i)=>insert.run(a.id,names[i],a.password_hash,a.role,a.created_at));
    db.exec('DROP TABLE admins; ALTER TABLE admins_upgrade RENAME TO admins;');
  })();
  console.info('[setup] Email-based administrator accounts migrated to username sign-in. Password hashes preserved.');
}

if (!db.prepare('SELECT key FROM settings WHERE key = ?').get('site')) {
  db.prepare('INSERT INTO settings(key,data) VALUES(?,?)').run('site', JSON.stringify(defaultSettings));
}
const insertItem = db.prepare('INSERT INTO content_items(type,data,position,visible) VALUES(?,?,?,1)');
for (const [type, items] of Object.entries(defaultItems)) {
  const exists = db.prepare('SELECT COUNT(*) count FROM content_items WHERE type=?').get(type).count;
  if (!exists) {
    const transaction = db.transaction(() => items.forEach((item, pos) => insertItem.run(type, JSON.stringify(item), pos)));
    transaction();
  }
}
const numAdmins=db.prepare('SELECT COUNT(*) count FROM admins').get().count;
const initialUsername=String(process.env.ADMIN_USERNAME||'admin').trim().toLowerCase();
if(!numAdmins && /^[a-z0-9._-]{3,32}$/.test(initialUsername) && process.env.ADMIN_PASSWORD?.length>=12){
  db.prepare('INSERT INTO admins(username,password_hash) VALUES(?,?)').run(initialUsername,bcrypt.hashSync(process.env.ADMIN_PASSWORD,12));
  console.info('[setup] Initial administrator created with a username; change the password after your first sign-in.');
}else if(!numAdmins){
  console.warn('[setup] Admin unavailable: configure ADMIN_USERNAME (or default admin) and ADMIN_PASSWORD (12+ characters) in private environment settings.');
}

export function getSite() {
  const raw = db.prepare('SELECT data FROM settings WHERE key=?').get('site');
  if (!raw) return defaultSettings;
  const saved=JSON.parse(raw.data);
  // One-time defaults for existing installations, retaining later admin overrides.
  if (!Object.hasOwn(saved,'videosTitle') && !saved.whatsapp) saved.whatsapp=defaultSettings.whatsapp;
  const sections=Array.isArray(saved.sections)?[...saved.sections]:[...defaultSettings.sections];
  for(const section of defaultSettings.sections){if(!sections.some(s=>s.id===section.id)){const idx=sections.findIndex(s=>s.id==='gallery');sections.splice(idx<0?sections.length:idx+1,0,section);}}
  return {...defaultSettings,...saved,sections};
}
export function updateSite(patch) {
  const current = getSite();
  const result = { ...current, ...patch };
  db.prepare('UPDATE settings SET data=? WHERE key=?').run(JSON.stringify(result), 'site');
  return result;
}
export const itemTypes = ['services','gallery','videos','faq','areas','reviews','offers'];
export function getItems(type, includeHidden = false) {
  if (!itemTypes.includes(type)) return [];
  const rows = db.prepare(`SELECT * FROM content_items WHERE type=? ${includeHidden ? '' : 'AND visible=1'} ORDER BY position,id`).all(type);
  return rows.map(({ data, visible, ...row })=>({ ...row, ...JSON.parse(data), visible: Boolean(visible) }));
}
export function publicData() {
  const collections=Object.fromEntries(itemTypes.map(t=>[t,getItems(t)]));
  // Hide demo videos missing from a source-only checkout until media is uploaded.
  collections.videos=collections.videos.filter(item=>{
    if(!/^\/(?:assets|uploads)\/[\w.-]+\.(?:mp4|webm)$/.test(item.video||''))return false;
    const file=item.video.startsWith('/uploads/')?path.join(publicUploadDir,path.basename(item.video)):path.resolve(process.cwd(),'public',item.video.slice(1));
    return fs.existsSync(file);
  });
  return {site:getSite(),...collections};
}
