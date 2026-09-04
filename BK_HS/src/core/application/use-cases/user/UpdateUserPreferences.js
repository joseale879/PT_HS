const LANGUAGES = new Set(['es', 'en', 'pt', 'it']);
const CURRENCIES = new Set(['COP', 'USD', 'BRL', 'EUR']);

class UpdateUserPreferences {
  constructor({ userRepository }) { this.userRepository = userRepository; }

  async execute({ userId, language, currency }) {
    if (!userId) throw this.error('El usuario autenticado es obligatorio', 400);
    if (!LANGUAGES.has(language)) throw this.error('El idioma seleccionado no es válido', 400);
    if (!CURRENCIES.has(currency)) throw this.error('La moneda seleccionada no es válida', 400);
    const preference = await this.userRepository.updatePreferences({ userId, language, currency });
    if (!preference) throw this.error('No fue posible guardar las preferencias', 400);
    return preference;
  }

  error(message, status) { const error = new Error(message); error.status = status; return error; }
}

module.exports = { UpdateUserPreferences };
