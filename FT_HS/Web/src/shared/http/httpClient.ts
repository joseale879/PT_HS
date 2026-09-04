// Infraestructura HTTP compartida. Los endpoints concretos viven en cada feature.
export {
  apiClient,
  ApiError,
  sessionTokens,
  authApi,
  userApi,
  homesApi,
  devicesApi,
  consumptionApi,
  alertsApi,
  tariffApi,
  goalsApi,
  vacationApi,
  rolesApi,
  supportApi,
  auditApi,
} from './apiClient';
