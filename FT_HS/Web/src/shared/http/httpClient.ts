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
  recommendationsApi,
  alertsApi,
  tariffApi,
  goalsApi,
  vacationApi,
  rolesApi,
  supportApi,
  auditApi,
} from './apiClient';

export type { Recommendation, RecommendationSummary } from './apiClient';
