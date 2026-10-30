ALTER TABLE home.saving_goal
    DROP CONSTRAINT IF EXISTS saving_goal_type_check,
    DROP CONSTRAINT IF EXISTS ck_saving_goal_type,
    DROP CONSTRAINT IF EXISTS saving_goal_target_m3_check,
    DROP CONSTRAINT IF EXISTS ck_saving_goal_target_m3_nonnegative;

ALTER TABLE home.saving_goal
    ADD CONSTRAINT ck_saving_goal_type
        CHECK (type IN ('daily', 'weekly', 'monthly', 'annual')),
    ADD CONSTRAINT ck_saving_goal_target_m3_nonnegative
        CHECK (target_m3 >= 0);

CREATE OR REPLACE FUNCTION analytics_support.fn_get_goal_progress(p_goal_id UUID)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = analytics_support, consumption, home, user_account, public, pg_temp
AS $$
DECLARE
    v_goal RECORD;
    v_consumed DECIMAL(10,4);
    v_progress DECIMAL(5,2);
    v_end_date DATE;
BEGIN
    SELECT home_id, target_m3, period_start, period_end INTO v_goal
    FROM home.saving_goal WHERE goal_id = p_goal_id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    PERFORM user_account.fn_assert_app_home_access(v_goal.home_id, 'reports.read');
    v_end_date := COALESCE(v_goal.period_end, CURRENT_DATE);
    SELECT COALESCE(SUM(consumption_m3), 0) INTO v_consumed
    FROM consumption.sensor_reading
    WHERE home_id = v_goal.home_id
      AND recorded_at >= v_goal.period_start::timestamp
      AND recorded_at < (v_end_date + 1)::timestamp;

    IF v_goal.target_m3 > 0 THEN
        v_progress := (v_consumed / v_goal.target_m3) * 100;
        IF v_progress > 100 THEN v_progress := 100; END IF;
    ELSIF v_consumed > 0 THEN
        v_progress := 100;
    ELSE
        v_progress := 0;
    END IF;
    RETURN v_progress;
END;
$$;
