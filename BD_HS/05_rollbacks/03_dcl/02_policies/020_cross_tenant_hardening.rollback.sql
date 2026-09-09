-- ============================================================
-- ARCO
-- ============================================================

DROP POLICY IF EXISTS arco_request_manager_update
ON privacy.arco_request;

DROP POLICY IF EXISTS arco_request_manager_select
ON privacy.arco_request;


CREATE POLICY arco_request_self_update
ON privacy.arco_request

FOR UPDATE
TO hidro_smart_app

USING (
    user_account_id =
        user_account.fn_app_current_user_id()
)

WITH CHECK (
    user_account_id =
        user_account.fn_app_current_user_id()
);


-- ============================================================
-- ALERT NOTIFICATION
-- ============================================================

DROP POLICY IF EXISTS alert_notification_member_update
ON alert_rate.alert_notification;


CREATE POLICY alert_notification_member_update
ON alert_rate.alert_notification

FOR UPDATE
TO hidro_smart_app

USING (

    user_account.fn_app_has_permission(
        'alerts.manage'
    )

    AND EXISTS (

        SELECT 1

        FROM alert_rate.alert_event e

        WHERE e.event_id =
              alert_notification.event_id

          AND home.fn_is_home_member(
              e.home_id,
              user_account.fn_app_current_user_id()
          )
    )
)

WITH CHECK (
    user_account.fn_app_has_permission(
        'alerts.manage'
    )
);


-- ============================================================
-- GENERATED REPORT
-- ============================================================

DROP POLICY IF EXISTS generated_report_self_update
ON analytics_support.generated_report;

DROP POLICY IF EXISTS generated_report_self_insert
ON analytics_support.generated_report;


CREATE POLICY generated_report_self_insert
ON analytics_support.generated_report

FOR INSERT
TO hidro_smart_app

WITH CHECK (

    user_account.fn_app_has_permission(
        'reports.read'
    )

    AND user_account_id =
        user_account.fn_app_current_user_id()
);


CREATE POLICY generated_report_self_update
ON analytics_support.generated_report

FOR UPDATE
TO hidro_smart_app

USING (

    user_account.fn_app_has_permission(
        'reports.read'
    )

    AND user_account_id =
        user_account.fn_app_current_user_id()
)

WITH CHECK (

    user_account.fn_app_has_permission(
        'reports.read'
    )

    AND user_account_id =
        user_account.fn_app_current_user_id()
);


-- ============================================================
-- TICKET RESPONSE
-- ============================================================

DROP POLICY IF EXISTS ticket_response_insert
ON analytics_support.ticket_response;


CREATE POLICY ticket_response_insert
ON analytics_support.ticket_response

FOR INSERT
TO hidro_smart_app

WITH CHECK (

    user_account_id =
        user_account.fn_app_current_user_id()

    OR user_account.fn_app_has_permission(
        'tickets.manage'
    )
);


CREATE POLICY ticket_response_update
ON analytics_support.ticket_response

FOR UPDATE
TO hidro_smart_app

USING (

    user_account_id =
        user_account.fn_app_current_user_id()

    OR user_account.fn_app_has_permission(
        'tickets.manage'
    )
)

WITH CHECK (

    user_account_id =
        user_account.fn_app_current_user_id()

    OR user_account.fn_app_has_permission(
        'tickets.manage'
    )
);


-- ============================================================
-- TICKET
-- ============================================================

DROP POLICY IF EXISTS ticket_manager_update
ON analytics_support.ticket;


CREATE POLICY ticket_update
ON analytics_support.ticket

FOR UPDATE
TO hidro_smart_app

USING (

    user_account_id =
        user_account.fn_app_current_user_id()

    OR user_account.fn_app_has_permission(
        'tickets.manage'
    )
)

WITH CHECK (

    user_account_id =
        user_account.fn_app_current_user_id()

    OR user_account.fn_app_has_permission(
        'tickets.manage'
    )
);