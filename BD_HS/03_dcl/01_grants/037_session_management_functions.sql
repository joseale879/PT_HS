GRANT EXECUTE ON FUNCTION user_account.fn_list_owned_sessions(UUID, UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_revoke_owned_session(UUID, UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_revoke_other_sessions(UUID, UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_revoke_all_sessions(UUID) TO hidro_smart_app;
