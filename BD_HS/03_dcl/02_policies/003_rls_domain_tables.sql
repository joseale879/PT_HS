-- ============================================================
-- RLS PARA TABLAS SENSIBLES POR USUARIO U HOGAR
-- ============================================================

-- Preferencias personales
ALTER TABLE preference.user_preference ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_preference_self_access ON preference.user_preference
    FOR ALL TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

-- Relaciones y configuracion del hogar
ALTER TABLE home.home_user ENABLE ROW LEVEL SECURITY;
CREATE POLICY home_user_member_access ON home.home_user
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (
        home.fn_is_home_member(home_id, user_account.fn_app_current_user_id())
        OR home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

ALTER TABLE home.vacation_mode ENABLE ROW LEVEL SECURITY;
CREATE POLICY vacation_mode_member_access ON home.vacation_mode
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE home.saving_goal ENABLE ROW LEVEL SECURITY;
CREATE POLICY saving_goal_member_access ON home.saving_goal
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

-- Historiales y predicciones de consumo
ALTER TABLE consumption.daily_consumption_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_summary_member_access ON consumption.daily_consumption_summary
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE consumption.hourly_consumption_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY hourly_history_member_access ON consumption.hourly_consumption_history
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE consumption.monthly_consumption_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY monthly_history_member_access ON consumption.monthly_consumption_history
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE consumption.consumption_prediction ENABLE ROW LEVEL SECURITY;
CREATE POLICY prediction_member_access ON consumption.consumption_prediction
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

-- Alertas y tarifas por hogar
ALTER TABLE alert_rate.threshold_configuration ENABLE ROW LEVEL SECURITY;
CREATE POLICY threshold_member_access ON alert_rate.threshold_configuration
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE alert_rate.alert_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_rule_member_access ON alert_rate.alert_rule
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE alert_rate.alert_event ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_event_member_access ON alert_rate.alert_event
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

ALTER TABLE alert_rate.alert_notification ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_notification_member_access ON alert_rate.alert_notification
    FOR ALL TO hidro_smart_app
    USING (EXISTS (
        SELECT 1
        FROM alert_rate.alert_event e
        WHERE e.event_id = alert_notification.event_id
          AND home.fn_is_home_member(e.home_id, user_account.fn_app_current_user_id())
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM alert_rate.alert_event e
        WHERE e.event_id = alert_notification.event_id
          AND home.fn_is_home_member(e.home_id, user_account.fn_app_current_user_id())
    ));

ALTER TABLE alert_rate.home_rate ENABLE ROW LEVEL SECURITY;
CREATE POLICY home_rate_member_access ON alert_rate.home_rate
    FOR ALL TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

-- Reportes, recomendaciones y soporte propios
ALTER TABLE analytics_support.user_recommendation ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_recommendation_self_access ON analytics_support.user_recommendation
    FOR ALL TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

ALTER TABLE analytics_support.generated_report ENABLE ROW LEVEL SECURITY;
CREATE POLICY generated_report_self_access ON analytics_support.generated_report
    FOR ALL TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

ALTER TABLE analytics_support.ticket ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_self_access ON analytics_support.ticket
    FOR ALL TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

ALTER TABLE analytics_support.ticket_response ENABLE ROW LEVEL SECURITY;
CREATE POLICY ticket_response_self_access ON analytics_support.ticket_response
    FOR ALL TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

-- El rol de reportes es un rol confiable de solo lectura.
CREATE POLICY user_preference_readonly_select ON preference.user_preference FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY home_user_readonly_select ON home.home_user FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY vacation_mode_readonly_select ON home.vacation_mode FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY saving_goal_readonly_select ON home.saving_goal FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY daily_summary_readonly_select ON consumption.daily_consumption_summary FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY hourly_history_readonly_select ON consumption.hourly_consumption_history FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY monthly_history_readonly_select ON consumption.monthly_consumption_history FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY prediction_readonly_select ON consumption.consumption_prediction FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY threshold_readonly_select ON alert_rate.threshold_configuration FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY alert_rule_readonly_select ON alert_rate.alert_rule FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY alert_event_readonly_select ON alert_rate.alert_event FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY alert_notification_readonly_select ON alert_rate.alert_notification FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY home_rate_readonly_select ON alert_rate.home_rate FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY user_recommendation_readonly_select ON analytics_support.user_recommendation FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY generated_report_readonly_select ON analytics_support.generated_report FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY ticket_readonly_select ON analytics_support.ticket FOR SELECT TO hidro_smart_readonly USING (TRUE);
CREATE POLICY ticket_response_readonly_select ON analytics_support.ticket_response FOR SELECT TO hidro_smart_readonly USING (TRUE);
