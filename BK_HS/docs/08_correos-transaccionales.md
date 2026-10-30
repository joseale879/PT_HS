# Correos transaccionales de HidroSmart

Este documento registra los correos que el backend puede enviar, qué acción los dispara y cuáles están conectados actualmente a un flujo de la aplicación. “Correo” significa mensaje enviado por HidroSmart al correo del usuario; no implica que Gmail sea el proveedor de envío.

## Correos conectados a flujos actuales

| Correo | Cuándo se envía | Destinatario | Asunto configurado |
| --- | --- | --- | --- |
| Verificación de correo | Al registrarse, y al solicitar el reenvío de verificación. | Dirección registrada. | `Verifica tu correo de HidroSmart` |
| Recuperación de contraseña | Al solicitar “Olvidé mi contraseña”, si la cuenta existe y el proveedor está configurado. | Dirección ingresada para recuperar la cuenta. | `Restablece tu contraseña de HidroSmart` |
| Contraseña modificada | Después de cambiar la contraseña desde la sesión o completar una recuperación válida. | Correo asociado a la cuenta. | `Tu contraseña fue modificada - HidroSmart` |
| Información de cuenta modificada | Después de actualizar el perfil (nombre, teléfono, ciudad o foto). Actualmente se dispara tras actualizar el perfil, no solo cuando cambia un dato sensible. | Correo asociado a la cuenta. | `Información de cuenta modificada - HidroSmart` |
| Cuenta suspendida/bloqueada | Cuando un administrador cambia el estado a `Suspended` o `Blocked`. Ambos estados usan la plantilla titulada “Cuenta suspendida”. | Usuario afectado. | `Cuenta suspendida - HidroSmart` |
| Cuenta reactivada | Cuando un administrador cambia el estado a `Active`. | Usuario reactivado. | `Cuenta reactivada - HidroSmart` |
| Cuenta eliminada | Después de que un administrador elimina otra cuenta. | Correo de la cuenta eliminada. | `Cuenta eliminada - HidroSmart` |
| Acceso a hogar concedido | Después de agregar correctamente a un usuario como `Member` o `Guest` a un hogar. | Miembro agregado. | `Te agregaron a un hogar en HidroSmart` |

### Detalles de verificación y recuperación

- El enlace de verificación usa `FRONTEND_URL/verify-email?token=...` y vence en 24 horas.
- El enlace de recuperación siempre apunta a `FRONTEND_URL/login` (o al origen de `PASSWORD_RESET_URL`, si está configurada) y agrega `resetToken`. Así el formulario de recuperación de `/login` puede leer el token aunque la variable de despliegue se haya configurado solo con el dominio.
- El enlace de recuperación vence en una hora. El token se guarda como hash en la base de datos; el token sin hash solo viaja en el enlace enviado al usuario.
- El correo de cambio de contraseña se envía tanto después del cambio autenticado como después de restablecerla desde el enlace. No incluye la contraseña.

## Plantillas implementadas, pero sin disparador encontrado

Estas plantillas existen en `NotificationService`, pero no se encontró una llamada desde los casos de uso/controladores actuales. Por tanto, no deben considerarse notificaciones activas hasta conectar y probar sus disparadores:

| Plantilla | Propósito previsto |
| --- | --- |
| Bienvenida | Confirmar que la cuenta se creó y permitir ingresar. |
| Posible fuga | Avisar de una posible fuga, con dispositivo y fecha. |
| Consumo elevado | Informar el consumo y el límite configurado. |
| Meta al 80 % / 90 % | Avisar que el consumo se acerca a la meta. |
| Dispositivo sin lecturas | Indicar que el dispositivo dejó de enviar lecturas. |
| Dispositivo desconectado | Avisar que el dispositivo aparece fuera de línea. |
| Ticket de soporte actualizado | Informar el estado nuevo de un ticket. |

`sendGoalThreshold80` y `sendGoalThreshold90` son variantes de la misma plantilla de meta. Las funciones `sendLeakAlert`, `sendHighConsumption`, `sendDeviceNoReading`, `sendDeviceDisconnected` y `sendTicketUpdated` tampoco aparecen conectadas a un disparador en el código revisado.

## Formato y proveedor

Los mensajes activos se construyen con una plantilla HTML común y una versión de texto plano. `BrevoEmailSender` los envía exclusivamente mediante la API HTTPS de Brevo.

Las variables de configuración son `BREVO_API_KEY`, `BREVO_FROM_EMAIL` y `BREVO_FROM_NAME`. `BREVO_API_KEY` debe ser una API key v3 de Brevo; una clave SMTP no autentica esta integración. El remitente debe estar registrado y verificado en Brevo. El emisor no usa Resend, SMTP ni Mailpit como alternativas. No se registran aquí valores ni credenciales.

En producción y al probar localmente se deben revisar las variables del backend y la actividad de correo en Brevo, sin copiar secretos a chats o documentación.

## Qué significa una respuesta exitosa

En registro, reenvío de verificación y recuperación, la respuesta evita revelar si una dirección está asociada a una cuenta. Un `202 Accepted` confirma que la solicitud fue procesada, pero **no confirma que se haya intentado ni entregado el correo**: si faltan variables, el caso de uso conserva la respuesta neutral; si Brevo rechaza el envío, revisa el error `[BREVO]` en Render.

Para diagnosticar una entrega, comprobar:

1. Que el navegador complete CSRF y revisar el estado de la solicitud a la API.
2. En los logs de Render, buscar el detalle `[BREVO]` y el código HTTP de rechazo.
3. En Render, comprobar `BREVO_API_KEY` (API key, no SMTP key), `BREVO_FROM_EMAIL` y `BREVO_FROM_NAME`.
4. En Brevo, confirmar que el remitente esté registrado/verificado y que Transactional Email esté activo.
5. Revisar la actividad, el estado de entrega y los rebotes en Brevo; luego la carpeta de spam del destinatario.
6. Que el enlace generado use el dominio publicado y abra `/login` con `resetToken`.

## Referencias de implementación

- Plantillas, asuntos y enlaces: `src/core/application/services/notifications/NotificationService.js`.
- Envío mediante Brevo: `src/core/infrastructure/notifications/BrevoEmailSender.js`.
- Registro y verificación: `src/core/application/use-cases/auth/RegisterUser.js` y `ResendEmailVerification.js`.
- Recuperación y confirmación de cambio: `src/core/application/use-cases/auth/RequestPasswordReset.js`, `ResetPassword.js` y `ChangePassword.js`.
- Actualización de perfil: `src/core/application/use-cases/user/UpdateCurrentUser.js`.
- Cambios administrativos de cuenta: `src/core/application/services/user/AccountAdminService.js`.
- Invitaciones a hogares: `src/core/application/use-cases/home/AddHomeMember.js`.
