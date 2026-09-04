DROP POLICY IF EXISTS ticket_response_select ON analytics_support.ticket_response;

CREATE POLICY ticket_response_select ON analytics_support.ticket_response
    FOR SELECT TO hidro_smart_app
    USING (
        user_account_id = user_account.fn_app_current_user_id()
        OR user_account.fn_app_has_permission('tickets.manage')
        OR EXISTS (
            SELECT 1
              FROM analytics_support.ticket t
             WHERE t.ticket_id = ticket_response.ticket_id
               AND t.user_account_id = user_account.fn_app_current_user_id()
        )
    );
