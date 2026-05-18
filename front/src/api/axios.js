import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching the token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for handling 401s and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('refresh');
      
      if (refreshToken) {
        try {
          const res = await axios.post('http://127.0.0.1:8000/api/auth/token/refresh/', {
            refresh: refreshToken,
          });
          
          Cookies.set('access', res.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh expired or invalid
          Cookies.remove('access');
          Cookies.remove('refresh');
          localStorage.removeItem('user');
          window.location.href = '/'; 
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
