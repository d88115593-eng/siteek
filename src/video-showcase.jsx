import React from 'react';
import {PlayCircle} from 'lucide-react';
import WhatsAppQuickQuote from './quick-whatsapp-form.jsx';

export default function VideoShowcase({site,videos=[]}){
  return <>
    {videos.length>0&&<section id="videos" className="section project-video-section"><div className="container">
      <div className="section-heading center"><span className="eyebrow"><span className="eyebrow-line"/> REAL WORK IN ORLANDO</span>
        <h2>{site.videosTitle||'See our team at work.'}</h2><p>{site.videosSubtitle||'Real cleaning projects, recorded on site.'}</p>
      </div>
      <div className="project-video-grid">{videos.map(item=><article className="project-video-card" key={item.id}>
        <div className="project-video-frame"><video src={item.video} poster={item.poster||undefined} controls preload="none" playsInline aria-label={item.title}>Your browser does not support video.</video><span className="project-video-label"><PlayCircle size={15}/> Real job footage</span></div>
        <div className="project-video-copy"><h3>{item.title}</h3>{item.description&&<p>{item.description}</p>}</div>
      </article>)}</div>
    </div></section>}
    <WhatsAppQuickQuote phone={site.whatsapp||''} smsPhone={site.phone||''}/>
  </>;
}
