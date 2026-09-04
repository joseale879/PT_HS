class NotificationSender {
  isConfigured() {
    throw new Error('NotificationSender.isConfigured no implementado');
  }

  async sendPasswordReset() {
    throw new Error('NotificationSender.sendPasswordReset no implementado');
  }
}

module.exports = { NotificationSender };
