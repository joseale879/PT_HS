const CHANNELS = new Set(['Email', 'SMS', 'Push', 'All']);
const GROUP_KEYS = {
  consumption: ['dailyReport', 'weeklyReport', 'monthlyReport'],
  alerts: ['leakDetection', 'abnormalConsumption', 'flowThresholdExceeded'],
  devices: ['deviceDisconnected', 'lowBattery'],
  channels: ['email', 'push'],
};
const DEFAULTS = {
  consumption: { dailyReport: true, weeklyReport: true, monthlyReport: true },
  alerts: { leakDetection: true, abnormalConsumption: true, flowThresholdExceeded: true },
  devices: { deviceDisconnected: true, lowBattery: true },
  channels: { email: true, push: false },
};

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizePreferences(value) {
  if (value === undefined || value === null) return structuredClone(DEFAULTS);
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw invalid('notificationPreferences debe ser un objeto');
  }

  const normalized = structuredClone(DEFAULTS);
  for (const [group, keys] of Object.entries(GROUP_KEYS)) {
    if (value[group] === undefined || value[group] === null) continue;
    if (typeof value[group] !== 'object' || Array.isArray(value[group])) {
      throw invalid(`notificationPreferences.${group} debe ser un objeto`);
    }
    for (const key of keys) {
      if (value[group][key] === undefined) continue;
      if (typeof value[group][key] !== 'boolean') {
        throw invalid(`notificationPreferences.${group}.${key} debe ser booleano`);
      }
      normalized[group][key] = value[group][key];
    }
  }
  return normalized;
}

class UpdateNotificationPreferences {
  constructor({ userRepository }) { this.userRepository = userRepository; }

  async execute({ userId, notificationsEnabled, preferredChannel, notificationPreferences }) {
    if (!userId) throw invalid('El usuario autenticado es obligatorio');
    if (typeof notificationsEnabled !== 'boolean') {
      throw invalid('notificationsEnabled debe ser booleano');
    }
    if (!CHANNELS.has(preferredChannel)) {
      throw invalid('preferredChannel no es válido');
    }
    const normalized = normalizePreferences(notificationPreferences);
    const preference = await this.userRepository.updateNotificationPreferences({
      userId,
      notificationsEnabled,
      preferredChannel,
      notificationPreferences: normalized,
    });
    if (!preference) throw invalid('No fue posible guardar las preferencias de notificación');
    return { ...preference, notificationPreferences: normalizePreferences(preference.notificationPreferences) };
  }
}

module.exports = { UpdateNotificationPreferences, normalizePreferences, DEFAULTS };
