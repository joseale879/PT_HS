CREATE OR REPLACE FUNCTION user_account.fn_app_has_permission(
    p_permission_name VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
    SELECT user_account.fn_user_has_permission(
        user_account.fn_app_current_user_id(),
        p_permission_name
    );
$$;

COMMENT ON FUNCTION user_account.fn_app_has_permission(VARCHAR) IS
'Comprueba el permiso RBAC de la cuenta definida en app.user_id.';

CREATE OR REPLACE FUNCTION consumption.fn_get_home_monthly_consumption(
    p_home_id UUID
)
RETURNS TABLE (
    home_id UUID,
    month_start DATE,
    total_consumption_m3 NUMERIC,
    total_cost NUMERIC,
    reading_count BIGINT,
    last_reading_at TIMESTAMPTZ,
    refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, home, user_account, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('consumption.read')
       OR NOT home.fn_is_home_member(p_home_id, user_account.fn_app_current_user_id()) THEN
        RAISE EXCEPTION 'La cuenta no puede consultar el consumo de este hogar';
    END IF;

    RETURN QUERY
    SELECT mv.home_id, mv.month_start, mv.total_consumption_m3, mv.total_cost,
           mv.reading_count, mv.last_reading_at, mv.refreshed_at
    FROM consumption.mv_home_monthly_consumption mv
    WHERE mv.home_id = p_home_id;
END;
$$;

CREATE OR REPLACE FUNCTION consumption.fn_get_home_hourly_consumption(
    p_home_id UUID
)
RETURNS TABLE (
    home_id UUID,
    hour INTEGER,
    avg_consumption_m3 NUMERIC,
    avg_consumption_liters NUMERIC,
    sample_count BIGINT,
    refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = consumption, home, user_account, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('consumption.read')
       OR NOT home.fn_is_home_member(p_home_id, user_account.fn_app_current_user_id()) THEN
        RAISE EXCEPTION 'La cuenta no puede consultar el consumo horario de este hogar';
    END IF;

    RETURN QUERY
    SELECT mv.home_id, mv.hour, mv.avg_consumption_m3, mv.avg_consumption_liters,
           mv.sample_count, mv.refreshed_at
    FROM consumption.mv_hourly_consumption_avg mv
    WHERE mv.home_id = p_home_id
    ORDER BY mv.hour;
END;
$$;

CREATE OR REPLACE FUNCTION alert_rate.fn_get_home_pending_alerts(
    p_home_id UUID
)
RETURNS TABLE (
    home_id UUID,
    pending_count BIGINT,
    last_alert_at TIMESTAMPTZ,
    refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = alert_rate, home, user_account, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('alerts.manage')
       OR NOT home.fn_is_home_member(p_home_id, user_account.fn_app_current_user_id()) THEN
        RAISE EXCEPTION 'La cuenta no puede consultar las alertas de este hogar';
    END IF;

    RETURN QUERY
    SELECT mv.home_id, mv.pending_count, mv.last_alert_at, mv.refreshed_at
    FROM alert_rate.mv_pending_alerts mv
    WHERE mv.home_id = p_home_id;
END;
$$;

CREATE OR REPLACE FUNCTION device.fn_get_home_active_devices(
    p_home_id UUID
)
RETURNS TABLE (
    home_id UUID,
    total_devices BIGINT,
    active_devices BIGINT,
    suspended_devices BIGINT,
    low_battery_devices BIGINT,
    last_connection_at TIMESTAMPTZ,
    refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = device, home, user_account, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('devices.manage')
       OR NOT home.fn_is_home_member(p_home_id, user_account.fn_app_current_user_id()) THEN
        RAISE EXCEPTION 'La cuenta no puede consultar los dispositivos de este hogar';
    END IF;

    RETURN QUERY
    SELECT mv.home_id, mv.total_devices, mv.active_devices, mv.suspended_devices,
           mv.low_battery_devices, mv.last_connection_at, mv.refreshed_at
    FROM device.mv_active_devices mv
    WHERE mv.home_id = p_home_id;
END;
$$;

CREATE OR REPLACE FUNCTION analytics_support.fn_get_home_recommendation_summary(
    p_home_id UUID
)
RETURNS TABLE (
    home_id UUID,
    total_recommendations BIGINT,
    applied_count BIGINT,
    pending_count BIGINT,
    dismissed_count BIGINT,
    avg_usefulness NUMERIC,
    refreshed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = analytics_support, home, user_account, public, pg_temp
AS $$
BEGIN
    IF NOT user_account.fn_app_has_permission('reports.read')
       OR NOT home.fn_is_home_member(p_home_id, user_account.fn_app_current_user_id()) THEN
        RAISE EXCEPTION 'La cuenta no puede consultar las recomendaciones de este hogar';
    END IF;

    RETURN QUERY
    SELECT mv.home_id, mv.total_recommendations, mv.applied_count, mv.pending_count,
           mv.dismissed_count, mv.avg_usefulness, mv.refreshed_at
    FROM analytics_support.mv_recommendation_summary mv
    WHERE mv.home_id = p_home_id;
END;
$$;