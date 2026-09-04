# Configuración del Backend — Hidro Smart

## 1. Introducción

La carpeta `config` contiene la configuración necesaria para ejecutar el backend de Hidro Smart.

Su función es centralizar la configuración de:

- PostgreSQL.
- Variables de entorno.
- MQTT.
- Redis.

Se encuentra en:

```text
src/
└── config/
    ├── database.js
    ├── environment.js
    ├── mqtt.js
    └── redis.js
```

---

# 2. Estructura

```text
config/
│
├── database.js
├── environment.js
├── mqtt.js
└── redis.js
```

Cada archivo tiene una responsabilidad específica.

---

# 3. environment.js

Archivo:

```text
src/config/environment.js
```

Es el punto central para leer y validar las variables de entorno utilizadas por el backend.

El objetivo es evitar que las configuraciones sensibles estén escritas directamente en el código.

---

# 4. Variables de entorno

La configuración debe obtenerse desde `.env`.

Ejemplos de información que puede manejar:

```text
PORT
NODE_ENV

DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD

MQTT_BROKER_URL
MQTT_USERNAME
MQTT_PASSWORD

REDIS_HOST
REDIS_PORT
REDIS_PASSWORD

JWT_SECRET
JWT_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN
```

Los nombres definitivos deben mantenerse consistentes con el entorno de ejecución y Docker Compose.

---

# 5. `.env`

El archivo:

```text
.env
```

contiene valores específicos del entorno local.

Ejemplo conceptual:

```text
NODE_ENV=development
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=hidro_smart
DATABASE_USER=postgres
DATABASE_PASSWORD=********

MQTT_BROKER_URL=********

REDIS_HOST=localhost
REDIS_PORT=6379
```

Los valores reales no deben publicarse en GitHub.

---

# 6. `.env.example`

También debe existir:

```text
.env.example
```

Este archivo sirve como plantilla para otros desarrolladores.

Debe contener los nombres de las variables, pero no los secretos reales.

Ejemplo:

```text
NODE_ENV=
PORT=

DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

MQTT_BROKER_URL=
MQTT_USERNAME=
MQTT_PASSWORD=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

JWT_SECRET=
```

---

# 7. Seguridad de `.env`

`.env` debe incluirse en:

```text
.gitignore
```

Por ejemplo:

```text
.env
```

No se deben subir al repositorio:

- Contraseñas.
- Secretos JWT.
- Credenciales MQTT.
- Credenciales de Redis.
- Credenciales de PostgreSQL.

---

# 8. database.js

Archivo:

```text
src/config/database.js
```

Su responsabilidad es configurar la conexión del backend con PostgreSQL.

El flujo es:

```text
Application
     ↓
Repository
     ↓
Database Configuration
     ↓
PostgreSQL
```

---

# 9. PostgreSQL

Hidro Smart utiliza PostgreSQL como base de datos principal.

La configuración debe permitir establecer:

```text
Host
Puerto
Base de datos
Usuario
Contraseña
```

mediante variables de entorno.

---

# 10. Pool de conexiones

El backend debe utilizar un pool de conexiones para administrar las conexiones a PostgreSQL.

Conceptualmente:

```text
Backend
   │
   ▼
Connection Pool
 ┌──┬──┬──┬──┐
 │  │  │  │  │
 ▼  ▼  ▼  ▼  ▼
PostgreSQL
```

Esto evita crear una conexión nueva para cada petición.

---

# 11. Configuración del Pool

La configuración puede contemplar:

```text
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
```

También pueden existir parámetros relacionados con:

```text
Máximo de conexiones
Tiempo de espera
Tiempo de conexión inactiva
```

Los valores definitivos deben ajustarse según el entorno de desarrollo y producción.

---

# 12. PostgreSQL y Docker

Cuando PostgreSQL se ejecute mediante Docker Compose, el backend debe utilizar el nombre del servicio Docker como host cuando ambos estén dentro de la misma red.

Conceptualmente:

```text
Docker Compose
│
├── backend
│
└── postgres
```

Dentro de Docker:

```text
Backend → postgres:5432
```

No necesariamente:

```text
Backend → localhost:5432
```

`localhost` dentro del contenedor del backend hace referencia al propio contenedor.

---

# 13. mqtt.js

Archivo:

```text
src/config/mqtt.js
```

Contiene la configuración necesaria para conectar el backend con el MQTT Broker.

La comunicación será utilizada para conectar:

```text
Backend ↔ MQTT Broker ↔ ESP32
```

---

# 14. Configuración MQTT

La configuración puede incluir:

```text
MQTT_BROKER_URL
MQTT_USERNAME
MQTT_PASSWORD
MQTT_CLIENT_ID
MQTT_PORT
```

Los valores deben obtenerse desde las variables de entorno.

---

# 15. Flujo MQTT

```text
Backend
   │
   ▼
MqttClient
   │
   ▼
MQTT Broker
   │
   ▼
ESP32
```

Para recibir información:

```text
ESP32
   │
   ▼
MQTT Broker
   │
   ▼
MqttSubscriber
   │
   ▼
Backend
```

---

# 16. Redis

Archivo:

```text
src/config/redis.js
```

Contiene la configuración de Redis.

Redis puede utilizarse como infraestructura complementaria para:

- Caché.
- Datos temporales.
- Gestión de sesiones o tokens según la implementación.
- Procesos que requieran almacenamiento rápido.

No reemplaza PostgreSQL como base de datos principal.

---

# 17. Configuración Redis

Puede utilizar variables como:

```text
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
```

Ejemplo conceptual:

```text
Redis
   │
   └── Host: redis
       Port: 6379
```

El valor real dependerá del entorno.

---

# 18. Redis y Docker

Si Redis está dentro de Docker Compose:

```text
Docker Compose
│
├── backend
├── postgres
└── redis
```

El backend puede comunicarse mediante el nombre del servicio:

```text
redis:6379
```

en lugar de `localhost`.

---

# 19. Redis como caché

Un posible flujo es:

```text
Frontend
   ↓
API
   ↓
¿Existe información en Redis?
   │
   ├── Sí → Redis → Respuesta
   │
   └── No
        ↓
    PostgreSQL
        ↓
      Redis
        ↓
    Respuesta
```

Esto puede utilizarse para consultas frecuentes.

---

# 20. Configuración y arquitectura

La configuración no debe contener lógica de negocio.

Por ejemplo:

```text
config/database.js
```

debe encargarse de configurar PostgreSQL.

No debería decidir:

```text
"Si el consumo supera X litros, crear una alerta."
```

Esa regla pertenece a Domain/Application.

---

# 21. Dependencias de configuración

La configuración sirve como punto de entrada para la infraestructura.

Conceptualmente:

```text
.env
 │
 ▼
environment.js
 │
 ├──────────────┐
 ▼              ▼
database.js   mqtt.js
 │              │
 ▼              ▼
PostgreSQL   MQTT Broker

       redis.js
          │
          ▼
        Redis
```

---

# 22. Inicio del backend

Cuando se inicia Hidro Smart:

```text
server.js
    ↓
app.js
    ↓
Cargar configuración
    ↓
Validar variables
    ↓
Conectar PostgreSQL
    ↓
Conectar Redis
    ↓
Conectar MQTT
    ↓
Iniciar API
```

La secuencia exacta puede variar según la implementación.

---

# 23. Validación de configuración

El backend debería verificar que las variables obligatorias existan.

Por ejemplo:

```text
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
```

Si falta una variable crítica:

```text
Backend
   ↓
environment.js
   ↓
Configuración inválida
   ↓
Error de inicio
```

Esto evita que el sistema arranque parcialmente configurado.

---

# 24. Diferentes entornos

La configuración debe permitir trabajar en diferentes entornos.

Por ejemplo:

```text
development
test
production
```

Conceptualmente:

```text
development
    ↓
.env

test
    ↓
.env.test

production
    ↓
Variables del entorno de despliegue
```

Los nombres y archivos concretos pueden definirse posteriormente.

---

# 25. Configuración para pruebas

Las pruebas no deberían depender obligatoriamente de la base de datos de desarrollo.

Por ejemplo:

```text
NODE_ENV=test
```

puede utilizar una configuración independiente.

Esto evita que las pruebas modifiquen accidentalmente los datos reales de desarrollo.

---

# 26. Configuración y seguridad

Nunca se deben escribir secretos directamente en:

```text
database.js
mqtt.js
redis.js
jwt.js
```

Incorrecto:

```text
password = "CAMBIA_ESTA_CONTRASENA"
```

Correcto:

```text
password = process.env.DATABASE_PASSWORD
```

La aplicación debe obtener los valores desde el entorno.

---

# 27. Configuración y Docker Compose

La configuración del backend debe ser compatible con:

```text
docker-compose.yml
```

Conceptualmente:

```text
docker-compose.yml
       │
       ├── backend
       │
       ├── postgres
       │
       ├── redis
       │
       └── mqtt broker
```

Los servicios se comunican mediante la red interna de Docker.

---

# 28. Configuración del puerto HTTP

El backend necesita un puerto para exponer la API.

Por ejemplo:

```text
PORT=3000
```

El frontend podría comunicarse:

```text
Frontend
   ↓
HTTP
   ↓
Backend :3000
```

El puerto definitivo debe coincidir con Docker y la configuración del frontend.

---

# 29. Configuración de JWT

Aunque `jwt.js` está ubicado en:

```text
src/shared/utils/jwt.js
```

sus secretos y tiempos de expiración deben provenir de `config/environment.js`.

Flujo:

```text
.env
 ↓
environment.js
 ↓
jwt.js
 ↓
Generación/validación JWT
```

Esto mantiene separada la configuración de la lógica.

---

# 30. Configuración MQTT y ESP32

El backend debe tener una configuración compatible con el broker utilizado por el ESP32.

El flujo será:

```text
ESP32
   │
   │ Wi-Fi
   ▼
MQTT Broker
   │
   │
   ▼
Backend
```

El backend no necesita conocer los pines físicos del ESP32.

Por ejemplo, el backend no debe contener:

```text
GPIO 25
GPIO 26
```

La configuración de pines pertenece al firmware.

---

# 31. Configuración de actuadores

La electroválvula y la hidrobomba se controlan mediante comandos MQTT.

La configuración del backend solamente necesita conocer:

```text
Broker
Credenciales
Topics
QoS
Conexión
```

La lógica física:

```text
MQTT
 ↓
ESP32
 ↓
GPIO
 ↓
MOSFET / controlador
 ↓
Actuador
```

pertenece al ESP32.

---

# 32. Manejo de errores de conexión

Cada servicio externo puede fallar.

Por ejemplo:

```text
PostgreSQL → desconectado
Redis → desconectado
MQTT → desconectado
```

El backend debe registrar estos eventos mediante el logger.

Ejemplo:

```text
[DATABASE] Connection failed
[REDIS] Connection failed
[MQTT] Connection lost
```

No se deben registrar credenciales ni secretos.

---

# 33. Reconexión

Para servicios como MQTT y Redis puede ser necesario implementar mecanismos de reconexión.

Conceptualmente:

```text
Servicio
   ↓
Conexión perdida
   ↓
Registrar error
   ↓
Intentar reconectar
   ↓
Conexión recuperada
```

La estrategia concreta dependerá de las librerías utilizadas.

---

# 34. Health Check

La configuración puede utilizarse para implementar endpoints de salud.

Por ejemplo:

```text
GET /health
```

Puede comprobar:

```text
Backend
PostgreSQL
Redis
MQTT
```

Conceptualmente:

```text
/health
   │
   ├── API → OK
   ├── PostgreSQL → OK
   ├── Redis → OK
   └── MQTT → OK
```

El endpoint exacto debe definirse en la documentación de API.

---

# 35. Estructura final

```text
hidro-smart-backend/
│
├── src/
│   │
│   └── config/
│       ├── database.js
│       ├── environment.js
│       ├── mqtt.js
│       └── redis.js
│
├── .env
├── .env.example
├── .gitignore
└── docker-compose.yml
```

---

# 36. Resumen

La carpeta `config` centraliza la configuración técnica del backend.

```text
environment.js
        ↓
Variables de entorno

database.js
        ↓
PostgreSQL

mqtt.js
        ↓
MQTT Broker

redis.js
        ↓
Redis
```

El principio principal es:

> **La configuración debe estar separada del código y los secretos deben administrarse mediante variables de entorno.**

En Hidro Smart, esta configuración conecta las diferentes partes de infraestructura:

```text
                    BACKEND
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
 PostgreSQL          Redis          MQTT Broker
                                       │
                                       ▼
                                      ESP32
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                       Electroválvula       Hidrobomba
```
