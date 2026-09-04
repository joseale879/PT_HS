const ACCESS_TOKEN_KEY = 'hidrosmart_access_token';
const REFRESH_TOKEN_KEY = 'hidrosmart_refresh_token';

export const sessionStorageAdapter = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  save: ({ accessToken, refreshToken }: { accessToken?: string; refreshToken?: string }) => {
    if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => { sessionStorage.removeItem(ACCESS_TOKEN_KEY); sessionStorage.removeItem(REFRESH_TOKEN_KEY); }
};
