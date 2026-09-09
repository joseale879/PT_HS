-- ============================================================
-- ROLES: zona horaria operativa de Hidro Smart
-- ============================================================

ALTER ROLE hidro_smart_app
    SET timezone TO 'America/Bogota';

ALTER ROLE hidro_smart_ingest
    SET timezone TO 'America/Bogota';

ALTER ROLE hidro_smart_readonly
    SET timezone TO 'America/Bogota';