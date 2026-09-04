class AnswerHomeMembershipRequest {
  constructor({ status }) { this.status = status; }
  static fromRequest(body = {}) { return new AnswerHomeMembershipRequest({ status: body.status }); }
}
module.exports = { AnswerHomeMembershipRequest };
