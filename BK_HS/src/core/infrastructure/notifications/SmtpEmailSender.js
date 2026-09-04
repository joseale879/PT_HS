const nodemailer = require('nodemailer');

class SmtpEmailSender {
  constructor({ smtp, transportFactory = nodemailer.createTransport }) {
    this.smtp = smtp;
    const transportOptions = {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure
    };
    if (smtp.user || smtp.password) {
      transportOptions.auth = { user: smtp.user, pass: smtp.password };
    }
    this.transporter = transportFactory(transportOptions);
  }

  isConfigured() {
    const hasPartialAuth = Boolean(this.smtp.user) !== Boolean(this.smtp.password);
    return Boolean(this.smtp.host && this.smtp.port && this.smtp.from && !hasPartialAuth);
  }

  async verifyConfiguration() {
    if (!this.isConfigured()) return false;
    await this.transporter.verify();
    return true;
  }

  async send({ recipient, subject, text, html }) {
    if (!this.isConfigured()) {
      const error = new Error('SMTP no está configurado para enviar correos');
      error.status = 503;
      throw error;
    }
    if (typeof recipient !== 'string' || !recipient.trim()) {
      const error = new Error('El destinatario es obligatorio');
      error.status = 400;
      throw error;
    }
    const result = await this.transporter.sendMail({ from: this.smtp.from, to: recipient.trim(), subject, text, html });
    return { messageId: result.messageId, accepted: result.accepted, rejected: result.rejected };
  }
}

module.exports = { SmtpEmailSender };
