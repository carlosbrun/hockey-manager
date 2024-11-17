import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL, // Ajusta el puerto si es necesario
  withCredentials: true, // Esto permite que las cookies se envíen con cada solicitud
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para incluir el token en cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
