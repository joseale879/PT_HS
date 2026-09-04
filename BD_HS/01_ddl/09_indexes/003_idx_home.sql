-- ============================================================
-- ÍNDICES - DOMINIO: home
-- ============================================================
CREATE INDEX idx_home_status ON home.home(status);
CREATE INDEX idx_home_city ON home.home(city);
CREATE INDEX idx_home_tier ON home.home(tier);
CREATE INDEX idx_home_name ON home.home(name);

CREATE INDEX idx_home_user_user_account_id ON home.home_user(user_account_id);
CREATE INDEX idx_home_user_role ON home.home_user(home_role);

CREATE INDEX idx_home_user_function_home_user_id ON home.home_user_function(home_user_id);

CREATE INDEX idx_home_device_home_id ON home.home_device(home_id);
CREATE INDEX idx_home_device_status ON home.home_device(status);
CREATE INDEX idx_home_device_suspendido_en ON home.home_device(suspended_at) WHERE status = 'Suspended';

CREATE INDEX idx_home_member_request_user_account_id ON home.home_member_request(user_account_id);
CREATE INDEX idx_home_member_request_status ON home.home_member_request(status);
CREATE INDEX idx_home_member_request_home_status ON home.home_member_request(home_id, status);

CREATE INDEX idx_vacation_mode_home_active ON home.vacation_mode(home_id, active) WHERE active = TRUE;
CREATE INDEX idx_vacation_mode_dates ON home.vacation_mode(started_at, ended_at);

CREATE INDEX idx_saving_goal_home_type ON home.saving_goal(home_id, type);
CREATE INDEX idx_saving_goal_period_start ON home.saving_goal(period_start);
CREATE INDEX idx_saving_goal_achieved ON home.saving_goal(achieved) WHERE achieved = FALSE;