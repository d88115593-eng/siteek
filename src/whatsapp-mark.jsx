import React from 'react';
/** WhatsApp-style mark. Green button reserved for this contact channel. */
export default function WhatsAppMark({size=22}){
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M16 2.5A13.5 13.5 0 0 0 4.1 22.4L2 30l7.8-2.1A13.5 13.5 0 1 0 16 2.5Zm0 24.5a11 11 0 0 1-5.6-1.5l-.4-.2-4.4 1.2 1.2-4.2-.3-.4A11 11 0 1 1 16 27Z"/>
    <path fill="currentColor" d="M12 9.3c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.8.1-1.2.6s-1.5 1.4-1.5 3.4 1.5 4 1.7 2.2 4.9 3.9 4 1.5 4.8 1.4c.8-.1 2.5-1 2.8-2s.3-1.8.2-2-.4-.3-.8-.5l-2.3-1.1c-.4-.1-.6-.2-.8.2-.3.4-.9 1.1-1.1 1.3-.2.2-.4.3-.8.1-.4-.2-1.5-.5-2.8-1.7-1-1-1.7-2-1.9-2.4-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2 0-.5-.1-.7L12 9.3Z"/>
  </svg>;
}