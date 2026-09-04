const nodemailer = require('nodemailer');

class SmtpEmailSender {
  constructor({ smtp, transportFactory = nodemailer.createTransport }) {
    this.smtp = smtp;
    this.transporter = transportFactory({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.password }
    });
  }

  isConfigured() {
    return Boolean(this.smtp.host && this.smtp.port && this.smtp.user && this.smtp.password && this.smtp.from);
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
