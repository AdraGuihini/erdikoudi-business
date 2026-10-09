import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Admin from './Admin.jsx';
import { inject } from '@vercel/analytics';
import VisitorTracker from './VisitorTracker';

inject();

const Page = window.location.pathname === '/admin' ? Admin : App;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VisitorTracker />
    <Page />
  </StrictMode>
);