import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Checkbox } from '@shared/ui/checkbox';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Progress } from '@shared/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  documentNumberPattern,
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeNameInput,
  normalizeDocumentNumber,
  passwordValidation as getPasswordValidation,
} from '@shared/lib/validators';
import logoImage from '@/imports/aaa-Photoroom-1.png';

interface RegisterScreenProps {
  onRegister: (payload: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    documentType: 'CC' | 'CE';
    documentNumber: string;
  }) => Promise<void>;
  onBack: () => void;
  initialFormData?: {
    name: string;
    email: string;
    docType: string;
    docNumber: string;
    password: string;
    confirmPassword: string;
  } | null;
  initialLegalAccepted?: boolean;
  onReviewTerms: (draft: {
    name: string;
    email: string;
    docType: string;
    docNumber: string;
    password: string;
    confirmPassword: string;
  }) => void;
}

type RegisterField =
  | 'name'
  | 'email'
  | 'docType'
  | 'docNumber'
  | 'password'
  | 'confirmPassword'
  | 'legalConsent';
type FieldErrors = Partial<Record<RegisterField, string>>;

// RF1 - Registro de Usuario
export function RegisterScreen({
  onRegister,
  onBack,
  initialFormData,
  initialLegalAccepted = false,
  onReviewTerms,
}: RegisterScreenProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState(
    initialFormData || {
      name: '',
      email: '',
      docType: '',
      docNumber: '',
      password: '',
      confirmPassword: '',
    }
  );
  const [acceptedLegal, setAcceptedLegal] = useState(initialLegalAccepted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [legalDocument, setLegalDocument] = useState<'terms' | 'privacy' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // RF1.2 - Validación de contraseña
  const passwordValidation = getPasswordValidation(formData.password);
  const passwordStrength =
    (passwordValidation.hasMinLength ? 20 : 0) +
    (passwordValidation.hasUpperCase ? 20 : 0) +
    (passwordValidation.hasLowerCase ? 20 : 0) +
    (passwordValidation.hasNumber ? 20 : 0) +
    (passwordValidation.hasSymbol ? 20 : 0);

  const clearFieldError = (field: RegisterField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const focusFirstError = (errors: FieldErrors) => {
    const firstField = Object.keys(errors)[0] as RegisterField | undefined;
    if (!firstField) return;
    const targetId = firstField === 'legalConsent' ? 'reviewTerms' : firstField;
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!(target instanceof HTMLElement)) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    });
  };

  const validateForm = () => {
    const errors: FieldErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (!isValidName(formData.name)) {
      errors.name = 'Debe tener entre 3 y 60 caracteres y solo usar letras y espacios';
    }
    if (!formData.email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Escribe un correo completo, por ejemplo: usuario@gmail.com';
    }
    if (!formData.docType) errors.docType = 'Selecciona un tipo de documento';
    if (!formData.docNumber) {
      errors.docNumber = 'El número de documento es obligatorio';
    } else if (!documentNumberPattern.test(formData.docNumber)) {
      errors.docNumber = 'Usa solo dígitos y máximo 10 caracteres';
    }
    if (!formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (!isValidPassword(formData.password)) {
      errors.password = 'La contraseña no cumple los requisitos de seguridad';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!acceptedLegal) errors.legalConsent = 'Debes leer y aceptar los términos y condiciones';

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstError(errors);
      toast.error('Revisa los campos marcados en rojo');
      return false;
    }
    return true;
  };

  // RF1.1, RF1.3 - Validar todos los campos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onRegister({
        username: formData.email.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        fullName: formData.name.trim(),
        documentType: formData.docType as 'CC' | 'CE',
        documentNumber: formData.docNumber,
      });
      toast.success('Cuenta creada exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocumentNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setDocumentError(digits.length > 10 ? 'El número de documento admite máximo 10 dígitos.' : '');
    updateFormData('docNumber', normalizeDocumentNumber(value));
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-3 sm:p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8 items-center">
        <div className="text-center md:text-left space-y-3 md:space-y-6">
          <div className="flex min-w-0 items-center justify-center md:justify-start gap-3 sm:gap-4">
            <div className="bg-blue-600 p-2 rounded-xl sm:p-3 sm:rounded-2xl">
              <img src={logoImage} alt="HidroSmart Logo" className="h-12 w-auto sm:h-20" />
            </div>
            <h1 className="min-w-0 break-words text-2xl sm:text-5xl text-blue-900 hidrosmart-logo">
              {t('app.name')}
            </h1>
          </div>
          <h2 className="text-base sm:text-2xl text-blue-800">{t('app.tagline')}</h2>
          <p className="hidden text-blue-700 sm:block">{t('login.description')}</p>
          <div className="hidden sm:grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-3xl text-blue-600">24/7</div>
              <div className="text-sm text-blue-700">{t('login.monitoring247')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl text-blue-600">IoT</div>
              <div className="text-sm text-blue-700">{t('login.smartDevices')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl text-blue-600">100%</div>
              <div className="text-sm text-blue-700">{t('login.secure')}</div>
            </div>
          </div>
        </div>

        <Card className="register-card w-full max-w-2xl justify-self-center gap-0 shadow-2xl">
          <div className="grid grid-cols-2 rounded-t-xl bg-gray-100 p-1">
            <Button type="button" variant="ghost" onClick={onBack} className="rounded-xl">
              Iniciar Sesión
            </Button>
            <div className="flex min-h-8 items-center justify-center rounded-xl bg-white px-3 py-1.5 text-xs font-medium shadow-sm sm:h-9 sm:text-sm">
              Registrarse
            </div>
          </div>
          <CardHeader className="gap-0 px-4 pt-3 pb-2 sm:px-6 sm:pt-3 sm:pb-2">
            <CardTitle>{t('auth.createAccountTitle')}</CardTitle>
            <CardDescription>
              Completa todos los campos obligatorios para registrarte
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-1.5 px-4 sm:px-6">
              {/* RF1.1 - Nombre completo */}
              <div className="space-y-1">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  className={fieldErrors.name ? 'h-8 border-red-500 focus-visible:ring-red-500' : 'h-8'}
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={(e) => {
                    updateFormData('name', normalizeNameInput(e.target.value));
                    clearFieldError('name');
                  }}
                  maxLength={60}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name && <p id="name-error" className="text-xs text-red-600">{fieldErrors.name}</p>}
              </div>

              {/* RF1.1 - Tipo y número de documento (C.C/C.E) */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="docType">Tipo de documento *</Label>
                  <Select
                    value={formData.docType}
                      onValueChange={(value) => {
                        updateFormData('docType', value);
                        clearFieldError('docType');
                      }}
                  >
                  <SelectTrigger
                    id="docType"
                    type="button"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.docType)}
                    className={fieldErrors.docType ? 'h-8 border-red-500 focus-visible:ring-red-500' : 'h-8'}
                  >
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía (C.C)</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería (C.E)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">No se admiten menores de edad (T.I)</p>
                  {fieldErrors.docType && <p className="text-xs text-red-600">{fieldErrors.docType}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="docNumber">Número de documento *</Label>
                  <Input
                    id="docNumber"
                    className={fieldErrors.docNumber ? 'h-8 border-red-500 focus-visible:ring-red-500' : 'h-8'}
                    placeholder="1234567890"
                    value={formData.docNumber}
                    onChange={(e) => {
                      updateDocumentNumber(e.target.value);
                      clearFieldError('docNumber');
                    }}
                    inputMode="numeric"
                    pattern="[0-9]{1,10}"
                    aria-invalid={Boolean(fieldErrors.docNumber)}
                    aria-describedby={fieldErrors.docNumber ? 'docNumber-error' : undefined}
                  />
                  <p className={`text-xs ${documentError ? 'text-red-600' : 'text-gray-500'}`}>
                    {documentError || `${formData.docNumber.length}/10 dígitos`}
                  </p>
                </div>
              </div>

              {/* RF1.1 - Correo electrónico */}
              <div className="space-y-1">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  className={fieldErrors.email ? 'h-8 border-red-500 focus-visible:ring-red-500' : 'h-8'}
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => {
                    updateFormData('email', e.target.value);
                    clearFieldError('email');
                  }}
                  maxLength={150}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && <p id="email-error" className="text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              {/* RF1.2 - Contraseña con requisitos */}
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    className={fieldErrors.password ? 'h-8 border-red-500 focus-visible:ring-red-500' : 'h-8'}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      updateFormData('password', e.target.value);
                      clearFieldError('password');
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* RF1.2 - Indicador de fortaleza de contraseña */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Progress value={passwordStrength} className="flex-1" />
                      <span className="text-xs text-gray-600">{passwordStrength}%</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div
                        className={`flex items-center gap-1 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasMinLength ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Mínimo 8 caracteres
                      </div>
                      <div
                        className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasUpperCase ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Al menos una mayúscula
                      </div>
                      <div
                        className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasLowerCase ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Al menos una minúscula
                      </div>
                      <div
                        className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasNumber ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Al menos un número
                      </div>
                      <div
                        className={`flex items-center gap-1 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {passwordValidation.hasSymbol ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Al menos un símbolo (!@#$%^&*)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    className={fieldErrors.confirmPassword ? 'h-8 border-red-500 focus-visible:ring-red-500' : 'h-8'}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      updateFormData('confirmPassword', e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* RF7.1 - Aceptar políticas */}
              <div className="space-y-1.5 border-t pt-1.5">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="legalConsent"
                    checked={acceptedLegal}
                    disabled
                    aria-invalid={Boolean(fieldErrors.legalConsent)}
                  />
                  <Label htmlFor="legalConsent" className="text-sm leading-snug">
                    <span className="text-red-600">*</span> Acepto los términos y condiciones y la
                    política de privacidad de HidroSmart.
                  </Label>
                </div>
                <Button
                  id="reviewTerms"
                  type="button"
                  variant="outline"
                  className={fieldErrors.legalConsent ? 'w-full border-red-500 text-red-600' : 'w-full'}
                  onClick={() => {
                    clearFieldError('legalConsent');
                    onReviewTerms(formData);
                  }}
                >
                  {acceptedLegal
                    ? 'Volver a leer términos y condiciones'
                    : 'Leer términos y condiciones'}
                </Button>
                {fieldErrors.legalConsent && (
                  <p className="text-xs text-red-600">{fieldErrors.legalConsent}</p>
                )}
              </div>

              {/* RF1.5 - Información sobre verificación */}
              <Alert className="py-2">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-sm">
                  Te enviaremos un enlace de verificación. La cuenta se activará únicamente
                  cuando confirmes el correo electrónico.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 px-4 pb-3 sm:flex-row sm:px-6 sm:pb-3">
              <Button type="button" variant="outline" onClick={onBack} className="h-8 flex-1">
                Volver
              </Button>
              <Button type="submit" className="h-8 flex-1" disabled={isSubmitting || !acceptedLegal}>
                {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </CardFooter>
          </form>
          <Dialog
            open={legalDocument !== null}
            onOpenChange={(open) => {
              if (!open) setLegalDocument(null);
            }}
          >
            <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {legalDocument === 'terms' ? 'Términos y condiciones' : 'Política de privacidad'}
                </DialogTitle>
                <DialogDescription>HidroSmart · versión local de consulta</DialogDescription>
              </DialogHeader>
              {legalDocument === 'terms' ? (
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    HidroSmart permite monitorear el consumo de agua y administrar hogares y
                    dispositivos autorizados.
                  </p>
                  <p>
                    La persona usuaria debe mantener seguras sus credenciales y usar la plataforma
                    únicamente con hogares y dispositivos sobre los que tenga autorización.
                  </p>
                  <p>
                    El acceso puede limitarse ante uso indebido, incumplimiento de seguridad o
                    requerimientos legales.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    HidroSmart trata los datos de cuenta, hogar, dispositivos y consumo para prestar
                    el servicio y generar información de monitoreo.
                  </p>
                  <p>
                    Los datos se protegen con controles de acceso y se comparten solo cuando sea
                    necesario para operar el servicio o cumplir obligaciones legales.
                  </p>
                  <p>
                    Puedes solicitar actualización, corrección o eliminación de datos conforme a la
                    normativa aplicable.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
}
