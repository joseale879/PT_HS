DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hidro_smart_ingest') THEN
        CREATE ROLE hidro_smart_ingest WITH LOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION CONNECTION LIMIT 20;
    END IF;
END $$;

COMMENT ON ROLE hidro_smart_ingest IS
'Rol técnico separado para la ingesta de lecturas IoT; debe autenticarse mediante secreto externo.';
