-- ============================================================
-- LLAVES FORÁNEAS - DOMINIO: privacy
-- ============================================================
ALTER TABLE privacy.arco_request
    ADD CONSTRAINT fk_arco_request_answered_by
    FOREIGN KEY (answered_by) REFERENCES user_account.user_account(user_account_id);