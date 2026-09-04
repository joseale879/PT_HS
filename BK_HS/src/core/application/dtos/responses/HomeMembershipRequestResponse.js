class HomeMembershipRequestResponse {
  static fromRow(row) {
    return {
      requestId: row.request_id,
      homeId: row.home_id,
      userId: row.user_id,
      status: row.status,
      requestedAt: row.requested_at,
      answeredAt: row.answered_at || null
    };
  }
}
module.exports = { HomeMembershipRequestResponse };
