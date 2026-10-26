INSERT INTO user_account.permission (name, description, type, status)
VALUES ('actuators.manage', 'Enviar y consultar comandos de actuadores', 'functional', 'Active')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    status = 'Active';

INSERT INTO user_account.role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM user_account.role r
JOIN user_account.permission p ON p.name = 'actuators.manage'
WHERE r.name IN ('Administrator', 'HomeUser')
ON CONFLICT DO NOTHING;
