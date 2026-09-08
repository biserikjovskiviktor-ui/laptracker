import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// 1. Request Interceptor: Automatically attach the token from sessionStorage
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('userToken') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized.");
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/auth'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;