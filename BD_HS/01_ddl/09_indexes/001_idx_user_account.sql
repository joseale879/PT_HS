-- ============================================================
-- ÍNDICES - DOMINIO: user_account
-- ============================================================
CREATE INDEX idx_user_account_status ON user_account.user_account(status);
CREATE INDEX idx_user_account_created_at ON user_account.user_account(created_at);
CREATE INDEX idx_user_account_email ON user_account.user_account(email);
CREATE INDEX idx_user_account_deleted_at ON user_account.user_account(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_user_profile_city ON user_account.user_profile(city);
CREATE INDEX idx_user_profile_document_number ON user_account.user_profile(document_number);

CREATE INDEX idx_role_name ON user_account.role(name);
CREATE INDEX idx_permission_name ON user_account.permission(name);

CREATE INDEX idx_user_role_user_account_id ON user_account.user_role(user_account_id);
CREATE INDEX idx_user_role_role_id ON user_account.user_role(role_id);

CREATE INDEX idx_role_permission_role_id ON user_account.role_permission(role_id);
CREATE INDEX idx_role_permission_permission_id ON user_account.role_permission(permission_id);

CREATE INDEX idx_user_credential_policy_id ON user_account.user_credential(policy_id);

CREATE INDEX idx_login_attempt_user_account_id ON user_account.login_attempt(user_account_id);
CREATE INDEX idx_login_attempt_blocked_until ON user_account.login_attempt(blocked_until) WHERE blocked_until IS NOT NULL;

CREATE INDEX idx_password_reset_token_user_account_id ON user_account.password_reset_token(user_account_id);
CREATE INDEX idx_password_reset_token_expires_at ON user_account.password_reset_token(expires_at) WHERE used = FALSE;

CREATE INDEX idx_token_user_account_id ON user_account.token(user_account_id);
CREATE INDEX idx_token_status_expires ON user_account.token(status, expires_at);
CREATE INDEX idx_token_parent_id ON user_account.token(parent_id);

CREATE INDEX idx_session_user_account_id ON user_account.session(user_account_id);
CREATE INDEX idx_session_status_date ON user_account.session(status, started_at);
CREATE INDEX idx_session_token_id ON user_account.session(token_id);