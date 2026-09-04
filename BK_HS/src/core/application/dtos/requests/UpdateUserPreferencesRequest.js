class UpdateUserPreferencesRequest {
  constructor({ language, currency }) {
    this.language = typeof language === 'string' ? language.trim().toLowerCase() : language;
    this.currency = typeof currency === 'string' ? currency.trim().toUpperCase() : currency;
  }

  static fromRequest(body = {}) {
    return new UpdateUserPreferencesRequest({ language: body.language, currency: body.currency });
  }
}

module.exports = { UpdateUserPreferencesRequest };
