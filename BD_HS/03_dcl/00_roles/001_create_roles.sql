-- ============================================================
-- CREACIÓN DE ROLES DE BASE DE DATOS
-- ============================================================
-- Usuario de aplicación (conexión desde el backend)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hidro_smart_app') THEN
        CREATE ROLE hidro_smart_app WITH
            LOGIN
            -- La contraseña se configura fuera del changelog mediante un secreto.
            -- Un rol recién creado queda bloqueado hasta ejecutar ALTER ROLE ... PASSWORD.
            PASSWORD NULL
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            NOREPLICATION
            CONNECTION LIMIT 50;
    END IF;
END $$;

-- Usuario de solo lectura (reportes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hidro_smart_readonly') THEN
        CREATE ROLE hidro_smart_readonly WITH
            LOGIN
            -- La contraseña se configura fuera del changelog mediante un secreto.
            PASSWORD NULL
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            NOREPLICATION
            CONNECTION LIMIT 10;
    END IF;
END $$;

COMMENT ON ROLE hidro_smart_app IS 'Usuario de aplicación para el backend de Hidro Smart';
COMMENT ON ROLE hidro_smart_readonly IS 'Usuario de solo lectura para reportes y consultas';
