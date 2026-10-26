DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM user_account.user_profile
        WHERE phone IS NOT NULL AND char_length(phone) > 20
    ) THEN
        RAISE EXCEPTION 'No se puede reducir phone a 20 caracteres: existen valores mas largos';
    END IF;
END;
$$;

ALTER TABLE user_account.user_profile
    ALTER COLUMN phone TYPE VARCHAR(20);
