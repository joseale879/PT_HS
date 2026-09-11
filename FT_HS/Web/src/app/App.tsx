import { useEffect } from 'react';
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
import { RenderErrorBoundary } from '@app/components/RenderErrorBoundary';

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
};

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="bg-blue-600 p-4 rounded-2xl">
            <img
              src={logoImage}
              alt="HidroSmart Logo"
              className="h-24 w-auto mx-auto animate-pulse sm:h-32"
            />
          </div>
          <Loader2 className="size-10 text-blue-600 animate-spin absolute -bottom-2 -right-2" />
        </div>
        <h2 className="text-3xl text-blue-900 hidrosmart-logo">{t('app.name')}</h2>
        <p className="text-gray-600">{t('app.loadingSystem')}</p>
      </div>
    </div>
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

function FallbackRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return (
    <Navigate
      to={isAuthenticated ? '/app' : { pathname: '/login', search: location.search }}
      replace
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  const { login, requestPasswordReset, resetPassword, getPasswordResetEmail } = useAuth();
  return (
    <LoginScreen
      onLogin={async (credentials) => {
        await login(credentials);
        navigate('/app', { replace: true });
      }}
      onPasswordReset={requestPasswordReset}
      onPasswordResetComplete={({ token, password }) => resetPassword({ token, password })}
      onGetPasswordResetEmail={getPasswordResetEmail}
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
        await register(payload);
        navigate('/login', { replace: true, state: { verificationPending: true } });
      }}
      onBack={() => navigate('/login')}
      initialFormData={state.draft || null}
      initialLegalAccepted={Boolean(state.legalAccepted)}
      onReviewTerms={(draft) => navigate('/privacy', { state: { draft } })}
    />
  );
}

function VerifyEmailRoute() {
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const token = new URLSearchParams(useLocation().search).get('token');
  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return; }
    verifyEmail(token).then(() => navigate('/login', { replace: true, state: { emailVerified: true } })).catch(() => navigate('/login', { replace: true }));
  }, [navigate, token, verifyEmail]);
  return <LoadingScreen />;
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
  const { session, logout } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
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

// Router central: la URL representa la pantalla y las guardas bloquean enlaces directos.
export default function App() {
  const { isInitializing, isAuthenticated } = useAuth();
  if (isInitializing) return <LoadingScreen />;

  return (
    <RenderErrorBoundary
      title="HidroSmart no pudo mostrar la aplicación"
      description="La aplicación encontró un error inesperado. Reintenta la carga para continuar."
    >
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/privacy" element={<PrivacyRoute />} />
          <Route path="/verify-email" element={<VerifyEmailRoute />} />
        </Route>
        <Route element={<RequireAuthentication />}>
          <Route path="/app/*" element={<AuthenticatedApplication />} />
        </Route>
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
      <FloatingLanguageSwitcher />
      <Toaster />
    </RenderErrorBoundary>
  );
}
