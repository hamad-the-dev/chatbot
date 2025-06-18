import axios from 'axios';

const axiosPrivate = axios.create({
  baseURL: process.env.NEXT_PUBLIC_VITE_BACKEND_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const isBrowser = typeof window !== 'undefined';

// Request interceptor
axiosPrivate.interceptors.request.use(
  (config) => {
    if (isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors but don't redirect for login/register endpoints
    if (error.response?.status === 401 && 
        isBrowser && 
        originalRequest?.url && 
        !originalRequest.url.includes('/auth/login') && 
        !originalRequest.url.includes('/auth/register')) {
      
      // Only clear auth data if it's a token validation error
      const errorMessage = error.response?.data?.message;
      if (errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        
        // Use replace instead of href to avoid adding to browser history
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosPrivate;