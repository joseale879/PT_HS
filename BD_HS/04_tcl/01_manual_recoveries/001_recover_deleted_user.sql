-- ============================================================
-- RECUPERACIÓN MANUAL: Usuario eliminado (soft delete)
-- ============================================================
-- Este script permite recuperar un usuario que fue eliminado (soft delete)
-- Reemplazar 'UUID_DEL_USUARIO' con el UUID real
/*
UPDATE user_account.user_account
SET deleted_at = NULL,
    status = 'Active'
WHERE user_account_id = 'UUID_DEL_USUARIO'
  AND deleted_at IS NOT NULL;
*/