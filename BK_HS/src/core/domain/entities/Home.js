class Home {
  constructor({ id = null, name, address, city, tier = null, status = 'Active', createdAt = null }) {
    this.id = id;
    this.name = Home.validateText(name, 'name', 3, 100);
    this.address = Home.validateText(address, 'address', 1, 255);
    this.city = Home.validateText(city, 'city', 1, 100);
    this.tier = Home.validateTier(tier);
    this.status = status;
    this.createdAt = createdAt;
  }

  static create(attributes) {
    return new Home(attributes);
  }

  static validateText(value, field, min, max) {
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
      throw new Error(`${field} debe tener entre ${min} y ${max} caracteres`);
    }
    return value.trim();
  }

  static validateTier(tier) {
    if (tier === null || tier === undefined || tier === '') return null;
    const numericTier = Number(tier);
    if (!Number.isInteger(numericTier) || numericTier < 1 || numericTier > 6) {
      throw new Error('tier debe ser un número entero entre 1 y 6');
    }
    return numericTier;
  }
}

module.exports = { Home };
