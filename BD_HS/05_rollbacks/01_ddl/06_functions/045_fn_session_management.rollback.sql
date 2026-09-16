DROP FUNCTION IF EXISTS user_account.fn_revoke_all_sessions(UUID);
DROP FUNCTION IF EXISTS user_account.fn_revoke_other_sessions(UUID, UUID);
DROP FUNCTION IF EXISTS user_account.fn_revoke_owned_session(UUID, UUID);
DROP FUNCTION IF EXISTS user_account.fn_list_owned_sessions(UUID, UUID);
