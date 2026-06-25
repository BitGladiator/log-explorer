import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './src/hooks/useAuth.jsx';
import { AlertToastProvider } from './src/components/AlertToast.jsx';
import App from './src/App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AlertToastProvider>
          <App />
        </AlertToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);