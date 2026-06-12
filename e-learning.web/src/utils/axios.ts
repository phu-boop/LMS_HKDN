import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { HOST_API_URL } from '@/config';
import { getToken } from './cacheStorage';
import { getHeaders } from '.';
import { refreshAccessTokenWithMutex } from './accessTokenRefresh';

// ----------------------------------------------------------------------

type RequestConfigWithFlags = AxiosRequestConfig & {
  skipTokenRefresh?: boolean;
  _retry?: boolean;
};

const axiosInstance = axios.create({
  baseURL: HOST_API_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    const headers = config.headers as Record<string, unknown>;
    const skipAuth = headers?.['x-skip-auth'];

    if (skipAuth) {
      delete (config.headers as Record<string, unknown>)['x-skip-auth'];
      (config as RequestConfigWithFlags).skipTokenRefresh = true;
    }

    if (token && !skipAuth) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as typeof config.headers;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RequestConfigWithFlags | undefined;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error || new Error('Request failed'));
    }

    if (originalRequest.skipTokenRefresh) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccess = await refreshAccessTokenWithMutex();
    if (!newAccess) {
      return Promise.reject(error || new Error('Request failed'));
    }

    originalRequest.headers = {
      ...originalRequest.headers,
      ...(getHeaders() as Record<string, string>),
    } as typeof originalRequest.headers;

    return axiosInstance(originalRequest);
  }
);

export default axiosInstance;
