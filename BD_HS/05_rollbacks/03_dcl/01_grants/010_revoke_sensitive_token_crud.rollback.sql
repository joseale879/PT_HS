-- Restauracion conservadora del acceso que existia antes de este changeset.
GRANT INSERT, UPDATE, DELETE ON user_account.password_reset_token,
    user_account.token,
    user_account.session
TO hidro_smart_app;