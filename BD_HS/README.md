# Hidro Smart DB

Repositorio minimo para versionar la base de datos de Hidro Smart con Liquibase y PostgreSQL.

## Alcance Actual

Este repositorio administra el modelo base actual:

- extensiones `uuid-ossp`, `pgcrypto` y `btree_gist`
- schemas de dominio reservados para organización futura
- tablas base para usuarios, roles, hogares, dispositivos, tarifas, alertas, recomendaciones, consumo, reportes, auditoria, privacidad y derechos ARCO
- datos semilla, índices, permisos, funciones, procedimientos y triggers versionados por Liquibase
- vistas materializadas y refrescos programados para reportes y alertas
- consulta administrativa de auditoría mediante función `SECURITY DEFINER` y permiso controlado

El proyecto incluye lógica operativa real y no se limita únicamente a DDL estático.

## Estructura

```text
hidro-smart-db/
|-- changelog-master.yaml
|-- 01_ddl/
|   |-- changelog.yaml
|   |-- 00_extensions/
|   |   `-- 0000changelog.yaml
|   |-- 01_schemas/
|   |   `-- 0000changelog.yaml
|   |-- 02_types/
|   |   `-- 0000changelog.yaml
|   |-- 03_tables/
|   |   `-- 0000changelog.yaml
|   |-- 04_views/
|   |   `-- 0000changelog.yaml
|   |-- 05_materialized_views/
|   |   `-- 0000changelog.yaml
|   |-- 06_functions/
|   |   `-- 0000changelog.yaml
|   |-- 07_procedures/
|   |   `-- 0000changelog.yaml
|   |-- 08_triggers/
|   |   `-- 0000changelog.yaml
|   `-- 09_indexes/
|       `-- 0000changelog.yaml
|-- 02_dml/
|   |-- changelog.yaml
|   |-- 00_inserts/
|   |   `-- 0000changelog.yaml
|   |-- 01_updates/
|   |   `-- 0000changelog.yaml
|   |-- 02_deletes/
|   |   `-- 0000changelog.yaml
|   |-- 03_upserts/
|   |   `-- 0000changelog.yaml
|   `-- 04_patches/
|       `-- 0000changelog.yaml
|-- 03_dcl/
|   |-- changelog.yaml
|   |-- 00_roles/
|   |   `-- 0000changelog.yaml
|   |-- 01_grants/
|   |   `-- 0000changelog.yaml
|   `-- 02_policies/
|       `-- 0000changelog.yaml
|-- 04_tcl/
|   |-- changelog.yaml
|   |-- 00_transaction_blocks/
|   |   `-- 0000changelog.yaml
|   |-- 01_manual_recoveries/
|   |   `-- 0000changelog.yaml
|   `-- 02_release_tags/
|       `-- 0000changelog.yaml
|-- 05_rollbacks/
|   |-- 01_ddl/
|   |   |-- 00_extensions/
|   |   |-- 01_schemas/
|   |   |-- 02_types/
|   |   |-- 03_tables/
|   |   |-- 04_views/
|   |   |-- 05_materialized_views/
|   |   |-- 06_functions/
|   |   |-- 07_procedures/
|   |   |-- 08_triggers/
|   |   `-- 09_indexes/
|   |-- 02_dml/
|   |   |-- 00_inserts/
|   |   |-- 01_updates/
|   |   |-- 02_deletes/
|   |   |-- 03_upserts/
|   |   `-- 04_patches/
|   |-- 03_dcl/
|   |   |-- 00_roles/
|   |   |-- 01_grants/
|   |   `-- 02_policies/
|   `-- 04_tcl/
|       |-- 00_transaction_blocks/
|       `-- 01_manual_recoveries/
|-- docker-compose.yml
|-- .dockerignore
|-- .env.example
|-- liquibase.properties.example
|-- README.md
|-- docs/
`-- docker/
```

## Arquitectura De Capas

La arquitectura queda organizada por responsabilidad SQL:

- `01_ddl`: cambios estructurales
- `02_dml`: cambios de datos por verbo operativo
- `03_dcl`: seguridad, permisos y control de acceso
- `04_tcl`: operaciones transaccionales o de recuperacion excepcionales

Dentro de cada capa, los directorios se dividen por familia tecnica para que el crecimiento siga siendo ordenado.

## Por Que `db/` Ya No Existe

En un repositorio que ya es exclusivamente de base de datos, `db/` no agrega semantica; solo agrega profundidad innecesaria.

Por eso el contrato de despliegue ahora vive directo en `changelog-master.yaml`.

## Orquestacion Por YAML

La orquestacion ahora esta distribuida por niveles:

- `changelog-master.yaml`: coordina las capas principales
- `01_ddl/changelog.yaml`, `02_dml/changelog.yaml`, `03_dcl/changelog.yaml`, `04_tcl/changelog.yaml`: coordinan cada paquete principal
- cada subcarpeta tiene su propio `0000changelog.yaml` para declarar su responsabilidad concreta

Eso deja el repositorio mas modular: cada paquete conoce solo sus hijos directos y cada subcarpeta controla su propio contenido activo.

## Arbol De Rollbacks En Raiz

Los scripts de rollback quedan separados en `05_rollbacks/` en la raiz, con arbol espejo por capas.

En cada `changeSet`, el `rollback.sqlFile` apunta a esa ruta centralizada. Esto facilita auditoria y seguimiento cuando el equipo quiere revisar reversas sin mezclar archivos de avance y reversa.

Regla obligatoria: los archivos `.rollback.sql` deben vivir solo dentro de `05_rollbacks/`. Las capas activas (`01_ddl` a `04_tcl`) contienen cambios de avance y sus changelogs; no se deben dejar rollbacks locales allí. Las rutas se escriben con `/` para que funcionen dentro del contenedor de Liquibase.

La numeracion deja `01` a `04` para capas funcionales y usa `05` como bloque de reversa.

## Regla De Activacion

Una carpeta o script solo se vuelve activo cuando entra en la cadena de includes desde `changelog-master.yaml`.

Mientras eso no ocurra:

- la carpeta puede existir
- su proposito puede estar definido
- pero no participa en el despliegue

En la practica, eso significa que cada nivel gobierna solo su alcance inmediato:

- el `master` activa capas
- cada capa activa subcarpetas
- cada subcarpeta activa sus scripts SQL

## Capa Activa Hoy

Hoy el despliegue funcional usa todas las capas gobernadas por el changelog maestro:

- `01_ddl/00_extensions`
- `01_ddl/01_schemas`
- `01_ddl/03_tables`
- `01_ddl/09_indexes`
- `02_dml/00_inserts`
- `03_dcl/00_roles`
- `01_ddl/04_alter`
- `01_ddl/05_materialized_views`
- `01_ddl/06_functions`
- `01_ddl/07_procedures`
- `01_ddl/08_triggers`
- `03_dcl/01_grants`
- `03_dcl/02_policies`
- `04_tcl/00_transaction_blocks`
- `04_tcl/01_manual_recoveries` (runbook manual, fuera del changelog principal)
- `04_tcl/02_release_tags` (referencia histórica; usar `liquibase tag`)

## Capas Reservadas

Queda reservada para futuras extensiones:

- `01_ddl/02_types`
- `01_ddl/04_views`

## Criterio Mas Experto

Si pensamos como ingenieria de datos o de plataforma:

- `DDL` debe concentrar la evolucion del modelo fisico
- `DML` debe separar los cambios de datos de la estructura y, si el equipo necesita trazabilidad fina, conviene hacerlo visible por verbo principal
- `DCL` debe aislar seguridad y permisos
- `TCL` normalmente debe mantenerse pequeno, porque Liquibase ya controla buena parte del orden y la transaccionalidad

Eso suele ser mas limpio que mezclar todo por objeto tecnico o esconder el flujo activo dentro de una carpeta generica.

## Estructuras Complementarias Posibles

Si el repositorio crece, estas extensiones siguen siendo validas dentro de la taxonomia actual:

- `13_sequences`: secuencias explicitas
- `14_constraints`: constraints complejas separadas de tablas
- `15_permissions`: grants, roles y permisos
- `16_partitions`: particiones
- `17_jobs`: jobs o scheduler SQL si aplica
- `18_hotfixes`: cambios urgentes y acotados
- `19_reference_data`: maestros estables
- `20_patches`: scripts excepcionales de correccion

La explicacion completa de esta arquitectura esta en `docs/sql-layer-architecture.md`.

## Seguimiento De Datos

La capa `02_dml` queda intencionalmente explicita:

- `02_dml/00_inserts`: altas o cargas nuevas
- `02_dml/01_updates`: correcciones o modificaciones
- `02_dml/02_deletes`: bajas controladas
- `02_dml/03_upserts`: insercion o actualizacion en una sola operacion
- `02_dml/04_patches`: scripts mixtos o parches excepcionales

Esto facilita mucho mas el seguimiento operativo: que se inserto, que se corrigio, que se elimino y que fue un parche compuesto.

## Requisitos

- Docker Desktop
- Docker Compose
- Liquibase local solo si quieres ejecutarlo fuera de Docker

## Reset Limpio Del Proyecto (Solo Este Repo)

Ejecuta este flujo desde la raiz del repositorio cuando necesites limpiar el estado y volver a aplicar todo desde cero:

```bash
docker compose -p hidro_smart down --volumes --remove-orphans
docker compose -p hidro_smart up -d postgres
docker compose -p hidro_smart --profile tooling run --rm liquibase validate
docker compose -p hidro_smart --profile tooling run --rm liquibase update
```

Nota: en DBeaver puede aparecer `SQL Error [08003]: This connection has been closed` despues del reset. Solo debes reconectar el datasource y refrescar `Schemas`.

## Uso Rapido Con Docker

1. Si quieres personalizar credenciales o puerto, crea `.env` a partir de `.env.example`.
2. Levanta PostgreSQL:

```bash
docker compose -p hidro_smart up -d postgres
```

3. Construye la imagen de tooling de Liquibase solo la primera vez:

```bash
docker compose -p hidro_smart --profile tooling build liquibase
```

4. Valida el changelog:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase validate
```

5. Revisa el estado:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase status
```

6. Aplica la estructura base:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase update
```

7. Prueba el rollback del ultimo changeset:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-count --count=1
```

8. Si quieres marcar un punto claro antes de un cambio, crea un tag operativo:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase tag --tag=pre_cambio_x
```

9. Genera el SQL sin ejecutar cambios:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase update-sql
```

## Uso Con Liquibase Local

Usa esta opcion solo si tu instalacion local de Liquibase ya tiene disponible el driver JDBC de PostgreSQL.

1. Copia `liquibase.properties.example` como `liquibase.properties`.
2. Ajusta host, usuario, password y base de datos si cambiaste los valores por defecto.
3. Ejecuta los mismos comandos de Liquibase desde la raiz del repo:

```bash
liquibase validate
liquibase status
liquibase update
liquibase rollback-count --count=1
```

## Orden De Ejecucion

El `changelog-master.yaml` aplica los cambios en este orden:

1. habilita extensiones necesarias
2. crea schemas de dominio
3. crea tablas del modelo Hidro Smart
4. agrega constraints y relaciones diferidas
5. crea vistas materializadas, funciones, procedimientos y triggers
6. crea índices
7. carga datos semilla y patches
8. crea roles, grants y políticas RLS
9. ejecuta bloques TCL y tags de release

Ese orden evita errores por dependencias entre tablas y llaves foraneas.

## Buenas Practicas Adoptadas

- un solo `master changelog`
- separacion por capa SQL y por responsabilidad de paquete
- archivos pequenos y ordenados por responsabilidad
- un `0000changelog.yaml` por paquete y subpaquete
- changesets declarativos en YAML con `sqlFile` de avance y reversa
- rollback separado en `sqlFile` dedicados bajo `05_rollbacks/`
- configuracion local separada en archivos `.example`
- runner Docker de Liquibase con driver PostgreSQL preinstalado
- puerto por defecto `5433` para evitar choques con una instalacion local de PostgreSQL en `5432`
- contrato de despliegue visible desde la raiz del repo

## Reglas Para Cambios Nuevos

- no modificar changesets ya aplicados
- crear nuevos archivos para cada cambio posterior
- mantener el orden de dependencias en el master changelog
- no subir secretos reales al repositorio
- validar con `validate` y `update-sql` antes de aplicar
- antes de un `UPDATE` o `DELETE` sensible, definir por escrito la estrategia de reversa
- antes de un parche delicado, crear un `tag`

## Rollback Operativo

En este repositorio, cada `changeSet` activo de las capas SQL tiene su `rollback.sqlFile` en `05_rollbacks/`.

Rollback del ultimo `changeSet` aplicado:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-count --count=1
```

Rollback de los ultimos `N` changesets:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-count --count=2
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-count --count=3
```

Vista previa del rollback sin ejecutar (recomendado antes de revertir):

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-count-sql --count=1
```

Flujo profesional con `tag` + `rollback --tag`:

1. Marcar un punto estable antes del cambio:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase tag --tag=bd01_stable
```

2. Aplicar nuevos cambios (`update`).

3. Si debes volver al punto estable:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback --tag=bd01_stable
```

Rollback por fecha/hora (cuando aplica):

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase rollback-to-date "2026-03-26 13:21:00"
```

Auditoria despues de aplicar o revertir:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase history
```

Validar si un tag existe:

```bash
docker compose -p hidro_smart --profile tooling run --rm liquibase tag-exists --tag=bd01_stable
```

Verificacion directa en DB (util en Liquibase 5.0.2):

```sql
SELECT orderexecuted, id, author, filename, tag
FROM public.databasechangelog
ORDER BY orderexecuted;
```

## Rollback Por Changeset ID

Liquibase Community no trae rollback directo por `changeset id`, pero este repo incluye helper para hacerlo de forma controlada:

Atajos `ps1` (un archivo por accion):

```powershell
# Rollback por ID (seguro, interactivo)
powershell -ExecutionPolicy Bypass -File .\scripts\01_rollback_by_id.ps1

# Solo preview por ID
powershell -ExecutionPolicy Bypass -File .\scripts\02_rollback_by_id_preview.ps1

# Rollback en cascada por ID (peligroso, pide confirmacion extra)
powershell -ExecutionPolicy Bypass -File .\scripts\03_rollback_by_id_cascade.ps1

# Volver a aplicar solo el siguiente pendiente
powershell -ExecutionPolicy Bypass -File .\scripts\04_reapply_next.ps1

# Volver a aplicar todos los pendientes
powershell -ExecutionPolicy Bypass -File .\scripts\05_reapply_all.ps1
```

Uso interactivo simple (recomendado):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rollback-by-id.ps1
```

El script te pide el `changeset id`, muestra preview SQL y pregunta si quieres ejecutar el rollback.

Politica de seguridad por defecto:

- si es el ultimo changeset aplicado, usa rollback normal de Liquibase
- si es un changeset intermedio, intenta rollback aislado de ese ID
- antes del rollback aislado, ejecuta validacion de dependencias con `RESTRICT`
- si detecta dependencia en cambios posteriores, rechaza el rollback aislado para proteger la integridad

Preview del rollback por ID (no ejecuta cambios):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rollback-by-id.ps1 -ChangesetId "7a38ca68-3705-481d-80af-3f4a7de3c4a3" -PreviewOnly
```

Ejecucion real del rollback por ID:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rollback-by-id.ps1 -ChangesetId "7a38ca68-3705-481d-80af-3f4a7de3c4a3" -Execute
```

Si el `id` existe con mas de un autor, ejecuta con `-Author`.

Si realmente necesitas rollback en cascada (desde ese ID hacia arriba), debes confirmarlo explicitamente:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rollback-by-id.ps1 -ChangesetId "0ac6b8dc-d77d-47d8-935b-5d1d3a6c8ac5" -AllowCascade -Execute
```

Para ver primero el SQL de esa cascada sin ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\rollback-by-id.ps1 -ChangesetId "0ac6b8dc-d77d-47d8-935b-5d1d3a6c8ac5" -AllowCascade -PreviewOnly
```

## Volver A Aplicar Despues De Rollback

Uso interactivo simple:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\reapply-after-rollback.ps1
```

El script te pregunta si quieres:

1. aplicar solo el siguiente changeset pendiente (por ejemplo volver a poner el `005`)
2. aplicar todos los pendientes

Ejecucion directa sin preguntas:

```powershell
# Solo el siguiente pendiente
powershell -ExecutionPolicy Bypass -File .\scripts\reapply-after-rollback.ps1 -OnlyNext -AutoConfirm

# Todos los pendientes
powershell -ExecutionPolicy Bypass -File .\scripts\reapply-after-rollback.ps1 -AllPending -AutoConfirm
```

## Politica De IDs De Changeset

El formato del `id` del changeset debe seguir el criterio operativo definido por el equipo.

- En este repo no se usa `logicalFilePath` estatico para changesets.
- El `id` puede mantenerse en formato UUID si ese es el criterio operativo del equipo.
- IDs semanticos son mas auditables (HU, modulo, intencion del cambio).
- Para control de rollback, el mecanismo recomendado es `tag` + `rollback --tag` o rollback por ID usando el helper del repo.

## Estado Esperado

Cuando el flujo funciona correctamente, la base queda con:

- extensiones `uuid-ossp`, `pgcrypto`, `btree_gist`
- schemas de dominio de Hidro Smart
- tablas distribuidas en `user_account`, `preference`, `home`, `device`, `consumption`, `alert_rate`, `analytics_support`, `audit` y `privacy`
- datos semilla, índices, funciones, procedimientos, triggers, roles, grants y RLS aplicados
- integridad de lecturas mediante la relación compuesta entre `sensor_reading` y `home_device`
- roles separados para aplicación, ingesta IoT y reportes

### Mapa de rollback

La ruta de un rollback se resuelve desde el changelog de su subcarpeta. Por ejemplo:

```yaml
rollback:
  - sqlFile:
      path: ../../05_rollbacks/01_ddl/06_functions/018_fn_registration_flows.rollback.sql
      relativeToChangelogFile: true
      splitStatements: false
      stripComments: false
```

No se deben usar rutas de Windows con `\` en los changelogs. Liquibase se ejecuta dentro de Docker y requiere rutas con `/`.
## Estado operativo e integración IoT (2026-09-04)

El Compose integrado de la raíz levanta PostgreSQL, `db-bootstrap`, backend, frontend, Mailpit y Mosquitto. Liquibase se ejecuta con el perfil `tooling`; consulta `docs/guia-ejecucion-liquibase.md` para los comandos actuales.

La base está actualizada con 166 changesets. Los objetos `device.device`, `device.home_device`, `consumption.sensor_reading` y `device.device_telemetry_history` están preparados para IoT, pero el subscriber MQTT del backend todavía no persiste lecturas.

Antes de activar la ingestión deben revisarse los grants del rol `hidro_smart_ingest`, la resolución segura del dispositivo y la precisión de `consumption.sensor_reading.consumption_liters`, actualmente `NUMERIC(10,2)`, porque el ESP32 puede enviar muestras de `0.040 L`.
