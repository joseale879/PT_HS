class HomeResponse {
  static fromEntity(home) {
    return {
      homeId: home.id,
      name: home.name,
      address: home.address,
      city: home.city,
      tier: home.tier,
      status: home.status,
      createdAt: home.createdAt
    };
  }
}

module.exports = { HomeResponse };
