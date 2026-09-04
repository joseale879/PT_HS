export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, ''),
};
