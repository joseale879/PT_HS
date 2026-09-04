ALTER TABLE audit.audit_log
    DROP CONSTRAINT IF EXISTS ck_audit_log_action;
ALTER TABLE audit.audit_log
    ADD CONSTRAINT ck_audit_log_action CHECK (action IN (
        'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ERROR', 'EXPORT', 'IMPORT',
        'USER_DEACTIVATED', 'USER_REACTIVATED', 'USER_BLOCKED'
    ));

CREATE OR REPLACE FUNCTION user_account.fn_audit_user_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, audit, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_action VARCHAR(20);
    v_description TEXT;
BEGIN
    v_user_id := user_account.fn_app_current_user_id();
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_description := 'Usuario creado: ' || NEW.email;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_description := 'Cuenta eliminada fisicamente: ' || COALESCE(OLD.email, 'desconocido');
    ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        v_action := 'USER_DEACTIVATED';
        v_description := 'Usuario desactivado: ' || NEW.email;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
        v_action := 'USER_REACTIVATED';
        v_description := 'Usuario reactivado: ' || NEW.email;
    ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Blocked' THEN
        v_action := 'USER_BLOCKED';
        v_description := 'Usuario bloqueado: ' || NEW.email;
    ELSE
        v_action := 'UPDATE';
        v_description := 'Usuario actualizado: ' || NEW.email;
    END IF;

    INSERT INTO audit.audit_log (
        user_account_id, action, table_name, record_id,
        old_value, new_value, description, created_at
    ) VALUES (
        CASE
            WHEN TG_OP = 'DELETE' AND (v_user_id IS NULL OR v_user_id = OLD.user_account_id) THEN NULL
            ELSE COALESCE(v_user_id, NEW.user_account_id, OLD.user_account_id)
        END,
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.user_account_id::TEXT, OLD.user_account_id::TEXT),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::JSONB ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::JSONB ELSE NULL END,
        v_description,
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_account ON user_account.user_account;
CREATE TRIGGER trg_audit_user_account
    AFTER INSERT OR UPDATE OR DELETE ON user_account.user_account
    FOR EACH ROW EXECUTE FUNCTION user_account.fn_audit_user_account();