class UpdateNotificationPreferencesRequest {
  constructor({ notificationsEnabled, preferredChannel, notificationPreferences }) {
    this.notificationsEnabled = notificationsEnabled;
    this.preferredChannel = preferredChannel;
    this.notificationPreferences = notificationPreferences;
  }

  static fromRequest(body = {}) {
    return new UpdateNotificationPreferencesRequest({
      notificationsEnabled: body.notificationsEnabled,
      preferredChannel: body.preferredChannel,
      notificationPreferences: body.notificationPreferences,
    });
  }
}

module.exports = { UpdateNotificationPreferencesRequest };
