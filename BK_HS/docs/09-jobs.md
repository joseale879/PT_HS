# Jobs — Hidro Smart

## 1. Introducción

Los `Jobs` son tareas automáticas que el backend ejecuta de forma programada sin que el usuario tenga que realizar una petición manual.

En Hidro Smart se utilizarán principalmente para:

- Generar resúmenes de consumo.
- Procesar información acumulada.
- Ejecutar tareas periódicas.
- Limpiar información temporal.
- Mantener el sistema organizado.
- Ejecutar procesos que no necesitan realizarse inmediatamente durante una petición HTTP.

---

# 2. Ubicación

Los Jobs estarán ubicados en:

```text
src/
└── jobs/
    ├── daily-consumption.job.js
    ├── summary.job.js
    └── cleanup.job.js
```

---

# 3. Estructura

```text
jobs/
│
├── daily-consumption.job.js
├── summary.job.js
└── cleanup.job.js
```

Cada archivo representa una tarea programada diferente.

---

# 4. ¿Por qué utilizar Jobs?

No todas las operaciones deben ejecutarse cuando el usuario hace una petición.

Por ejemplo, generar un resumen de consumo de todos los hogares puede ser una operación pesada.

En lugar de:

```text
Usuario
   ↓
Frontend
   ↓
API
   ↓
Calcular todo el historial
   ↓
Respuesta
```

se puede hacer:

```text
Job programado
      ↓
Procesa información
      ↓
Guarda resumen
```

Después, cuando el usuario consulta:

```text
Frontend
   ↓
API
   ↓
Resumen previamente calculado
   ↓
Respuesta rápida
```

---

# 5. daily-consumption.job.js

Archivo:

```text
src/jobs/daily-consumption.job.js
```

Su función principal es procesar el consumo correspondiente a un período diario.

Conceptualmente:

```text
Lecturas del día
      ↓
Procesamiento
      ↓
Consumo diario
      ↓
Base de datos
```

---

# 6. Procesamiento diario

El Job puede ejecutarse una vez terminado el día.

Por ejemplo:

```text
23:59 / 00:00
      ↓
daily-consumption.job
      ↓
Procesar lecturas
      ↓
Generar consumo diario
```

El horario definitivo dependerá de la configuración del sistema.

---

# 7. Información utilizada

El Job puede utilizar información almacenada por los dispositivos IoT.

Flujo:

```text
ESP32
 ↓
YF-S201
 ↓
MQTT
 ↓
Backend
 ↓
PostgreSQL
 ↓
Daily Consumption Job
```

El Job no recibe directamente datos del sensor.

Los datos primero deben haber sido procesados y almacenados por el backend.

---

# 8. summary.job.js

Archivo:

```text
src/jobs/summary.job.js
```

Su función es generar o actualizar información resumida para facilitar consultas.

Por ejemplo:

```text
Lecturas
   ↓
Procesamiento
   ↓
Resumen
   ↓
PostgreSQL
```

Puede generar información como:

- Consumo diario.
- Consumo semanal.
- Consumo mensual.
- Totales por hogar.
- Información necesaria para estadísticas.

Los datos concretos dependerán de las tablas disponibles en la base de datos final.

---

# 9. Ventaja de los resúmenes

Supongamos que un usuario solicita:

> "Muéstrame el consumo de los últimos 6 meses."

En lugar de procesar millones de lecturas cada vez:

```text
Frontend
 ↓
API
 ↓
Millones de lecturas
 ↓
Procesamiento
 ↓
Respuesta
```

se puede utilizar información resumida:

```text
Frontend
 ↓
API
 ↓
Resumen
 ↓
Respuesta
```

Esto mejora el rendimiento.

---

# 10. cleanup.job.js

Archivo:

```text
src/jobs/cleanup.job.js
```

Se encarga de tareas de mantenimiento.

Puede encargarse de información temporal que ya no sea necesaria.

Por ejemplo:

```text
Tokens expirados
Sesiones expiradas
Datos temporales
Registros que ya cumplieron su período de retención
```

La eliminación definitiva debe respetar las reglas de auditoría y conservación definidas para Hidro Smart.

---

# 11. Limpieza de sesiones

Un ejemplo:

```text
Sesiones expiradas
       ↓
cleanup.job
       ↓
Identificación
       ↓
Eliminación / actualización
```

No se deben eliminar registros que sean necesarios para auditoría o trazabilidad.

---

# 12. Jobs y base de datos

Los Jobs pueden leer y escribir en PostgreSQL mediante los mecanismos definidos por Application e Infrastructure.

La arquitectura debe evitar que el Job contenga directamente toda la lógica de negocio.

Una estructura recomendada es:

```text
Job
 ↓
Use Case
 ↓
Repository Port
 ↓
Postgres Repository
 ↓
PostgreSQL
```

---

# 13. Ejemplo de procesamiento diario

```text
                    00:00
                      │
                      ▼
             daily-consumption.job
                      │
                      ▼
             Get daily readings
                      │
                      ▼
              Calculate summary
                      │
                      ▼
             Save daily summary
                      │
                      ▼
                 PostgreSQL
```

---

# 14. Jobs y MQTT

Los Jobs **no sustituyen MQTT**.

MQTT se utiliza para comunicación con los dispositivos:

```text
ESP32 ↔ MQTT ↔ Backend
```

Los Jobs se utilizan para procesos automáticos:

```text
Scheduler
   ↓
Job
   ↓
Application
   ↓
Database
```

Son responsabilidades diferentes.

---

# 15. Jobs relacionados con IoT

Un Job puede utilizar información generada por los dispositivos.

Por ejemplo:

```text
ESP32
 ↓
Lecturas
 ↓
MQTT
 ↓
PostgreSQL
 ↓
Job
 ↓
Resumen
```

Pero el Job no debería enviar comandos físicos al ESP32 como parte de un procesamiento normal.

Los comandos de los actuadores deben pasar por el flujo de Application + MQTT.

---

# 16. Ejemplo con consumo

Supongamos que durante el día se reciben:

```text
08:00 → 2.5 L/min
08:01 → 2.7 L/min
08:02 → 2.6 L/min
...
```

Estas lecturas son almacenadas.

Posteriormente:

```text
daily-consumption.job
          ↓
Obtiene lecturas
          ↓
Procesa información
          ↓
Genera resumen
          ↓
Guarda resultado
```

El frontend posteriormente consulta el resumen mediante la API.

---

# 17. Frecuencia de ejecución

La frecuencia dependerá del Job.

Ejemplo conceptual:

| Job | Frecuencia aproximada | Objetivo |
|---|---|---|
| `daily-consumption.job` | Diario | Procesar consumo diario |
| `summary.job` | Diario/periódico | Actualizar resúmenes |
| `cleanup.job` | Diario/periódico | Mantenimiento |

Los horarios exactos se definirán durante la configuración.

---

# 18. Scheduler

Los Jobs necesitan un mecanismo que determine cuándo ejecutarlos.

Puede utilizarse un scheduler de Node.js.

Por ejemplo:

```text
Scheduler
    │
    ├── daily-consumption.job
    │
    ├── summary.job
    │
    └── cleanup.job
```

La tecnología concreta se definirá durante la implementación.

---

# 19. Manejo de errores

Los Jobs deben tener manejo de errores.

Ejemplo:

```text
Job
 ↓
Error
 ↓
Registrar error
 ↓
Continuar / reintentar según corresponda
```

Un error en un Job no debería tumbar todo el backend.

---

# 20. Logs

Cada Job debe generar información suficiente para conocer:

- Cuándo comenzó.
- Cuándo terminó.
- Cuántos registros procesó.
- Si ocurrió un error.
- Cuánto tardó.

Ejemplo conceptual:

```text
[JOB] daily-consumption started
[JOB] Processing...
[JOB] 1500 readings processed
[JOB] daily-consumption completed
```

Los logs deben utilizar el sistema centralizado definido en:

```text
src/shared/utils/logger.js
```

---

# 21. Idempotencia

Los Jobs deben intentar ser idempotentes.

Esto significa que ejecutar el mismo Job dos veces no debería generar información duplicada.

Ejemplo:

```text
Job
 ↓
Resumen 30/08/2026
```

Si vuelve a ejecutarse:

```text
Job
 ↓
Resumen 30/08/2026
 ↓
Actualizar / verificar existente
```

y no:

```text
Resumen
Resumen
Resumen
```

---

# 22. Transacciones

Cuando un Job realice varias operaciones relacionadas, puede utilizar una transacción.

Ejemplo:

```text
BEGIN
   ↓
Procesar consumo
   ↓
Guardar resumen
   ↓
Actualizar estado
   ↓
COMMIT
```

Si algo falla:

```text
ROLLBACK
```

Esto ayuda a mantener la consistencia de los datos.

---

# 23. Evitar Jobs demasiado grandes

No se recomienda crear un único Job para hacer todo:

```text
mega-job.js
```

Es mejor separar responsabilidades:

```text
daily-consumption.job.js
summary.job.js
cleanup.job.js
```

Cada Job tiene un propósito claro.

Esto facilita:

- Pruebas.
- Mantenimiento.
- Depuración.
- Escalabilidad.

---

# 24. Relación con CQRS

Los Jobs pueden ayudar a implementar la separación entre escritura y lectura.

Por ejemplo:

```text
                 Lecturas
                    ↓
             sensor readings
                    ↓
                  Job
                    ↓
              Daily Summary
                    ↓
               PostgreSQL
                    ↓
                  API
                    ↓
                Frontend
```

El frontend no necesita procesar todas las lecturas originales para mostrar estadísticas.

---

# 25. Jobs y frontend

El frontend no ejecuta los Jobs.

El frontend solamente consulta la información que los Jobs hayan generado.

```text
JOB
 ↓
Base de datos
 ↓
API
 ↓
Frontend
```

---

# 26. Jobs y autenticación

Los Jobs no deben depender de que exista un usuario conectado.

Por ejemplo:

```text
Usuario conectado ✕
```

no es necesario para:

```text
daily-consumption.job
```

Los Jobs son procesos internos del backend.

---

# 27. Seguridad

Los Jobs deben utilizar las mismas medidas de seguridad de infraestructura:

- Variables de entorno.
- Credenciales seguras.
- Conexiones protegidas.
- Logs sin información sensible.
- Acceso limitado a las tablas necesarias.

Nunca se deben registrar contraseñas, tokens o secretos en los logs.

---

# 28. Pruebas

Los Jobs deben tener pruebas.

Ejemplos:

```text
tests/
├── unit/
│   └── jobs/
│
├── integration/
│
└── e2e/
```

Se pueden probar casos como:

```text
Job procesa correctamente
Job sin datos
Job con datos inválidos
Job con error de PostgreSQL
Job ejecutado dos veces
```

---

# 29. Flujo general de Jobs

```text
                 SCHEDULER
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Daily      Summary     Cleanup
        Job         Job         Job
          │          │          │
          └──────────┼──────────┘
                     ▼
                 APPLICATION
                     │
                     ▼
               REPOSITORIES
                     │
                     ▼
                 POSTGRESQL
```

---

# 30. Estructura final

```text
hidro-smart-backend/
│
├── src/
│   │
│   ├── jobs/
│   │   ├── daily-consumption.job.js
│   │   ├── summary.job.js
│   │   └── cleanup.job.js
│   │
│   ├── core/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── api/
│   ├── mqtt/
│   ├── events/
│   ├── shared/
│   └── config/
│
└── tests/
```

---

# 31. Resumen

Los Jobs de Hidro Smart sirven para ejecutar automáticamente procesos que no necesitan depender de una petición del usuario.

Los principales son:

```text
daily-consumption.job.js
        ↓
Procesamiento diario

summary.job.js
        ↓
Generación/actualización de resúmenes

cleanup.job.js
        ↓
Mantenimiento y limpieza
```

La regla principal es:

```text
Jobs
  ↓
Use Cases
  ↓
Ports
  ↓
Infrastructure
  ↓
PostgreSQL
```

Los Jobs no deben contener toda la lógica del sistema ni comunicarse directamente con el ESP32.

Su función es automatizar procesos internos del backend de Hidro Smart.