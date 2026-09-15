import { env } from '../config/env';

const API_BASE_URL = env.apiBaseUrl;

const ACCESS_TOKEN_KEY = 'hidrosmart_access_token';
const REFRESH_TOKEN_KEY = 'hidrosmart_refresh_token';
const SESSION_ID_KEY = 'hidrosmart_session_id';
export const SESSION_EXPIRED_EVENT = 'hidrosmart:session-expired';
let refreshPromise: Promise<string> | null = null;

type ApiOptions = RequestInit & { skipAuth?: boolean; responseType?: 'json' | 'blob' };

export type MembershipRequest = {
  requestId: string;
  homeId: string;
  userId: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  requestedAt: string;
  answeredAt?: string | null;
  email?: string;
  fullName?: string;
};

export type HomeMemberNotification = {
  sent: boolean;
  configured: boolean;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const sessionTokens = {
  get accessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },
  get sessionId() {
    return sessionStorage.getItem(SESSION_ID_KEY);
  },
  save(data: { accessToken?: string; refreshToken?: string; sessionId?: string }) {
    if (data.accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data.sessionId) sessionStorage.setItem(SESSION_ID_KEY, data.sessionId);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem('hidrosmart_session');
    sessionStorage.removeItem('hidrosmart_refresh');
    sessionStorage.removeItem('hidrosmart_role');
  },
};

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionTokens.refreshToken;
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshed = await request<{ data: { accessToken: string; refreshToken?: string } }>(
      '/auth/refresh',
      {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ refreshToken }),
      },
      false
    );
    sessionTokens.save(refreshed.data);
    return refreshed.data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request<T>(path: string, options: ApiOptions = {}, retry = true): Promise<T> {
  const { skipAuth, responseType = 'json', headers, body, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  if (body && !requestHeaders.has('Content-Type'))
    requestHeaders.set('Content-Type', 'application/json');

  if (!skipAuth && sessionTokens.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${sessionTokens.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      body,
      headers: requestHeaders,
    });
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'La solicitud fue cancelada.'
        : 'No se pudo conectar con el backend. Verifica que el servicio esté disponible.';
    throw new ApiError(message, 0, error);
  }

  if (response.status === 401 && retry && sessionTokens.refreshToken) {
    try {
      await refreshAccessToken();
      return request<T>(path, options, false);
    } catch {
      sessionTokens.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  const data =
    response.ok && responseType === 'blob' ? await response.blob() : await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data &&
      'error' in data &&
      (data as { error?: { message?: unknown } }).error?.message
        ? String((data as { error: { message: unknown } }).error.message)
        : typeof data === 'object' && data && 'message' in data
          ? String((data as { message: unknown }).message)
          : `La solicitud falló (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
  getBlob: (path: string, options?: ApiOptions) =>
    request<Blob>(path, { ...options, method: 'GET', responseType: 'blob' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export const authApi = {
  login: (login: string, password: string) =>
    apiClient.post<{
      data: { userId: string; sessionId: string; accessToken: string; refreshToken: string };
    }>('/auth/login', { login, password }, { skipAuth: true }),
  register: (payload: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    documentType: 'CC' | 'CE';
    documentNumber: string;
    privacyPolicyAccepted: boolean;
    termsAccepted: boolean;
    privacyPolicyVersion: string;
    termsVersion: string;
  }) =>
    apiClient.post<{
      data: { message: string; email: string };
    }>('/auth/register', payload, { skipAuth: true }),
  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { sessionId: string; accessToken: string; refreshToken?: string } }>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    ),
  logout: (refreshToken: string) => apiClient.post<void>('/auth/logout', { refreshToken }),
  requestPasswordReset: (email: string) =>
    apiClient.post<{ data: { message: string } }>(
      '/auth/request-password-reset',
      { email },
      { skipAuth: true }
    ),
  passwordResetContext: (resetToken: string) =>
    apiClient.get<{ data: { email: string } }>(
      `/auth/password-reset-context?resetToken=${encodeURIComponent(resetToken)}`,
      { skipAuth: true }
    ),
  resendVerification: (email: string) =>
    apiClient.post<{ data: { message: string } }>(
      '/auth/resend-verification',
      { email },
      { skipAuth: true }
    ),
  verifyEmail: (token: string) =>
    apiClient.post<void>('/auth/verify-email', { token }, { skipAuth: true }),
  resetPassword: (token: string, password: string) =>
    apiClient.post(
      '/auth/reset-password',
      { resetToken: token, newPassword: password },
      { skipAuth: true }
    ),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
  listSessions: () => apiClient.get<{ data: AuthSession[] }>('/auth/sessions'),
  revokeSession: (sessionId: string) =>
    apiClient.delete<void>(`/auth/sessions/${encodeURIComponent(sessionId)}`),
  revokeOtherSessions: () =>
    apiClient.post<{ data: { revokedCount: number } }>('/auth/sessions/revoke-others'),
  revokeAllSessions: () =>
    apiClient.post<{ data: { revokedCount: number } }>('/auth/sessions/revoke-all'),
};

export type AuthSession = {
  sessionId: string;
  status: string;
  startedAt: string;
  endedAt?: string | null;
  sourceIp?: string | null;
  userAgent?: string | null;
  refreshExpiresAt?: string | null;
  isCurrent: boolean;
  avatarDataUrl?: string | null;
};

export const userApi = {
  me: () => apiClient.get<{ data: unknown }>('/users/me'),
  updateMe: (payload: {
    fullName?: string;
    phone?: string;
    city?: string;
    avatarDataUrl?: string | null;
  }) => apiClient.put<{ data: unknown }>('/users/me', payload),
  preferences: () =>
    apiClient.get<{ data: { language: string; currency: string } }>('/users/me/preferences'),
  updatePreferences: (payload: { language: string; currency: string }) =>
    apiClient.put<{ data: { language: string; currency: string } }>(
      '/users/me/preferences',
      payload
    ),
  notificationPreferences: () =>
    apiClient.get<{ data: NotificationSettings }>('/users/me/notifications'),
  updateNotificationPreferences: (payload: NotificationSettings) =>
    apiClient.put<{ data: NotificationSettings }>('/users/me/notifications', payload),
  listManagedUsers: (
    params: {
      search?: string;
      status?: 'Active' | 'Suspended' | 'Blocked';
      sort?: 'createdAt' | 'username' | 'email' | 'status';
      order?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<{
      data: ManagedUser[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/users${suffix}`);
  },
  changeUserStatus: (userId: string, status: 'Active' | 'Suspended' | 'Blocked', reason?: string) =>
    apiClient.patch<{ data: ManagedUser }>(`/users/${encodeURIComponent(userId)}/status`, {
      status,
      reason,
    }),
  deleteUser: (userId: string) => apiClient.delete<void>(`/users/${encodeURIComponent(userId)}`),
};

export type NotificationPreferenceGroups = {
  consumption: {
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  alerts: {
    leakDetection: boolean;
    abnormalConsumption: boolean;
    flowThresholdExceeded: boolean;
  };
  devices: {
    deviceDisconnected: boolean;
    lowBattery: boolean;
  };
  channels: {
    email: boolean;
    push: boolean;
  };
};

export type NotificationSettings = {
  notificationsEnabled: boolean;
  preferredChannel: 'Email' | 'SMS' | 'Push' | 'All' | string;
  notificationPreferences: NotificationPreferenceGroups;
};

export type ManagedUser = {
  userId: string;
  username: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Blocked' | string;
  createdAt: string;
  updatedAt?: string | null;
  fullName?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  roles: string[];
};

export type CollectionPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DeviceListOptions = {
  page?: number;
  pageSize?: number;
  sort?: 'name' | 'code' | 'status' | 'createdAt';
  order?: 'asc' | 'desc';
};

export type DeviceListResponse = {
  data: unknown[];
  pagination: CollectionPagination;
};

export type DeviceTelemetry = {
  readingId: string;
  deviceId: string;
  homeId: string;
  recordedAt: string;
  measuredAt: string;
  receivedAt: string;
  consumptionLiters: number;
  flowRateLpm: number | null;
  totalLiters: number | null;
  pulses: number | null;
  sampleIntervalSeconds: number | null;
  wifiRssiDbm: number | null;
  signalQuality: number | null;
  batteryLevel: number | null;
  voltage: number | null;
  temperature: number | null;
  mqttMessageId: string | null;
};

export type DeviceTelemetryListOptions = {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  sort?: 'measuredAt' | 'receivedAt' | 'flowRateLpm' | 'consumptionLiters';
  order?: 'asc' | 'desc';
};

export type DeviceTelemetryListResponse = {
  data: DeviceTelemetry[];
  pagination: CollectionPagination;
};

export const homesApi = {
  list: () => apiClient.get<{ data: unknown[] }>('/homes'),
  get: (homeId: number | string) => apiClient.get<{ data: unknown }>(`/homes/${homeId}`),
  create: (payload: { name: string; address: string; city: string; tier?: string | null }) =>
    apiClient.post<{ data: unknown }>('/homes', payload),
  update: (
    homeId: number | string,
    payload: { name?: string; address?: string; city?: string; tier?: string | null }
  ) => apiClient.put<{ data: unknown }>(`/homes/${homeId}`, payload),
  members: (homeId: number | string) =>
    apiClient.get<{ data: unknown[] }>(`/homes/${homeId}/members`),
  addMember: (
    homeId: number | string,
    payload: { email: string; homeRole?: 'Owner' | 'Member' | 'Guest' }
  ) =>
    apiClient.post<{ data: unknown; notification?: HomeMemberNotification }>(
      `/homes/${homeId}/members`,
      payload
    ),
  requestMembership: (homeId: number | string) =>
    apiClient.post<{ data: MembershipRequest }>(`/homes/${homeId}/membership-requests`),
  membershipRequests: (homeId: number | string) =>
    apiClient.get<{ data: MembershipRequest[] }>(`/homes/${homeId}/membership-requests`),
  answerMembershipRequest: (requestId: number | string, status: 'Approved' | 'Rejected') =>
    apiClient.patch<{ data: MembershipRequest }>(`/homes/membership-requests/${requestId}`, {
      status,
    }),
  changeMemberRole: (
    homeId: number | string,
    memberUserId: number | string,
    homeRole: 'Owner' | 'Member' | 'Guest'
  ) =>
    apiClient.patch<{ data: unknown }>(`/homes/${homeId}/members/${memberUserId}/role`, {
      homeRole,
    }),
  removeMember: (homeId: number | string, memberUserId: number | string) =>
    apiClient.delete<void>(`/homes/${homeId}/members/${memberUserId}`),
};

export const devicesApi = {
  list: (homeId?: number | string, options: DeviceListOptions = {}) => {
    const query = new URLSearchParams();
    if (homeId !== undefined && homeId !== '') query.set('homeId', String(homeId));
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<DeviceListResponse>(`/devices${suffix}`);
  },
  get: (deviceId: number | string) => apiClient.get<{ data: unknown }>(`/devices/${deviceId}`),
  status: (deviceId: number | string) =>
    apiClient.get<{ data: unknown }>(`/devices/${deviceId}/status`),
  register: (payload: {
    homeId: string;
    code: string;
    name: string;
    type: string;
    location?: string;
    manufacturer?: string;
    model?: string;
    alertThreshold?: number | null;
  }) => apiClient.post<{ data: unknown }>('/devices', payload),
  link: (payload: { homeId: string; code: string }) =>
    apiClient.post<{ data: unknown }>('/devices/link', payload),
  latestTelemetry: (deviceId: string) =>
    apiClient.get<{ data: DeviceTelemetry | null }>(
      `/devices/${encodeURIComponent(deviceId)}/telemetry/latest`
    ),
  telemetry: (deviceId: string, options: DeviceTelemetryListOptions = {}) => {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<DeviceTelemetryListResponse>(
      `/devices/${encodeURIComponent(deviceId)}/telemetry${suffix}`
    );
  },
  update: (deviceId: number | string, payload: unknown) =>
    apiClient.put<{ data: unknown }>(`/devices/${deviceId}`, payload),
  updateConfig: (deviceId: number | string, payload: unknown) =>
    apiClient.put<{ data: unknown }>(`/devices/${deviceId}/config`, payload),
  updateStatus: (deviceId: number | string, payload: unknown) =>
    apiClient.patch<{ data: unknown }>(`/devices/${deviceId}/status`, payload),
  deactivate: (deviceId: number | string) =>
    apiClient.post<void>(`/devices/${deviceId}/deactivate`),
  unlink: (deviceId: number | string, homeId: number | string) =>
    apiClient.delete<void>(`/devices/${deviceId}/home/${homeId}`),
};

export type ActuatorType = 'VALVE' | 'PUMP';
export type ValveCommand = 'OPEN' | 'CLOSED';
export type PumpCommand = 'ON' | 'OFF';
export type ActuatorCommandValue = ValveCommand | PumpCommand;

export type ActuatorState = {
  deviceId: string;
  deviceCode: string;
  homeId: string;
  actuator: ActuatorType;
  status: 'OPEN' | 'CLOSED' | 'ON' | 'OFF' | 'UNKNOWN' | string;
  lastReportedAt: string;
  updatedAt: string;
};

export type ActuatorCommandRecord = {
  commandId: string;
  deviceId: string;
  deviceCode: string;
  homeId: string;
  requestedBy: string;
  actuator: ActuatorType;
  command: ActuatorCommandValue;
  correlationId: string;
  status: 'Pending' | 'Published' | 'Acknowledged' | 'Failed' | 'TimedOut' | 'Cancelled' | string;
  requestedAt: string;
  publishedAt?: string | null;
  acknowledgedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export type ActuatorCommandListOptions = {
  homeId?: string;
  status?: ActuatorCommandRecord['status'];
  page?: number;
  pageSize?: number;
  sort?: 'actuator' | 'command' | 'status' | 'requestedAt';
  order?: 'asc' | 'desc';
};

export const actuatorsApi = {
  states: (homeId?: string) => {
    const suffix = homeId ? `?homeId=${encodeURIComponent(homeId)}` : '';
    return apiClient.get<{ data: ActuatorState[] }>(`/actuators/states${suffix}`);
  },
  deviceStatus: (deviceId: string) =>
    apiClient.get<{ data: ActuatorState[] }>(`/actuators/${encodeURIComponent(deviceId)}/status`),
  commands: (options: ActuatorCommandListOptions = {}) => {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<{
      data: ActuatorCommandRecord[];
      pagination: CollectionPagination;
    }>(`/actuators/commands${suffix}`);
  },
  sendCommand: (
    deviceId: string,
    actuator: ActuatorType,
    command: ActuatorCommandValue,
    correlationId?: string
  ) =>
    apiClient.post<{ data: ActuatorCommandRecord }>(
      `/actuators/${encodeURIComponent(deviceId)}/${actuator.toLowerCase()}/commands`,
      { command, ...(correlationId ? { correlationId } : {}) }
    ),
};

export type ConsumptionSummary = {
  homeId: string;
  period: { from: string; to: string };
  totalM3: number;
  totalLiters: number;
  totalCost: number | null;
  readingCount: number;
};

export type DailyConsumption = {
  homeId: string;
  date: string;
  consumptionLiters: number;
};

export type MonthlyConsumption = {
  homeId: string;
  year: number;
  month: number;
  consumptionLiters: number;
};

export type HourlyConsumption = {
  homeId: string;
  hour: number;
  averageConsumptionM3: number;
  averageConsumptionLiters: number;
  sampleCount: number;
  refreshedAt: string | null;
};

export type ConsumptionSeriesPoint = {
  groupKey: string;
  bucketDate: string | null;
  bucketHour: number | null;
  location: string | null;
  consumptionLiters: number;
  consumptionM3: number;
  readingCount: number;
  averageFlowLpm: number | null;
  peakFlowLpm: number | null;
};

export const consumptionApi = {
  summary: (query: string) =>
    apiClient.get<{ data: ConsumptionSummary }>(`/consumption/summary?${query}`),
  daily: (query: string) =>
    apiClient.get<{ data: DailyConsumption }>(`/consumption/daily?${query}`),
  hourly: (query: string) =>
    apiClient.get<{ data: { homeId: string; points: HourlyConsumption[] } }>(
      `/consumption/hourly?${query}`
    ),
  monthly: (query: string) =>
    apiClient.get<{ data: MonthlyConsumption }>(`/consumption/monthly?${query}`),
  cost: (query: string) =>
    apiClient.get<{ data: { homeId: string; from: string; to: string; totalCost: number | null } }>(
      `/consumption/cost?${query}`
    ),
  advanced: (query: string) =>
    apiClient.get<{
      data: {
        homeId: string;
        from: string;
        to: string;
        groupBy: 'daily' | 'hourly' | 'monthly' | 'location';
        points: ConsumptionSeriesPoint[];
      };
    }>(`/consumption/advanced?${query}`),
};

export const reportsApi = {
  downloadConsumptionPdf: (query: string) => apiClient.getBlob(`/reports/consumption.pdf?${query}`),
  downloadConsumptionExcel: (query: string) =>
    apiClient.getBlob(`/reports/consumption.xlsx?${query}`),
  history: (
    homeId: string,
    params: { page?: number; pageSize?: number; type?: string; status?: string } = {}
  ) => {
    const query = new URLSearchParams({ homeId });
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    return apiClient.get<{ data: GeneratedReport[]; pagination: CollectionPagination }>(
      `/reports/history?${query.toString()}`
    );
  },
  downloadStored: (reportId: string) =>
    apiClient.getBlob(`/reports/${encodeURIComponent(reportId)}/download`),
};

export type GeneratedReport = {
  reportId: string;
  userId: string;
  homeId: string | null;
  type: 'pdf' | 'excel';
  category: string;
  periodStart: string | null;
  periodEnd: string | null;
  sizeBytes: number | null;
  status: 'Generating' | 'Ready' | 'Error';
  errorMessage: string | null;
  createdAt: string;
  availableUntil: string;
};

export type Recommendation = {
  userRecommendationId: string;
  recommendationId: string;
  userId: string;
  homeId: string | null;
  title: string;
  description: string;
  category: string;
  activationThreshold: number | null;
  thresholdUnit: string | null;
  status: 'Pending' | 'Read' | 'Dismissed' | 'Applied' | string;
  usefulness: boolean | null;
  sentAt: string;
  readAt: string | null;
};

export type RecommendationSummary = {
  homeId: string;
  totalRecommendations: number;
  appliedCount: number;
  pendingCount: number;
  dismissedCount: number;
  averageUsefulness: number | null;
  refreshedAt: string | null;
};

export const recommendationsApi = {
  list: (homeId?: string, params: { status?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (homeId) query.set('homeId', homeId);
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<{ data: Recommendation[]; pagination: CollectionPagination }>(
      `/recommendations${suffix}`
    );
  },
  summary: (homeId: string) =>
    apiClient.get<{ data: RecommendationSummary }>(
      `/recommendations/home/${encodeURIComponent(homeId)}/summary`
    ),
  update: (
    userRecommendationId: string,
    payload: { status?: 'Read' | 'Dismissed' | 'Applied'; usefulness?: boolean | null }
  ) =>
    apiClient.patch<{ data: Recommendation }>(
      `/recommendations/${encodeURIComponent(userRecommendationId)}`,
      payload
    ),
};

export type AlertEvent = {
  alertId: string;
  ruleId?: string | null;
  homeId: string;
  message: string | null;
  detectedValue: number | null;
  generatedAt: string;
  status: 'Pending' | 'Sent' | 'Read' | 'Dismissed' | string;
  readAt?: string | null;
  dismissedAt?: string | null;
};

export const alertsApi = {
  pending: (homeId: number | string) =>
    apiClient.get<{
      data: {
        homeId: string;
        pendingCount: number;
        lastAlertAt: string | null;
        refreshedAt: string | null;
      };
    }>(`/alerts/home/${homeId}/pending`),
  rules: (homeId: number | string) =>
    apiClient.get<{ data: unknown[] }>(`/alerts/home/${homeId}/rules`),
  thresholds: (homeId: number | string) =>
    apiClient.get<{ data: unknown }>(`/alerts/home/${homeId}/thresholds`),
  history: (homeId: number | string, query = '') =>
    apiClient.get<{ data: AlertEvent[]; pagination: CollectionPagination }>(
      `/alerts/home/${homeId}/history${query ? `?${query}` : ''}`
    ),
  updateStatus: (alertId: number | string, status: string) =>
    apiClient.patch<{ data: unknown }>(`/alerts/${alertId}/status`, { status }),
  createRule: (homeId: number | string, payload: unknown) =>
    apiClient.post<{ data: unknown }>(`/alerts/home/${homeId}/rules`, payload),
  updateRule: (ruleId: number | string, payload: unknown) =>
    apiClient.patch<{ data: unknown }>(`/alerts/rules/${ruleId}`, payload),
  deleteRule: (ruleId: number | string) => apiClient.delete<void>(`/alerts/rules/${ruleId}`),
  saveThresholds: (homeId: number | string, payload: unknown) =>
    apiClient.put<{ data: unknown }>(`/alerts/home/${homeId}/thresholds`, payload),
  deleteThresholds: (homeId: number | string) =>
    apiClient.delete<void>(`/alerts/home/${homeId}/thresholds`),
};

export const tariffApi = {
  currentByHome: (homeId: number | string) =>
    apiClient.get<{ data: unknown }>(`/tariffs/home/${homeId}`),
};

export const goalsApi = {
  list: (homeId?: number | string) =>
    apiClient.get<{ data: unknown[]; pagination: unknown }>(
      homeId ? `/goals?homeId=${encodeURIComponent(String(homeId))}` : '/goals'
    ),
  get: (goalId: number | string) => apiClient.get<{ data: unknown }>(`/goals/${goalId}`),
  progress: (goalId: number | string) =>
    apiClient.get<{ data: unknown }>(`/goals/${goalId}/progress`),
  create: (payload: unknown) => apiClient.post<{ data: unknown }>('/goals', payload),
  update: (goalId: number | string, payload: unknown) =>
    apiClient.put<{ data: unknown }>(`/goals/${goalId}`, payload),
  remove: (goalId: number | string) => apiClient.delete<void>(`/goals/${goalId}`),
};

export const vacationApi = {
  get: (homeId: number | string, date?: string) =>
    apiClient.get<{ data: unknown }>(
      `/vacation/home/${homeId}${date ? `?date=${encodeURIComponent(date)}` : ''}`
    ),
  save: (homeId: number | string, payload: unknown) =>
    apiClient.put<{ data: unknown }>(`/vacation/home/${homeId}`, payload),
  remove: (homeId: number | string) => apiClient.delete<void>(`/vacation/home/${homeId}`),
};

export const rolesApi = {
  listByUser: (userId: number | string) =>
    apiClient.get<{ data: unknown[] }>(`/roles/users/${userId}`),
  assign: (userId: number | string, payload: unknown) =>
    apiClient.post<{ data: unknown }>(`/roles/users/${userId}`, payload),
  remove: (userId: number | string, roleName: string) =>
    apiClient.delete<void>(`/roles/users/${userId}?roleName=${encodeURIComponent(roleName)}`),
};

export const supportApi = {
  categories: () => apiClient.get<{ data: unknown[] }>('/support/catalogs'),
  list: (query = '') =>
    apiClient.get<{ data: unknown[]; pagination: CollectionPagination }>(
      `/support/tickets${query ? `?${query}` : ''}`
    ),
  get: (ticketId: number | string) =>
    apiClient.get<{ data: unknown }>(`/support/tickets/${ticketId}`),
  responses: (ticketId: number | string) =>
    apiClient.get<{ data: unknown[] }>(`/support/tickets/${ticketId}/responses`),
  create: (payload: unknown) => apiClient.post<{ data: unknown }>('/support/tickets', payload),
  update: (ticketId: number | string, payload: unknown) =>
    apiClient.patch<{ data: unknown }>(`/support/tickets/${ticketId}`, payload),
  respond: (ticketId: number | string, message: string) =>
    apiClient.post<{ data: unknown }>(`/support/tickets/${ticketId}/responses`, { message }),
};

export const auditApi = {
  logs: (query = '') =>
    apiClient.get<{ data: unknown[]; pagination: unknown }>(
      `/audit/logs${query ? `?${query}` : ''}`
    ),
};

export type PrivacyConsent = {
  consentId: string;
  userId: string;
  type: string;
  documentVersion: string;
  accepted: boolean;
  date: string;
  sourceIp?: string | null;
  userAgent?: string | null;
};

export type ArcoRequest = {
  requestId: string;
  userId: string;
  type: string;
  description?: string | null;
  status: 'Received' | 'In_progress' | 'Resolved' | 'Rejected' | string;
  requestedAt: string;
  deadlineAt: string;
  answeredAt?: string | null;
  answer?: string | null;
  answeredBy?: string | null;
  attachmentDocument?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export const privacyApi = {
  exportData: () => apiClient.get<Record<string, unknown>>('/privacy/export'),
  consents: () => apiClient.get<{ data: PrivacyConsent[] }>('/privacy/consents'),
  createConsent: (payload: { type: string; documentVersion: string; accepted: true }) =>
    apiClient.post<{ data: PrivacyConsent }>('/privacy/consents', payload),
  requests: (query = '') =>
    apiClient.get<{ data: ArcoRequest[]; pagination: unknown }>(
      `/privacy/requests${query ? `?${query}` : ''}`
    ),
  createRequest: (payload: { type: string; description?: string }) =>
    apiClient.post<{ data: ArcoRequest }>('/privacy/requests', payload),
  getRequest: (requestId: string) =>
    apiClient.get<{ data: ArcoRequest }>(`/privacy/requests/${encodeURIComponent(requestId)}`),
  manageRequests: (query = '') =>
    apiClient.get<{ data: ArcoRequest[]; pagination: unknown }>(
      `/privacy/requests/manage${query ? `?${query}` : ''}`
    ),
  updateRequest: (requestId: string, payload: { status: string; answer?: string }) =>
    apiClient.patch<{ data: ArcoRequest }>(
      `/privacy/requests/${encodeURIComponent(requestId)}`,
      payload
    ),
};
