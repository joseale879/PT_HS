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
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_description := 'Usuario actualizado: ' || NEW.email;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_description := 'Usuario eliminado (soft delete): ' || COALESCE(OLD.email, 'desconocido');
    ELSE
        RETURN NULL;
    END IF;
    INSERT INTO audit.audit_log (
        user_account_id, action, table_name, record_id,
        old_value, new_value, description, created_at
    ) VALUES (
        CASE WHEN TG_OP = 'DELETE' AND v_user_id IS NULL THEN NULL
             ELSE COALESCE(v_user_id, NEW.user_account_id, OLD.user_account_id) END,
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
    FOR EACH ROW
    EXECUTE FUNCTION user_account.fn_audit_user_account();