class UpdateCurrentUserRequest {
  constructor({ fullName, phone, city, avatarDataUrl }) {
    this.fullName = fullName;
    this.phone = phone;
    this.city = city;
    this.avatarDataUrl = avatarDataUrl;
  }

  static fromRequest(body = {}) {
    const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const value = (camelCase, snakeCase) => Object.prototype.hasOwnProperty.call(source, camelCase)
      ? source[camelCase]
      : source[snakeCase];

    return new UpdateCurrentUserRequest({
      fullName: value('fullName', 'full_name'),
      phone: source.phone,
      city: source.city,
      avatarDataUrl: value('avatarDataUrl', 'avatar_data_url')
    });
  }
}
module.exports = { UpdateCurrentUserRequest };
