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
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

if (!db.pragma('table_info(admins)').some(c=>c.name==='role')) db.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'owner'");

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
const numAdmins = db.prepare('SELECT COUNT(*) count FROM admins').get().count;
if (!numAdmins && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12) {
  db.prepare('INSERT INTO admins(email,password_hash) VALUES(?,?)').run(process.env.ADMIN_EMAIL.trim().toLowerCase(), bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12));
  console.info('[setup] Initial administrator created. Change the password in the dashboard after login.');
} else if (!numAdmins) {
  console.warn('[setup] Admin unavailable: set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) before starting.');
}

export function getSite() {
  const raw = db.prepare('SELECT data FROM settings WHERE key=?').get('site');
  return raw ? JSON.parse(raw.data) : defaultSettings;
}
export function updateSite(patch) {
  const current = getSite();
  const result = { ...current, ...patch };
  db.prepare('UPDATE settings SET data=? WHERE key=?').run(JSON.stringify(result), 'site');
  return result;
}
export const itemTypes = ['services','gallery','faq','areas','reviews','offers'];
export function getItems(type, includeHidden = false) {
  if (!itemTypes.includes(type)) return [];
  const rows = db.prepare(`SELECT * FROM content_items WHERE type=? ${includeHidden ? '' : 'AND visible=1'} ORDER BY position,id`).all(type);
  return rows.map(({ data, visible, ...row })=>({ ...row, ...JSON.parse(data), visible: Boolean(visible) }));
}
export function publicData() {
  return { site: getSite(), ...Object.fromEntries(itemTypes.map(t=>[t,getItems(t)])) };
}
