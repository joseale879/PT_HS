DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_account.user_account WHERE status = 'Pending'
    ) THEN
        RAISE EXCEPTION 'No se puede revertir la verificacion de correo mientras existan cuentas Pending';
    END IF;
END;
$$;

ALTER TABLE user_account.user_account
    DROP CONSTRAINT IF EXISTS ck_user_account_status,
    DROP CONSTRAINT IF EXISTS ck_user_account_suspension;

ALTER TABLE user_account.user_account
    ADD CONSTRAINT user_account_status_check
        CHECK (status IN ('Active', 'Suspended', 'Blocked')),
    ADD CONSTRAINT ck_user_account_suspension
        CHECK (status = 'Active' OR suspended_at IS NOT NULL);
