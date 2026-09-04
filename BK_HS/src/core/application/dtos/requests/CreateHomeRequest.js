class CreateHomeRequest {
  constructor({ name, address, city, tier = null }) {
    this.name = name;
    this.address = address;
    this.city = city;
    this.tier = tier;
  }

  static fromRequest(body = {}) {
    return new CreateHomeRequest({
      name: body.name,
      address: body.address,
      city: body.city,
      tier: body.tier
    });
  }
}

module.exports = { CreateHomeRequest };
