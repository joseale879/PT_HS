-- ============================================================
-- PERMISOS PARA EL USUARIO DE APLICACIÓN
-- ============================================================
-- Conectar a la base de datos
GRANT CONNECT ON DATABASE hidro_smart TO hidro_smart_app;

-- Uso de esquemas
GRANT USAGE ON SCHEMA user_account TO hidro_smart_app;
GRANT USAGE ON SCHEMA preference TO hidro_smart_app;
GRANT USAGE ON SCHEMA home TO hidro_smart_app;
GRANT USAGE ON SCHEMA device TO hidro_smart_app;
GRANT USAGE ON SCHEMA consumption TO hidro_smart_app;
GRANT USAGE ON SCHEMA alert_rate TO hidro_smart_app;
GRANT USAGE ON SCHEMA analytics_support TO hidro_smart_app;
GRANT USAGE ON SCHEMA audit TO hidro_smart_app;
GRANT USAGE ON SCHEMA privacy TO hidro_smart_app;

-- Permisos CRUD en todas las tablas (para el usuario de aplicación)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA user_account TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA preference TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA home TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA device TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA consumption TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA alert_rate TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics_support TO hidro_smart_app;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA privacy TO hidro_smart_app;

-- Permisos en secuencias (para columnas SERIAL, aunque usamos UUID)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA user_account TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA preference TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA home TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA device TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA consumption TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA alert_rate TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA analytics_support TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA audit TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA privacy TO hidro_smart_app;

-- ============================================================
-- PERMISOS PARA EL USUARIO DE SOLO LECTURA (reportes)
-- ============================================================
GRANT CONNECT ON DATABASE hidro_smart TO hidro_smart_readonly;

GRANT USAGE ON SCHEMA user_account TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA preference TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA home TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA device TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA consumption TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA alert_rate TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA analytics_support TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA audit TO hidro_smart_readonly;
GRANT USAGE ON SCHEMA privacy TO hidro_smart_readonly;

-- Solo SELECT en todas las tablas
GRANT SELECT ON ALL TABLES IN SCHEMA user_account TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA preference TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA home TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA device TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA consumption TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA alert_rate TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics_support TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO hidro_smart_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA privacy TO hidro_smart_readonly;

