import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './app/providers/AuthProvider';
import { QueryProvider } from './app/providers/QueryProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import './styles/index.css';
import './shared/i18n/config';

createRoot(document.getElementById('root')).render(
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
