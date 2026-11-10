/**
 * Configure or reset the primary owner via the SERVER'S PRIVATE environment.
 *
 * ADMIN_USERNAME=eike
 * ADMIN_PASSWORD=(set privately on hosting, never in Git)
 *
 * This is an operator-only CLI command, not a public reset endpoint.
 * It preserves all site content, estimate requests and team accounts.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../server/db.js';

const username=String(process.env.ADMIN_USERNAME||'eike').trim().toLowerCase();
const password=String(process.env.ADMIN_PASSWORD||'');
if(!/^[a-z0-9._-]{3,32}$/.test(username)){
  console.error('Invalid username. Use 3–32 lowercase letters, numbers, dots, dashes or underscores.');
  process.exit(1);
}
if(password.length<12||password.length>512){
  console.error('Set ADMIN_PASSWORD to a strong 12–512 character secret in the private server environment.');
  process.exit(1);
}
const owner=db.prepare("SELECT id,username FROM admins WHERE role='owner' ORDER BY id LIMIT 1").get();
const other=db.prepare('SELECT id FROM admins WHERE username=?').get(username);
if(owner && other && owner.id!==other.id){
  console.error('Username is already assigned to a different account. Choose another name or resolve this manually.');
  process.exit(1);
}
const hash=await bcrypt.hash(password,12);
if(owner){
  db.prepare('UPDATE admins SET username=?,password_hash=? WHERE id=?').run(username,hash,owner.id);
}else{
  db.prepare("INSERT INTO admins(username,password_hash,role) VALUES(?,?,'owner')").run(username,hash);
}
console.log('Owner account configured with username: '+username);
console.log('Password stored as a bcrypt hash; plaintext password was not saved or printed.');
console.log('All previous sessions remain valid until expiry unless SESSION_SECRET is rotated.');
db.close();
