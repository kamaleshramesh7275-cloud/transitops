import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Register the PWA service worker and check for updates every 10 minutes
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      setInterval(() => {
        r.update();
      }, 10 * 60 * 1000); // 10 minutes
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

