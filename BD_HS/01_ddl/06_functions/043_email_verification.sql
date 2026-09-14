CREATE OR REPLACE FUNCTION user_account.fn_create_email_verification_token(p_user_id UUID, p_token_hash TEXT, p_expires_at TIMESTAMPTZ)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = user_account, public, pg_temp AS $$
BEGIN
  IF p_token_hash IS NULL OR length(p_token_hash) <> 64 OR p_expires_at <= now() THEN RAISE EXCEPTION 'Token de verificación inválido'; END IF;
  UPDATE user_account.email_verification_token SET used = TRUE, used_at = now() WHERE user_account_id = p_user_id AND used = FALSE;
  INSERT INTO user_account.email_verification_token(user_account_id, token_hash, expires_at) VALUES (p_user_id, p_token_hash, p_expires_at);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION user_account.fn_verify_email(p_token_hash TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = user_account, public, pg_temp AS $$
DECLARE v_user_id UUID;
BEGIN
  SELECT user_account_id INTO v_user_id FROM user_account.email_verification_token
   WHERE token_hash = p_token_hash AND used = FALSE AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE user_account.email_verification_token SET used = TRUE, used_at = now() WHERE token_hash = p_token_hash;
  UPDATE user_account.user_account SET status = 'Active', email_verified_at = now(), updated_at = now()
   WHERE user_account_id = v_user_id AND status = 'Pending';
  RETURN v_user_id;
END;
$$;
