import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Checkbox } from '@shared/ui/checkbox';
import { Label } from '@shared/ui/label';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Shield, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@shared/ui/alert';

interface PrivacyConsentProps {
  onAccept: () => void;
}

// RF7 - Gestión de Privacidad y Consentimiento de Datos
export function PrivacyConsent({ onAccept }: PrivacyConsentProps) {
  const [acceptLegal, setAcceptLegal] = useState(false);

  const canProceed = acceptLegal;

  const handleAccept = () => {
    if (canProceed) {
      // RF7.4 - Registrar consentimientos otorgados
      onAccept();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Shield className="size-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Privacidad y Consentimiento</CardTitle>
          </div>
          <CardDescription>
            Antes de crear tu cuenta, por favor revisa y acepta nuestras políticas de privacidad
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* RF7.3 - Mostrar claramente qué datos se recopilan */}
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Datos que recopilamos:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Información personal: nombre, correo electrónico, documento de identidad</li>
                  <li>Datos de consumo de agua de tus dispositivos IoT</li>
                  <li>Ubicación de dispositivos instalados</li>
                  <li>Historial de actividad en la plataforma</li>
                  <li>Preferencias de configuración</li>
                </ul>
                <p className="font-semibold mt-3">Propósito de la recopilación:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Monitoreo y análisis de consumo de agua</li>
                  <li>Generación de reportes y recomendaciones</li>
                  <li>Detección de fugas y anomalías</li>
                  <li>Mejora del servicio</li>
                  <li>Soporte técnico y atención al cliente</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Política de privacidad completa */}
          <div className="space-y-3">
            <Label>Política de Privacidad</Label>
            <ScrollArea className="h-64 w-full rounded-lg border bg-gray-50 p-4">
              <div className="space-y-4 text-sm text-gray-700">
                <h3 className="font-semibold">1. Recopilación de Datos</h3>
                <p>
                  AquaMonitor recopila información necesaria para proporcionar servicios de monitoreo
                  de consumo de agua mediante dispositivos IoT. Los datos incluyen información
                  personal básica, datos de consumo en tiempo real y métricas de dispositivos.
                </p>

                <h3 className="font-semibold">2. Uso de la Información</h3>
                <p>
                  Los datos recopilados se utilizan exclusivamente para: análisis de consumo,
                  generación de reportes, detección de fugas, envío de notificaciones relevantes,
                  y mejora continua del servicio.
                </p>

                <h3 className="font-semibold">3. Protección de Datos</h3>
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas para proteger tus
                  datos contra acceso no autorizado, pérdida o alteración. Utilizamos cifrado
                  end-to-end y autenticación segura mediante sesión y correo electrónico.
                </p>

                <h3 className="font-semibold">4. Compartir Información</h3>
                <p>
                  No vendemos ni compartimos tu información personal con terceros para fines
                  comerciales. Solo compartimos datos con proveedores de servicios esenciales
                  bajo estrictos acuerdos de confidencialidad.
                </p>

                <h3 className="font-semibold">5. Derechos del Usuario</h3>
                <p>
                  Tienes derecho a acceder, corregir, eliminar o exportar tus datos en cualquier
                  momento. Puedes solicitar la eliminación completa de tu cuenta y datos asociados
                  conforme a la normativa vigente (RGPD-like).
                </p>

                <h3 className="font-semibold">6. Retención de Datos</h3>
                <p>
                  Conservamos tus datos mientras mantengas una cuenta activa o según sea necesario
                  para cumplir con obligaciones legales. Puedes solicitar la eliminación en cualquier momento.
                </p>

                <h3 className="font-semibold">7. Cookies y Tecnologías de Seguimiento</h3>
                <p>
                  Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies
                  de análisis para mejorar la experiencia del usuario. Puedes gestionar tus
                  preferencias de cookies en la configuración.
                </p>
              </div>
            </ScrollArea>
          </div>

          {/* RF7.1 - Consentimientos requeridos */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="legalConsent"
                checked={acceptLegal}
                onCheckedChange={(checked) => setAcceptLegal(checked as boolean)}
              />
              <Label htmlFor="legalConsent" className="text-sm leading-relaxed cursor-pointer">
                <span className="text-red-600">*</span> Acepto los términos y condiciones y la política de privacidad de HidroSmart.
              </Label>
            </div>
          </div>

          {/* RF7.2 - Información sobre eliminación de datos */}
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription className="text-sm">
              Puedes solicitar la eliminación completa de tus datos personales en cualquier momento
              desde la configuración de tu cuenta, conforme a la normativa de protección de datos vigente.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter>
          <Button onClick={handleAccept} disabled={!canProceed} className="w-full">
            Volver al formulario
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
