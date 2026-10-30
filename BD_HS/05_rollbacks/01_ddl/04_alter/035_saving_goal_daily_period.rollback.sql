ALTER TABLE home.saving_goal
    DROP CONSTRAINT IF EXISTS ck_saving_goal_type,
    DROP CONSTRAINT IF EXISTS ck_saving_goal_target_m3_nonnegative;

ALTER TABLE home.saving_goal
    ADD CONSTRAINT saving_goal_type_check
        CHECK (type IN ('monthly', 'weekly', 'annual')),
    ADD CONSTRAINT saving_goal_target_m3_check
        CHECK (target_m3 > 0);
