# Ambiente local

El desarrollo local utiliza dos proyectos Docker separados:

```text
BD_HS  -> PostgreSQL + Liquibase -> localhost:5433
BK_HS  -> API Node.js/Express   -> localhost:3000
```

La API se conecta a PostgreSQL mediante el rol `hidro_smart_app`. Liquibase y las tareas administrativas permanecen en `BD_HS`.

## Preparación

Desde `BD_HS`:

```powershell
Copy-Item .env.example .env
```

Desde `BK_HS`:

```powershell
Copy-Item .env.local.example .env
```

En `BK_HS/.env` se debe colocar la contraseña local real de `hidro_smart_app` y un secreto JWT local. Estos archivos no se suben al repositorio.

## Levantar todo

Desde la raíz del proyecto:

```powershell
.\BK_HS\start-local.ps1 -BuildBackend
```

Si las imágenes ya existen:

```powershell
.\BK_HS\start-local.ps1
```

## Verificación

```powershell
Invoke-RestMethod http://localhost:3000/health
```

La API debe responder con `status: ok` y mostrar la base `hidro_smart`.

## Pruebas de integración autenticadas

Las pruebas básicas se ejecutan con:

```powershell
$env:RUN_INTEGRATION = '1'
$env:INTEGRATION_DATABASE_URL = 'postgresql://hidro_smart_app:<PASSWORD>@localhost:5433/hidro_smart'
npm.cmd run test:integration
```

Para validar además el flujo autenticado, define temporalmente:

```powershell
$env:INTEGRATION_USER_EMAIL = '<EMAIL_DE_PRUEBA>'
$env:INTEGRATION_USER_PASSWORD = '<PASSWORD_DE_PRUEBA>'
```

La prueba inicia sesión, consulta `/users/me`, `/homes` y `/devices`, y revoca la sesión con logout. No se guardan credenciales en el repositorio. El usuario de prueba debe existir realmente en la base local antes de activar esta validación.
