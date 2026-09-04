import { useState, useEffect } from 'react';
import { LoginScreen } from '@features/auth/pages/LoginPage';
import { DashboardLayout } from '@app/layouts/AppLayout';
import { RegisterScreen } from '@features/auth/pages/RegisterPage';
import { PrivacyConsent } from '@features/privacy/pages/PrivacyPage';
import { Toaster } from '@shared/ui/sonner';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@app/providers/ThemeProvider';
import { FloatingLanguageSwitcher } from '@shared/ui/FloatingLanguageSwitcher';
import '@shared/i18n/config';
import { useTranslation } from 'react-i18next';
import logoImage from '../imports/aaa-Photoroom-1.png';
import { authApi, sessionTokens, userApi } from '@shared/http/httpClient';

// RNF1.1 - Tiempo de inicio: La aplicación debe iniciar en máximo 5 segundos
// RNF5.2 - Autenticación segura con tokens
export default function App() {
  const [userRole, setUserRole] = useState(null);
  const [currentView, setCurrentView] = useState('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [registrationDraft, setRegistrationDraft] = useState(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const { t, i18n } = useTranslation();

  const restoreUserPreferences = async () => {
    const response = await userApi.preferences();
    await i18n.changeLanguage(response.data.language);
  };

  // Suppress known Recharts duplicate key warning
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Encountered two children with the same key')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // RNF1.1 - Simular carga inicial con tiempo de inicio controlado
  useEffect(() => {
    // Verificar sesión existente y restaurar estado
    const initializeApp = async () => {
      try {
        // RF3.2 - Validar sesión existente (simulado)
        const savedSession = sessionTokens.accessToken;
        if (savedSession) {
          await userApi.me();
          await restoreUserPreferences();
          setUserRole('user');
          setCurrentView('dashboard');
        } else if (sessionTokens.refreshToken) {
          const refreshed = await authApi.refresh(sessionTokens.refreshToken);
          sessionTokens.save(refreshed.data);
          await userApi.me();
          await restoreUserPreferences();
          setUserRole('user');
          setCurrentView('dashboard');
        } else {
          setCurrentView('login');
        }
      } catch (error) {
        sessionTokens.clear();
        console.error('Error al inicializar:', error);
        setCurrentView('login');
      } finally {
        // RNF1.1 - Asegurar que la carga no exceda 5 segundos
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    initializeApp();
  }, []);

  // RF2.1, RF2.3 - Inicio de sesión con generación de tokens
  const handleLogin = async ({ login, password }) => {
    // RF3.1 - Crear sesión con tokens (simulado)
    const response = await authApi.login(login, password);
    sessionTokens.save(response.data);
    await restoreUserPreferences();

    // RNF5.2 - Almacenar tokens de forma segura
    sessionStorage.setItem('hidrosmart_role', 'user');

    // RF19.1 - Registrar inicio de sesión en auditoría
    const auditLog = {
      action: 'LOGIN',
      timestamp: new Date().toISOString(),
      ipAddress: 'Backend'
    };
    console.log('Auditoría:', auditLog);

    setUserRole('user');
    setCurrentView('dashboard');
  };

  // RF3.4 - Cerrar sesión y revocar tokens
  const handleLogout = () => {
    // RF19.1 - Registrar cierre de sesión
    const auditLog = {
      action: 'LOGOUT',
      role: userRole,
      timestamp: new Date().toISOString()
    };
    console.log('Auditoría:', auditLog);

    // Limpiar sesión
    const refreshToken = sessionTokens.refreshToken;
    if (refreshToken) authApi.logout(refreshToken).catch(() => undefined);
    sessionTokens.clear();

    setUserRole(null);
    setCurrentView('login');
  };

  const handleRegisterClick = () => {
    setRegistrationDraft(null);
    setLegalAccepted(false);
    setCurrentView('register');
  };

  const handleReviewTerms = (draft) => {
    setRegistrationDraft(draft);
    setCurrentView('privacy');
  };

  const handlePrivacyAccept = () => {
    setLegalAccepted(true);
    setCurrentView('register');
  };

  const handleRegister = async (payload) => {
    const response = await authApi.register(payload);
    sessionTokens.save(response.data);
    await restoreUserPreferences();
    setUserRole('user');
    setCurrentView('dashboard');
  };

  const handlePasswordReset = (email) => authApi.requestPasswordReset(email);
  const handlePasswordResetComplete = ({ token, password }) => authApi.resetPassword(token, password).then(() => undefined);

  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  // RNF1.1 - Pantalla de carga inicial (máximo 5 segundos)
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
          <div className="text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <img src={logoImage} alt="HidroSmart Logo" className="h-32 w-auto mx-auto animate-pulse" />
              </div>
              <Loader2 className="size-10 text-blue-600 animate-spin absolute -bottom-2 -right-2" />
            </div>
            <h2 className="text-3xl text-blue-900 hidrosmart-logo">{t('app.name')}</h2>
            <p className="text-gray-600">{t('app.loadingSystem')}</p>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (currentView === 'privacy') {
    return (
      <ThemeProvider>
        <PrivacyConsent onAccept={handlePrivacyAccept} />
        <FloatingLanguageSwitcher />
        <Toaster />
      </ThemeProvider>
    );
  }

  // RF1 - Pantalla de registro
  if (currentView === 'register') {
    return (
      <ThemeProvider>
        <RegisterScreen onRegister={handleRegister} onBack={handleBackToLogin} initialFormData={registrationDraft} initialLegalAccepted={legalAccepted} onReviewTerms={handleReviewTerms} />
        <FloatingLanguageSwitcher />
        <Toaster />
      </ThemeProvider>
    );
  }

  // RF2 - Pantalla de login
  if (currentView === 'login') {
    return (
      <ThemeProvider>
        <LoginScreen onLogin={handleLogin} onPasswordReset={handlePasswordReset} onPasswordResetComplete={handlePasswordResetComplete} onRegisterClick={handleRegisterClick} />
        <FloatingLanguageSwitcher />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Dashboard principal con todos los módulos
  return (
    <ThemeProvider>
      <DashboardLayout userRole={userRole} onLogout={handleLogout} />
      <FloatingLanguageSwitcher />
      <Toaster />
    </ThemeProvider>
  );
}
