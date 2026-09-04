-- ============================================================
-- TRIGGER: trg_audit_user_account
-- DOMINIO: user_account
-- PROPÓSITO: Registra automáticamente acciones sobre la tabla user_account
-- ============================================================

-- ============================================================
-- 1. Función de auditoría para user_account
-- ============================================================
CREATE OR REPLACE FUNCTION user_account.fn_audit_user_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, audit, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_action VARCHAR(20);
    v_description VARCHAR(500);
BEGIN
    -- Obtener el usuario actual
    v_user_id := user_account.fn_app_current_user_id();

    -- Determinar la acción
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_description := 'Usuario creado: ' || NEW.email;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_description := 'Usuario actualizado: ' || NEW.email;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_description := 'Usuario eliminado (soft delete): ' || OLD.email;
        NULL;
    ELSE
        RETURN NULL;
    END IF;

    -- Insertar en audit_log
    INSERT INTO audit.audit_log (
        user_account_id,
        action,
        table_name,
        record_id,
        old_value,
        new_value,
        description
    ) VALUES (
        COALESCE(v_user_id, NEW.user_account_id),
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.user_account_id, OLD.user_account_id)::TEXT,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::JSONB ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::JSONB ELSE NULL END,
        v_description
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION user_account.fn_audit_user_account() IS
'Función de auditoría para la tabla user_account. Registra INSERT, UPDATE y DELETE en audit_log.';

-- ============================================================
-- 2. Trigger de auditoría
-- ============================================================
CREATE TRIGGER trg_audit_user_account
    AFTER INSERT OR UPDATE OR DELETE ON user_account.user_account
    FOR EACH ROW
    EXECUTE FUNCTION user_account.fn_audit_user_account();
