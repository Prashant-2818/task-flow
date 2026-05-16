import axios from 'axios';

const api = axios.create({
  baseURL: 'https://task-flow-uhf2.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// ==============================
// REQUEST INTERCEPTOR
// ==============================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // Attach token only if valid
    if (
      token &&
      token !== 'null' &&
      token !== 'undefined'
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==============================
// RESPONSE INTERCEPTOR
// ==============================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    // Handle unauthorized access
    if (
      error.response &&
      error.response.status === 401
    ) {
      console.warn('Session expired. Logging out.');

      localStorage.removeItem('token');
      localStorage.removeItem('role');

      // Notify app globally
      window.dispatchEvent(
        new Event('auth:unauthorized')
      );
    }

    // Handle forbidden access
    if (
      error.response &&
      error.response.status === 403
    ) {
      console.warn('Access forbidden.');
    }

    // Handle backend unavailable
    if (
      error.code === 'ERR_NETWORK'
    ) {
      console.error(
        'Unable to connect to backend server.'
      );
    }

    return Promise.reject(error);
  }
);

export default api;