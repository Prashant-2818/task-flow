import axios from 'axios';

const api = axios.create({
  baseURL: 'https://task-flow-uhf2.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // Prevent sending malformed tokens like 'null' or 'undefined'
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[JWT Debug] Attached Bearer token to ${config.url}`);
    } else {
      delete config.headers.Authorization;
      console.log(`[JWT Debug] No valid token found for ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');

      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;