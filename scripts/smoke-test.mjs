// Start the backend first; then run BASE_URL=http://localhost:3001 npm run smoke.
const origin=(process.env.BASE_URL||'http://127.0.0.1:3001').replace(/\/$/,'');
for(const route of ['/api/health','/api/public']){
  const res=await fetch(origin+route);
  if(!res.ok)throw new Error(`${route}: expected HTTP 200, got ${res.status}`);
  const value=await res.json();
  if(route==='/api/public'){
    if(!value.site?.businessName||!Array.isArray(value.services))throw new Error('Public API missing site/services.');
    if(value.site.phone!=='4074566059')throw new Error('Default Orlando SMS number changed unexpectedly.');
  }
  console.log('PASS',route);
}
const anonymous=await fetch(origin+'/api/auth/me');
if(anonymous.status!==401)throw new Error(`Admin auth should reject anonymous access, got ${anonymous.status}`);
console.log('PASS anonymous admin access rejected');
const brandIcon=await fetch(origin+'/favicon.png');
if(!brandIcon.ok || !String(brandIcon.headers.get('content-type')).includes('image/png'))throw new Error('Brand favicon is unavailable.');
const ogPreview=await fetch(origin+'/social-preview.jpg');
if(!ogPreview.ok || !String(ogPreview.headers.get('content-type')).includes('image/jpeg'))throw new Error('Sharing preview is unavailable.');
console.log('PASS official brand favicon and social sharing preview');
if(process.env.RUN_INTEGRATION_TESTS==='1'){
  if(!process.env.ADMIN_PASSWORD)throw new Error('Integration tests require test-only admin credentials.');
  const fields=new FormData();
  for(const [k,v] of Object.entries({name:'Website Smoke Test',phone:'4075550102',zipcode:'32801',service:'Carpet Cleaning',details:'Integration test estimate submission.',preferred_contact:'sms'}))fields.append(k,v);
  const posted=await fetch(origin+'/api/quotes',{method:'POST',body:fields});
  if(posted.status!==201)throw new Error(`Could not submit estimate: ${posted.status} ${await posted.text()}`);
  const quote=await posted.json();
  if(!/^PC-\d+$/.test(quote.reference))throw new Error('Estimate response is missing its reference.');
  console.log('PASS quote submission',quote.reference);
  const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:process.env.ADMIN_USERNAME||'admin',password:process.env.ADMIN_PASSWORD})});
  if(!login.ok)throw new Error(`Test administrator could not sign in: ${login.status}`);
  const sess=await login.json();
  const cookie=login.headers.get('set-cookie')?.split(';')[0];
  if(!cookie||!sess.csrfToken)throw new Error('Admin login missing secure session or CSRF token.');
  const dashboard=await fetch(origin+'/api/admin/bootstrap',{headers:{cookie}});
  if(!dashboard.ok)throw new Error(`Authenticated admin could not load dashboard: ${dashboard.status}`);
  const data=await dashboard.json();
  const lead=data.leads?.find(x=>x.name==='Website Smoke Test');
  if(!lead||lead.preferred_contact!=='sms')throw new Error('Submitted SMS-first lead was not visible in admin.');
  const update=await fetch(origin+`/api/admin/leads/${lead.id}`,{method:'PUT',headers:{'content-type':'application/json',cookie,'x-csrf-token':sess.csrfToken},body:JSON.stringify({status:'Contacted',internal_notes:'Reviewed by integration test.',scheduled_for:''})});
  if(!update.ok)throw new Error(`Could not update lead: ${update.status}`);
  if(sess.username!==(process.env.ADMIN_USERNAME||'admin').toLowerCase())throw new Error('Login did not return a username.');
  if(!data.admin?.username)throw new Error('Admin bootstrap missing username.');
  console.log('PASS username/password login, private dashboard, SMS lead and status update');
  const demo=new FormData();const fakeMp4=new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109,0,0,0,0,0,0,0,0]);
  demo.append('video',new Blob([fakeMp4],{type:'video/mp4'}),'test.mp4');
  const uploaded=await fetch(origin+'/api/admin/upload-video',{method:'POST',headers:{cookie,'x-csrf-token':sess.csrfToken},body:demo});
  if(uploaded.status!==201)throw new Error(`Video upload failed: ${uploaded.status} ${await uploaded.text()}`);
  const media=await uploaded.json();
  if(!/^\/uploads\/[a-f0-9-]{36}\.mp4$/.test(media.url))throw new Error('Video upload path was not generated.');
  const served=await fetch(origin+media.url);
  if(!served.ok||!String(served.headers.get('content-type')).includes('video/mp4'))throw new Error('Video not served as MP4.');
  const created=await fetch(origin+'/api/admin/items/videos',{method:'POST',headers:{'content-type':'application/json',cookie,'x-csrf-token':sess.csrfToken},body:JSON.stringify({title:'CI Work Video',video:media.url})});
  if(created.status!==201)throw new Error('Could not create a video card in admin.');
  const publicVideos=await (await fetch(origin+'/api/public')).json();
  if(!publicVideos.videos.some(v=>v.title==='CI Work Video'))throw new Error('Uploaded video missing from public site.');
  const id=(await created.json()).id;
  await fetch(origin+`/api/admin/items/videos/${id}`,{method:'DELETE',headers:{cookie,'x-csrf-token':sess.csrfToken}});
  await fetch(origin+'/api/admin/uploads/'+media.url.split('/').at(-1),{method:'DELETE',headers:{cookie,'x-csrf-token':sess.csrfToken}});
  console.log('PASS secured video upload, streaming, and editable portfolio');
}
console.log('All smoke tests passed.');
