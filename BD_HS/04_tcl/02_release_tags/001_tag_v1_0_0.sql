-- ============================================================
-- RELEASE TAG: v1.0.0
-- ============================================================
COMMENT ON DATABASE hidro_smart IS 'Hidro Smart v1.0.0 - Released 2026-08-21';

-- También se puede crear una tabla de versiones si se desea
CREATE TABLE IF NOT EXISTS public.schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO public.schema_version (version, description) VALUES
    ('1.0.0', 'Versión inicial completa - Hidro Smart');