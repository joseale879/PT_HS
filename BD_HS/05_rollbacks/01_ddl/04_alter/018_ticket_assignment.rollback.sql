ALTER TABLE analytics_support.ticket DROP CONSTRAINT IF EXISTS fk_ticket_assigned_to;
DROP INDEX IF EXISTS analytics_support.idx_ticket_assigned_to;
ALTER TABLE analytics_support.ticket DROP COLUMN IF EXISTS assigned_to;
