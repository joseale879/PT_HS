class RegisterUserRequest {
  constructor({ username, email, password, fullName, documentType, documentNumber }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.documentType = documentType;
    this.documentNumber = documentNumber;
  }

  static fromRequest(body = {}) {
    return new RegisterUserRequest({
      username: body.username,
      email: body.email,
      password: body.password,
      fullName: body.fullName
      , documentType: body.documentType || body.document_type
      , documentNumber: body.documentNumber || body.document_number
    });
  }
}

module.exports = { RegisterUserRequest };
