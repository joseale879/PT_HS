-- ============================================================
-- RLS: ENDURECIMIENTO CONTRA ACCESO CRUZADO
-- ============================================================


-- ============================================================
-- 1. TICKETS
-- ============================================================
-- Solo Support/Administrator con tickets.manage puede modificar
-- estado, prioridad y asignacion.

DROP POLICY IF EXISTS ticket_update
ON analytics_support.ticket;


DROP POLICY IF EXISTS ticket_manager_update
ON analytics_support.ticket;


CREATE POLICY ticket_manager_update
ON analytics_support.ticket

FOR UPDATE
TO hidro_smart_app

USING (
    user_account.fn_app_has_permission('tickets.manage')
)

WITH CHECK (
    user_account.fn_app_has_permission('tickets.manage')
);


-- ============================================================
-- 2. RESPUESTAS DE TICKETS
-- ============================================================
-- El usuario autenticado siempre debe ser el autor.
--
-- Usuario normal:
--   solo puede responder tickets propios.
--
-- Support / Administrator:
--   puede responder cualquier ticket.
--
-- Las respuestas no se editan posteriormente.

DROP POLICY IF EXISTS ticket_response_insert
ON analytics_support.ticket_response;


DROP POLICY IF EXISTS ticket_response_update
ON analytics_support.ticket_response;


CREATE POLICY ticket_response_insert
ON analytics_support.ticket_response

FOR INSERT
TO hidro_smart_app

WITH CHECK (

    user_account_id =
        user_account.fn_app_current_user_id()

    AND (

        user_account.fn_app_has_permission(
            'tickets.manage'
        )

        OR EXISTS (

            SELECT 1

            FROM analytics_support.ticket t

            WHERE t.ticket_id =
                  ticket_response.ticket_id

              AND t.user_account_id =
                  user_account.fn_app_current_user_id()
        )
    )
);


-- ============================================================
-- 3. REPORTES GENERADOS
-- ============================================================
-- El reporte siempre pertenece al usuario actual.
--
-- Si tiene home_id, el usuario debe ser miembro del hogar.

DROP POLICY IF EXISTS generated_report_self_insert
ON analytics_support.generated_report;


DROP POLICY IF EXISTS generated_report_self_update
ON analytics_support.generated_report;


CREATE POLICY generated_report_self_insert
ON analytics_support.generated_report

FOR INSERT
TO hidro_smart_app

WITH CHECK (

    user_account_id =
        user_account.fn_app_current_user_id()

    AND (

        home_id IS NULL

        OR home.fn_is_home_member(
            home_id,
            user_account.fn_app_current_user_id()
        )
    )
);


CREATE POLICY generated_report_self_update
ON analytics_support.generated_report

FOR UPDATE
TO hidro_smart_app

USING (

    user_account_id =
        user_account.fn_app_current_user_id()

    AND (

        home_id IS NULL

        OR home.fn_is_home_member(
            home_id,
            user_account.fn_app_current_user_id()
        )
    )
)

WITH CHECK (

    user_account_id =
        user_account.fn_app_current_user_id()

    AND (

        home_id IS NULL

        OR home.fn_is_home_member(
            home_id,
            user_account.fn_app_current_user_id()
        )
    )
);


-- ============================================================
-- 4. NOTIFICACIONES DE ALERTAS
-- ============================================================
-- Tanto la fila original como el nuevo event_id deben pertenecer
-- a un hogar accesible por el usuario.

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
);


-- ============================================================
-- 5. PRIVACIDAD / ARCO
-- ============================================================
-- El usuario conserva:
--
--   INSERT propio
--   SELECT propio
--
-- pero no puede modificar status/answer/answered_by.
--
-- La administracion queda en users.manage.

DROP POLICY IF EXISTS arco_request_self_update
ON privacy.arco_request;


DROP POLICY IF EXISTS arco_request_manager_select
ON privacy.arco_request;


DROP POLICY IF EXISTS arco_request_manager_update
ON privacy.arco_request;


CREATE POLICY arco_request_manager_select
ON privacy.arco_request

FOR SELECT
TO hidro_smart_app

USING (
    user_account.fn_app_has_permission(
        'users.manage'
    )
);


CREATE POLICY arco_request_manager_update
ON privacy.arco_request

FOR UPDATE
TO hidro_smart_app

USING (
    user_account.fn_app_has_permission(
        'users.manage'
    )
)

WITH CHECK (
    user_account.fn_app_has_permission(
        'users.manage'
    )
);