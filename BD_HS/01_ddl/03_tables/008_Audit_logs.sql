-- ============================================================
-- DOMINIO 8: AUDITORÍA Y LOGS (audit)
-- ============================================================

-- 44. audit_log — Registro de todas las acciones críticas del sistema
SET search_path TO audit, user_account, home, device, consumption, alert_rate, analytics_support, preference, privacy, public;

CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NULL REFERENCES user_account(user_account_id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ERROR', 'EXPORT', 'IMPORT')),
    table_name VARCHAR(100) NULL,
    record_id TEXT NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    description VARCHAR(500) NULL,
    source_ip VARCHAR(50) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_audit_log_old_value_json CHECK (old_value IS NULL OR jsonb_typeof(old_value) = 'object'),
    CONSTRAINT ck_audit_log_new_value_json CHECK (new_value IS NULL OR jsonb_typeof(new_value) = 'object')
);

-- 45. log_error — Registro de errores del sistema
CREATE TABLE log_error (
    log_error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NULL REFERENCES user_account(user_account_id) ON DELETE SET NULL,
    module VARCHAR(100) NULL,
    description TEXT NOT NULL,
    stack_trace TEXT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'ERROR' CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'CRITICAL')),
    source_ip VARCHAR(50) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
