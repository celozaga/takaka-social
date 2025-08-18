import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './lib/i18n'; // Initialize i18n
import { Loader2 } from 'lucide-react';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <App />
    </Suspense>
  </React.StrictMode>
);