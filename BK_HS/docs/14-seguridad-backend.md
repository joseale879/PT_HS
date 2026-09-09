# Seguridad del Backend — Hidro Smart

Estado de implementación: la autenticación activa usa JWT, refresh tokens,
revocación de sesiones y recuperación por correo SMTP. Las secciones de MFA,
Redis y actuadores describen capacidades futuras o legado y no deben tratarse
como rutas disponibles mientras no aparezcan montadas en `src/app.js`.

## 1. Introducción

Este documento define las medidas de seguridad que debe implementar el backend de Hidro Smart para proteger:

- Usuarios.
- Credenciales.
- Sesiones.
- Datos de los hogares.
- Dispositivos IoT.
- Lecturas de consumo.
- Alertas.
- Electroválvula.
- Hidrobomba.
- Comunicación MQTT.
- API REST.
- Base de datos PostgreSQL.

La seguridad debe aplicarse desde el diseño del sistema y no únicamente como una capa posterior.

---

# 2. Objetivos de seguridad

El backend debe garantizar principalmente:

| Objetivo | Aplicación |
|---|---|
| Autenticación | Verificar la identidad del usuario |
| Autorización | Determinar qué puede hacer cada usuario |
| Confidencialidad | Proteger información sensible |
| Integridad | Evitar modificaciones no autorizadas |
| Disponibilidad | Mantener los servicios funcionando |
| Trazabilidad | Registrar operaciones importantes |
| Aislamiento | Evitar acceso entre hogares |
| Seguridad IoT | Proteger dispositivos y comandos |

---

# 3. Capas de seguridad

La seguridad de Hidro Smart se divide en varias capas:

```text
┌──────────────────────────┐
│       Frontend            │
└────────────┬─────────────┘
             │ HTTPS
             ▼
┌──────────────────────────┐
│      API REST             │
│ Auth / Validation / Rate  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      Application          │
│       Use Cases           │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         Domain            │
│     Reglas de negocio     │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      PostgreSQL           │
│       RLS + BD            │
└──────────────────────────┘

              +
              
┌──────────────────────────┐
│          MQTT             │
│       Seguridad IoT       │
└──────────────────────────┘
```

---

# 4. Autenticación

La autenticación permite verificar que un usuario sea realmente quien dice ser.

El flujo será:

```text
Usuario
   ↓
POST /api/v1/auth/login
   ↓
Validar credenciales
   ↓
Generar tokens
   ↓
Access Token + Refresh Token
   ↓
Cliente
```

---

# 5. Contraseñas

Las contraseñas nunca deben almacenarse directamente.

No se debe guardar:

```text
password = "CAMBIA_ESTA_CONTRASENA"
```

Se debe almacenar únicamente un hash seguro.

Conceptualmente:

```text
Contraseña
    ↓
Hash
    ↓
password_hash
```

El backend utilizará una función de hash adecuada para contraseñas, como Argon2id o bcrypt, de acuerdo con la implementación definitiva del proyecto.

---

# 6. Login

El proceso de inicio de sesión será:

```text
POST /auth/login
        ↓
Validar email
        ↓
Buscar usuario
        ↓
Comparar contraseña
        ↓
¿Correcta?
   ┌────┴────┐
   │         │
  NO        SÍ
   │         │
   ▼         ▼
 Error    Crear sesión
             │
             ▼
        Generar tokens
```

No se deben revelar detalles innecesarios cuando el login falla.

---

# 7. JWT

El backend utilizará JWT para la autenticación stateless.

Se contemplan dos tipos:

```text
Access Token
Refresh Token
```

El Access Token tendrá una duración corta.

El Refresh Token tendrá una duración mayor y permitirá obtener nuevos Access Tokens.

La duración exacta debe configurarse mediante variables de entorno.

---

# 8. Access Token

El Access Token será utilizado para acceder a los endpoints protegidos.

Ejemplo conceptual:

```http
Authorization: Bearer <access_token>
```

El middleware:

```text
auth.middleware.js
```

será responsable de validar el token antes de permitir el acceso.

---

# 9. Refresh Token

El Refresh Token permite renovar la autenticación sin solicitar nuevamente las credenciales.

Flujo:

```text
Access Token
     ↓
Expira
     ↓
Refresh Token
     ↓
POST /auth/refresh
     ↓
Nuevo Access Token
```

Los Refresh Tokens deben manejarse de forma segura y poder ser revocados.

---

# 10. Logout

El logout debe invalidar la sesión o token correspondiente.

Flujo:

```text
Usuario
   ↓
POST /auth/logout
   ↓
Invalidar sesión/token
   ↓
Respuesta
```

Si se utiliza Redis para una blacklist, los tokens revocados pueden registrarse allí hasta su expiración.

---

# 11. Middleware de autenticación

Archivo:

```text
src/api/middlewares/auth.middleware.js
```

Responsabilidades:

- Obtener el token.
- Validar su estructura.
- Verificar su firma.
- Verificar expiración.
- Identificar al usuario.
- Adjuntar el contexto autenticado a la petición.

Conceptualmente:

```text
Request
   ↓
Auth Middleware
   ↓
¿Token válido?
 ┌─┴─┐
No  Sí
│    │
403  ▼
    Controller
```

---

# 12. Autorización

Autenticación y autorización son conceptos diferentes.

### Autenticación

Responde:

> ¿Quién eres?

### Autorización

Responde:

> ¿Qué puedes hacer?

El backend debe implementar ambas.

---

# 13. Roles

Los roles permiten controlar las operaciones disponibles para cada usuario.

Ejemplo conceptual:

```text
Usuario
   │
   └── Rol
        │
        ├── Permiso
        ├── Permiso
        └── Permiso
```

Los roles y permisos deben respetar el modelo definido en la base de datos de Hidro Smart.

---

# 14. Authorization Middleware

Archivo:

```text
src/api/middlewares/authorization.middleware.js
```

Este middleware comprueba que el usuario autenticado tenga autorización para realizar una operación.

Ejemplo:

```text
Usuario autenticado
        ↓
¿Tiene permiso?
   ┌────┴────┐
  NO        SÍ
   │         │
   ▼         ▼
 403      Controller
```

---

# 15. Seguridad por hogar

Una de las reglas más importantes es impedir que un usuario consulte o modifique información de un hogar al que no pertenece.

Ejemplo:

```text
Usuario A
   ↓
Hogar A
   ↓
Dispositivo A
```

No debe poder acceder a:

```text
Hogar B
Dispositivo B
Consumo B
Alertas B
```

aunque conozca el identificador.

---

# 16. Row Level Security

PostgreSQL puede utilizar Row Level Security (RLS) para reforzar el aislamiento de información.

La seguridad se puede aplicar directamente sobre las filas de las tablas.

Conceptualmente:

```text
Usuario
   ↓
Backend
   ↓
PostgreSQL
   ↓
RLS
   ↓
Solo filas autorizadas
```

Esto crea una segunda barrera además de la autorización del backend.

---

# 17. Funciones de seguridad de hogares

En la arquitectura de Hidro Smart se contemplan funciones como:

```text
fn_is_home_member
fn_is_home_owner
```

Estas funciones pueden utilizarse para determinar:

- Si un usuario pertenece a un hogar.
- Si un usuario es propietario.
- Si puede realizar una operación determinada.

La implementación definitiva debe coincidir con la versión vigente de la base de datos.

---

# 18. Validación de entrada

Todas las entradas provenientes del cliente deben validarse.

Ejemplos:

```text
Email
Password
Home ID
Device ID
Flow rate
Commands
Dates
Pagination
```

Los validators estarán en:

```text
src/api/validators/
```

Por ejemplo:

```text
auth.validator.js
device.validator.js
consumption.validator.js
actuator.validator.js
```

---

# 19. Validación de datos IoT

Los mensajes provenientes del ESP32 tampoco deben considerarse confiables automáticamente.

El backend debe comprobar:

```text
¿Mensaje válido?
¿Device ID válido?
¿Dispositivo registrado?
¿Formato correcto?
¿Valores permitidos?
```

Flujo:

```text
MQTT
 ↓
Parser
 ↓
Validation
 ↓
Business Rules
 ↓
Database
```

---

# 20. Protección de comandos de actuadores

Los comandos relacionados con actuadores requieren especial protección.

Ejemplos:

```text
OPEN_VALVE
CLOSE_VALVE
START_PUMP
STOP_PUMP
```

No deberían ejecutarse simplemente porque el usuario está autenticado.

Debe comprobarse:

```text
Usuario autenticado
        ↓
¿Tiene permiso?
        ↓
¿Pertenece al hogar?
        ↓
¿Puede controlar el dispositivo?
        ↓
Enviar comando MQTT
```

---

# 21. Flujo seguro de electroválvula

```text
Frontend
   ↓
POST /actuators/valve/open
   ↓
Auth Middleware
   ↓
Authorization Middleware
   ↓
Validation
   ↓
OpenValve Use Case
   ↓
Comprobar hogar/dispositivo
   ↓
MQTT Publisher
   ↓
ESP32
   ↓
MOSFET
   ↓
Electroválvula
```

---

# 22. Flujo seguro de hidrobomba

```text
Frontend
   ↓
POST /actuators/pump/start
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
StartPump
   ↓
Validar dispositivo
   ↓
MQTT
   ↓
ESP32
   ↓
Controlador
   ↓
Hidrobomba
```

---

# 23. Principio de mínimo privilegio

Cada componente debe tener únicamente los permisos necesarios.

Ejemplo:

```text
Usuario
   ↓
Permisos necesarios
```

El backend no debe entregar permisos administrativos por defecto.

Los usuarios tampoco deben tener acceso directo a PostgreSQL.

---

# 24. Seguridad de la base de datos

El backend debe conectarse mediante un usuario específico de aplicación.

No se recomienda utilizar el usuario administrador de PostgreSQL para las operaciones normales de la aplicación.

Conceptualmente:

```text
Backend
   ↓
hidro_smart_app
   ↓
PostgreSQL
```

Los permisos deben limitarse a las operaciones necesarias.

---

# 25. Separación de usuarios de BD

En el sistema pueden existir diferentes usuarios técnicos para diferentes responsabilidades.

Por ejemplo:

```text
hidro_smart_app
hidro_smart_ingest
```

La separación debe mantenerse si está contemplada por la base de datos y la arquitectura definitiva.

Esto permite aplicar diferentes niveles de privilegio.

---

# 26. Protección de variables de entorno

Información sensible no debe almacenarse directamente en el código.

Ejemplos:

```text
DATABASE_PASSWORD
JWT_SECRET
MQTT_PASSWORD
REDIS_PASSWORD
```

Deben configurarse mediante:

```text
.env
```

El archivo `.env` no debe subirse al repositorio.

Debe existir:

```text
.env.example
```

sin credenciales reales.

---

# 27. HTTPS

La comunicación entre frontend y backend debe utilizar HTTPS en producción.

```text
Frontend
   │
 HTTPS
   ▼
Backend
```

Esto protege:

- Credenciales.
- Tokens.
- Información de usuario.
- Datos de consumo.
- Comandos.

---

# 28. TLS para MQTT

La comunicación MQTT también debe protegerse cuando el entorno de producción lo requiera.

Conceptualmente:

```text
ESP32
   │
 TLS
   ▼
MQTT Broker
   │
 TLS
   ▼
Backend
```

La configuración debe coincidir con el broker utilizado.

---

# 29. Seguridad del MQTT Broker

El broker debe controlar quién puede publicar y suscribirse.

Conceptualmente:

```text
ESP32
   ↓
Puede publicar:
device/{id}/reading

Backend
   ↓
Puede publicar:
device/{id}/command
```

El acceso a topics debe restringirse mediante ACL cuando el broker utilizado lo soporte.

---

# 30. Aislamiento de dispositivos

Un dispositivo no debería poder publicar libremente en topics de otro dispositivo.

Ejemplo:

```text
ESP32-A
   ↓
device/A/reading
```

No debería poder escribir:

```text
device/B/command
```

La identificación y autorización de dispositivos deben formar parte de la configuración IoT.

---

# 31. Rate Limiting

La API debe limitar solicitudes excesivas.

Archivo:

```text
src/api/middlewares/rate-limit.middleware.js
```

Es especialmente importante para:

```text
/login
/register
/refresh
```

También puede aplicarse a otros endpoints sensibles.

---

# 32. Protección contra fuerza bruta

Los intentos repetidos de autenticación deben controlarse.

Ejemplo:

```text
Login
 ↓
Intento 1
Intento 2
Intento 3
...
 ↓
Rate Limit / bloqueo temporal
```

La política concreta debe definirse según los requisitos de seguridad del proyecto.

---

# 33. Manejo de errores

Los errores internos no deben revelar información sensible.

No se debe responder al usuario con:

```text
password_hash
SQL completo
credenciales
stack trace
variables de entorno
```

El cliente debe recibir mensajes controlados.

---

# 34. Error Middleware

Archivo:

```text
src/api/middlewares/error.middleware.js
```

Responsabilidades:

- Capturar errores.
- Clasificarlos.
- Registrar detalles internamente.
- Devolver respuestas controladas.
- Evitar exposición de información sensible.

---

# 35. Auditoría

Las operaciones sensibles deben poder quedar registradas.

Ejemplos:

```text
Login
Logout
Cambio de contraseña
Creación de hogar
Registro de dispositivo
Control de electroválvula
Control de hidrobomba
Eliminación de cuenta
```

La auditoría debe respetar las tablas y mecanismos definidos en la base de datos.

---

# 36. Seguridad al eliminar una cuenta

La eliminación de una cuenta debe respetar las reglas definidas para Hidro Smart.

Cuando corresponda, los datos personales pueden anonimizarse en lugar de conservar información identificable innecesariamente.

La implementación exacta debe seguir las reglas del modelo de datos vigente.

---

# 37. Protección de DTOs

Los DTO de respuesta no deben exponer información sensible.

No debe enviarse al frontend:

```text
password_hash
salt
JWT secrets
database credentials
internal security data
```

Ejemplo:

```text
UserResponse
├── id
├── email
├── name
└── status
```

y no:

```text
password_hash
salt
```

---

# 38. Caché y seguridad

Si Redis se utiliza para caché, no se deben almacenar datos sensibles sin una razón justificada.

También deben definirse:

- TTL.
- Invalidación.
- Separación de claves.
- Protección de Redis.

---

# 39. Seguridad de sesiones

Las sesiones deben poder:

- Identificarse.
- Expirarse.
- Revocarse.
- Asociarse con el usuario correspondiente.

El backend debe evitar mantener sesiones críticas únicamente en memoria local si se pretende escalar horizontalmente.

---

# 40. Protección contra acceso directo

Los usuarios no deben poder acceder directamente a:

```text
PostgreSQL
Redis
MQTT Broker
```

desde Internet.

La arquitectura debe mantener estos componentes protegidos dentro de la infraestructura.

```text
Internet
   ↓
Backend
   ↓
Servicios internos
```

---

# 41. Seguridad de Docker

Los servicios deben ejecutarse con la menor cantidad posible de privilegios.

Además:

- No incluir secretos en imágenes.
- Utilizar `.env`.
- No exponer puertos innecesarios.
- Mantener imágenes actualizadas.
- Separar servicios mediante redes Docker.

---

# 42. Dependencias

Las dependencias de Node.js deben mantenerse actualizadas.

El proyecto debe revisar periódicamente:

```text
npm audit
```

y utilizar versiones compatibles y soportadas de las librerías.

---

# 43. Logs

El sistema debe registrar eventos relevantes mediante un logger centralizado.

Archivo:

```text
src/shared/utils/logger.js
```

Los logs pueden incluir:

```text
INFO
WARN
ERROR
DEBUG
```

Nunca deben registrarse:

```text
Contraseñas
JWT completos
Secretos
Credenciales MQTT
Credenciales de BD
```

---

# 44. Seguridad por capas

Hidro Smart no debe depender de una única medida de seguridad.

Ejemplo:

```text
JWT
  +
Roles
  +
Permisos
  +
Validación
  +
RLS
  +
MQTT ACL
  +
HTTPS/TLS
  +
Rate Limit
  +
Auditoría
```

Si una capa falla, las demás deben reducir el impacto.

---

# 45. Flujo general de una petición protegida

```text
                    REQUEST
                       │
                       ▼
               ┌───────────────┐
               │ Authentication│
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │ Authorization │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │  Validation   │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │  Use Case     │
               └───────┬───────┘
                       │
                       ▼
               ┌───────────────┐
               │ Repository    │
               └───────┬───────┘
                       │
                       ▼
                  PostgreSQL
                       │
                       ▼
                    RESPONSE
```

---

# 46. Flujo de seguridad IoT

```text
ESP32
  │
  │ MQTT/TLS
  ▼
MQTT Broker
  │
  │ ACL
  ▼
Backend
  │
  ├── Validación
  ├── Identificación
  ├── Reglas de negocio
  └── Persistencia
  │
  ▼
PostgreSQL
```

---

# 47. Seguridad de los actuadores

Los actuadores representan una operación crítica porque pueden producir una acción física.

Por eso:

```text
OPEN_VALVE
CLOSE_VALVE
START_PUMP
STOP_PUMP
```

deben pasar por:

```text
Autenticación
      ↓
Autorización
      ↓
Validación
      ↓
Regla de negocio
      ↓
MQTT
      ↓
ESP32
```

No se debe permitir que una petición HTTP salte directamente desde el controlador hasta MQTT sin pasar por el caso de uso.

---

# 48. Principios aplicados

La seguridad del backend sigue principalmente:

### Mínimo privilegio

Cada usuario y servicio obtiene únicamente los permisos necesarios.

### Defensa en profundidad

Se utilizan varias capas de protección.

### Separación de responsabilidades

Autenticación, autorización, validación y reglas de negocio se mantienen separadas.

### Fail Secure

Cuando una validación falla, la operación debe bloquearse.

### No confiar en el cliente

Ni el frontend ni el ESP32 deben considerarse automáticamente confiables.

---

# 49. Resumen de componentes

```text
src/
├── api/
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── authorization.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rate-limit.middleware.js
│   │   └── error.middleware.js
│   │
│   └── validators/
│
├── core/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── mqtt/
│
├── shared/
│   └── utils/
│       ├── jwt.js
│       ├── password.js
│       └── logger.js
│
└── config/
```

---

# 50. Conclusión

La seguridad de Hidro Smart debe proteger tanto la información digital como las operaciones físicas del sistema.

La protección se basa en:

```text
Usuario
  ↓
JWT
  ↓
Roles / Permisos
  ↓
Validación
  ↓
Casos de uso
  ↓
RLS / PostgreSQL
```

y para IoT:

```text
ESP32
  ↓
MQTT seguro
  ↓
Backend
  ↓
Validación
  ↓
Autorización
  ↓
Comando
  ↓
ESP32
  ↓
Actuador
```

De esta manera, el backend mantiene el control de la lógica de negocio y evita que un usuario, dispositivo o cliente pueda ejecutar operaciones para las que no está autorizado.
