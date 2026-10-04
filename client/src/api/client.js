import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lecture-notes-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/api/auth/')) {
    localStorage.removeItem('lecture-notes-token');
    window.dispatchEvent(new Event('auth:expired'));
  }
  return Promise.reject(error);
});

export function errorMessage(error) {
  return error.response?.data?.message || 'Something went wrong. Please try again.';
}