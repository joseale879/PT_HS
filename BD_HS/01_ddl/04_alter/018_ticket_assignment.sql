ALTER TABLE analytics_support.ticket
    ADD COLUMN IF NOT EXISTS assigned_to UUID NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_ticket_assigned_to'
          AND conrelid = 'analytics_support.ticket'::regclass
    ) THEN
        ALTER TABLE analytics_support.ticket
            ADD CONSTRAINT fk_ticket_assigned_to
            FOREIGN KEY (assigned_to)
            REFERENCES user_account.user_account(user_account_id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ticket_assigned_to
    ON analytics_support.ticket(assigned_to);
