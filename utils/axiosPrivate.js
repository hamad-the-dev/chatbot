import axios from 'axios';

const axiosPrivate = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // This enables sending cookies with requests
});

// Add auth token to requests if available
axiosPrivate.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default axiosPrivate;