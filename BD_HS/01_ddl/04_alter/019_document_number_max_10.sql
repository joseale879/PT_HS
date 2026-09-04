-- Regla de identificación para el registro de Hidro Smart.
-- La ciudadanía puede conservar numeraciones históricas menores a 10 dígitos;
-- por eso se valida máximo 10, no exactamente 10.
ALTER TABLE user_account.user_profile
    DROP CONSTRAINT IF EXISTS ck_user_profile_document_number_format;

ALTER TABLE user_account.user_profile
    ADD CONSTRAINT ck_user_profile_document_number_format
    CHECK (
        document_number IS NULL
        OR document_number ~ '^[0-9]{1,10}$'
    );
