const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCOUNT_STATUSES = new Set(['Active', 'Suspended', 'Blocked']);

class AccountAdminService {
  constructor({ userRepository, notificationService, logger = console }) {
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async changeStatus({ actorId, targetUserId, status, reason }) {
    this.requireUuid(actorId, 'actorId');
    this.requireUuid(targetUserId, 'userId');
    if (!ACCOUNT_STATUSES.has(status)) {
      throw this.error('status debe ser Active, Suspended o Blocked', 400);
    }
    const normalizedReason = typeof reason === 'string' ? reason.trim() : null;
    if (status !== 'Active' && (!normalizedReason || normalizedReason.length < 3)) {
      throw this.error('reason es obligatorio para suspender o bloquear una cuenta', 400);
    }
    if (actorId === targetUserId) {
      throw this.error('No puedes cambiar el estado de tu propia cuenta', 400);
    }
    const accountProfile = await this.findNotificationProfile(targetUserId);
    const account = await this.userRepository.changeAccountStatus({
      actorId,
      targetUserId,
      status,
      reason: normalizedReason
    });
    if (!account) throw this.error('Usuario no encontrado o ya eliminado', 404);
    await this.notifyStatus(accountProfile, status, normalizedReason);
    return account;
  }

  async deleteAccount({ actorId, targetUserId }) {
    this.requireUuid(actorId, 'actorId');
    this.requireUuid(targetUserId, 'userId');
    if (actorId === targetUserId) throw this.error('No puedes eliminar tu propia cuenta', 400);
    const accountProfile = await this.findNotificationProfile(targetUserId);
    const deleted = await this.userRepository.deleteAccount({ actorId, targetUserId });
    if (!deleted) throw this.error('Usuario no encontrado o ya eliminado', 404);
    await this.notifyDeleted(accountProfile);
  }

  async notifyStatus(profile, status, reason) {
    if (!profile?.email || !this.notificationService?.isConfigured?.()) return;
    try {
      const input = { recipient: profile.email, name: profile.fullName || profile.username, reason };
      if (status === 'Suspended' || status === 'Blocked') await this.notificationService.sendAccountSuspended(input);
      if (status === 'Active') await this.notificationService.sendAccountReactivated(input);
    } catch (error) {
      this.logger.error('[ACCOUNT] No se pudo enviar la notificación de estado:', error.message);
    }
  }

  async notifyDeleted(profile) {
    if (!profile?.email || !this.notificationService?.isConfigured?.()) return;
    try {
      await this.notificationService.sendAccountDeleted({ recipient: profile.email, name: profile.fullName || profile.username });
    } catch (error) {
      this.logger.error('[ACCOUNT] No se pudo enviar la notificación de eliminación:', error.message);
    }
  }

  async findNotificationProfile(userId) {
    if (!this.userRepository.findById) return null;
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      this.logger.error('[ACCOUNT] No se pudo consultar el contacto para notificación:', error.message);
      return null;
    }
  }

  async listUsers({ actorId, search, status, sort = 'createdAt', order = 'desc', page = 1, pageSize = 20 }) {
    this.requireUuid(actorId, 'actorId');
    const parsedPage = this.positiveInteger(page, 'page');
    const parsedPageSize = this.positiveInteger(pageSize, 'pageSize');
    if (parsedPageSize > 100) throw this.error('pageSize no puede superar 100', 400);
    if (search !== undefined && search !== null && (typeof search !== 'string' || search.trim().length > 100)) {
      throw this.error('search no puede superar 100 caracteres', 400);
    }
    if (status !== undefined && status !== null && !ACCOUNT_STATUSES.has(status)) {
      throw this.error('status debe ser Active, Suspended o Blocked', 400);
    }
    if (!['createdAt', 'username', 'email', 'status'].includes(sort)) {
      throw this.error('sort no es válido', 400);
    }
    if (!['asc', 'desc'].includes(order)) throw this.error('order debe ser asc o desc', 400);
    const result = await this.userRepository.listManagedUsers({
      actorId,
      search: typeof search === 'string' ? search.trim() || null : null,
      status: status || null,
      sort,
      order,
      limit: parsedPageSize,
      offset: (parsedPage - 1) * parsedPageSize
    });
    return {
      items: result.items,
      pagination: { page: parsedPage, pageSize: parsedPageSize, total: result.total, totalPages: Math.ceil(result.total / parsedPageSize) }
    };
  }

  requireUuid(value, field) {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw this.error(`${field} no es válido`, 400);
    }
  }

  error(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  positiveInteger(value, field) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw this.error(`${field} debe ser un entero positivo`, 400);
    return parsed;
  }
}

module.exports = { AccountAdminService };
