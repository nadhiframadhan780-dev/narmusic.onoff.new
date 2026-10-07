import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA Service Worker Registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('NARmusic Service Worker terdaftar:', reg.scope);
      })
      .catch((err) => {
        console.warn('Registrasi Service Worker gagal:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

