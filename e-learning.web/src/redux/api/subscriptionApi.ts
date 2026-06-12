import { apiSlice } from './apiSlice';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { extractSubscriptionsFromResponse, mapApiSubscriptionToModel } from '@/sections/admin/subscriptions/subscriptionApiHelpers';
import type { Subscription } from '@/@types/subscription';

export const subscriptionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query<Subscription[], void>({
      query: () => API_ENDPOINTS.subscriptionsList,
      transformResponse: (response: any) => extractSubscriptionsFromResponse(response),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Subscription' as const, id })), { type: 'Subscription', id: 'LIST' }]
          : [{ type: 'Subscription', id: 'LIST' }],
    }),
    getSubscriptionsBySchool: builder.query<Subscription[], string>({
      query: (schoolId) => API_ENDPOINTS.schoolSubscriptions(schoolId),
      transformResponse: (response: any) => extractSubscriptionsFromResponse(response),
      providesTags: (result, _error, schoolId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Subscription' as const, id })), { type: 'Subscription', id: `SCHOOL-${schoolId}` }]
          : [{ type: 'Subscription', id: `SCHOOL-${schoolId}` }],
    }),
    createSubscription: builder.mutation<Subscription, { schoolId: string; data: any }>({
      query: ({ schoolId, data }) => ({
        url: API_ENDPOINTS.schoolSubscriptions(schoolId),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { schoolId }) => [
        { type: 'Subscription', id: 'LIST' },
        { type: 'Subscription', id: `SCHOOL-${schoolId}` },
      ],
    }),
    updateSubscription: builder.mutation<Subscription, { schoolId: string; subscriptionId: string; data: any }>({
      query: ({ schoolId, subscriptionId, data }) => ({
        url: API_ENDPOINTS.schoolSubscriptionById(schoolId, subscriptionId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { schoolId, subscriptionId }) => [
        { type: 'Subscription', id: subscriptionId },
        { type: 'Subscription', id: 'LIST' },
        { type: 'Subscription', id: `SCHOOL-${schoolId}` },
      ],
    }),
    deleteSubscription: builder.mutation<void, { schoolId: string; subscriptionId: string }>({
      query: ({ schoolId, subscriptionId }) => ({
        url: API_ENDPOINTS.schoolSubscriptionById(schoolId, subscriptionId),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { schoolId, subscriptionId }) => [
        { type: 'Subscription', id: subscriptionId },
        { type: 'Subscription', id: 'LIST' },
        { type: 'Subscription', id: `SCHOOL-${schoolId}` },
      ],
    }),
  }),
});

export const {
  useGetSubscriptionsQuery,
  useGetSubscriptionsBySchoolQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
} = subscriptionApi;
