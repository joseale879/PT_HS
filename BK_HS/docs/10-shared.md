# Shared — Hidro Smart

## 1. Introducción

La carpeta `shared` contiene componentes reutilizables por diferentes partes del backend.

Su objetivo es evitar duplicación de código y centralizar funcionalidades generales que no pertenecen directamente a un dominio específico.

Se encuentra en:

```text
src/
└── shared/
    ├── constants/
    ├── utils/
    │   ├── logger.js
    │   ├── jwt.js
    │   └── password.js
    └── exceptions/
```

---

# 2. Responsabilidad de Shared

`shared` contiene funcionalidades transversales del sistema.

Por ejemplo:

- Logger.
- JWT.
- Manejo de contraseñas.
- Constantes generales.
- Excepciones compartidas.
- Utilidades reutilizables.

No debe contener reglas específicas de un dominio.

Por ejemplo:

```text
shared/
```

Sí debería contener:

```text
jwt.js
logger.js
password.js
```

Pero no:

```text
calculateWaterConsumptionForHome.js
```

porque esa lógica pertenece al dominio/application de consumo.

---

# 3. Estructura

```text
shared/
│
├── constants/
│
├── utils/
│   ├── logger.js
│   ├── jwt.js
│   └── password.js
│
└── exceptions/
```

---

# 4. Constants

Ubicación:

```text
src/shared/constants/
```

Contiene valores constantes utilizados por diferentes partes del backend.

Ejemplos:

```text
Roles
Estados
Tipos de dispositivos
Tipos de actuadores
Estados de actuadores
Códigos de error
Configuraciones generales
```

---

# 5. ¿Por qué utilizar constantes?

Evita repetir valores directamente en el código.

En lugar de:

```text
if status === "ACTIVE"
```

se puede utilizar una constante:

```text
DEVICE_STATUS.ACTIVE
```

Esto facilita el mantenimiento y reduce errores de escritura.

---

# 6. Constantes relacionadas con dispositivos

Hidro Smart tiene dispositivos IoT, por lo que pueden existir constantes relacionadas con:

```text
Device
Sensor
Actuator
Valve
Pump
```

Ejemplo conceptual:

```text
DEVICE_STATUS
├── ONLINE
├── OFFLINE
└── ERROR
```

Los valores definitivos deben coincidir con los definidos en la base de datos y con el firmware del ESP32.

---

# 7. Constantes de actuadores

Los actuadores principales del proyecto son:

```text
Electroválvula
Hidrobomba
```

Por lo tanto pueden existir constantes para:

```text
VALVE
PUMP
```

y sus estados:

```text
OPEN
CLOSED
ON
OFF
```

Estas constantes deben mantenerse consistentes con MQTT y la base de datos.

---

# 8. Utils

Ubicación:

```text
src/shared/utils/
```

Contiene funciones reutilizables.

Actualmente se contempla:

```text
logger.js
jwt.js
password.js
```

---

# 9. logger.js

Archivo:

```text
src/shared/utils/logger.js
```

Su función es centralizar el registro de información del backend.

Puede utilizarse para registrar:

- Información.
- Advertencias.
- Errores.
- Procesos importantes.
- Jobs.
- Conexiones.
- Eventos técnicos.

---

# 10. Uso del Logger

En lugar de utilizar diferentes métodos de impresión por todo el proyecto:

```text
console.log(...)
console.error(...)
```

se debe utilizar el logger centralizado.

Conceptualmente:

```text
Controller
     │
     ▼
   Logger
     │
     ▼
Registro
```

Esto permite mantener un formato uniforme.

---

# 11. Información que NO debe registrarse

El logger nunca debe almacenar información sensible como:

```text
Contraseñas
Tokens completos
Secretos JWT
Credenciales MQTT
Claves privadas
```

Si una información sensible necesita aparecer para depuración, debe ocultarse o anonimizarse.

---

# 12. jwt.js

Archivo:

```text
src/shared/utils/jwt.js
```

Centraliza las operaciones relacionadas con JSON Web Tokens.

Puede encargarse de:

```text
Generar token
Validar token
Decodificar token
```

La autenticación será utilizada principalmente por el módulo de usuarios.

---

# 13. Flujo JWT

```text
Usuario
   ↓
Login
   ↓
Backend
   ↓
Validar credenciales
   ↓
Generar JWT
   ↓
Frontend
```

Posteriormente:

```text
Frontend
   ↓
Request + JWT
   ↓
Auth Middleware
   ↓
Validación
   ↓
Controller
```

---

# 14. Access Token

El Access Token permite que el cliente realice peticiones autenticadas.

Flujo:

```text
Login
 ↓
Access Token
 ↓
Request
 ↓
Authorization Middleware
 ↓
Endpoint
```

El tiempo de expiración debe definirse mediante configuración y no quedar escrito directamente en múltiples archivos.

---

# 15. Refresh Token

El Refresh Token permite obtener un nuevo Access Token sin solicitar nuevamente las credenciales.

Conceptualmente:

```text
Access Token
     ↓
Expira
     ↓
Refresh Token
     ↓
Nuevo Access Token
```

Los mecanismos exactos de almacenamiento, revocación y expiración deben mantenerse consistentes con la implementación de autenticación y la base de datos.

---

# 16. password.js

Archivo:

```text
src/shared/utils/password.js
```

Contiene las funciones relacionadas con el manejo seguro de contraseñas.

Responsabilidades:

```text
Hash de contraseña
Verificación de contraseña
```

Nunca se deben almacenar contraseñas en texto plano.

---

# 17. Flujo de contraseña

Durante el registro:

```text
Contraseña
    ↓
password.js
    ↓
Hash
    ↓
PostgreSQL
```

Durante el login:

```text
Contraseña ingresada
       ↓
password.js
       ↓
Comparación con hash
       ↓
Resultado
```

---

# 18. Excepciones

Ubicación:

```text
src/shared/exceptions/
```

Contendrá errores reutilizables por diferentes módulos.

Ejemplos conceptuales:

```text
ApplicationError
InfrastructureError
AuthenticationError
NotFoundError
```

La estructura definitiva de excepciones debe mantenerse separada de los errores específicos del dominio.

---

# 19. Diferencia entre Domain y Shared

Es importante no mezclar responsabilidades.

### Domain

Contiene errores relacionados directamente con reglas del negocio.

Ejemplo:

```text
DeviceCannotBeActivatedError
```

### Shared

Contiene errores o herramientas que pueden ser utilizados por diferentes módulos.

Ejemplo:

```text
AuthenticationError
```

---

# 20. Shared y arquitectura

La relación general es:

```text
                 API
                  │
                  ▼
             Application
                  │
          ┌───────┴───────┐
          ▼               ▼
       Domain          Shared
          │               │
          └───────┬───────┘
                  ▼
           Infrastructure
```

`Shared` puede ser utilizado por diferentes capas, siempre evitando introducir dependencias que rompan la arquitectura.

---

# 21. Shared y MQTT

MQTT puede utilizar elementos de `shared`.

Por ejemplo:

```text
MQTT
 ↓
constants
 ↓
Estados / tipos
```

Pero `shared` no debe depender directamente del MQTT Broker.

---

# 22. Shared y Jobs

Los Jobs pueden utilizar:

```text
logger
constants
exceptions
```

Ejemplo:

```text
daily-consumption.job
        ↓
logger
        ↓
Registro del proceso
```

---

# 23. Shared y API

Los controladores y middlewares pueden utilizar:

```text
logger
jwt
exceptions
constants
```

Por ejemplo:

```text
Request
   ↓
Auth Middleware
   ↓
jwt.js
   ↓
Validación
```

---

# 24. Variables de entorno

Los secretos y configuraciones sensibles no deben almacenarse en `shared`.

Por ejemplo, una clave JWT no debería estar escrita directamente en:

```text
jwt.js
```

Debe obtenerse desde la configuración:

```text
.env
   ↓
config/environment.js
   ↓
jwt.js
```

---

# 25. Principio de reutilización

Antes de crear una función nueva, se debe revisar si la funcionalidad ya existe en `shared`.

Por ejemplo:

```text
¿Necesito generar un JWT?
        ↓
Sí
        ↓
Usar shared/utils/jwt.js
```

No crear otro sistema de JWT dentro de cada módulo.

---

# 26. No convertir Shared en un "cajón"

No se debe colocar cualquier código que no se sepa dónde ubicar.

Incorrecto:

```text
shared/
├── calculateConsumption.js
├── createAlert.js
├── registerDevice.js
└── doEverything.js
```

Correcto:

```text
shared/
├── constants/
├── utils/
└── exceptions/
```

y las reglas de negocio permanecen en sus respectivos módulos.

---

# 27. Pruebas

Las utilidades de `shared` deben tener pruebas unitarias.

Ejemplos:

### JWT

```text
Generar token
Validar token
Token expirado
Token inválido
```

### Password

```text
Generar hash
Comparar contraseña correcta
Rechazar contraseña incorrecta
```

### Logger

Se puede verificar que los métodos principales funcionen correctamente y que no se exponga información sensible.

---

# 28. Estructura de pruebas

```text
tests/
└── unit/
    └── shared/
        ├── jwt.test.js
        ├── password.test.js
        └── logger.test.js
```

La estructura exacta puede ajustarse al framework de pruebas elegido.

---

# 29. Reglas de implementación

### Regla 1

No guardar secretos directamente en el código.

### Regla 2

No guardar contraseñas en texto plano.

### Regla 3

No registrar tokens o contraseñas en logs.

### Regla 4

No colocar lógica de negocio dentro de `shared`.

### Regla 5

Las constantes deben tener una única fuente.

### Regla 6

Las utilidades deben ser reutilizables.

---

# 30. Relación con Hidro Smart

`Shared` sirve como base transversal para todos los módulos:

```text
                 SHARED
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
      AUTH        HOME       DEVICE
       │           │           │
       ├───────────┼───────────┤
       ▼           ▼           ▼
 CONSUMPTION     ALERT       ACTUATOR
       │           │           │
       └───────────┼───────────┘
                   ▼
                 SHARED
```

Esto permite reutilizar componentes comunes sin duplicarlos.

---

# 31. Estructura final

```text
src/
│
├── shared/
│   │
│   ├── constants/
│   │   ├── device.constants.js
│   │   ├── actuator.constants.js
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   ├── jwt.js
│   │   └── password.js
│   │
│   └── exceptions/
│       ├── ApplicationError.js
│       ├── AuthenticationError.js
│       └── NotFoundError.js
```

Los nombres adicionales son una propuesta de organización y deberán ajustarse a la implementación definitiva.

---

# 32. Resumen

La carpeta `shared` contiene las funcionalidades que pueden ser utilizadas por diferentes partes del backend.

Sus principales responsabilidades son:

```text
constants/
    ↓
Valores compartidos

utils/
    ↓
Funciones reutilizables

exceptions/
    ↓
Errores compartidos
```

En Hidro Smart, los componentes más importantes inicialmente son:

```text
logger.js
jwt.js
password.js
```

La regla principal es:

> **Shared contiene herramientas comunes, no lógica específica del negocio.**