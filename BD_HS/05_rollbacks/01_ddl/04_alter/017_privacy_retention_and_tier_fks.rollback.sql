ALTER TABLE alert_rate.home_rate
    DROP CONSTRAINT IF EXISTS fk_home_rate_tier_estrato;
ALTER TABLE home.home
    DROP CONSTRAINT IF EXISTS fk_home_tier_estrato;

ALTER TABLE privacy.arco_request
    DROP CONSTRAINT IF EXISTS fk_arco_request_user_account;
ALTER TABLE privacy.arco_request
    ADD CONSTRAINT arco_request_user_account_id_fkey
        FOREIGN KEY (user_account_id)
        REFERENCES user_account.user_account(user_account_id)
        ON DELETE CASCADE;

ALTER TABLE privacy.user_consent
    DROP CONSTRAINT IF EXISTS fk_user_consent_user_account;
ALTER TABLE privacy.user_consent
    ADD CONSTRAINT user_consent_user_account_id_fkey
        FOREIGN KEY (user_account_id)
        REFERENCES user_account.user_account(user_account_id)
        ON DELETE CASCADE;