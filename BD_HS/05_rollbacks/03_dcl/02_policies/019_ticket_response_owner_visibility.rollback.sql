DROP POLICY IF EXISTS ticket_response_select ON analytics_support.ticket_response;

CREATE POLICY ticket_response_select ON analytics_support.ticket_response
    FOR SELECT TO hidro_smart_app
    USING (
        user_account_id = user_account.fn_app_current_user_id()
        OR user_account.fn_app_has_permission('tickets.manage')
    );
