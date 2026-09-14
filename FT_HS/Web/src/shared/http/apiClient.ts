import { env } from '../config/env';

const API_BASE_URL = env.apiBaseUrl;

const ACCESS_TOKEN_KEY = 'hidrosmart_access_token';
const REFRESH_TOKEN_KEY = 'hidrosmart_refresh_token';
export const SESSION_EXPIRED_EVENT = 'hidrosmart:session-expired';
let refreshPromise: Promise<string> | null = null;

type ApiOptions = RequestInit & { skipAuth?: boolean };

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
  save(data: { accessToken?: string; refreshToken?: string }) {
    if (data.accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
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
  const { skipAuth, headers, body, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  if (body && !requestHeaders.has('Content-Type'))
    requestHeaders.set('Content-Type', 'application/json');

  if (!skipAuth && sessionTokens.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${sessionTokens.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    body,
    headers: requestHeaders,
    cache: requestOptions.cache ?? 'no-store',
  });

  if (response.status === 401 && retry && sessionTokens.refreshToken) {
    try {
      await refreshAccessToken();
      return request<T>(path, options, false);
    } catch {
      sessionTokens.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  const data = await parseResponse(response);
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
    apiClient.post<{ data: { userId: string; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { login, password },
      { skipAuth: true }
    ),
  register: (payload: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    documentType: 'CC' | 'CE';
    documentNumber: string;
  }) =>
    apiClient.post<{ data: { message: string } }>(
      '/auth/register',
      payload,
      { skipAuth: true }
    ),
  verifyEmail: (token: string) => apiClient.post<void>('/auth/verify-email', { token }, { skipAuth: true }),
  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string; refreshToken?: string } }>(
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
  resetPassword: (token: string, password: string) =>
    apiClient.post(
      '/auth/reset-password',
      { resetToken: token, newPassword: password },
      { skipAuth: true }
    ),
  passwordResetContext: (token: string) =>
    apiClient.get<{ data: { email: string } }>(
      `/auth/password-reset-context?resetToken=${encodeURIComponent(token)}`,
      { skipAuth: true }
    ),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
};

export const userApi = {
  me: () => apiClient.get<{ data: unknown }>('/users/me'),
  updateMe: (payload: { fullName?: string; phone?: string; city?: string; avatarDataUrl?: string | null }) =>
    apiClient.put<{ data: unknown }>('/users/me', payload),
  preferences: () =>
    apiClient.get<{ data: { language: string; currency: string } }>('/users/me/preferences'),
  updatePreferences: (payload: { language: string; currency: string }) =>
    apiClient.put<{ data: { language: string; currency: string } }>(
      '/users/me/preferences',
      payload
    ),
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
  ) => apiClient.post<{ data: unknown }>(`/homes/${homeId}/members`, payload),
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
  list: (homeId?: number | string) =>
    apiClient.get<{ data: unknown[] }>(
      homeId ? `/devices?homeId=${encodeURIComponent(String(homeId))}` : '/devices'
    ),
  get: (deviceId: number | string) => apiClient.get<{ data: unknown }>(`/devices/${deviceId}`),
  status: (deviceId: number | string) =>
    apiClient.get<{ data: unknown }>(`/devices/${deviceId}/status`),
  register: (payload: unknown) => apiClient.post<{ data: unknown }>('/devices', payload),
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

export const consumptionApi = {
  summary: (query: string) => apiClient.get<{ data: unknown }>(`/consumption/summary?${query}`),
  daily: (query: string) => apiClient.get<{ data: unknown }>(`/consumption/daily?${query}`),
  hourly: (query: string) => apiClient.get<{ data: unknown }>(`/consumption/hourly?${query}`),
  monthly: (query: string) => apiClient.get<{ data: unknown }>(`/consumption/monthly?${query}`),
  cost: (query: string) => apiClient.get<{ data: unknown }>(`/consumption/cost?${query}`),
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
    apiClient.get<{ data: unknown[]; pagination: unknown }>(
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
    apiClient.get<{ data: unknown[]; pagination: unknown }>(
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
