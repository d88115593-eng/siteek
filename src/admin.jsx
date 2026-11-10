import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BadgeCheck, Bell, CalendarDays, Check, ChevronDown, CircleHelp, ClipboardList, Clock3, Download, ExternalLink, Eye, EyeOff, FileText, Gift, Globe2, ImagePlus, Images, LayoutDashboard, LockKeyhole, LogOut, Mail, MapPin, Menu, MessageCircle, MoreHorizontal, Palette, Pencil, Phone, Plus, Save, Search, Settings2, ShieldCheck, Smartphone, Sparkles, Star, Trash2, UploadCloud, Users, WandSparkles, X } from 'lucide-react';

const panels = [
  {id:'dashboard',title:'Dashboard',icon:LayoutDashboard},
  {id:'leads',title:'Estimate Requests',icon:ClipboardList},
  {id:'schedule',title:'Appointments',icon:CalendarDays},
  {id:'branding',title:'Website & Branding',icon:Palette},
  {id:'sections',title:'Page Builder',icon:WandSparkles},
  {id:'services',title:'Services',icon:Sparkles},
  {id:'gallery',title:'Before & After',icon:Images},
  {id:'reviews',title:'Customer Reviews',icon:Star},
  {id:'faq',title:'FAQs',icon:CircleHelp},
  {id:'areas',title:'Service Areas',icon:MapPin},
  {id:'offers',title:'Offers & Specials',icon:Gift},
  {id:'settings',title:'Contact & SEO',icon:Settings2},
  {id:'account',title:'Account & Security',icon:ShieldCheck},
  {id:'team',title:'Team Access',icon:Users},
  {id:'media',title:'Media Library',icon:Images}
];
const collectionFields = {
  services:[['title','Service name','text'],['description','Description','textarea'],['priceText','Price label (optional)','text'],['icon','Icon','icon'],['image','Service photo','image'],['featured','Featured service','boolean']],
  gallery:[['title','Project title','text'],['tag','Service category','text'],['description','Caption','textarea'],['before','Before photo','image'],['after','After photo','image']],
  reviews:[['name','Customer name','text'],['location','City / location','text'],['quote','Review text (only with permission)','textarea'],['rating','Star rating','rating']],
  faq:[['question','Question','text'],['answer','Answer','textarea']],
  areas:[['title','Area / city','text'],['description','Details','textarea']],
  offers:[['title','Offer title','text'],['description','Offer terms and conditions','textarea'],['validFrom','Starts on (optional)','date'],['validUntil','Ends on (optional)','date']]
};
const settingsPanels={
  'Identity & first impression':[
    ['businessName','Business name','text'],['brandTitle','Brand first word','text'],['brandAccent','Brand accent word','text'],['brandLine','Brand subline','text'],['tagline','Tagline','text'],
    ['eyebrow','Hero eyebrow','text'],['heroTitle','Main headline','text'],['heroSubtitle','Hero description','textarea'],['heroHighlight','Floating photo message','text'],
    ['quoteButton','Estimate button text','text'],['smsButton','Text button label','text'],['whatsappButton','WhatsApp button label','text'],
    ['responseLabel','Response time message','text'],['responseNote','Response disclaimer','textarea'],
    ['logo','Original logo','image'],['heroPhoto','Hero image','image'],['aboutPhoto','About image','image']
  ],
  'Content & section headlines':[
    ['servicesTitle','Services heading','text'],['servicesSubtitle','Services introduction','textarea'],
    ['galleryTitle','Gallery heading','text'],['gallerySubtitle','Gallery introduction','textarea'],
    ['aboutTitle','About heading','text'],['aboutText','About description','textarea'],
    ['extraTitle','Other services heading','text'],['extraText','Other services description','textarea'],
    ['contactTitle','Contact heading','text'],['contactText','Contact introduction','textarea'],
    ['contactFormHeading','Quote form heading','text'],['contactFormSubtitle','Quote form subtitle','text'],
    ['reviewsTitle','Reviews heading','text'],['reviewsSubtitle','Reviews subtitle','textarea'],
    ['faqTitle','FAQ heading','text'],['faqSubtitle','FAQ introduction','textarea'],
    ['galleryInstruction','Gallery instruction','text'],
    ['footerHeading','Footer heading','text'],['footerButton','Footer button','text']
  ],
  'Navigation & trust messages':[
    ['navServices','Navigation: Services','text'],['navWork','Navigation: Our Work','text'],['navAbout','Navigation: About Us','text'],['navFaq','Navigation: FAQ','text'],['navContact','Navigation: Contact','text'],
    ['heroTrustOne','Hero benefit one','text'],['heroTrustTwo','Hero benefit two','text'],['heroTrustThree','Hero benefit three','text'],
    ['trustOneTitle','Trust item 1 heading','text'],['trustOneSubtitle','Trust item 1 caption','text'],
    ['trustTwoTitle','Trust item 2 heading','text'],['trustTwoSubtitle','Trust item 2 caption','text'],
    ['trustThreeTitle','Trust item 3 heading','text'],['trustThreeSubtitle','Trust item 3 caption','text']
  ],
  'Colors':[
    ['primaryColor','Primary blue','color'],['deepColor','Deep navy','color'],['accentColor','Sky blue','color'],['surfaceColor','Light background','color']
  ],
  'Site announcement':[
    ['showAnnouncement','Show announcement bar','boolean'],['announcement','Announcement message','text']
  ]
};
const configPanels={
  'How customers reach you':[['phone','SMS / US phone number','text'],['whatsapp','WhatsApp number (leave empty to hide)','text'],['email','Public email address','text'],['instagram','Instagram profile URL','text'],['facebook','Facebook profile URL','text'],['city','City','text'],['serviceRegion','Service region','text'],['streetAddress','Street address (optional)','text'],['businessHours','Business hours / availability','text']],
  'Search engines & marketing':[['seoTitle','Google page title','text'],['seoDescription','Search description','textarea'],['analyticsId','Google Analytics measurement ID','text'],['metaPixelId','Meta Pixel ID','text']],
  'Legal pages':[['privacyText','Privacy policy (review before publishing)','textarea'],['termsText','Terms of service (review before publishing)','textarea']]
};
const leadStatuses=['New','Contacted','Quote Sent','Scheduled','In Progress','Completed','Cancelled'];
const emptyObject={};
async function request(url,{method='GET',body,csrf='',multipart=false}={}){
  const headers={};if(csrf)headers['x-csrf-token']=csrf;if(body&&!multipart)headers['Content-Type']='application/json';
  const r=await fetch(url,{method,credentials:'same-origin',headers,body:multipart?body:(body?JSON.stringify(body):undefined)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||`Request failed (${r.status})`);
  return data;
}
function MediaUpload({value,onChange,csrf,compact=false}){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function select(e) {
    const f=e.target.files?.[0];if(!f)return;setBusy(true);setError('');
    const body=new FormData();body.append('image',f);
    try{const result=await request('/api/admin/upload',{method:'POST',body,multipart:true,csrf});onChange(result.url);}catch(err){setError(err.message);}finally{setBusy(false);e.target.value='';}
  }
  return <div className={`media-uploader ${compact?'compact':''}`}>
    {value&&<div className="media-preview"><img src={value} alt="Currently selected"/><button title="Remove image selection" type="button" onClick={()=>onChange('')}><X size={14}/></button></div>}
    <label className="media-pick"><UploadCloud size={18}/>{busy?'Uploading…':'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={select}/></label>
    <input className="media-path" placeholder="Or use /assets/… or /uploads/…" value={value||''} onChange={e=>onChange(e.target.value)} />
    {error&&<small className="admin-error">{error}</small>}
  </div>;
}
function InputField({spec,value,onChange,csrf}) {
  const [key,label,type]=spec;
  return <label className={`admin-input-group ${type==='textarea'?'full':''}`}><span>{label}</span>
    {type==='textarea'?<textarea rows={key==='privacyText'||key==='termsText'?8:4} value={value||''} onChange={e=>onChange(e.target.value)}/>
      :type==='date'?<input type="date" value={value||''} onChange={e=>onChange(e.target.value)}/>
      :type==='boolean'?<span className="toggle-row"><input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked)}/> <span>{value?'Enabled':'Disabled'}</span></span>
      :type==='image'?<MediaUpload value={value} onChange={onChange} csrf={csrf}/>
      :type==='color'?<span className="color-control"><input type="color" value={value||'#0767c8'} onChange={e=>onChange(e.target.value)}/><input value={value||''} onChange={e=>onChange(e.target.value)}/></span>
      :type==='icon'?<select value={value||'sparkles'} onChange={e=>onChange(e.target.value)}>{['sparkles','sofa','armchair','bed-double','layers','car','house','spray','waves'].map(x=><option value={x} key={x}>{x}</option>)}</select>
      :type==='rating'?<select value={value||5} onChange={e=>onChange(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n===1?'':'s'}</option>)}</select>
      :<input value={value??''} onChange={e=>onChange(e.target.value)}/>}
  </label>;
}
function Login({onLogin}) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{onLogin(await request('/api/auth/login',{method:'POST',body:{email,password}}));}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="login-page"><div className="login-decoration one"/><div className="login-decoration two"/><div className="login-card"><div className="login-icon"><img src="/assets/prime-logo-original.jpg" alt="Prime Carpet & Home Care logo"/></div><span className="admin-eyebrow">PRIME CARPET & HOME CARE</span><h1>Welcome back.</h1><p>Sign in to manage your website and customer requests.</p><form onSubmit={submit}><label>Email address<input autoComplete="username" type="email" required value={email} placeholder="admin@yourcompany.com" onChange={e=>setEmail(e.target.value)}/></label><label>Password<input autoComplete="current-password" type="password" required value={password} placeholder="Enter your password" onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="admin-error" role="alert">{error}</div>}<button disabled={busy} className="admin-main-btn" type="submit">{busy?'Signing in…':'Sign in to dashboard'} <ArrowRight size={18}/></button></form><a href="/" className="back-site"><ArrowLeft size={15}/> Back to website</a></div></div>;
}
function Dashboard({data,setPage}) {
  const requests=data.leads||[];const newest=requests.slice(0,6);const count=s=>requests.filter(x=>x.status===s).length;
  const cards=[{label:'Recent requests',value:requests.length,icon:ClipboardList},{label:'New inquiries',value:count('New'),icon:Bell},{label:'Scheduled',value:count('Scheduled'),icon:CalendarDays},{label:'Completed',value:count('Completed'),icon:Check}];
  return <div><div className="dashboard-welcome"><div><span className="admin-eyebrow">YOUR BUSINESS AT A GLANCE</span><h2>Good to see you! <span>👋</span></h2><p>Everything you need to manage Prime Carpet & Home Care in one place.</p></div><div className="dashboard-links"><a href="/api/admin/backup.json" className="outline-link" download><Download size={17}/> Export JSON</a><a href="/" target="_blank" className="outline-link"><ExternalLink size={17}/> View website</a></div></div><div className="metric-grid">{cards.map(x=>{const Icon=x.icon;return <div className="metric-card" key={x.label}><span className="metric-icon"><Icon size={22}/></span><strong>{x.value}</strong><p>{x.label}</p></div>})}</div><div className="dashboard-columns"><div className="admin-panel"><div className="panel-title-row"><div><h3>Latest inquiries</h3><p>Review new estimate requests and follow up quickly.</p></div><button className="link-button" onClick={()=>setPage('leads')}>View all <ArrowRight size={16}/></button></div>{newest.length?newest.map(l=><div className="recent-lead" key={l.id}><div className="avatar-circle">{l.name?.[0]?.toUpperCase()||'?'}</div><div><strong>{l.name}</strong><span>{l.service||'General request'} · {l.created_at?.split(' ')[0]}</span></div><span className={'status-pill '+l.status.replaceAll(' ','-').toLowerCase()}>{l.status}</span></div>):<div className="blank-slate"><ClipboardList size={28}/><h4>No estimate requests yet</h4><p>When customers submit the form, they will appear here.</p></div>}</div><div className="admin-panel quick-panel"><h3>Quick actions</h3><p>Make the most common updates in seconds.</p><button onClick={()=>setPage('branding')}><Palette size={20}/><span><strong>Update homepage</strong><small>Headlines, photos and colors</small></span><ArrowRight size={17}/></button><button onClick={()=>setPage('services')}><Sparkles size={20}/><span><strong>Manage services</strong><small>Add a service or adjust copy</small></span><ArrowRight size={17}/></button><button onClick={()=>setPage('gallery')}><Images size={20}/><span><strong>Add before / after</strong><small>Showcase another finished job</small></span><ArrowRight size={17}/></button><button onClick={()=>setPage('settings')}><MessageCircle size={20}/><span><strong>Update contact details</strong><small>SMS, WhatsApp and social links</small></span><ArrowRight size={17}/></button></div></div><div className="dashboard-help"><ShieldCheck size={22}/><div><strong>Everything is editable.</strong><span>Make changes here, save, and see them live on the public website. Your customer request photos are accessible only to signed-in admins.</span></div></div></div>;
}
function SettingsEditor({data,setData,csrf,mode}) {
  const [draft,setDraft]=useState({...data.site});const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>setDraft({...data.site}),[data.site,mode]);
  const groups=mode==='branding'?settingsPanels:configPanels;
  async function save(e) {e.preventDefault();setBusy(true);setMessage('');try{const result=await request('/api/admin/settings',{method:'PUT',body:draft,csrf});setData(d=>({...d,site:result.site}));setMessage('Changes saved and published successfully.');}catch(e){setMessage('Error: '+e.message);}finally{setBusy(false);}}
  return <form className="settings-editor" onSubmit={save}><div className="edit-header"><div><h2>{mode==='branding'?'Website & Branding':'Contact, SEO & Legal'}</h2><p>{mode==='branding'?'Edit every headline, image and color on your website.':'Manage contact channels, search visibility, analytics and legal information.'}</p></div><button type="submit" disabled={busy} className="admin-main-btn"><Save size={17}/>{busy?'Saving…':'Save & Publish'}</button></div>{message&&<div className={message.startsWith('Error')?'admin-error':'admin-success'}>{message}</div>}{Object.entries(groups).map(([label,fields])=><div key={label} className="admin-panel edit-group"><div className="panel-title-row"><h3>{label}</h3>{label==='Colors'&&<span className="muted-text">Match your original blue, silver and white identity</span>}</div><div className="fields-grid">{fields.map(spec=><InputField key={spec[0]} spec={spec} value={draft[spec[0]]} onChange={v=>setDraft(o=>({...o,[spec[0]]:v}))} csrf={csrf}/>)}</div></div>)}<div className="save-bar"><span>Unsaved changes are not visible to website visitors.</span><button type="submit" disabled={busy} className="admin-main-btn"><Save size={17}/>{busy?'Saving…':'Save & Publish'}</button></div></form>;
}
function SectionBuilder({data,setData,csrf}) {
  const [sections,setSections]=useState(data.site.sections||[]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>setSections(data.site.sections||[]),[data.site.sections]);
  function move(i,shift){const newIndex=i+shift;if(newIndex<0||newIndex>=sections.length)return;const copy=[...sections];[copy[i],copy[newIndex]]=[copy[newIndex],copy[i]];setSections(copy);}
  async function save(){setBusy(true);setMessage('');try{const result=await request('/api/admin/settings',{method:'PUT',body:{sections},csrf});setData(d=>({...d,site:result.site}));setMessage('Page layout published.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  return <div><div className="edit-header"><div><h2>Page Builder</h2><p>Change the order of page sections or hide them completely. Edit the text under Website & Branding.</p></div><button className="admin-main-btn" onClick={save} disabled={busy}><Save size={17}/>{busy?'Saving…':'Publish Layout'}</button></div>{message&&<div className={message.includes('published')?'admin-success':'admin-error'}>{message}</div>}<div className="admin-panel sections-builder">{sections.map((section,i)=><div key={section.id} className="section-item"><div className="section-grip"><MoreHorizontal size={19}/></div><div className="section-number">{String(i+1).padStart(2,'0')}</div><div className="section-info"><strong>{section.label}</strong><span>#{section.id} on the public website</span></div><button className={`visibility ${section.enabled?'enabled':''}`} title={section.enabled?'Hide section':'Show section'} onClick={()=>setSections(a=>a.map((x,j)=>i===j?{...x,enabled:!x.enabled}:x))}>{section.enabled?<Eye size={18}/>:<EyeOff size={18}/>} <span>{section.enabled?'Visible':'Hidden'}</span></button><div className="reorder"><button disabled={i===0} onClick={()=>move(i,-1)} title="Move up"><ArrowUp size={17}/></button><button disabled={i===sections.length-1} onClick={()=>move(i,1)} title="Move down"><ArrowDown size={17}/></button></div></div>)}</div><div className="admin-helper"><CircleHelp size={18}/><p>Example: move Before & After above Services for a photo-first landing page, or hide FAQs until you are ready.</p></div></div>;
}
function CollectionEditor({data,setData,csrf,type}) {
  const [edit,setEdit]=useState(null);const [draft,setDraft]=useState({});const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const items=data[type]||[];const title=panels.find(p=>p.id===type)?.title||type;
  useEffect(()=>{setEdit(null);setMessage('');},[type]);
  function start(item=null){setEdit(item?.id||'new');setDraft(item?{...item}:Object.fromEntries((collectionFields[type]||[]).map(([key,,input])=>[key,input==='boolean'?false:input==='rating'?5:''])));setMessage('');}
  async function persist(e){e.preventDefault();setBusy(true);setMessage('');try{const body={...draft};delete body.id;delete body.created_at;delete body.type;
    if(edit==='new')await request(`/api/admin/items/${type}`,{method:'POST',body,csrf});else await request(`/api/admin/items/${type}/${edit}`,{method:'PUT',body,csrf});
    const refreshed=await request('/api/admin/bootstrap');setData(refreshed);setEdit(null);setMessage('Content saved and published.');
  }catch(e){setMessage('Error: '+e.message);}finally{setBusy(false);}}
  async function remove(item){if(!window.confirm(`Delete “${item.title||item.name||item.question}”? This cannot be undone.`))return;try{await request(`/api/admin/items/${type}/${item.id}`,{method:'DELETE',csrf});setData(await request('/api/admin/bootstrap'));setMessage('Item deleted.');}catch(e){setMessage('Error: '+e.message);}}
  async function update(item,patch){try{await request(`/api/admin/items/${type}/${item.id}`,{method:'PUT',body:{...item,...patch},csrf});setData(await request('/api/admin/bootstrap'));}catch(e){setMessage('Error: '+e.message);}}
  async function move(item,shift){const visibleSorted=[...items].sort((a,b)=>a.position-b.position);const index=visibleSorted.findIndex(x=>x.id===item.id),other=visibleSorted[index+shift];if(!other)return;try{await request(`/api/admin/items/${type}/${item.id}`,{method:'PUT',body:{...item,position:other.position},csrf});await request(`/api/admin/items/${type}/${other.id}`,{method:'PUT',body:{...other,position:item.position},csrf});setData(await request('/api/admin/bootstrap'));}catch(e){setMessage('Error: '+e.message);}}
  return <div><div className="edit-header"><div><h2>{title}</h2><p>{type==='reviews'?'Only publish genuine reviews with customer permission.':`Manage ${title.toLowerCase()} on the public website. Everything updates when you save.`}</p></div><button className="admin-main-btn" onClick={()=>start()}><Plus size={17}/>Add {type==='faq'?'Question':type==='gallery'?'Project':type==='offers'?'Offer':'New'}</button></div>{message&&<div className={message.startsWith('Error')?'admin-error':'admin-success'}>{message}</div>}{edit!==null&&<div className="admin-panel collection-form"><div className="panel-title-row"><h3>{edit==='new'?'Add new content':'Edit content'}</h3><button className="icon-button" onClick={()=>setEdit(null)} aria-label="Close editor"><X size={18}/></button></div><form onSubmit={persist}><div className="fields-grid">{collectionFields[type].map(spec=><InputField key={spec[0]} spec={spec} value={draft[spec[0]]} csrf={csrf} onChange={value=>setDraft(o=>({...o,[spec[0]]:value}))}/>)}</div><div className="form-actions"><button type="button" className="admin-secondary-btn" onClick={()=>setEdit(null)}>Cancel</button><button type="submit" className="admin-main-btn" disabled={busy}><Save size={17}/>{busy?'Saving…':'Save Content'}</button></div></form></div>}<div className="admin-panel collection-list">{items.length?items.map((item,index)=><div key={item.id} className="collection-item">{(item.image||item.after||item.before)&&<div className="collection-thumb"><img src={item.image||item.after||item.before} alt="Content preview"/></div>}<div className="collection-description"><div><strong>{item.title||item.name||item.question||'Untitled'}</strong><span className={`list-visibility ${item.visible?'':'off'}`}>{item.visible?'Published':'Hidden'}</span></div><p>{item.description||item.answer||item.quote||item.location||''}</p></div><div className="collection-buttons"><button className="icon-button" title={item.visible?'Hide':'Show'} onClick={()=>update(item,{visible:!item.visible})}>{item.visible?<Eye size={17}/>:<EyeOff size={17}/>}</button><button className="icon-button" title="Move up" disabled={index===0} onClick={()=>move(item,-1)}><ArrowUp size={17}/></button><button className="icon-button" title="Move down" disabled={index===items.length-1} onClick={()=>move(item,1)}><ArrowDown size={17}/></button><button className="icon-button" title="Edit" onClick={()=>start(item)}><Pencil size={17}/></button><button className="icon-button danger" title="Delete" onClick={()=>remove(item)}><Trash2 size={17}/></button></div></div>):<div className="blank-slate"><ImagePlus size={30}/><h4>No content yet</h4><p>Use the add button to publish your first entry.</p></div>}</div></div>;
}
function LeadsPanel({data,setData,csrf}) {
  const [selected,setSelected]=useState(null);const [search,setSearch]=useState('');const [statusFilter,setStatusFilter]=useState('All');const [edit,setEdit]=useState({});const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const leads=data.leads||[];
  const filtered=leads.filter(l=>(statusFilter==='All'||l.status===statusFilter)&&`${l.name} ${l.phone} ${l.email} ${l.service} ${l.zipcode}`.toLowerCase().includes(search.toLowerCase()));
  function pick(lead){setSelected(lead);setEdit({status:lead.status,internal_notes:lead.internal_notes||'',scheduled_for:lead.scheduled_for||''});setMessage('');}
  async function save(){setBusy(true);setMessage('');try{await request(`/api/admin/leads/${selected.id}`,{method:'PUT',body:edit,csrf});const d=await request('/api/admin/bootstrap');setData(d);setSelected(d.leads.find(x=>x.id===selected.id));setMessage('Request updated.');}catch(e){setMessage('Error: '+e.message);}finally{setBusy(false);}}
  async function remove(){if(!window.confirm('Permanently delete this estimate request and its private photos?'))return;try{await request(`/api/admin/leads/${selected.id}`,{method:'DELETE',csrf});setData(await request('/api/admin/bootstrap'));setSelected(null);}catch(e){setMessage('Error: '+e.message)}}
  return <div><div className="edit-header"><div><h2>Estimate Requests</h2><p>Follow up with clients, track estimates and plan appointments.</p></div><a href="/api/admin/leads.csv" className="outline-link" download><Download size={17}/> Export CSV</a></div><div className="admin-panel leads-panel"><div className="lead-toolbar"><div className="lead-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients, services, phone…"/></div><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="All">All statuses</option>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select></div><div className="leads-list">{filtered.length?filtered.map(l=><button key={l.id} className={`lead-row ${selected?.id===l.id?'selected':''}`} onClick={()=>pick(l)}><span className="lead-id">#{String(l.id).padStart(4,'0')}</span><span className="lead-client"><strong>{l.name}</strong><small>{l.phone}</small></span><span className="lead-service">{l.service||'Other service'}</span><span className={'status-pill '+l.status.replaceAll(' ','-').toLowerCase()}>{l.status}</span><span className="lead-date">{l.created_at?.split(' ')[0]}</span><ArrowRight size={17}/></button>):<div className="blank-slate"><ClipboardList size={28}/><h4>No matching requests</h4><p>Try a different search or status filter.</p></div>}</div></div>{selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="lead-detail" role="dialog" aria-modal="true" aria-label="Estimate request details" onClick={e=>e.stopPropagation()}><header><div><span className="admin-eyebrow">REQUEST #{String(selected.id).padStart(4,'0')}</span><h3>{selected.name}</h3><p>Received {selected.created_at}</p></div><button className="icon-button" onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button></header><div className="detail-body"><div className="detail-contact"><a href={`tel:${selected.phone}`}><Phone size={16}/>{selected.phone}</a><a href={`sms:${selected.phone}`}><MessageCircle size={16}/>Send SMS</a>{selected.email&&<a href={`mailto:${selected.email}`}><Mail size={16}/>{selected.email}</a>}</div><div className="detail-grid"><div><small>SERVICE</small><strong>{selected.service||'General / other'}</strong></div><div><small>ZIP CODE</small><strong>{selected.zipcode||'Not provided'}</strong></div><div><small>PREFERRED CONTACT</small><strong>{selected.preferred_contact}</strong></div><div><small>ADDRESS</small><strong>{selected.address||'Not provided'}</strong></div></div><div className="details-content"><small>CUSTOMER MESSAGE</small><p>{selected.details}</p></div>{selected.attachments?.length>0&&<div className="lead-attachments"><small>PRIVATE CUSTOMER PHOTOS</small><div>{selected.attachments.map(f=><a key={f} href={`/api/admin/attachments/${f}`} target="_blank" rel="noreferrer"><img src={`/api/admin/attachments/${f}`} alt="Customer attachment"/></a>)}</div></div>}<div className="lead-edit-fields"><label>Status<select value={edit.status} onChange={e=>setEdit(o=>({...o,status:e.target.value}))}>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select></label><label>Appointment date and time<input type="datetime-local" value={edit.scheduled_for||''} onChange={e=>setEdit(o=>({...o,scheduled_for:e.target.value}))}/></label><label>Internal notes (not visible to customers)<textarea rows="4" value={edit.internal_notes||''} onChange={e=>setEdit(o=>({...o,internal_notes:e.target.value}))}/></label></div>{message&&<p className={message.startsWith('Error')?'admin-error':'admin-success'}>{message}</p>}<div className="detail-actions"><button className="admin-secondary-btn danger-text" onClick={remove}><Trash2 size={16}/> Delete</button><button className="admin-main-btn" disabled={busy} onClick={save}><Save size={17}/>{busy?'Saving…':'Save Request'}</button></div></div></div></div>}</div>;
}
function Account({auth,setAuth,csrf}){
  const [email,setEmail]=useState(auth.email||'');const [currentPassword,setCurrentPassword]=useState('');const [newPassword,setNewPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function save(e){e.preventDefault();setBusy(true);setMessage('');try{const a=await request('/api/admin/account',{method:'PUT',body:{email,currentPassword,newPassword},csrf});setAuth(a);setCurrentPassword('');setNewPassword('');setMessage('Account updated successfully.');}catch(e){setMessage('Error: '+e.message);}finally{setBusy(false)}}
  return <div><div className="edit-header"><div><h2>Account & Security</h2><p>Keep your dashboard login safe and up to date.</p></div></div><div className="admin-panel account-panel"><ShieldCheck size={35}/><h3>Administrator credentials</h3><p>Use a unique, strong password. Changing these details updates your login immediately.</p><form onSubmit={save}><label>Admin email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label><label>New password (optional — 12+ characters)<input type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label>{message&&<div className={message.startsWith('Error')?'admin-error':'admin-success'}>{message}</div>}<button className="admin-main-btn" type="submit" disabled={busy}><LockKeyhole size={17}/> {busy?'Updating…':'Update Account'}</button></form></div><div className="admin-helper"><ShieldCheck size={18}/><p>Keep your .env secrets private and back up the persistent data folder. Never commit a real password to GitHub.</p></div></div>;
}
function SchedulePanel({data,setPage}){
  const today=new Date();
  const [month,setMonth]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [day,setDay]=useState(today.toISOString().slice(0,10));
  const all=(data.leads||[]).filter(l=>l.scheduled_for && l.status!=='Cancelled');
  const byDay=(d)=>all.filter(l=>l.scheduled_for?.slice(0,10)===d);
  const fmt=(date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const start=new Date(month.getFullYear(),month.getMonth(),1);
  const offset=start.getDay();
  const cells=Array.from({length:42},(_,i)=>new Date(start.getFullYear(),start.getMonth(),i-offset+1));
  const appointments=byDay(day);
  function changeMonth(diff){const next=new Date(month.getFullYear(),month.getMonth()+diff,1);setMonth(next);setDay(fmt(next));}
  return <div><div className="edit-header"><div><h2>Appointment Calendar</h2><p>Scheduled estimate requests appear here. Set a date on any request to add it to the calendar.</p></div><button className="outline-link" onClick={()=>setPage('leads')}>Go to requests <ArrowRight size={17}/></button></div><div className="calendar-layout"><div className="admin-panel calendar-panel"><div className="calendar-toolbar"><h3>{month.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h3><div><button onClick={()=>changeMonth(-1)}><ArrowLeft size={18}/></button><button onClick={()=>changeMonth(1)}><ArrowRight size={18}/></button></div></div><div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span key={d} className="calendar-weekday">{d}</span>)}{cells.map((d,i)=>{const value=fmt(d),count=byDay(value).length;return <button key={i} className={`calendar-day ${d.getMonth()!==month.getMonth()?'out':''} ${value===day?'chosen':''} ${value===fmt(today)?'today':''}`} onClick={()=>setDay(value)}><span>{d.getDate()}</span>{count>0&&<small>{count} booked</small>}</button>})}</div></div><div className="admin-panel calendar-aside"><h3>{new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h3><p>{appointments.length} appointment{appointments.length===1?'':'s'} scheduled</p>{appointments.length?appointments.map(l=><div className="appointment-card" key={l.id}><span><CalendarDays size={17}/>{l.scheduled_for?.replace('T',' at ')}</span><strong>{l.name}</strong><small>{l.service||'Other Service'}</small><a href={`tel:${l.phone}`}>{l.phone}</a></div>):<div className="blank-slate"><CalendarDays size={28}/><h4>No appointments</h4><p>Assign a date to an estimate request to schedule it.</p></div>}</div></div></div>;
}
function TeamAccess({csrf}){
  const [team,setTeam]=useState([]);const [form,setForm]=useState({email:'',password:'',role:'editor'});const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [showPassword,setShowPassword]=useState(false);
  async function reload(){try{setTeam(await request('/api/admin/team'));}catch(e){setError(e.message)}}
  useEffect(()=>{reload();},[]);
  async function create(e){e.preventDefault();setBusy(true);setError('');try{await request('/api/admin/team',{method:'POST',body:form,csrf});setForm({email:'',password:'',role:'editor'});await reload();}catch(e){setError(e.message);}finally{setBusy(false)}}
  async function remove(user){if(!window.confirm(`Remove access for ${user.email}?`))return;try{await request(`/api/admin/team/${user.id}`,{method:'DELETE',csrf});await reload();}catch(e){setError(e.message)}}
  return <div><div className="edit-header"><div><h2>Team Access</h2><p>Invite a teammate to help manage website content and customer requests.</p></div></div><div className="admin-panel team-list"><h3>Current team</h3>{team.map(t=><div className="team-row" key={t.id}><span className="avatar-circle">{t.email[0].toUpperCase()}</span><div><strong>{t.email}</strong><small>{t.role==='owner'?'Owner — can manage team accounts':'Editor — website and leads'}</small></div><span className="list-visibility">{t.role}</span>{t.role!=='owner'&&<button className="icon-button danger" onClick={()=>remove(t)} title="Remove account"><Trash2 size={17}/></button>}</div>)}</div><div className="admin-panel team-create"><h3>Add a team member</h3><p>Choose Editor for day-to-day marketing and customer follow-up. Only an Owner can manage access to this section.</p><form onSubmit={create}><div className="fields-grid"><label className="admin-input-group"><span>Email</span><input type="email" required value={form.email} onChange={e=>setForm(o=>({...o,email:e.target.value}))}/></label><label className="admin-input-group"><span>Access level</span><select value={form.role} onChange={e=>setForm(o=>({...o,role:e.target.value}))}><option value="editor">Editor</option><option value="owner">Owner</option></select></label><label className="admin-input-group"><span>Temporary password (12+ characters)</span><input type={showPassword?'text':'password'} required minLength={12} value={form.password} onChange={e=>setForm(o=>({...o,password:e.target.value}))}/></label></div><label className="show-password"><input type="checkbox" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)}/> Show password while entering</label>{error&&<div className="admin-error">{error}</div>}<button className="admin-main-btn" type="submit" disabled={busy}><Users size={17}/>{busy?'Adding…':'Create Team Account'}</button></form></div></div>;
}
function MediaLibrary({csrf}){
  const [media,setMedia]=useState([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [copied,setCopied]=useState('');
  async function reload(){try{setMedia(await request('/api/admin/media'));}catch(e){setError(e.message)}}
  useEffect(()=>{reload()},[]);
  async function remove(item){if(!window.confirm('Delete this unused uploaded image permanently?'))return;setBusy(true);setError('');try{await request(`/api/admin/uploads/${item.filename}`,{method:'DELETE',csrf});await reload()}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div><div className="edit-header"><div><h2>Media Library</h2><p>View the images you have uploaded through the dashboard. Images in use are protected from accidental deletion.</p></div></div>{error&&<div className="admin-error">{error}</div>}<div className="admin-panel media-library"><div className="panel-title-row"><h3>{media.length} Uploaded Image{media.length===1?'':'s'}</h3><span className="muted-text">To upload new photos, use the image field in any content editor.</span></div>{media.length?<div className="media-grid">{media.map(item=><div className="media-library-card" key={item.filename}><img src={item.url} alt="Uploaded website asset"/><div><span>{item.inUse?'Used on site':'Not in use'} · {Math.round(item.bytes/1024)} KB</span><button onClick={async()=>{try{await navigator.clipboard.writeText(item.url);setCopied(item.filename)}catch{setError('Copy is not available here. Use the URL displayed below.')}}}><FileText size={15}/>{copied===item.filename?'Copied':'Copy URL'}</button><code>{item.url}</code><button className="media-delete" disabled={item.inUse||busy} onClick={()=>remove(item)}><Trash2 size={15}/> Delete unused image</button></div></div>)}</div>:<div className="blank-slate"><Images size={28}/><h4>No images uploaded yet</h4><p>Use the website editors to add your first image.</p></div>}</div></div>;
}

function Admin(){
  const [auth,setAuth]=useState(null);const [checking,setChecking]=useState(true);const [data,setData]=useState(null);const [page,setPage]=useState('dashboard');const [mobileOpen,setMobileOpen]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{request('/api/auth/me').then(setAuth).catch(()=>{}).finally(()=>setChecking(false));},[]);
  useEffect(()=>{if(auth)request('/api/admin/bootstrap').then(setData).catch(e=>setError(e.message));},[auth?.email]);
  async function logout(){try{await request('/api/auth/logout',{method:'POST',csrf:auth.csrfToken});}catch{}setAuth(null);setData(null);}
  function navigate(id){setPage(id);setMobileOpen(false);window.scrollTo({top:0,behavior:'smooth'});}
  if(checking)return <div className="site-loading"><span className="loading-orbit"/> Checking admin session…</div>;
  if(!auth)return <Login onLogin={setAuth}/>;
  if(!data)return <div className="site-loading">{error||'Loading your dashboard…'}</div>;
  const current=panels.find(p=>p.id===page)||panels[0];
  const section=page==='dashboard'?<Dashboard data={data} setPage={navigate}/>:
    page==='leads'?<LeadsPanel data={data} setData={setData} csrf={auth.csrfToken}/>:
    page==='branding'||page==='settings'?<SettingsEditor data={data} setData={setData} csrf={auth.csrfToken} mode={page}/>:
    page==='sections'?<SectionBuilder data={data} setData={setData} csrf={auth.csrfToken}/>:
    page==='account'?<Account auth={auth} setAuth={setAuth} csrf={auth.csrfToken}/>:page==='team'?<TeamAccess csrf={auth.csrfToken}/>:page==='media'?<MediaLibrary csrf={auth.csrfToken}/>:page==='schedule'?<SchedulePanel data={data} setPage={navigate}/>:
    <CollectionEditor data={data} setData={setData} csrf={auth.csrfToken} type={page}/>;
  return <div className="admin-app"><aside className={`admin-sidebar ${mobileOpen?'sidebar-open':''}`}><div className="admin-logo"><img src={data.site.logo||'/assets/prime-logo-original.jpg'} alt="Prime original logo"/><div><strong>PRIME CARPET</strong><small>ADMIN CONTROL CENTER</small></div><button className="mobile-close icon-button" onClick={()=>setMobileOpen(false)}><X size={20}/></button></div><span className="sidebar-group-label">MANAGEMENT</span><nav aria-label="Admin navigation">{panels.filter(p=>p.id!=='team'||auth.role==='owner').map(p=>{const Icon=p.icon;return <button key={p.id} onClick={()=>navigate(p.id)} className={page===p.id?'active':''}><Icon size={19}/><span>{p.title}</span>{p.id==='leads'&&data.leads?.filter(x=>x.status==='New').length>0&&<b>{data.leads.filter(x=>x.status==='New').length}</b>}</button>})}</nav><div className="sidebar-bottom"><a href="/" target="_blank"><ExternalLink size={18}/> View Website</a><button onClick={logout}><LogOut size={18}/> Sign out</button></div></aside>{mobileOpen&&<div className="sidebar-shade" onClick={()=>setMobileOpen(false)}/>}<div className="admin-main"><header className="admin-topbar"><div className="admin-topbar-left"><button className="mobile-menu icon-button" onClick={()=>setMobileOpen(true)} aria-label="Open admin navigation"><Menu size={22}/></button><span>Control Center</span><ArrowRight size={14}/><strong>{current.title}</strong></div><div className="admin-topbar-right"><span className="live-indicator"><i/> Website live when deployed</span><div className="admin-profile"><span>{auth.email?.[0]?.toUpperCase()||'A'}</span><div><strong>Administrator</strong><small>{auth.email}</small></div></div></div></header><main className="admin-content" key={page}>{section}</main><footer className="admin-bottom">Prime Carpet & Home Care · Orlando, Florida <span>Admin dashboard</span></footer></div></div>;
}
export default Admin;
