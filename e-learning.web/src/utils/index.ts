import { getToken } from '@/utils/cacheStorage';

export const isBrowser = typeof window !== 'undefined';

export const getHeaders = (options: object = {}): object =>
  Object.assign(
    {},
    {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    options
  );
