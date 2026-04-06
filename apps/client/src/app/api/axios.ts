import axios from 'axios';

const port = import.meta.env.VITE_PORT || 3000;

export const API_URL = `http://localhost:${port}/api`;

export const $api = axios.create({
  baseURL: API_URL,
});

$api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

$api.interceptors.response.use(
  (config) => config,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && error.config && !error.config._isRetry) {
      originalRequest._isRetry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });

        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        return $api.request(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
      }
    }
    throw error;
  }
);
