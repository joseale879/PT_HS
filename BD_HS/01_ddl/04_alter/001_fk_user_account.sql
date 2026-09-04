-- ============================================================
-- LLAVES FORÁNEAS - DOMINIO: user_account
-- ============================================================
ALTER TABLE user_account.user_account
    ADD CONSTRAINT fk_user_account_suspended_by
    FOREIGN KEY (suspended_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE user_account.user_role
    ADD CONSTRAINT fk_user_role_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE user_account.user_credential
    ADD CONSTRAINT fk_user_credential_policy
    FOREIGN KEY (policy_id) REFERENCES user_account.password_policy(policy_id);