import React,{useState} from 'react';
import {ArrowUpRight,MessageCircle} from 'lucide-react';
import WhatsAppMark from './whatsapp-mark.jsx';

const digits=s=>String(s||'').replace(/\D/g,'');
const usNumber=s=>digits(s).startsWith('1')?digits(s):'1'+digits(s);
export default function WhatsAppQuickQuote({phone,smsPhone}){
  const [name,setName]=useState('');
  const [callback,setCallback]=useState('');
  const [zip,setZip]=useState('');
  const [service,setService]=useState('');
  const [details,setDetails]=useState('');
  const whatsappAvailable=digits(phone).length>=10;
  const smsAvailable=digits(smsPhone).length>=10;
  if(!whatsappAvailable&&!smsAvailable)return null;
  const buildMessage=()=>[
    'Hi Prime Carpet & Home Care! I would like a free estimate.',
    'Name: '+name.trim(),
    'Phone: '+callback.trim(),
    'ZIP Code: '+(zip.trim()||'Not provided'),
    'Service: '+(service||'Other home service'),
    'Project: '+details.trim()
  ].join('\n');
  function submit(e,channel){
    e.preventDefault();
    const form=e.currentTarget.form||e.currentTarget;
    if(!form.reportValidity())return;
    const msg=encodeURIComponent(buildMessage());
    const target=channel==='whatsapp'
      ?'https://wa.me/'+usNumber(phone)+'?text='+msg
      :'sms:+'+usNumber(smsPhone)+'?body='+msg;
    // One deliberate user action, no background messages or storage.
    if(channel==='whatsapp'){
      const tab=window.open(target,'_blank');
      if(tab)tab.opener=null;else window.location.assign(target);
    }else window.location.assign(target);
  }
  return <section className="quick-wa-section" aria-labelledby="quick-wa-heading"><div className="container quick-wa-layout">
    <div className="quick-wa-copy"><span className="eyebrow light"><span className="eyebrow-line"/> FAST, PERSONAL SERVICE</span>
      <h2 id="quick-wa-heading">Tell us what you need.</h2>
      <p>Share a few details about your cleaning or home project in Orlando. We'll prepare your message for WhatsApp or SMS — no account needed.</p>
      <div className="quick-wa-highlight"><MessageCircle size={20}/> Serving Orlando, FL & surrounding areas</div>
    </div>
    <form className="quick-wa-card" onSubmit={e=>submit(e,whatsappAvailable?'whatsapp':'sms')}>
      <h3>Request a free estimate</h3>
      <p>Fill in your details to start a conversation.</p>
      <div className="quick-wa-fields">
        <label>Full name <b>*</b><input required maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>
        <label>Phone number <b>*</b><input required type="tel" autoComplete="tel" maxLength={30} value={callback} onChange={e=>setCallback(e.target.value)} placeholder="(407) 555-0123"/></label>
        <label>ZIP Code<input inputMode="numeric" maxLength={10} value={zip} onChange={e=>setZip(e.target.value)} placeholder="32801"/></label>
        <label>Service needed<select value={service} onChange={e=>setService(e.target.value)}>
          <option value="">Select a service</option>
          <option>Carpet Cleaning</option><option>Sofa Cleaning</option><option>Upholstery Cleaning</option>
          <option>Mattress Cleaning</option><option>Rug Cleaning</option><option>Car Interior Cleaning</option><option>General Home Services</option><option>Other Service</option>
        </select></label>
        <label className="quick-wa-message">Tell us about the job <b>*</b><textarea required minLength={8} maxLength={1000} rows={4} value={details} onChange={e=>setDetails(e.target.value)} placeholder="What needs cleaning or fixing?"/></label>
      </div>
      {whatsappAvailable&&<button className="quick-wa-submit" type="submit"><WhatsAppMark size={21}/> Continue on WhatsApp <ArrowUpRight size={17}/></button>}
      {smsAvailable&&<button className="quick-sms-submit" type={whatsappAvailable?'button':'submit'} onClick={whatsappAvailable?e=>submit(e,'sms'):undefined}><MessageCircle size={18}/> Prefer SMS? Text us instead <ArrowUpRight size={15}/></button>}
      <small>We'll prefill your message. Tap Send in your messaging app to contact our team. To share photos, attach them directly in the chat. This form does not automatically submit a request to our dashboard.</small>
    </form>
  </div></section>;
}
