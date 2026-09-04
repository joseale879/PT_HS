# API — Hidro Smart

## 1. Introducción

La carpeta `src/api/` contiene la capa encargada de la comunicación entre el **frontend** y el backend de Hidro Smart.

Su función principal es recibir solicitudes HTTP, validar la información recibida, verificar la autenticación y autorización del usuario, ejecutar el caso de uso correspondiente y devolver una respuesta al cliente.

La API no debe contener directamente las reglas principales del negocio ni consultas SQL.

---

# 2. Ubicación

La API se encuentra en:

```text
src/
└── api/
    ├── controllers/
    ├── routes/
    │   └── v1/
    ├── middlewares/
    └── validators/
```

---

# 3. Responsabilidad de la API

La API será responsable de:

- Recibir solicitudes HTTP.
- Definir los endpoints.
- Validar los datos recibidos.
- Autenticar usuarios.
- Verificar permisos.
- Ejecutar casos de uso.
- Manejar errores HTTP.
- Devolver respuestas al frontend.

El flujo general será:

```text
Frontend
    ↓
HTTP Request
    ↓
Routes
    ↓
Middlewares
    ↓
Controller
    ↓
Use Case
    ↓
Core
    ↓
Response
    ↓
Frontend
```

---

# 4. Versionamiento de la API

La API estará versionada mediante:

```text
/api/v1
```

Esto permitirá realizar cambios futuros sin romper inmediatamente las versiones anteriores.

Ejemplo:

```text
/api/v1/auth
/api/v1/users
/api/v1/homes
/api/v1/devices
/api/v1/consumption
/api/v1/alerts
/api/v1/tariffs
/api/v1/goals
/api/v1/vacation
/api/v1/actuators
```

---

# 5. Controllers

Ubicación:

```text
src/api/controllers/
```

Los controllers son responsables de recibir las solicitudes y coordinar la ejecución del caso de uso correspondiente.

La estructura será:

```text
controllers/
├── auth.controller.js
├── user.controller.js
├── home.controller.js
├── device.controller.js
├── consumption.controller.js
├── AlertController.js
├── tariff.controller.js
├── goal.controller.js
├── vacation.controller.js
└── actuator.controller.js
```

---

## 5.1 Auth Controller

Archivo:

```text
auth.controller.js
```

Gestionará las solicitudes relacionadas con autenticación.

Ejemplos:

- Registro.
- Inicio de sesión.
- Renovación de token.
- Cierre de sesión.

El controller no validará directamente las credenciales contra PostgreSQL.

Delegará esta responsabilidad al caso de uso correspondiente.

```text
Request
   ↓
AuthController
   ↓
LoginUser
   ↓
Repository
```

---

## 5.2 User Controller

Archivo:

```text
user.controller.js
```

Gestionará operaciones relacionadas con el usuario.

Ejemplos:

- Consultar información.
- Actualizar perfil.
- Eliminar o desactivar cuenta.

---

## 5.3 Home Controller

Archivo:

```text
home.controller.js
```

Gestionará los hogares.

Ejemplos:

- Crear hogar.
- Consultar hogar.
- Actualizar hogar.
- Gestionar miembros.

---

## 5.4 Device Controller

Archivo:

```text
device.controller.js
```

Gestionará los dispositivos IoT.

Principalmente permitirá:

- Registrar ESP32.
- Consultar dispositivos.
- Actualizar configuración.
- Consultar estado.

---

## 5.5 Consumption Controller

Archivo:

```text
consumption.controller.js
```

Gestionará las consultas relacionadas con el consumo de agua.

Ejemplos:

- Consumo actual.
- Historial.
- Resúmenes.
- Información procesada de las lecturas.

---

## 5.6 Alert Controller

Archivo:

```text
AlertController.js
```

Gestionará las alertas del sistema.

Ejemplos:

- Consultar alertas.
- Crear alertas cuando corresponda.
- Resolver alertas.

---

## 5.7 Tariff Controller

Archivo:

```text
tariff.controller.js
```

Gestionará las operaciones relacionadas con las tarifas utilizadas para calcular costos del consumo.

---

## 5.8 Goal Controller

Archivo:

```text
goal.controller.js
```

Gestionará las metas de consumo o ahorro establecidas por el usuario.

---

## 5.9 Vacation Controller

Archivo:

```text
vacation.controller.js
```

Gestionará el modo vacaciones.

---

## 5.10 Actuator Controller

Archivo:

```text
actuator.controller.js
```

Será uno de los controllers importantes para la integración IoT.

Permitirá solicitar acciones sobre:

- Electroválvula.
- Hidrobomba.

Por ejemplo:

```text
Abrir electroválvula
Cerrar electroválvula
Encender hidrobomba
Apagar hidrobomba
Consultar estado
```

El controller **no controla directamente el ESP32**.

El flujo será:

```text
Frontend
   ↓
ActuatorController
   ↓
OpenValve / CloseValve
   ↓
MQTT
   ↓
ESP32
```

---

# 6. Routes

Ubicación:

```text
src/api/routes/v1/
```

Las rutas definen los endpoints HTTP disponibles.

Estructura:

```text
v1/
├── auth.routes.js
├── users.routes.js
├── homes.routes.js
├── devices.routes.js
├── consumption.routes.js
├── alerts.routes.js
├── tariffs.routes.js
├── goals.routes.js
├── vacation.routes.js
└── actuators.routes.js
```

Las rutas deben ser simples.

Su responsabilidad es conectar:

```text
HTTP Endpoint
      ↓
Middleware
      ↓
Controller
```

No deben contener lógica de negocio.

---

# 7. Middlewares

Ubicación:

```text
src/api/middlewares/
```

Los middlewares funcionan como filtros que procesan las solicitudes antes de llegar al controller.

Estructura:

```text
middlewares/
├── auth.middleware.js
├── authorization.middleware.js
├── validation.middleware.js
├── rate-limit.middleware.js
└── error.middleware.js
```

---

## 7.1 Auth Middleware

Archivo:

```text
auth.middleware.js
```

Comprueba que la solicitud tenga una autenticación válida.

Por ejemplo:

```text
Authorization: Bearer <token>
```

Su función es identificar al usuario antes de permitir el acceso a un endpoint protegido.

---

## 7.2 Authorization Middleware

Archivo:

```text
authorization.middleware.js
```

Comprueba si el usuario autenticado tiene permiso para realizar una operación.

Esto será especialmente importante para:

- Hogares.
- Dispositivos.
- Electroválvulas.
- Hidrobombas.

Por ejemplo:

```text
Usuario autenticado
        ↓
¿Tiene acceso al hogar?
        ↓
¿Tiene acceso al dispositivo?
        ↓
¿Puede controlar el actuador?
        ↓
Permitir operación
```

---

## 7.3 Validation Middleware

Archivo:

```text
validation.middleware.js
```

Se encarga de ejecutar las validaciones correspondientes antes de procesar la solicitud.

Ejemplo:

```text
POST /api/v1/devices
        ↓
Validar datos
        ↓
Controller
```

---

## 7.4 Rate Limit Middleware

Archivo:

```text
rate-limit.middleware.js
```

Limita la cantidad de solicitudes que puede realizar un cliente en determinado periodo.

Su objetivo es reducir:

- Abuso de la API.
- Solicitudes excesivas.
- Intentos automatizados.

---

## 7.5 Error Middleware

Archivo:

```text
error.middleware.js
```

Centraliza el manejo de errores de la API.

Permite convertir errores internos en respuestas HTTP apropiadas.

Ejemplo:

```text
Error de validación
      ↓
Error Middleware
      ↓
HTTP 400
```

o:

```text
Usuario no autenticado
      ↓
Error Middleware
      ↓
HTTP 401
```

---

# 8. Validators

Ubicación:

```text
src/api/validators/
```

Los validators comprueban que los datos enviados por el cliente tengan el formato esperado.

Estructura:

```text
validators/
├── auth.validator.js
├── user.validator.js
├── home.validator.js
├── device.validator.js
├── consumption.validator.js
└── actuator.validator.js
```

---

## Auth Validator

Validará datos como:

- Email.
- Contraseña.
- Datos necesarios para registro.

---

## User Validator

Validará información enviada para actualizar los datos del usuario.

---

## Home Validator

Validará información necesaria para crear o actualizar hogares.

---

## Device Validator

Validará datos relacionados con el registro y configuración de dispositivos.

---

## Consumption Validator

Validará parámetros utilizados para consultar información de consumo.

---

## Actuator Validator

Validará las solicitudes relacionadas con los actuadores.

Ejemplos:

```text
deviceId
actuatorId
command
```

Esto es importante para evitar enviar comandos incorrectos al ESP32.

---

# 9. Relación entre API y Core

La API no debe implementar directamente las reglas de negocio.

La comunicación será:

```text
API
 │
 ├── Routes
 │
 ├── Middlewares
 │
 ├── Controllers
 │
 └───────────────┐
                 ↓
             Application
                 ↓
               Domain
                 ↓
          Infrastructure
```

Por ejemplo, para abrir la electroválvula:

```text
POST /api/v1/actuators/123/valve/open
                ↓
        Actuator Route
                ↓
     Authentication Middleware
                ↓
     Authorization Middleware
                ↓
      Actuator Controller
                ↓
          OpenValve
                ↓
         IMqttService
                ↓
            MQTT
                ↓
             ESP32
                ↓
        Electroválvula
```

---

# 10. Respuestas de la API

Las respuestas deberán mantener una estructura consistente.

Ejemplo de respuesta exitosa:

```json
{
  "success": true,
  "data": {},
  "message": "Operación realizada correctamente"
}
```

Ejemplo de error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos"
  }
}
```

La estructura definitiva podrá ajustarse cuando se implemente la API y se integre con el frontend.

---

# 11. Métodos HTTP

Se utilizarán principalmente:

| Método | Uso |
|---|---|
| GET | Consultar información |
| POST | Crear o ejecutar operaciones |
| PUT | Actualizar información |
| PATCH | Actualizaciones parciales cuando sean necesarias |
| DELETE | Eliminar o desactivar recursos |

---

# 12. Principios de la API

La API seguirá estas reglas:

### 1. Controllers simples

No deben contener lógica de negocio compleja.

### 2. Routes simples

Las rutas solamente deben definir los endpoints y conectar middlewares/controllers.

### 3. Validación antes del procesamiento

Los datos deben validarse antes de llegar al caso de uso.

### 4. Seguridad

Los endpoints protegidos deben requerir autenticación y autorización.

### 5. Separación de responsabilidades

La API se encarga de HTTP.

El Core se encarga de la lógica de negocio.

Infrastructure se encarga de las tecnologías externas.

---

# 13. Estructura final de la API

```text
src/
└── api/
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── home.controller.js
    │   ├── device.controller.js
    │   ├── consumption.controller.js
    │   ├── AlertController.js
    │   ├── tariff.controller.js
    │   ├── goal.controller.js
    │   ├── vacation.controller.js
    │   └── actuator.controller.js
    │
    ├── routes/
    │   └── v1/
    │       ├── auth.routes.js
    │       ├── users.routes.js
    │       ├── homes.routes.js
    │       ├── devices.routes.js
    │       ├── consumption.routes.js
    │       ├── alerts.routes.js
    │       ├── tariffs.routes.js
    │       ├── goals.routes.js
    │       ├── vacation.routes.js
    │       └── actuators.routes.js
    │
    ├── middlewares/
    │   ├── auth.middleware.js
    │   ├── authorization.middleware.js
    │   ├── validation.middleware.js
    │   ├── rate-limit.middleware.js
    │   └── error.middleware.js
    │
    └── validators/
        ├── auth.validator.js
        ├── user.validator.js
        ├── home.validator.js
        ├── device.validator.js
        ├── consumption.validator.js
        └── actuator.validator.js
```

---

# 14. Resumen

La API representa la **puerta de entrada HTTP** de Hidro Smart.

Su responsabilidad será:

```text
Recibir
   ↓
Validar
   ↓
Autenticar
   ↓
Autorizar
   ↓
Ejecutar caso de uso
   ↓
Responder
```

La API no será responsable directamente de:

- Consultar PostgreSQL.
- Controlar físicamente el ESP32.
- Ejecutar consultas SQL.
- Implementar las reglas principales del negocio.

Estas responsabilidades pertenecen a las capas correspondientes del Core e Infrastructure.
## Advertencia de implementación (2026-09-04)

Este documento conserva material conceptual de arquitectura. Para las rutas que realmente existen debe usarse `03-endpoints.md`, que se verificó contra `src/app.js`. Las secciones de `/api/v1/actuators` y los controladores de actuadores son una propuesta futura: actualmente no están montados.

La integración MQTT vigente está documentada en `14-mqtt-protocol.md`; el backend recibe y normaliza mensajes, pero aún no persiste lecturas en PostgreSQL.
