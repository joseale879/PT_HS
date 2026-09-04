export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
};
