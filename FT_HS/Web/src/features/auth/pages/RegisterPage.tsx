import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Checkbox } from '@shared/ui/checkbox';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Progress } from '@shared/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { documentNumberPattern, emailPattern, isValidPassword, normalizeDocumentNumber, passwordValidation as getPasswordValidation } from '@shared/lib/validators';

interface RegisterScreenProps {
  onRegister: (payload: { username: string; email: string; password: string; fullName: string; documentType: 'CC' | 'CE'; documentNumber: string }) => Promise<void>;
  onBack: () => void;
  initialFormData?: { name: string; email: string; docType: string; docNumber: string; password: string; confirmPassword: string } | null;
  initialLegalAccepted?: boolean;
  onReviewTerms: (draft: { name: string; email: string; docType: string; docNumber: string; password: string; confirmPassword: string }) => void;
}

// RF1 - Registro de Usuario
export function RegisterScreen({ onRegister, onBack, initialFormData, initialLegalAccepted = false, onReviewTerms }: RegisterScreenProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState(initialFormData || {
    name: '',
    email: '',
    docType: '',
    docNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedLegal, setAcceptedLegal] = useState(initialLegalAccepted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [legalDocument, setLegalDocument] = useState<'terms' | 'privacy' | null>(null);

  // RF1.2 - Validación de contraseña
  const passwordValidation = getPasswordValidation(formData.password);
  const passwordStrength = 
    (passwordValidation.hasMinLength ? 20 : 0) +
    (passwordValidation.hasUpperCase ? 20 : 0) +
    (passwordValidation.hasLowerCase ? 20 : 0) +
    (passwordValidation.hasNumber ? 20 : 0) +
    (passwordValidation.hasSymbol ? 20 : 0);

  // RF1.1, RF1.3 - Validar todos los campos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!formData.name || !formData.email || !formData.docType || !formData.docNumber || !formData.password) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!documentNumberPattern.test(formData.docNumber)) {
      toast.error('El número de documento debe contener solo dígitos y máximo 10 caracteres');
      return;
    }

    // RF1.1 - No se admiten menores de edad (simulado con validación de documento)
    if (formData.docType === 'TI') {
      toast.error('No se admiten registros con Tarjeta de Identidad. Debes ser mayor de edad.');
      return;
    }

    // Validar formato de email
    if (!emailPattern.test(formData.email)) {
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    // RF1.2 - Validar contraseña
    if (!isValidPassword(formData.password)) {
      toast.error('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // RF7.1 - Validar aceptación de políticas
    if (!acceptedLegal) {
      toast.error('Debes aceptar los términos y condiciones y la política de privacidad');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRegister({
      username: formData.email.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      fullName: formData.name.trim(),
      documentType: formData.docType as 'CC' | 'CE',
      documentNumber: formData.docNumber
      });
      toast.success('Cuenta creada exitosamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateDocumentNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setDocumentError(digits.length > 10 ? 'El número de documento admite máximo 10 dígitos.' : '');
    updateFormData('docNumber', normalizeDocumentNumber(value));
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 to-cyan-100 p-3 sm:flex sm:items-start sm:justify-center sm:p-4 lg:py-6">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle>Crear Cuenta en HidroSmart</CardTitle>
          <CardDescription>
            Completa todos los campos obligatorios para registrarte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            {/* RF1.1 - Nombre completo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input 
                id="name" 
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                required 
              />
            </div>

            {/* RF1.1 - Tipo y número de documento (C.C/C.E) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="docType">Tipo de documento *</Label>
                <Select 
                  value={formData.docType}
                  onValueChange={(value) => updateFormData('docType', value)}
                >
                  <SelectTrigger id="docType" type="button" aria-required="true">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía (C.C)</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería (C.E)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  No se admiten menores de edad (T.I)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="docNumber">Número de documento *</Label>
                <Input 
                  id="docNumber" 
                  placeholder="1234567890"
                  value={formData.docNumber}
                  onChange={(e) => updateDocumentNumber(e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{1,10}"
                  required 
                />
                <p className={`text-xs ${documentError ? 'text-red-600' : 'text-gray-500'}`}>
                  {documentError || `${formData.docNumber.length}/10 dígitos`}
                </p>
              </div>
            </div>

            {/* RF1.1 - Correo electrónico */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@ejemplo.com"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required 
              />
            </div>

            {/* RF1.2 - Contraseña con requisitos */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required 
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Progress value={passwordStrength} className="flex-1" />
                    <span className="text-xs text-gray-600">{passwordStrength}%</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-1 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasMinLength ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                      Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasUpperCase ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                      Al menos una mayúscula
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasLowerCase ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                      Al menos una minúscula
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasNumber ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                      Al menos un número
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordValidation.hasSymbol ? <CheckCircle2 className="size-3" /> : <X className="size-3" />}
                      Al menos un símbolo (!@#$%^&*)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* RF7.1 - Aceptar políticas */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="legalConsent"
                  checked={acceptedLegal}
                  disabled
                />
                <Label htmlFor="legalConsent" className="text-sm leading-relaxed">
                  <span className="text-red-600">*</span> Acepto los términos y condiciones y la política de privacidad de HidroSmart.
                </Label>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => onReviewTerms(formData)}>
                {acceptedLegal ? 'Volver a leer términos y condiciones' : 'Leer términos y condiciones'}
              </Button>
            </div>

            {/* RF1.5 - Información sobre verificación */}
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription className="text-sm">
                El correo de verificación estará disponible cuando se configure SMTP en el servidor.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Volver
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </CardFooter>
        </form>
        <Dialog open={legalDocument !== null} onOpenChange={(open) => { if (!open) setLegalDocument(null); }}>
          <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{legalDocument === 'terms' ? 'Términos y condiciones' : 'Política de privacidad'}</DialogTitle>
              <DialogDescription>
                HidroSmart · versión local de consulta
              </DialogDescription>
            </DialogHeader>
            {legalDocument === 'terms' ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p>HidroSmart permite monitorear el consumo de agua y administrar hogares y dispositivos autorizados.</p>
                <p>La persona usuaria debe mantener seguras sus credenciales y usar la plataforma únicamente con hogares y dispositivos sobre los que tenga autorización.</p>
                <p>El acceso puede limitarse ante uso indebido, incumplimiento de seguridad o requerimientos legales.</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <p>HidroSmart trata los datos de cuenta, hogar, dispositivos y consumo para prestar el servicio y generar información de monitoreo.</p>
                <p>Los datos se protegen con controles de acceso y se comparten solo cuando sea necesario para operar el servicio o cumplir obligaciones legales.</p>
                <p>Puedes solicitar actualización, corrección o eliminación de datos conforme a la normativa aplicable.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
