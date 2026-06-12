import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { HOST_API_URL } from '@/config';
import { getToken } from '@/utils/cacheStorage';

// Define a service using a base URL and expected endpoints
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: HOST_API_URL,
    prepareHeaders: (headers) => {
      const accessToken = getToken();
      if (accessToken) {
        headers.set('authorization', `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  tagTypes: ['School', 'Tenant', 'Subscription'],
  endpoints: () => ({}),
});
