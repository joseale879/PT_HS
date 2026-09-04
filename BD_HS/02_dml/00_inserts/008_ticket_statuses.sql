-- ============================================================
-- DATOS INICIALES: ESTADOS DE TICKETS
-- ============================================================
INSERT INTO analytics_support.ticket_status (status_id, name) VALUES
    (gen_random_uuid(), 'Abierto'),
    (gen_random_uuid(), 'En Proceso'),
    (gen_random_uuid(), 'Resuelto'),
    (gen_random_uuid(), 'Cerrado');