// Usage after starting the server: BASE_URL=http://localhost:3001 npm run smoke
const origin=(process.env.BASE_URL||'http://localhost:3001').replace(/\/$/,'');
const routes=['/api/health','/api/public'];
for(const route of routes){
  const res=await fetch(origin+route);
  if(!res.ok)throw new Error(`${route}: expected HTTP 200, got ${res.status}`);
  const value=await res.json();
  if(route.endsWith('/public') && (!value.site?.businessName||!Array.isArray(value.services)))throw new Error('Public endpoint missing site or service data.');
  console.log('PASS',route);
}
const auth=await fetch(origin+'/api/auth/me');
if(auth.status!==401)throw new Error(`Expected private admin route 401 without login; got ${auth.status}`);
console.log('PASS /api/auth/me denies anonymous access');
console.log('Smoke tests passed.');
