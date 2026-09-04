-- Conserva evidencia de privacidad y unifica tier con el catalogo de estratos.

ALTER TABLE privacy.user_consent
    DROP CONSTRAINT IF EXISTS user_consent_user_account_id_fkey;
ALTER TABLE privacy.user_consent
    ADD CONSTRAINT fk_user_consent_user_account
        FOREIGN KEY (user_account_id)
        REFERENCES user_account.user_account(user_account_id)
        ON DELETE RESTRICT;

ALTER TABLE privacy.arco_request
    DROP CONSTRAINT IF EXISTS arco_request_user_account_id_fkey;
ALTER TABLE privacy.arco_request
    ADD CONSTRAINT fk_arco_request_user_account
        FOREIGN KEY (user_account_id)
        REFERENCES user_account.user_account(user_account_id)
        ON DELETE RESTRICT;

ALTER TABLE home.home
    ADD CONSTRAINT fk_home_tier_estrato
        FOREIGN KEY (tier)
        REFERENCES alert_rate.estratos(numero_estrato)
        ON DELETE RESTRICT;

ALTER TABLE alert_rate.home_rate
    ADD CONSTRAINT fk_home_rate_tier_estrato
        FOREIGN KEY (tier)
        REFERENCES alert_rate.estratos(numero_estrato)
        ON DELETE RESTRICT;