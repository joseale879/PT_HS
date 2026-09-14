class UpdateCurrentUserRequest {
  constructor({ fullName, phone = null, city = null, avatarDataUrl = null }) { this.fullName = fullName; this.phone = phone; this.city = city; this.avatarDataUrl = avatarDataUrl; }
  static fromRequest(body = {}) { return new UpdateCurrentUserRequest({ fullName: body.fullName ?? body.full_name, phone: body.phone, city: body.city, avatarDataUrl: body.avatarDataUrl }); }
}
module.exports = { UpdateCurrentUserRequest };
