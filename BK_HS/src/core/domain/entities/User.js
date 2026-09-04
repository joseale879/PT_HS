class User {
  constructor({ id, username, email, status, fullName, documentType = null, documentNumber = null, phone = null, city = null, createdAt = null }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.status = status;
    this.fullName = fullName;
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.phone = phone;
    this.city = city;
    this.createdAt = createdAt;
  }
}

module.exports = { User };
