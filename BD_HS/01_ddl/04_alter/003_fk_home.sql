-- ============================================================
-- LLAVES FORÁNEAS - DOMINIO: home
-- ============================================================
ALTER TABLE home.home_user
    ADD CONSTRAINT fk_home_user_added_by
    FOREIGN KEY (added_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE home.home_user_function
    ADD CONSTRAINT fk_home_user_function_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES user_account.user_account(user_account_id);

ALTER TABLE home.home_member_request
    ADD CONSTRAINT fk_home_member_request_answered_by
    FOREIGN KEY (answered_by) REFERENCES user_account.user_account(user_account_id);