-- ============================================================
-- ÍNDICES - DOMINIO: privacy
-- ============================================================
CREATE INDEX idx_user_consent_user_account_id ON privacy.user_consent(user_account_id);
CREATE INDEX idx_user_consent_type ON privacy.user_consent(type);
CREATE INDEX idx_user_consent_date ON privacy.user_consent(date DESC);
CREATE INDEX idx_user_consent_accepted_type ON privacy.user_consent(accepted, type);

CREATE INDEX idx_arco_request_user_account_id ON privacy.arco_request(user_account_id);
CREATE INDEX idx_arco_request_status ON privacy.arco_request(status);
CREATE INDEX idx_arco_request_deadline_at ON privacy.arco_request(deadline_at) WHERE status IN ('Received', 'In_progress');
CREATE INDEX idx_arco_request_type ON privacy.arco_request(type);
CREATE INDEX idx_arco_request_requested_at ON privacy.arco_request(requested_at DESC);