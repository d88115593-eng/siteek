import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, getSite, getItems, updateSite, publicData, itemTypes, publicUploadDir, privateUploadDir } from './db.js';
import { defaultSettings } from './seed.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const production = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || (production ? '' : 'only-for-local-development-not-production-12345');
if (production && sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters in production.');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: production ? { directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    scriptSrc: ["'self'", 'https://www.googletagmanager.com', 'https://connect.facebook.net'],
    connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://region1.google-analytics.com', 'https://www.facebook.com'],
    frameSrc: ["'none'"], objectSrc: ["'none'"], upgradeInsecureRequests: []
  }} : false
}));
app.use(express.json({ limit: '700kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(publicUploadDir, { maxAge: '1d', immutable: false }));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please try again later.' } });
const quoteLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many submissions. Try again later.' } });
const safeString = (v, limit=500) => String(v ?? '').trim().slice(0, limit);
const validColor = v => /^#[0-9a-fA-F]{6}$/.test(v);
const validMediaPath = v => !v || /^\/(?:assets|uploads)\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(v);
const validVideoPath = v => !v || /^\/(?:assets|uploads)\/[\w.-]+\.(?:mp4|webm)$/i.test(v);
const safeExternalUrl = v => !v || /^https:\/\/[^\s"'<>]+$/i.test(v);
const allowedSections = new Set(defaultSettings.sections.map(s=>s.id));
const allowedStatuses = ['New', 'Contacted', 'Quote Sent', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

function auth(req,res,next) {
  try {
    const token = req.cookies.prime_session;
    const payload = jwt.verify(token, sessionSecret, { algorithms: ['HS256'] });
    const admin = db.prepare('SELECT id,username,role FROM admins WHERE id=?').get(payload.sub);
    if (!admin) throw new Error('Invalid session');
    req.admin = { ...admin, csrf: payload.csrf };
    return next();
  } catch { return res.status(401).json({ error: 'Please sign in.' }); }
}
function owner(req,res,next) {if(req.admin.role!=='owner')return res.status(403).json({error:'Only the owner can manage team accounts.'});next();}
function csrf(req,res,next) {
  if (req.headers['x-csrf-token'] !== req.admin.csrf) return res.status(403).json({ error: 'Security token expired. Please refresh.' });
  return next();
}
function sendSession(res,user) {
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign({ sub: user.id, csrf: csrfToken }, sessionSecret, { algorithm: 'HS256', expiresIn: '7d' });
  res.cookie('prime_session', token, { httpOnly: true, secure: production, sameSite: 'strict', maxAge: 7*86400000, path: '/' });
  res.json({ username: user.username, role:user.role, csrfToken });
}

app.get('/api/health',(_req,res)=>res.json({ status:'ok' }));
app.get('/api/public',(_req,res)=>{ res.setHeader('Cache-Control','no-store'); res.json(publicData()); });

const getBrandImagePath=selected=>{
  const value=String(selected||'');
  if(!validMediaPath(value)||!value)return null;
  const local=value.startsWith('/uploads/')?path.join(publicUploadDir,path.basename(value)):path.join(root,'public',value.slice(1));
  return fs.existsSync(local)?local:null;
};
// Favicon is served as a real PNG, optimized for Google results, tabs and mobile browsers.
// Updates in the dashboard are reflected here without code changes.
app.get('/favicon.png',async(_req,res,next)=>{
  try {
    const brand=getSite();
    const file=getBrandImagePath(brand.favicon)||getBrandImagePath(brand.logo);
    if(!file)return res.status(404).end();
    const useCircularMask=(brand.favicon||brand.logo||'').endsWith('/prime-logo-original.jpg');
    const input=sharp(file).rotate().resize(96,96,{fit:'contain',background:'#ffffff'});
    const mask=Buffer.from('<svg width="96" height="96" xmlns="http://www.w3.org/2000/svg"><circle cx="48" cy="48" r="47.5" fill="white"/></svg>');
    const output=await (useCircularMask?input.ensureAlpha().composite([{input:mask,blend:'dest-in'}]):input).png().toBuffer();
    res.setHeader('Cache-Control','public, max-age=3600');res.type('image/png').send(output);
  }catch(error){next(error);}
});
// Sharing preview uses the original brand asset, not an invented stock photo.
app.get('/social-preview.jpg',async(_req,res,next)=>{
  try {
    const site=getSite();
    const file=getBrandImagePath(site.socialImage)||getBrandImagePath(site.logo);
    if(!file)return res.status(404).end();
    const brand=await sharp(file).rotate().resize(500,500,{fit:'contain',background:'#ffffff'}).jpeg({quality:88}).toBuffer();
    const image=await sharp({create:{width:1200,height:630,channels:3,background:'#f4f9fd'}})
      .composite([{input:brand,left:350,top:65}]).jpeg({quality:88}).toBuffer();
    res.setHeader('Cache-Control','public,max-age=3600');res.type('image/jpeg').send(image);
  }catch(error){next(error);}
});

app.post('/api/auth/login',loginLimiter,async(req,res)=>{
  const username=safeString(req.body?.username,32).toLowerCase();
  const password=String(req.body?.password??'').slice(0,512);
  const admin=/^[a-z0-9._-]{3,32}$/.test(username)?db.prepare('SELECT * FROM admins WHERE username=?').get(username):null;
  if(!admin || !(await bcrypt.compare(password,admin.password_hash)))return res.status(401).json({error:'Invalid username or password.'});
  sendSession(res,admin);
});
app.get('/api/auth/me',auth,(req,res)=>res.json({ username:req.admin.username,role:req.admin.role,csrfToken:req.admin.csrf }));
app.post('/api/auth/logout',auth,csrf,(_req,res)=>{res.clearCookie('prime_session',{path:'/'});res.json({ok:true});});

const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 7 * 1024 * 1024, files:3 },
  fileFilter: (_req,file,cb) => ['image/jpeg','image/png','image/webp'].includes(file.mimetype) ? cb(null,true) : cb(new Error('Please upload JPG, PNG or WebP images only.'))
});
async function saveImage(buffer,dest) {
  const filename = crypto.randomUUID()+'.webp';
  await sharp(buffer,{limitInputPixels:25000000}).rotate().resize({ width:2000, height:2000, fit:'inside', withoutEnlargement:true }).webp({ quality:85 }).toFile(path.join(dest,filename));
  return filename;
}
async function notifyNewLead(lead) {
  if (!process.env.SMTP_HOST || !process.env.NOTIFY_EMAIL || !process.env.FROM_EMAIL) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT||587),
    secure: process.env.SMTP_SECURE==='true', auth: process.env.SMTP_USER ? {user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD} : undefined
  });
  const html = ['New estimate request', 'Name: '+lead.name, 'Phone: '+lead.phone,
    'Email: '+lead.email, 'ZIP: '+lead.zipcode, 'Service: '+lead.service,
    'Contact preference: '+lead.preferred_contact, 'Details: '+lead.details].join('\n');
  await transporter.sendMail({ from:process.env.FROM_EMAIL, to:process.env.NOTIFY_EMAIL,
    subject:`Prime Carpet: New estimate #${lead.id}`, text:html });
}
app.post('/api/quotes',quoteLimiter,upload.array('photos',3),async(req,res,next)=>{
  try {
    if (safeString(req.body.website,10)) return res.json({ok:true}); // honeypot
    const lead = {
      name:safeString(req.body.name,120), phone:safeString(req.body.phone,60),
      email:safeString(req.body.email,180), zipcode:safeString(req.body.zipcode,20),
      address:safeString(req.body.address,240), service:safeString(req.body.service,120),
      details:safeString(req.body.details,4000),
      preferred_contact:['sms','whatsapp','phone','email'].includes(req.body.preferred_contact) ? req.body.preferred_contact : 'sms'
    };
    if (lead.name.length<2 || lead.phone.length<7 || lead.details.length<8) return res.status(400).json({error:'Please enter your name, phone and a short project description.'});
    if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return res.status(400).json({error:'Please enter a valid email address.'});
    const attachments=[];
    for (const f of (req.files||[])) attachments.push(await saveImage(f.buffer,privateUploadDir));
    const stmt=db.prepare(`INSERT INTO leads(name,phone,email,zipcode,address,service,details,preferred_contact,attachments) VALUES(@name,@phone,@email,@zipcode,@address,@service,@details,@preferred_contact,@attachments)`);
    const result=stmt.run({...lead,attachments:JSON.stringify(attachments)});
    const created={...lead,id:result.lastInsertRowid};
    notifyNewLead(created).catch(e=>console.error('[email] Notification failed:',e.message));
    res.status(201).json({ ok:true, reference:`PC-${String(result.lastInsertRowid).padStart(5,'0')}` });
  } catch(e) { next(e); }
});

app.get('/api/admin/bootstrap',auth,(req,res)=>{
  const leads=db.prepare('SELECT * FROM leads ORDER BY created_at DESC,id DESC LIMIT 500').all().map(l=>({...l,attachments:JSON.parse(l.attachments)}));
  res.setHeader('Cache-Control','no-store');
  res.json({...publicData(), ...Object.fromEntries(itemTypes.map(t=>[t,getItems(t,true)])),leads,admin:{username:req.admin.username,role:req.admin.role}});
});
app.put('/api/admin/settings',auth,csrf,(req,res)=>{
  if (!req.body || typeof req.body!=='object' || Array.isArray(req.body)) return res.status(400).json({error:'Invalid settings.'});
  const patch={};
  for (const [key,value] of Object.entries(req.body)) {
    if (!(key in defaultSettings)) continue;
    if (key==='sections') {
      if (!Array.isArray(value) || value.length!==allowedSections.size || new Set(value.map(x=>x.id)).size!==allowedSections.size || !value.every(x=>allowedSections.has(x.id))) continue;
      patch.sections=value.map(x=>({id:x.id,label:defaultSettings.sections.find(s=>s.id===x.id).label,enabled:!!x.enabled}));
    } else if (typeof defaultSettings[key]==='boolean') patch[key]=!!value;
    else if (typeof value === 'string') {
      if (['primaryColor','deepColor','accentColor','surfaceColor'].includes(key) && !validColor(value)) continue;
      if (['logo','heroPhoto','aboutPhoto','favicon','socialImage'].includes(key) && !validMediaPath(value)) continue;
      if (['instagram','facebook'].includes(key) && !safeExternalUrl(value)) continue;
      if (['analyticsId','metaPixelId'].includes(key) && !/^[\w-]{0,40}$/.test(value)) continue;
      patch[key]=safeString(value,key.toLowerCase().includes('text') || key.toLowerCase().includes('description') ? 2500 : 500);
    }
  }
  res.json({site:updateSite(patch)});
});
function validType(req,res,next) { if(!itemTypes.includes(req.params.type)) return res.status(404).json({error:'Unknown collection.'}); next(); }
function cleanItem(body) {
  if (!body || typeof body!=='object' || Array.isArray(body)) return null;
  const result={};
  for (const [k,v] of Object.entries(body)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k) || ['id','type','position','visible','created_at'].includes(k)) continue;
    if (typeof v==='string') {
      if (['image','before','after','poster'].includes(k) && !validMediaPath(v)) continue;
      if (k==='video' && !validVideoPath(v)) continue;
      result[k]=safeString(v,['description','answer'].includes(k)?2400:500);
    } else if (typeof v==='boolean') result[k]=v;
  }
  return result;
}
app.post('/api/admin/items/:type',auth,csrf,validType,(req,res)=>{
  const body=cleanItem(req.body);
  if (!body) return res.status(400).json({error:'Invalid item.'});
  const position=db.prepare('SELECT COALESCE(MAX(position),-1)+1 AS p FROM content_items WHERE type=?').get(req.params.type).p;
  const result=db.prepare('INSERT INTO content_items(type,data,position) VALUES(?,?,?)').run(req.params.type,JSON.stringify(body),position);
  res.status(201).json({id:result.lastInsertRowid});
});
app.put('/api/admin/items/:type/:id',auth,csrf,validType,(req,res)=>{
  const id=Number(req.params.id);
  const existing=db.prepare('SELECT * FROM content_items WHERE id=? AND type=?').get(id,req.params.type);
  if(!existing) return res.status(404).json({error:'Item not found.'});
  const clean=cleanItem(req.body);
  if(!clean) return res.status(400).json({error:'Invalid item.'});
  const newData={...JSON.parse(existing.data),...clean};
  const visible=typeof req.body.visible==='boolean'?Number(req.body.visible):existing.visible;
  const position=Number.isSafeInteger(req.body.position)&&req.body.position>=0?req.body.position:existing.position;
  db.prepare('UPDATE content_items SET data=?,visible=?,position=? WHERE id=?').run(JSON.stringify(newData),visible,position,id);
  res.json({ok:true});
});
app.delete('/api/admin/items/:type/:id',auth,csrf,validType,(req,res)=>{
  db.prepare('DELETE FROM content_items WHERE type=? AND id=?').run(req.params.type,Number(req.params.id));
  res.json({ok:true});
});
app.put('/api/admin/items/:type/reorder',auth,csrf,validType,(req,res)=>{
  // intentionally not used; update each item's position via PUT above
  res.status(405).json({error:'Use item position update.'});
});
app.post('/api/admin/upload',auth,csrf,upload.single('image'),async(req,res,next)=>{
  try { if(!req.file) return res.status(400).json({error:'Please select a JPG, PNG or WebP image (max 7 MB).'});
    const filename=await saveImage(req.file.buffer,publicUploadDir);
    return res.json({url:`/uploads/${filename}`});
  } catch(e){next(e);}
});
// Video uploads are opt-in and never used for private customer attachments.
const videoUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:40*1024*1024,files:1},
  fileFilter:(_req,file,cb)=>['video/mp4','video/webm'].includes(file.mimetype)?cb(null,true):cb(new Error('Only MP4 or WebM videos are accepted.'))});
app.post('/api/admin/upload-video',auth,csrf,videoUpload.single('video'),(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Please select a video.'});
  const buf=req.file.buffer;
  const mp4=req.file.mimetype==='video/mp4' && buf.length>12 && buf.toString('ascii',4,8)==='ftyp';
  const webm=req.file.mimetype==='video/webm' && buf.length>4 && buf.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
  if(!mp4&&!webm)return res.status(400).json({error:'Invalid video file format.'});
  const filename=crypto.randomUUID()+(mp4?'.mp4':'.webm');
  fs.writeFileSync(path.join(publicUploadDir,filename),buf,{flag:'wx'});
  res.status(201).json({url:'/uploads/'+filename});
});
app.delete('/api/admin/uploads/:filename',auth,csrf,(req,res)=>{
  const filename=req.params.filename;
  if (!/^[a-f0-9-]{36}\.(?:webp|mp4|webm)$/.test(filename)) return res.status(400).json({error:'Invalid file.'});
  const content=[getSite(),...itemTypes.flatMap(type=>getItems(type,true))];
  if(content.some(row=>JSON.stringify(row).includes('/uploads/'+filename)))return res.status(409).json({error:'Remove this image from the website content before deleting it.'});
  fs.rmSync(path.join(publicUploadDir,filename),{force:true});res.json({ok:true});
});
app.get('/api/admin/attachments/:filename',auth,(req,res)=>{
  if(!/^[a-f0-9-]{36}\.webp$/.test(req.params.filename)) return res.status(400).end();
  res.setHeader('Cache-Control','private, no-store');
  res.sendFile(path.join(privateUploadDir,req.params.filename));
});
app.put('/api/admin/leads/:id',auth,csrf,(req,res)=>{
  const id=Number(req.params.id);
  const existing=db.prepare('SELECT id FROM leads WHERE id=?').get(id);
  if(!existing) return res.status(404).json({error:'Request not found.'});
  const status=allowedStatuses.includes(req.body.status)?req.body.status:null;
  if(!status) return res.status(400).json({error:'Invalid status.'});
  db.prepare('UPDATE leads SET status=?,internal_notes=?,scheduled_for=? WHERE id=?').run(status,safeString(req.body.internal_notes,5000),safeString(req.body.scheduled_for,40),id);
  res.json({ok:true});
});
app.delete('/api/admin/leads/:id',auth,csrf,(req,res)=>{
  const lead=db.prepare('SELECT attachments FROM leads WHERE id=?').get(Number(req.params.id));
  if(lead) {
    db.prepare('DELETE FROM leads WHERE id=?').run(Number(req.params.id));
    for(const f of JSON.parse(lead.attachments)) if(/^[a-f0-9-]{36}\.webp$/.test(f)) fs.rmSync(path.join(privateUploadDir,f),{force:true});
  }
  res.json({ok:true});
});
app.get('/api/admin/team',auth,owner,(_req,res)=>{
  res.json(db.prepare('SELECT id,username,role,created_at FROM admins ORDER BY id').all());
});
app.post('/api/admin/team',auth,owner,csrf,async(req,res)=>{
  const username=safeString(req.body.username,32).toLowerCase();
  const password=String(req.body.password||'');
  const role=['owner','editor'].includes(req.body.role)?req.body.role:'editor';
  if(!/^[a-z0-9._-]{3,32}$/.test(username)||password.length<12)return res.status(400).json({error:'Use a username (3–32 letters, digits, dots, dashes or underscores) and a password of at least 12 characters.'});
  try{
    const hash=await bcrypt.hash(password,12);
    db.prepare('INSERT INTO admins(username,password_hash,role) VALUES(?,?,?)').run(username,hash,role);
    res.status(201).json({ok:true});
  }catch{return res.status(400).json({error:'Username is already in use.'});}
});
app.delete('/api/admin/team/:id',auth,owner,csrf,(req,res)=>{
  const id=Number(req.params.id);
  if(id===req.admin.id) return res.status(400).json({error:'You cannot remove your own account.'});
  const result=db.prepare('DELETE FROM admins WHERE id=?').run(id);
  res.json({ok:true,removed:result.changes});
});
app.get('/api/admin/media',auth,(_req,res)=>{
  const content=[getSite(),...itemTypes.flatMap(type=>getItems(type,true))];
  const used=(filename)=>content.some(row=>JSON.stringify(row).includes('/uploads/'+filename));
  const files=fs.readdirSync(publicUploadDir).filter(f=>/^[a-f0-9-]{36}\.(?:webp|mp4|webm)$/.test(f))
    .map(filename=>{const stat=fs.statSync(path.join(publicUploadDir,filename));return { filename,url:'/uploads/'+filename,bytes:stat.size,createdAt:stat.birthtime.toISOString(),inUse:used(filename),isVideo:/\.(?:mp4|webm)$/.test(filename) };})
    .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  res.json(files);
});
app.get('/api/admin/backup.json',auth,(_req,res)=>{
  const leads=db.prepare('SELECT * FROM leads ORDER BY id').all().map(l=>({...l,attachments:JSON.parse(l.attachments)}));
  const items=Object.fromEntries(itemTypes.map(type=>[type,getItems(type,true)]));
  const backup={format:'prime-carpet-backup-v1',exportedAt:new Date().toISOString(),site:getSite(),items,leads};
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Content-Disposition','attachment; filename="prime-content-backup.json"');
  res.json(backup);
});
app.get('/api/admin/leads.csv',auth,(_req,res)=>{
  const rows=db.prepare('SELECT id,created_at,name,phone,email,zipcode,address,service,details,preferred_contact,status,internal_notes,scheduled_for FROM leads ORDER BY id DESC').all();
  const fields=['id','created_at','name','phone','email','zipcode','address','service','details','preferred_contact','status','internal_notes','scheduled_for'];
  const cell=v=>{const s=String(v??'');const cleaned=/^[=+@\-\t\r]/.test(s)?"'"+s:s;return '"'+cleaned.replaceAll('"','""')+'"';};
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="prime-leads.csv"');
  res.send('\uFEFF'+[fields.join(','),...rows.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n'));
});
app.put('/api/admin/account',auth,csrf,async(req,res)=>{
  const admin=db.prepare('SELECT * FROM admins WHERE id=?').get(req.admin.id);
  if(!(await bcrypt.compare(String(req.body.currentPassword??'').slice(0,512),admin.password_hash))) return res.status(400).json({error:'Current password is incorrect.'});
  const newPassword=String(req.body.newPassword??'').slice(0,512);
  const newUsername=safeString(req.body.username,32).toLowerCase();
  if(newPassword && newPassword.length<12) return res.status(400).json({error:'New password needs 12 or more characters.'});
  if(!/^[a-z0-9._-]{3,32}$/.test(newUsername)) return res.status(400).json({error:'Username must contain 3–32 letters, numbers, dots, dashes or underscores.'});
  try {
    db.prepare('UPDATE admins SET username=?,password_hash=? WHERE id=?').run(newUsername,newPassword?await bcrypt.hash(newPassword,12):admin.password_hash,admin.id);
  } catch { return res.status(400).json({error:'Username already in use.'}); }
  sendSession(res,{id:admin.id,username:newUsername,role:admin.role});
});

app.get('/robots.txt',(_req,res)=>res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n'));
app.get('/sitemap.xml',(_req,res)=>{
  const origin=(process.env.SITE_URL||'https://example.com').replace(/\/$/,'');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin.replaceAll('&','&amp;')}</loc></url></urlset>`);
});
app.use('/api', (_req,res)=>res.status(404).json({error:'API endpoint not found.'}));
if (fs.existsSync(path.join(root,'dist','index.html'))) {
  const indexTemplate=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');
  const htmlEscape=v=>String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  app.use(express.static(path.join(root,'dist'),{maxAge:'1h',index:false}));
  app.get('*',(req,res)=>{
    const s=getSite();
    const title=htmlEscape(s.seoTitle||s.businessName);
    const desc=htmlEscape(s.seoDescription||'Professional cleaning in Orlando, Florida.');
    const origin=(process.env.SITE_URL||'').replace(/\/$/,'');
    const jsonld={ '@context':'https://schema.org','@type':'LocalBusiness',name:s.businessName,
      description:s.seoDescription,areaServed:s.serviceRegion,url:origin||undefined,
      image:origin&&s.logo?origin+s.logo:undefined,
      telephone:s.phone?'+1'+String(s.phone).replace(/\D/g,'').replace(/^1/,''):undefined,
      sameAs:[s.instagram,s.facebook].filter(Boolean)
    };
    const ld=JSON.stringify(jsonld).replace(/</g,'\\u003c');
    const base=origin||('https://'+req.get('host'));
    const preview=htmlEscape(base+'/social-preview.jpg');
    const tags=`<meta property="og:type" content="website"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${desc}"/><meta property="og:image" content="${preview}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:image" content="${preview}"/>${origin?`<link rel="canonical" href="${htmlEscape(origin)}"/>`:''}<script type="application/ld+json">${ld}</script>`;
    res.setHeader('Cache-Control','no-store');
    res.type('html').send(indexTemplate
      .replace(/<title>[^<]*<\/title>/,`<title>${title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*("\s*\/>)/,`$1${desc}$2`)
      .replace('</head>',`${tags}</head>`));
  });
} else {
  app.get('/',(_req,res)=>res.redirect('http://localhost:5173'));
}
app.use((err,_req,res,_next)=>{
  console.error('[server]',err.message);
  if(err instanceof multer.MulterError) return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?(_req.path==='/api/admin/upload-video'?'Video must be smaller than 40 MB.':'Image must be smaller than 7 MB.'):'Too many or invalid files.'});
  if(err?.message==='Only MP4 or WebM videos are accepted.') return res.status(400).json({error:err.message});
  if(err?.message==='Please upload JPG, PNG or WebP images only.') return res.status(400).json({error:err.message});
  if(err?.name==='Error' && /unsupported image|Input buffer contains unsupported/i.test(err.message)) return res.status(400).json({error:'Unsupported image file.'});
  res.status(500).json({error:'Something went wrong. Please try again.'});
});
const port=Number(process.env.PORT||3001);
app.listen(port,()=>console.info(`[prime] Web server listening on ${port}`));
