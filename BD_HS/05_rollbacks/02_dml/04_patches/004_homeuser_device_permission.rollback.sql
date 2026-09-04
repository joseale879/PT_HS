DELETE FROM user_account.role_permission rp
USING user_account.role r, user_account.permission p
WHERE rp.role_id = r.role_id
  AND rp.permission_id = p.permission_id
  AND r.name = 'HomeUser'
  AND p.name = 'devices.manage';