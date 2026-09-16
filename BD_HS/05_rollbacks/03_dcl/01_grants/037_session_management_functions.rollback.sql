REVOKE EXECUTE ON FUNCTION user_account.fn_list_owned_sessions(UUID, UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_revoke_owned_session(UUID, UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_revoke_other_sessions(UUID, UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_revoke_all_sessions(UUID) FROM hidro_smart_app;
