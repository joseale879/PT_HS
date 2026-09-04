-- ============================================================
-- DATOS INICIALES: PRIORIDADES DE TICKETS
-- ============================================================
INSERT INTO analytics_support.ticket_priority (priority_id, name, level) VALUES
    (gen_random_uuid(), 'Baja', 1),
    (gen_random_uuid(), 'Media', 2),
    (gen_random_uuid(), 'Alta', 3);