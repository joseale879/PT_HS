'use strict';

const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function main() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.BREVO_FROM_EMAIL?.trim();
  const fromName = process.env.BREVO_FROM_NAME || 'HidroSmart';
  const toEmail = process.env.BREVO_TEST_EMAIL?.trim();

  if (!apiKey || !fromEmail || !toEmail) {
    console.error('ERROR: Faltan variables de Brevo.');
    console.error('Necesitas: BREVO_API_KEY, BREVO_FROM_EMAIL y BREVO_TEST_EMAIL.');
    process.exitCode = 1;
    return;
  }

  if (/^xsmtpsib-/i.test(apiKey)) {
    console.error('ERROR: BREVO_API_KEY contiene una clave SMTP.');
    console.error('Usa una API key de Brevo para la API HTTPS.');
    process.exitCode = 1;
    return;
  }

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: toEmail }],
    subject: 'Prueba de correo - HidroSmart',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;padding:24px">
        <h2>HidroSmart</h2>
        <p>Prueba de correo transaccional mediante Brevo.</p>
        <p>Si recibiste este mensaje, la API de envío funciona.</p>
      </div>
    `,
    textContent: 'HidroSmart: prueba de correo transaccional mediante Brevo.'
  };

  console.log('Iniciando prueba de correo...');
  console.log('Proveedor: Brevo HTTPS');

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const rawBody = await response.text();
    let result = {};

    try {
      result = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      // Se reporta el estado HTTP aunque Brevo no devuelva JSON válido.
    }

    console.log('HTTP STATUS:', response.status);

    if (response.ok) {
      console.log('Brevo aceptó la solicitud.');
      console.log('Message ID:', result.messageId || 'No informado');
      console.log('Revisa los registros de Brevo y el buzón destinatario.');
    } else {
      console.error('Brevo rechazó la solicitud.');
      console.error('Código:', result.code || 'No informado');
      console.error('Mensaje:', result.message || 'Sin detalle');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Error de conexión:', error.message);
    process.exitCode = 1;
  }
}

main();
