class UpdateCurrentUserRequest {
  constructor({ fullName, phone = null, city = null }) { this.fullName = fullName; this.phone = phone; this.city = city; }
  static fromRequest(body = {}) { return new UpdateCurrentUserRequest({ fullName: body.fullName ?? body.full_name, phone: body.phone, city: body.city }); }
}
module.exports = { UpdateCurrentUserRequest };
