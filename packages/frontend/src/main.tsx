import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/gsap'; // Initialize GSAP with plugins and prefers-reduced-motion
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
