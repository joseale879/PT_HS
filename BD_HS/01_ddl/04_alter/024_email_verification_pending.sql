-- Las cuentas nuevas permanecen pendientes hasta confirmar el correo.
ALTER TABLE user_account.user_account
    DROP CONSTRAINT IF EXISTS user_account_status_check,
    DROP CONSTRAINT IF EXISTS ck_user_account_status,
    DROP CONSTRAINT IF EXISTS ck_user_account_suspension;

ALTER TABLE user_account.user_account
    ADD CONSTRAINT ck_user_account_status
        CHECK (status IN ('Pending', 'Active', 'Suspended', 'Blocked')),
    ADD CONSTRAINT ck_user_account_suspension
        CHECK (status IN ('Active', 'Pending') OR suspended_at IS NOT NULL);
