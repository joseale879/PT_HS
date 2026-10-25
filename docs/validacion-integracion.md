# Validacion de integracion local

Última ejecución comprobada: 2026-09-14. El resultado fue 6 pruebas aprobadas,
sin fallos ni omisiones.

Este flujo comprueba el backend contra PostgreSQL, las politicas RLS, los
permisos de `Administrator`, `Support`, `HomeUser` y `Guest`, y la ingesta MQTT.
Los usuarios que crea son exclusivos para pruebas y no deben usarse en
produccion.

## Preparar la pila

Desde `PT_HS`:

```powershell
docker compose --env-file .env up -d postgres db-bootstrap mosquitto mailpit
docker compose --env-file .env --profile tooling run --rm liquibase validate
docker compose --env-file .env --profile tooling run --rm liquibase update
docker compose --env-file .env up -d --build backend frontend
```

## Preparar las cuentas de prueba

En la misma sesion de PowerShell define la conexion administrativa y cuatro
correos/contraseñas de prueba. Las contraseñas deben cumplir la politica local:

```powershell
$env:INTEGRATION_ADMIN_DATABASE_URL = 'postgresql://hidro_smart_admin:CLAVE_ADMIN@localhost:5433/hidro_smart'
$env:INTEGRATION_ADMIN_EMAIL = 'ci-administrator@hidrosmart.local'
$env:INTEGRATION_ADMIN_PASSWORD = 'CiAdministrator123!'
$env:INTEGRATION_SUPPORT_EMAIL = 'ci-support@hidrosmart.local'
$env:INTEGRATION_SUPPORT_PASSWORD = 'CiSupport123!'
$env:INTEGRATION_HOMEUSER_EMAIL = 'ci-homeuser@hidrosmart.local'
$env:INTEGRATION_HOMEUSER_PASSWORD = 'CiHomeuser123!'
$env:INTEGRATION_GUEST_EMAIL = 'ci-guest@hidrosmart.local'
$env:INTEGRATION_GUEST_PASSWORD = 'CiGuest123!'

npm.cmd run seed:integration --prefix BK_HS
```

El sembrador actualiza solo las cuentas identificadas por esos correos, asigna
un unico rol a cada una y no imprime las contraseñas.

## Ejecutar todas las pruebas de integracion

```powershell
$env:RUN_INTEGRATION = '1'
$env:INTEGRATION_DATABASE_URL = 'postgresql://hidro_smart_app:CLAVE_APP@localhost:5433/hidro_smart'
$env:INTEGRATION_MQTT_URL = 'mqtt://localhost:1883'
$env:INTEGRATION_USER_EMAIL = $env:INTEGRATION_HOMEUSER_EMAIL
$env:INTEGRATION_USER_PASSWORD = $env:INTEGRATION_HOMEUSER_PASSWORD

npm.cmd run test:integration --prefix BK_HS
```

El resultado esperado es `6 pass, 0 fail, 0 skipped`. La prueba RLS crea y
elimina sus datos temporales de hogar, reporte, ticket, respuesta y privacidad,
y comprueba cero filas sin contexto y visibilidad propia con el usuario
contextual. La prueba MQTT también elimina el dispositivo y la lectura de
prueba al finalizar.

La auditoría no concede acceso directo a la tabla al rol de aplicación. La
matriz de roles comprueba el endpoint administrativo: `Administrator` recibe
`200` y los demás roles reciben `403`.

## Validación completa

Para ejecutar BD, backend, frontend, mobile y las integraciones en una sola
secuencia usa desde `PT_HS`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-all.ps1
```

Esta validación también ejecuta Liquibase, siembra las cuatro cuentas de
integración y reconstruye las imágenes Docker.

## CI

`.github/workflows/validate.yml` define credenciales efimeras de CI, ejecuta
`seed:integration` y luego corre la misma matriz. No copies esas credenciales a
los `.env` locales ni a un despliegue.
