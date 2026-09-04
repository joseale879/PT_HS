class UserResponse {
  static fromEntity(user) { return { userId: user.id, username: user.username, email: user.email, status: user.status, fullName: user.fullName, documentType: user.documentType, documentNumber: user.documentNumber, phone: user.phone, city: user.city, createdAt: user.createdAt }; }
}
module.exports = { UserResponse };
