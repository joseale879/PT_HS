GRANT UPDATE
ON user_account.user_account
TO hidro_smart_app;


GRANT SELECT
ON user_account.user_role
TO hidro_smart_app;


GRANT UPDATE
ON analytics_support.ticket_response
TO hidro_smart_app;


GRANT EXECUTE
ON PROCEDURE consumption.prc_generate_daily_summary(DATE)
TO PUBLIC;


GRANT EXECUTE
ON PROCEDURE audit.prc_clean_old_audit_logs(INTEGER, INTEGER)
TO PUBLIC;


GRANT EXECUTE
ON PROCEDURE analytics_support.prc_archive_closed_tickets(INTEGER, INTEGER)
TO PUBLIC;