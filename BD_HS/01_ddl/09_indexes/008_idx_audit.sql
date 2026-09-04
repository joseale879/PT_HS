-- ============================================================
-- ÍNDICES - DOMINIO: audit
-- ============================================================
CREATE INDEX idx_audit_log_user_account_id ON audit.audit_log(user_account_id);
CREATE INDEX idx_audit_log_created_at ON audit.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit.audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit.audit_log(table_name);

CREATE INDEX idx_log_error_user_account_id ON audit.log_error(user_account_id);
CREATE INDEX idx_log_error_severity ON audit.log_error(severity);
CREATE INDEX idx_log_error_created_at ON audit.log_error(created_at DESC);
CREATE INDEX idx_log_error_module ON audit.log_error(module);