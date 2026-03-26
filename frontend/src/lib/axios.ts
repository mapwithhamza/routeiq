/**
 * src/lib/axios.ts — Axios instance for RouteIQ
 * All requests include credentials (httpOnly cookie auth).
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true, // CRITICAL — required for httpOnly cookie auth
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
