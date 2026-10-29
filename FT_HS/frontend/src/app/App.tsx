import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LoginScreen } from '@features/auth/pages/LoginPage';
import { DashboardLayout } from '@app/layouts/AppLayout';
import { RegisterScreen } from '@features/auth/pages/RegisterPage';
import { PrivacyConsent } from '@features/privacy/pages/PrivacyPage';
import { Toaster } from '@shared/ui/sonner';
import { Loader2 } from 'lucide-react';
import { FloatingLanguageSwitcher } from '@shared/ui/FloatingLanguageSwitcher';
import { useTranslation } from 'react-i18next';
import logoImage from '../imports/aaa-Photoroom-1.png';
import { useAuth } from '@app/providers/AuthProvider';
import { ActiveHomeProvider } from '@app/providers/ActiveHomeProvider';
import { VerifyEmailPage } from '@features/auth/pages/VerifyEmailPage';

type RegistrationDraft = {
  name: string;
  email: string;
  docType: string;
  docNumber: string;
  password: string;
  confirmPassword: string;
};

type RegistrationLocationState = {
  draft?: RegistrationDraft;
  legalAccepted?: boolean;
  registrationPending?: boolean;
  registeredEmail?: string;
};

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="text-center">
        <div className="mx-auto flex size-32 items-center justify-center rounded-2xl bg-blue-600 p-4">
          <img src={logoImage} alt="HidroSmart Logo" className="size-24 object-contain" />
        </div>
        <h2 className="mt-4 text-3xl text-blue-900 hidrosmart-logo">{t('app.name')}</h2>
        <div className="mt-2 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="size-4 animate-spin text-blue-600" aria-hidden="true" />
          <p>{t('app.loadingSystem')}</p>
        </div>
      </div>
    </div>
  );
}

function InitializationErrorScreen() {
  const { t } = useTranslation();
  const { retryInitialization } = useAuth();
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-blue-900">{t('app.connectionErrorTitle')}</h1>
        <p className="mt-3 text-slate-600">{t('app.connectionErrorDescription')}</p>
        <button
          type="button"
          onClick={() => void retryInitialization()}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          {t('common.retry')}
        </button>
      </section>
    </main>
  );
}

function RequireAuthentication() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />;
}

function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, requestPasswordReset, passwordResetContext, resetPassword } = useAuth();
  const state = (location.state || {}) as RegistrationLocationState;
  return (
    <LoginScreen
      initialEmail={state.registeredEmail || ''}
      registrationPending={Boolean(state.registrationPending)}
      onLogin={async (credentials) => {
        await login(credentials);
        navigate('/app', { replace: true });
      }}
      onPasswordReset={requestPasswordReset}
      onPasswordResetContext={passwordResetContext}
      onPasswordResetComplete={({ token, password }) => resetPassword({ token, password })}
      onRegisterClick={() => navigate('/register')}
    />
  );
}

function RegisterRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const state = (location.state || {}) as RegistrationLocationState;
  return (
    <RegisterScreen
      onRegister={async (payload) => {
        const result = await register(payload);
        navigate('/login', {
          replace: true,
          state: { registrationPending: true, registeredEmail: result.email },
        });
      }}
      initialFormData={state.draft || null}
      initialLegalAccepted={Boolean(state.legalAccepted)}
      onReviewTerms={(draft) => navigate('/privacy', { state: { draft } })}
    />
  );
}

function PrivacyRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as RegistrationLocationState;
  if (!state.draft) return <Navigate to="/register" replace />;
  return (
    <PrivacyConsent
      onAccept={() =>
        navigate('/register', {
          replace: true,
          state: { draft: state.draft, legalAccepted: true },
        })
      }
    />
  );
}

function AuthenticatedApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  if (!session) return <Navigate to="/login" replace />;

  const defaultPath = session.roles.includes('Administrator') ? '/app/admin' : '/app';

  if (location.pathname === '/app' && defaultPath !== '/app') {
    return <Navigate to={defaultPath} replace />;
  }

  return (
    <ActiveHomeProvider>
      <DashboardLayout
        session={session}
        onLogout={async () => {
          await logout();
          navigate('/login', { replace: true });
        }}
      />
    </ActiveHomeProvider>
  );
}

function NotFoundScreen() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
      <section className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="mt-2 text-slate-600">La ruta solicitada no existe.</p>
        <a className="mt-5 inline-block text-blue-700 hover:underline" href="/app">
          Volver al panel
        </a>
      </section>
    </main>
  );
}

// Router central: la URL representa la pantalla y las guardas bloquean enlaces directos.
export default function App() {
  const { isInitializing, initializationError, isAuthenticated } = useAuth();
  if (isInitializing) return <LoadingScreen />;
  if (initializationError) return <InitializationErrorScreen />;

  return (
    <>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/privacy" element={<PrivacyRoute />} />
        </Route>
        <Route element={<RequireAuthentication />}>
          <Route path="/app/*" element={<AuthenticatedApplication />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/app' : '/login'} replace />} />
      </Routes>
      <FloatingLanguageSwitcher />
      <Toaster />
    </>
  );
}
