-- Tokens, sesiones y recuperacion no se manipulan directamente desde la aplicacion.
REVOKE ALL ON user_account.password_reset_token,
    user_account.token,
    user_account.session
FROM hidro_smart_app;