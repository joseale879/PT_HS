class RegisterUserRequest {
  constructor({ username, email, password, fullName, documentType, documentNumber, privacyPolicyAccepted, termsAccepted, privacyPolicyVersion, termsVersion }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.privacyPolicyAccepted = privacyPolicyAccepted;
    this.termsAccepted = termsAccepted;
    this.privacyPolicyVersion = privacyPolicyVersion;
    this.termsVersion = termsVersion;
  }

  static fromRequest(body = {}) {
    return new RegisterUserRequest({
      username: body.username,
      email: body.email,
      password: body.password,
      fullName: body.fullName
      , documentType: body.documentType || body.document_type
      , documentNumber: body.documentNumber || body.document_number
      , privacyPolicyAccepted: body.privacyPolicyAccepted
      , termsAccepted: body.termsAccepted
      , privacyPolicyVersion: body.privacyPolicyVersion
      , termsVersion: body.termsVersion
    });
  }
}

module.exports = { RegisterUserRequest };
