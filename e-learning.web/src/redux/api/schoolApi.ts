import { apiSlice } from './apiSlice';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { extractSchoolsFromListResponse, mapApiSchoolToManaged } from '@/sections/admin/schools/schoolApiHelpers';
import type { ManagedSchool } from '@/@types/schoolManagement';

export const schoolApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSchools: builder.query<ManagedSchool[], void>({
      query: () => ({
        url: API_ENDPOINTS.schoolsList,
        params: { page: 1, pageSize: 1000 },
      }),
      transformResponse: (response: any) => extractSchoolsFromListResponse(response),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'School' as const, id })), { type: 'School', id: 'LIST' }]
          : [{ type: 'School', id: 'LIST' }],
    }),
    /** Lấy danh sách trường thuộc tenant của user hiện tại (dùng cho màn hình phân quyền tenant-admin). */
    getSchoolsByTenant: builder.query<ManagedSchool[], void>({
      query: () => ({
        url: API_ENDPOINTS.schoolsList,
        params: { page: 1, pageSize: 1000, filterByCurrentTenant: true },
      }),
      transformResponse: (response: any) => extractSchoolsFromListResponse(response),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'School' as const, id })), { type: 'School', id: 'TENANT_LIST' }]
          : [{ type: 'School', id: 'TENANT_LIST' }],
    }),
    getSchoolById: builder.query<ManagedSchool | null, string>({
      query: (id) => API_ENDPOINTS.schoolById(id),
      transformResponse: (response: any) => {
        const raw = response.data || response;
        return mapApiSchoolToManaged(raw);
      },
      providesTags: (_result, _error, id) => [{ type: 'School', id }],
    }),
    createSchool: builder.mutation<ManagedSchool, any>({
      query: (data) => ({
        url: API_ENDPOINTS.schoolsCreate,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'School', id: 'LIST' }],
    }),
    updateSchool: builder.mutation<ManagedSchool, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.schoolUpdate(id),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'School', id }, { type: 'School', id: 'LIST' }],
    }),
    updateSchoolStatus: builder.mutation<void, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: API_ENDPOINTS.schoolStatus(id),
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'School', id }, { type: 'School', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSchoolsQuery,
  useGetSchoolsByTenantQuery,
  useGetSchoolByIdQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useUpdateSchoolStatusMutation,
} = schoolApi;
