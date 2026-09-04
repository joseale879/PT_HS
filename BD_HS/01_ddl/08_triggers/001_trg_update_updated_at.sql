-- ============================================================
-- TRIGGER: trg_update_updated_at
-- DOMINIO: Varios (todas las tablas con columna updated_at)
-- PROPÓSITO: Actualiza automáticamente la columna updated_at en todas las tablas
-- ============================================================

-- ============================================================
-- 1. Función auxiliar para actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_update_updated_at() IS
'Función genérica para actualizar la columna updated_at en cualquier tabla.
Utilizada por todos los triggers de actualización de timestamp.';

-- ============================================================
-- 2. Triggers para las tablas principales
-- ============================================================

-- user_account
CREATE TRIGGER trg_user_account_updated_at
    BEFORE UPDATE ON user_account.user_account
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

-- home
CREATE TRIGGER trg_home_updated_at
    BEFORE UPDATE ON home.home
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

-- device
CREATE TRIGGER trg_device_updated_at
    BEFORE UPDATE ON device.device
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

-- user_preference
CREATE TRIGGER trg_user_preference_updated_at
    BEFORE UPDATE ON preference.user_preference
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

-- vacation_mode
CREATE TRIGGER trg_vacation_mode_updated_at
    BEFORE UPDATE ON home.vacation_mode
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

-- saving_goal
CREATE TRIGGER trg_saving_goal_updated_at
    BEFORE UPDATE ON home.saving_goal
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

-- ticket
CREATE TRIGGER trg_ticket_updated_at
    BEFORE UPDATE ON analytics_support.ticket
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_role_updated_at
    BEFORE UPDATE ON user_account.role
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_permission_updated_at
    BEFORE UPDATE ON user_account.permission
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_password_policy_updated_at
    BEFORE UPDATE ON user_account.password_policy
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_user_mfa_updated_at
    BEFORE UPDATE ON user_account.user_mfa
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_language_updated_at
    BEFORE UPDATE ON preference.language
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_currency_updated_at
    BEFORE UPDATE ON preference.currency
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_theme_updated_at
    BEFORE UPDATE ON preference.theme
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_threshold_configuration_updated_at
    BEFORE UPDATE ON alert_rate.threshold_configuration
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_alert_rule_updated_at
    BEFORE UPDATE ON alert_rate.alert_rule
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_home_rate_updated_at
    BEFORE UPDATE ON alert_rate.home_rate
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_recommendation_category_updated_at
    BEFORE UPDATE ON analytics_support.recommendation_category
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_recommendation_updated_at
    BEFORE UPDATE ON analytics_support.recommendation
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_arco_request_updated_at
    BEFORE UPDATE ON privacy.arco_request
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_updated_at();
