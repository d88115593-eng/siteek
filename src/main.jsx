import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicSite from './public-site.jsx';
import Admin from './admin.jsx';
import './styles.css';

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/admin/*" element={<Admin/>}/>
      <Route path="*" element={<PublicSite/>}/>
    </Routes>
  </BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
