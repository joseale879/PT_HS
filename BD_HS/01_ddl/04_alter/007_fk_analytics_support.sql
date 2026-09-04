-- ============================================================
-- LLAVES FORÁNEAS - DOMINIO: analytics_support
-- ============================================================
ALTER TABLE analytics_support.recommendation
    ADD CONSTRAINT fk_recommendation_created_by
    FOREIGN KEY (created_by) REFERENCES user_account.user_account(user_account_id);