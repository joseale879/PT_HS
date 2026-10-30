class BrevoEmailSender {
  constructor({ brevo = {}, fetchImpl = globalThis.fetch, logger = console } = {}) {
    this.brevo = brevo;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
  }

  configurationStatus() {
    const missing = [];
    const apiKey = typeof this.brevo.apiKey === 'string' ? this.brevo.apiKey.trim() : '';
    if (!apiKey) {
      missing.push('BREVO_API_KEY');
    } else if (/^xsmtpsib-/i.test(apiKey)) {
      missing.push('BREVO_API_KEY (usa una API key; una clave SMTP no sirve para esta integracion)');
    }
    if (typeof this.brevo.fromEmail !== 'string' || !this.brevo.fromEmail.trim()) {
      missing.push('BREVO_FROM_EMAIL');
    }
    return { configured: missing.length === 0, missing };
  }

  isConfigured() {
    return this.configurationStatus().configured;
  }

  async verifyConfiguration() {
    return this.isConfigured();
  }

  async send({ recipient, subject, text, html }) {
    if (!this.isConfigured()) {
      const error = new Error('Brevo no está configurado correctamente');
      error.status = 503;
      throw error;
    }
    if (typeof recipient !== 'string' || !recipient.trim()) {
      const error = new Error('El destinatario es obligatorio');
      error.status = 400;
      throw error;
    }
    if (typeof this.fetchImpl !== 'function') {
      const error = new Error('Este runtime no tiene soporte para fetch HTTPS');
      error.status = 503;
      throw error;
    }

    const normalizedRecipient = recipient.trim();
    const response = await this.fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.brevo.apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: this.brevo.fromName || 'HidroSmart',
          email: this.brevo.fromEmail.trim()
        },
        to: [{ email: normalizedRecipient }],
        subject,
        textContent: text,
        htmlContent: html
      }),
      signal: AbortSignal.timeout(15000)
    });

    const responseBody = await response.text();
    let result = {};
    try {
      result = responseBody ? JSON.parse(responseBody) : {};
    } catch {
      // No propagamos cuerpos de respuesta no validados.
    }

    if (!response.ok) {
      const providerMessage = typeof result.message === 'string'
        ? result.message.slice(0, 240)
        : 'No provider detail';
      this.logger.error?.('[BREVO] Brevo rechazo el correo transaccional', {
        httpStatus: response.status,
        providerCode: result.code || null,
        providerMessage
      });
      const error = new Error(
        `Brevo rechazó el envío (HTTP ${response.status}): ${result.message || 'Error de envío'}`
      );
      error.status = 502;
      error.code = result.code || 'BREVO_REJECTED';
      error.providerStatus = response.status;
      throw error;
    }

    this.logger.info?.(`[BREVO] Solicitud aceptada (messageId=${result.messageId || 'sin id'})`);

    return {
      messageId: result.messageId,
      accepted: [normalizedRecipient],
      rejected: []
    };
  }
}

module.exports = { BrevoEmailSender };
