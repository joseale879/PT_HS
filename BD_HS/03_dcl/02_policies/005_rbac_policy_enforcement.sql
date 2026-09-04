-- Reemplaza las politicas permisivas por politicas que consultan RBAC.
DROP POLICY IF EXISTS home_member_select ON home.home;
DROP POLICY IF EXISTS home_owner_update ON home.home;
DROP POLICY IF EXISTS home_device_member_select ON home.home_device;
DROP POLICY IF EXISTS device_member_select ON device.device;
DROP POLICY IF EXISTS sensor_reading_member_select ON consumption.sensor_reading;
DROP POLICY IF EXISTS device_backend_insert ON device.device;
DROP POLICY IF EXISTS home_device_owner_insert ON home.home_device;
DROP POLICY IF EXISTS home_device_owner_update_delete ON home.home_device;
DROP POLICY IF EXISTS home_device_owner_delete ON home.home_device;
DROP POLICY IF EXISTS home_user_member_select ON home.home_user;
DROP POLICY IF EXISTS home_user_owner_insert ON home.home_user;
DROP POLICY IF EXISTS home_user_owner_update ON home.home_user;
DROP POLICY IF EXISTS home_user_owner_delete ON home.home_user;

DROP POLICY IF EXISTS user_preference_self_access ON preference.user_preference;
DROP POLICY IF EXISTS vacation_mode_member_access ON home.vacation_mode;
DROP POLICY IF EXISTS saving_goal_member_access ON home.saving_goal;
DROP POLICY IF EXISTS daily_summary_member_access ON consumption.daily_consumption_summary;
DROP POLICY IF EXISTS hourly_history_member_access ON consumption.hourly_consumption_history;
DROP POLICY IF EXISTS monthly_history_member_access ON consumption.monthly_consumption_history;
DROP POLICY IF EXISTS prediction_member_access ON consumption.consumption_prediction;
DROP POLICY IF EXISTS threshold_member_access ON alert_rate.threshold_configuration;
DROP POLICY IF EXISTS alert_rule_member_access ON alert_rate.alert_rule;
DROP POLICY IF EXISTS alert_event_member_access ON alert_rate.alert_event;
DROP POLICY IF EXISTS alert_notification_member_access ON alert_rate.alert_notification;
DROP POLICY IF EXISTS home_rate_member_access ON alert_rate.home_rate;
DROP POLICY IF EXISTS user_recommendation_self_access ON analytics_support.user_recommendation;
DROP POLICY IF EXISTS generated_report_self_access ON analytics_support.generated_report;
DROP POLICY IF EXISTS ticket_self_access ON analytics_support.ticket;
DROP POLICY IF EXISTS ticket_response_self_access ON analytics_support.ticket_response;

CREATE POLICY home_member_select ON home.home
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY home_owner_update ON home.home
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    )
    WITH CHECK (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY home_device_member_select ON home.home_device
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY home_device_owner_insert ON home.home_device
    FOR INSERT TO hidro_smart_app
    WITH CHECK (
        user_account.fn_app_has_permission('devices.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY home_device_owner_update_delete ON home.home_device
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('devices.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    )
    WITH CHECK (
        user_account.fn_app_has_permission('devices.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY home_device_owner_delete ON home.home_device
    FOR DELETE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('devices.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY device_member_select ON device.device
    FOR SELECT TO hidro_smart_app
    USING (device.fn_can_access_device(device_id, user_account.fn_app_current_user_id()));

CREATE POLICY device_backend_insert ON device.device
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('devices.manage'));

CREATE POLICY device_backend_update ON device.device
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('devices.manage'))
    WITH CHECK (user_account.fn_app_has_permission('devices.manage'));

CREATE POLICY sensor_reading_member_select ON consumption.sensor_reading
    FOR SELECT TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('consumption.read')
        AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY home_user_member_select ON home.home_user
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY home_user_owner_insert ON home.home_user
    FOR INSERT TO hidro_smart_app
    WITH CHECK (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY home_user_owner_update ON home.home_user
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    )
    WITH CHECK (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY home_user_owner_delete ON home.home_user
    FOR DELETE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('homes.manage')
        AND home.fn_is_home_owner(home_id, user_account.fn_app_current_user_id())
    );

CREATE POLICY user_preference_self_access ON preference.user_preference
    FOR ALL TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id());

CREATE POLICY vacation_mode_member_select ON home.vacation_mode
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY vacation_mode_member_manage ON home.vacation_mode
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY vacation_mode_member_update ON home.vacation_mode
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY vacation_mode_member_delete ON home.vacation_mode
    FOR DELETE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY saving_goal_member_select ON home.saving_goal
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY saving_goal_member_manage ON home.saving_goal
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY saving_goal_member_update ON home.saving_goal
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY saving_goal_member_delete ON home.saving_goal
    FOR DELETE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('homes.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY daily_summary_member_select ON consumption.daily_consumption_summary
    FOR SELECT TO hidro_smart_app
    USING (user_account.fn_app_has_permission('consumption.read') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY hourly_history_member_select ON consumption.hourly_consumption_history
    FOR SELECT TO hidro_smart_app
    USING (user_account.fn_app_has_permission('consumption.read') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY monthly_history_member_select ON consumption.monthly_consumption_history
    FOR SELECT TO hidro_smart_app
    USING (user_account.fn_app_has_permission('consumption.read') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY prediction_member_select ON consumption.consumption_prediction
    FOR SELECT TO hidro_smart_app
    USING (user_account.fn_app_has_permission('consumption.read') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY threshold_member_select ON alert_rate.threshold_configuration
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY threshold_member_manage ON alert_rate.threshold_configuration
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY threshold_member_update ON alert_rate.threshold_configuration
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY threshold_member_delete ON alert_rate.threshold_configuration
    FOR DELETE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY alert_rule_member_select ON alert_rate.alert_rule
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY alert_rule_member_manage ON alert_rate.alert_rule
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY alert_rule_member_update ON alert_rate.alert_rule
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY alert_rule_member_delete ON alert_rate.alert_rule
    FOR DELETE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY alert_event_member_select ON alert_rate.alert_event
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY alert_event_member_update ON alert_rate.alert_event
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY alert_notification_member_select ON alert_rate.alert_notification
    FOR SELECT TO hidro_smart_app
    USING (EXISTS (
        SELECT 1 FROM alert_rate.alert_event e
        WHERE e.event_id = alert_notification.event_id
          AND home.fn_is_home_member(e.home_id, user_account.fn_app_current_user_id())
    ));
CREATE POLICY alert_notification_member_update ON alert_rate.alert_notification
    FOR UPDATE TO hidro_smart_app
    USING (
        user_account.fn_app_has_permission('alerts.manage')
        AND EXISTS (SELECT 1 FROM alert_rate.alert_event e WHERE e.event_id = alert_notification.event_id AND home.fn_is_home_member(e.home_id, user_account.fn_app_current_user_id()))
    )
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage'));

CREATE POLICY home_rate_member_select ON alert_rate.home_rate
    FOR SELECT TO hidro_smart_app
    USING (home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY home_rate_member_manage ON alert_rate.home_rate
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY home_rate_member_update ON alert_rate.home_rate
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()))
    WITH CHECK (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));
CREATE POLICY home_rate_member_delete ON alert_rate.home_rate
    FOR DELETE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('alerts.manage') AND home.fn_is_home_member(home_id, user_account.fn_app_current_user_id()));

CREATE POLICY user_recommendation_member_select ON analytics_support.user_recommendation
    FOR SELECT TO hidro_smart_app
    USING (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY user_recommendation_member_update ON analytics_support.user_recommendation
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id());

CREATE POLICY generated_report_self_select ON analytics_support.generated_report
    FOR SELECT TO hidro_smart_app
    USING (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY generated_report_self_insert ON analytics_support.generated_report
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id());
CREATE POLICY generated_report_self_update ON analytics_support.generated_report
    FOR UPDATE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id())
    WITH CHECK (user_account.fn_app_has_permission('reports.read') AND user_account_id = user_account.fn_app_current_user_id());

CREATE POLICY ticket_select ON analytics_support.ticket
    FOR SELECT TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id() OR user_account.fn_app_has_permission('tickets.manage'));
CREATE POLICY ticket_insert ON analytics_support.ticket
    FOR INSERT TO hidro_smart_app
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id() OR user_account.fn_app_has_permission('tickets.manage'));
CREATE POLICY ticket_update ON analytics_support.ticket
    FOR UPDATE TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id() OR user_account.fn_app_has_permission('tickets.manage'))
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id() OR user_account.fn_app_has_permission('tickets.manage'));
CREATE POLICY ticket_delete ON analytics_support.ticket
    FOR DELETE TO hidro_smart_app
    USING (user_account.fn_app_has_permission('tickets.manage'));

CREATE POLICY ticket_response_select ON analytics_support.ticket_response
    FOR SELECT TO hidro_smart_app
    USING (
        user_account_id = user_account.fn_app_current_user_id()
        OR user_account.fn_app_has_permission('tickets.manage')
    );
CREATE POLICY ticket_response_insert ON analytics_support.ticket_response
    FOR INSERT TO hidro_smart_app
    WITH CHECK (
        user_account_id = user_account.fn_app_current_user_id()
        OR user_account.fn_app_has_permission('tickets.manage')
    );
CREATE POLICY ticket_response_update ON analytics_support.ticket_response
    FOR UPDATE TO hidro_smart_app
    USING (user_account_id = user_account.fn_app_current_user_id() OR user_account.fn_app_has_permission('tickets.manage'))
    WITH CHECK (user_account_id = user_account.fn_app_current_user_id() OR user_account.fn_app_has_permission('tickets.manage'));