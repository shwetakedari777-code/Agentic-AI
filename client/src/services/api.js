import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('agentflow-auth');
    if (saved) {
      try {
        const token = JSON.parse(saved)?.state?.token || window.localStorage.getItem('agentflow_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {}
    }
  }
  if (typeof window !== 'undefined' && !config.headers.Authorization) {
    const token = window.localStorage.getItem('agentflow_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error) {
  return error?.response?.data?.error || error?.response?.data?.message || error.message || 'Something went wrong';
}

export default api;
