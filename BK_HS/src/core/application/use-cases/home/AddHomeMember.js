class AddHomeMember {
  constructor({ homeRepository, notificationService, logger = console }) {
    this.homeRepository = homeRepository;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async execute({ userId, homeId, email, homeRole }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw this.badRequest('El email no es válido');
    }
    if (!['Member', 'Guest'].includes(homeRole)) {
      throw this.badRequest('El rol del hogar debe ser Member o Guest');
    }

    const member = await this.homeRepository.addMemberForOwner({
      homeId,
      email: email.trim().toLowerCase(),
      homeRole,
      userId
    });
    if (!member) {
      const error = new Error('Usuario activo no encontrado');
      error.status = 404;
      throw error;
    }

    const notification = await this.notifyMember({ member, homeId, userId });
    return { member, notification };
  }

  async notifyMember({ member, homeId, userId }) {
    const configured = Boolean(this.notificationService?.isConfigured?.());
    const result = { sent: false, configured };
    if (!configured || !member.email || !this.notificationService?.sendHomeAccessGranted) return result;

    let homeName;
    if (this.homeRepository.findByIdForUser) {
      try {
        const home = await this.homeRepository.findByIdForUser(homeId, userId);
        homeName = home?.name;
      } catch (error) {
        this.logger.error('[HOME] No se pudo consultar el nombre del hogar para el correo:', error.message);
      }
    }

    try {
      await this.notificationService.sendHomeAccessGranted({
        recipient: member.email,
        name: member.full_name || member.username,
        homeName,
        homeRole: member.home_role
      });
      result.sent = true;
    } catch (error) {
      this.logger.error('[HOME] No se pudo enviar el correo de acceso al hogar:', error.message);
    }
    return result;
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}

module.exports = { AddHomeMember };
