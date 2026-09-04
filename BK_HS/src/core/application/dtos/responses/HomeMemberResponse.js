class HomeMemberResponse {
  static fromRow(member) {
    return {
      userId: member.user_id,
      username: member.username,
      email: member.email,
      fullName: member.full_name,
      homeRole: member.home_role,
      assignedAt: member.assigned_at
    };
  }
}

module.exports = { HomeMemberResponse };
