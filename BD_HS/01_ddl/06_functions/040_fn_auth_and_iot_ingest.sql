-- Flujos controlados para verificacion de correo, sesion y lecturas IoT.
ALTER TABLE user_account.user_account
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS user_account.email_verification_token (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account.user_account(user_account_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at TIMESTAMPTZ NULL,
    CONSTRAINT ck_email_verification_expiry CHECK (expires_at > created_at),
    CONSTRAINT ck_email_verification_used CHECK (used = FALSE OR used_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user
    ON user_account.email_verification_token(user_account_id, created_at DESC);

CREATE OR REPLACE FUNCTION user_account.fn_create_email_verification_token(
    p_login VARCHAR(150),
    p_token_hash TEXT,
    p_expires_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_token_id UUID;
BEGIN
    SELECT ua.user_account_id INTO v_user_id
      FROM user_account.user_account ua
     WHERE (lower(ua.email) = lower(btrim(p_login))
         OR lower(ua.username) = lower(btrim(p_login)))
       AND ua.deleted_at IS NULL
     LIMIT 1;
    IF v_user_id IS NULL THEN RETURN NULL; END IF;
    IF p_token_hash IS NULL OR length(p_token_hash) <> 64 OR p_expires_at <= now() THEN
        RAISE EXCEPTION 'El token de verificacion no es valido';
    END IF;

    UPDATE user_account.email_verification_token
       SET used = TRUE, used_at = now()
     WHERE user_account_id = v_user_id AND used = FALSE;
    INSERT INTO user_account.email_verification_token (user_account_id, token_hash, expires_at)
    VALUES (v_user_id, p_token_hash, p_expires_at)
    RETURNING verification_id INTO v_token_id;
    RETURN v_token_id;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_consume_email_verification(p_token_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = user_account, public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_verification_id UUID;
BEGIN
    SELECT verification_id, user_account_id
      INTO v_verification_id, v_user_id
      FROM user_account.email_verification_token
     WHERE token_hash = p_token_hash AND used = FALSE AND expires_at > now()
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'El token de verificacion no es valido o expiro'; END IF;
    UPDATE user_account.email_verification_token SET used = TRUE, used_at = now()
     WHERE verification_id = v_verification_id;
    UPDATE user_account.user_account SET email_verified_at = now(), updated_at = now()
     WHERE user_account_id = v_user_id;
    RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_is_session_active(
    p_user_account_id UUID,
    p_session_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = user_account, public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM user_account.session s
          JOIN user_account.user_account ua ON ua.user_account_id = s.user_account_id
         WHERE s.session_id = p_session_id
           AND s.user_account_id = p_user_account_id
           AND s.status = 'Active'
           AND ua.status = 'Active'
           AND ua.deleted_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION device.fn_ingest_sensor_reading(
    p_device_code VARCHAR(100),
    p_mqtt_message_id VARCHAR(100),
    p_consumption_liters NUMERIC,
    p_recorded_at TIMESTAMPTZ
)
RETURNS TABLE(inserted BOOLEAN, reading_id UUID, home_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, device, home, consumption, public, pg_temp
AS $$
DECLARE
    v_device_id UUID;
    v_home_id UUID;
    v_reading_id UUID;
BEGIN
    IF p_device_code IS NULL OR btrim(p_device_code) = ''
       OR p_consumption_liters IS NULL OR p_consumption_liters < 0
       OR p_recorded_at IS NULL THEN
        RAISE EXCEPTION 'La lectura IoT no cumple el contrato minimo';
    END IF;

    SELECT d.device_id, hd.home_id INTO v_device_id, v_home_id
      FROM device.device d
      JOIN home.home_device hd ON hd.device_id = d.device_id
     WHERE d.code = btrim(p_device_code)
       AND d.status = 'Active'
       AND hd.status = 'Active'
     ORDER BY hd.installed_at DESC
     LIMIT 1;
    IF v_device_id IS NULL THEN
        RAISE EXCEPTION 'El dispositivo no esta vinculado a un hogar activo';
    END IF;

    INSERT INTO consumption.sensor_reading
        (device_id, home_id, recorded_at, consumption_liters, mqtt_message_id)
    VALUES
        (v_device_id, v_home_id, p_recorded_at, p_consumption_liters, NULLIF(btrim(p_mqtt_message_id), ''))
    ON CONFLICT (device_id, mqtt_message_id) WHERE mqtt_message_id IS NOT NULL DO NOTHING
    RETURNING reading_id INTO v_reading_id;

    RETURN QUERY SELECT v_reading_id IS NOT NULL, v_reading_id, v_home_id;
END;
$$;

REVOKE ALL ON FUNCTION user_account.fn_create_email_verification_token(VARCHAR, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_consume_email_verification(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_is_session_active(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ) FROM PUBLIC;
