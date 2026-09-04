# DML: datos iniciales y correcciones

La capa `02_dml` modifica datos, no crea la estructura física.

## Paquetes activos

- `00_inserts`: roles de negocio, idiomas, monedas, temas, estratos y catálogos de tickets.
- `04_patches`: correcciones posteriores, como la auditoría de eliminación de usuarios.

Las carpetas `01_updates`, `02_deletes` y `03_upserts` están preparadas para cambios futuros y permanecen gobernadas por sus changelogs.

## Orden

DDL crea las tablas y constraints; después DML carga los catálogos. Los patches se ejecutan al final de la capa DML.

## Reglas

- No modificar changesets ya aplicados.
- Crear un changeset nuevo para cada corrección posterior.
- Hacer los seeds idempotentes cuando sea posible.
- Incluir rollback.
- No guardar contraseñas en texto plano: `password_hash` debe ser generado por el backend con bcrypt o Argon2.

Actualmente también se siembra la política `user_account.password_policy` llamada `Default`, con bloqueo predeterminado de 15 minutos.
