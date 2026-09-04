-- ============================================================
-- ÍNDICES - DOMINIO: analytics_support
-- ============================================================
CREATE INDEX idx_recommendation_category_active ON analytics_support.recommendation_category(active);

CREATE INDEX idx_recommendation_category_id ON analytics_support.recommendation(category_id);
CREATE INDEX idx_recommendation_active ON analytics_support.recommendation(active);

CREATE INDEX idx_user_recommendation_user_account_id ON analytics_support.user_recommendation(user_account_id);
CREATE INDEX idx_user_recommendation_status ON analytics_support.user_recommendation(status);
CREATE INDEX idx_user_recommendation_recommendation_id ON analytics_support.user_recommendation(recommendation_id);
CREATE INDEX idx_user_recommendation_home_id ON analytics_support.user_recommendation(home_id);

CREATE INDEX idx_generated_report_user_account_id ON analytics_support.generated_report(user_account_id);
CREATE INDEX idx_generated_report_home_id ON analytics_support.generated_report(home_id);
CREATE INDEX idx_generated_report_status ON analytics_support.generated_report(status);
CREATE INDEX idx_generated_report_created_at ON analytics_support.generated_report(created_at DESC);
CREATE INDEX idx_generated_report_available_until ON analytics_support.generated_report(available_until) WHERE status = 'Ready';

-- Índices para tickets (soporte)
CREATE INDEX idx_ticket_user_account_id ON analytics_support.ticket(user_account_id);
CREATE INDEX idx_ticket_status_id ON analytics_support.ticket(status_id);
CREATE INDEX idx_ticket_created_at ON analytics_support.ticket(created_at DESC);
CREATE INDEX idx_ticket_category_id ON analytics_support.ticket(category_id);
CREATE INDEX idx_ticket_priority_id ON analytics_support.ticket(priority_id);

CREATE INDEX idx_ticket_response_ticket_id ON analytics_support.ticket_response(ticket_id);
CREATE INDEX idx_ticket_response_user_account_id ON analytics_support.ticket_response(user_account_id);