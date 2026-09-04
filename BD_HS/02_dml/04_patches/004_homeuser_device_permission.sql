-- Permite al rol funcional HomeUser registrar sus propios dispositivos
-- mediante device.fn_register_device. El alcance de uso sigue limitado
-- por la funcion SECURITY DEFINER y las politicas RLS.
INSERT INTO user_account.role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM user_account.role r
JOIN user_account.permission p ON p.name = 'devices.manage'
WHERE r.name = 'HomeUser'
ON CONFLICT DO NOTHING;