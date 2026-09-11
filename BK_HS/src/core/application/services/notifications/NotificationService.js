class NotificationService {
  constructor({ sender, frontendUrl, passwordResetUrl }) {
    this.sender = sender;
    this.frontendUrl = frontendUrl;
    this.passwordResetUrl = passwordResetUrl || frontendUrl;
  }

  isConfigured() { return this.sender.isConfigured(); }

  async sendEmailVerification({ recipient, verificationToken }) {
    const verificationUrl = new URL(this.frontendUrl);
    verificationUrl.pathname = '/verify-email';
    verificationUrl.searchParams.set('token', verificationToken);
    return this.sendTemplate({ recipient, subject: 'Verifica tu correo de HidroSmart', title: 'Activa tu cuenta',
      paragraphs: ['Confirma tu correo electrónico para activar tu cuenta de HidroSmart.'], buttonText: 'Verificar correo',
      buttonUrl: verificationUrl.toString(), footer: 'El enlace vence en una hora.' });
  }

  async sendPasswordReset({ recipient, resetToken }) {
    const resetUrl = new URL(this.passwordResetUrl);
    resetUrl.searchParams.set('resetToken', resetToken);
    // El correo se muestra solo como referencia en el formulario de recuperación.
    // El token sigue siendo el único dato que autoriza el cambio de contraseña.
    resetUrl.searchParams.set('email', recipient);
    return this.sendTemplate({ recipient, subject: 'Restablece tu contraseña de HidroSmart', title: 'Recuperación de contraseña',
      paragraphs: ['Recibimos una solicitud para restablecer la contraseña de tu cuenta.'], buttonText: 'Restablecer contraseña',
      buttonUrl: resetUrl.toString(), footer: 'Este enlace vence en una hora. Si no hiciste la solicitud, puedes ignorar este correo.' });
  }

  async sendWelcome({ recipient, name }) { return this.sendTemplate({ recipient, subject: 'Bienvenido a HidroSmart', title: `Bienvenido, ${name}`,
    paragraphs: ['Tu cuenta fue creada correctamente. Ya puedes monitorear y gestionar tu consumo de agua.'], buttonText: 'Ingresar a HidroSmart', buttonUrl: this.frontendUrl, footer: 'Gracias por utilizar HidroSmart.' }); }

  async sendPasswordChanged({ recipient, name }) { return this.sendTemplate({ recipient, subject: 'Tu contraseña fue modificada - HidroSmart', title: 'Contraseña modificada',
    paragraphs: [`Hola ${name}.`, 'La contraseña de tu cuenta fue modificada correctamente.'], footer: 'Si no realizaste este cambio, contacta inmediatamente con soporte.' }); }

  async sendSensitiveDataChanged({ recipient, name }) { return this.sendTemplate({ recipient, subject: 'Información de cuenta modificada - HidroSmart', title: 'Información de cuenta modificada',
    paragraphs: [`Hola ${name}.`, 'Se realizó un cambio importante en la información de tu cuenta.'], footer: 'Si no reconoces esta actividad, contacta con soporte.' }); }

  async sendAccountSuspended({ recipient, name, reason }) { return this.sendTemplate({ recipient, subject: 'Cuenta suspendida - HidroSmart', title: 'Cuenta suspendida',
    paragraphs: [`Hola ${name}.`, 'Tu cuenta fue suspendida.', `Motivo: ${reason || 'No especificado'}`], footer: 'Si consideras que esto es un error, contacta con soporte.' }); }

  async sendAccountReactivated({ recipient, name }) { return this.sendTemplate({ recipient, subject: 'Cuenta reactivada - HidroSmart', title: 'Cuenta reactivada',
    paragraphs: [`Hola ${name}.`, 'Tu cuenta fue reactivada correctamente.'], buttonText: 'Ingresar a HidroSmart', buttonUrl: this.frontendUrl, footer: 'Ya puedes utilizar nuevamente los servicios de HidroSmart.' }); }

  async sendAccountDeleted({ recipient, name }) { return this.sendTemplate({ recipient, subject: 'Cuenta eliminada - HidroSmart', title: 'Cuenta eliminada',
    paragraphs: [`Hola ${name}.`, 'Tu cuenta fue eliminada y las sesiones activas fueron cerradas.'], footer: 'Gracias por haber utilizado HidroSmart.' }); }

  async sendLeakAlert({ recipient, name, deviceName, detectedAt }) { return this.sendTemplate({ recipient, subject: 'Alerta: posible fuga detectada - HidroSmart', title: 'Posible fuga detectada',
    paragraphs: [`Hola ${name}.`, 'Se detectó un comportamiento que puede indicar una fuga de agua.', `Dispositivo: ${deviceName}`, `Fecha: ${detectedAt}`], buttonText: 'Revisar HidroSmart', buttonUrl: this.frontendUrl, footer: 'Te recomendamos revisar la instalación lo antes posible.' }); }

  async sendHighConsumption({ recipient, name, consumption, limit }) { return this.sendTemplate({ recipient, subject: 'Consumo elevado de agua - HidroSmart', title: 'Consumo elevado',
    paragraphs: [`Hola ${name}.`, 'Tu consumo de agua superó el límite configurado.', `Consumo actual: ${consumption}`, `Límite: ${limit}`], buttonText: 'Revisar HidroSmart', buttonUrl: this.frontendUrl, footer: 'Revisa tu consumo para identificar posibles desperdicios o anomalías.' }); }

  async sendGoalThreshold80({ recipient, name }) { return this.sendGoalThreshold({ recipient, name, percentage: 80 }); }
  async sendGoalThreshold90({ recipient, name }) { return this.sendGoalThreshold({ recipient, name, percentage: 90 }); }
  async sendGoalThreshold({ recipient, name, percentage }) { return this.sendTemplate({ recipient, subject: `Has alcanzado el ${percentage}% de tu meta - HidroSmart`, title: 'Estás cerca de tu meta',
    paragraphs: [`Hola ${name}.`, `Has consumido aproximadamente el ${percentage}% de tu meta de agua configurada.`], buttonText: 'Revisar HidroSmart', buttonUrl: this.frontendUrl, footer: 'Controlar tu consumo a tiempo puede ayudarte a cumplir tu meta.' }); }

  async sendDeviceNoReading({ recipient, name, deviceName }) { return this.sendTemplate({ recipient, subject: 'Dispositivo sin lecturas - HidroSmart', title: 'Dispositivo sin lecturas',
    paragraphs: [`Hola ${name}.`, `El dispositivo ${deviceName} dejó de enviar lecturas.`], footer: 'Revisa la conexión y el estado del dispositivo.' }); }

  async sendDeviceDisconnected({ recipient, name, deviceName }) { return this.sendTemplate({ recipient, subject: 'Dispositivo desconectado - HidroSmart', title: 'Dispositivo desconectado',
    paragraphs: [`Hola ${name}.`, `El dispositivo ${deviceName} aparece desconectado.`], footer: 'Revisa su conexión para continuar recibiendo información.' }); }

  async sendTicketUpdated({ recipient, name, ticketId, status }) { return this.sendTemplate({ recipient, subject: `Ticket ${ticketId} actualizado - HidroSmart`, title: 'Ticket de soporte actualizado',
    paragraphs: [`Hola ${name}.`, `Tu ticket ${ticketId} fue actualizado.`, `Estado: ${status}`], buttonText: 'Abrir HidroSmart', buttonUrl: this.frontendUrl, footer: 'Puedes revisar el historial completo desde HidroSmart.' }); }

  async sendTemplate({ recipient, subject, title, paragraphs, buttonText, buttonUrl, footer }) {
    const text = [title, ...paragraphs, buttonUrl ? `${buttonText}: ${buttonUrl}` : '', footer].filter(Boolean).join('\n\n');
    return this.sender.send({ recipient, subject, text, html: this.buildTemplate({ title, paragraphs, buttonText, buttonUrl, footer }) });
  }

  buildTemplate({ title, paragraphs = [], buttonText, buttonUrl, footer }) {
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    const button = buttonText && buttonUrl ? `<p style="margin:28px 0"><a href="${escape(buttonUrl)}" style="display:inline-block;padding:12px 20px;background:#0757c8;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">${escape(buttonText)}</a></p>` : '';
    const body = paragraphs.map((paragraph) => `<p style="line-height:1.6">${escape(paragraph)}</p>`).join('');
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937"><main style="max-width:600px;margin:auto;padding:32px;background:#fff;border-radius:12px"><h1 style="margin:0 0 24px;color:#0757c8;font-size:24px">HidroSmart</h1><h2 style="font-size:20px">${escape(title)}</h2>${body}${button}${footer ? `<p style="margin-top:28px;color:#5b6472;font-size:14px;line-height:1.5">${escape(footer)}</p>` : ''}<hr style="border:0;border-top:1px solid #e5e7eb;margin-top:28px"><p style="color:#6b7280;font-size:12px;text-align:center">© HidroSmart</p></main></body></html>`;
  }
}

module.exports = { NotificationService };
