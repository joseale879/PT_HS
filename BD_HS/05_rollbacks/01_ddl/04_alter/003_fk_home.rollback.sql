ALTER TABLE IF EXISTS home.home_user DROP CONSTRAINT IF EXISTS fk_home_user_added_by;
ALTER TABLE IF EXISTS home.home_user_function DROP CONSTRAINT IF EXISTS fk_home_user_function_assigned_by;
ALTER TABLE IF EXISTS home.home_member_request DROP CONSTRAINT IF EXISTS fk_home_member_request_answered_by;
