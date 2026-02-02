import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/', // Change in production
  withCredentials: false, // If using session auth or CSRF
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Optional: Add JWT token to all requests automatically
// axiosInstance.interceptors.request.use(
//   config => {
//     const token = localStorage.getItem('accessToken');
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   error => Promise.reject(error)
// );

export default axiosInstance;
