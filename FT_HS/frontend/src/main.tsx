import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './app/providers/AuthProvider';
import { QueryProvider } from './app/providers/QueryProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import './styles/index.css';
import './shared/i18n/config';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encontró el elemento root');

createRoot(rootElement).render(
  <BrowserRouter>
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  </BrowserRouter>
);
