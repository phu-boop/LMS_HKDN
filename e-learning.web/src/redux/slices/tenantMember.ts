import { createSlice } from '@reduxjs/toolkit';
// utils
import axios from '../../utils/axios';
//
import { dispatch } from '../store';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { TenantMember } from '@/@types/cmsContent';

// ----------------------------------------------------------------------

type TenantMemberState = {
  isLoading: boolean;
  error: Error | string | null;
  members: TenantMember[];
  roles: any[];
  searchResults: any[];
};

const initialState: TenantMemberState = {
  isLoading: false,
  error: null,
  members: [],
  roles: [],
  searchResults: [],
};

const slice = createSlice({
  name: 'tenantMember',
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },

    // HAS ERROR
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },

    // GET MEMBERS
    getMembersSuccess(state, action) {
      state.isLoading = false;
      state.members = action.payload;
    },

    // GET ROLES
    getRolesSuccess(state, action) {
      state.isLoading = false;
      state.roles = action.payload;
    },

    // SEARCH USERS
    searchUsersSuccess(state, action) {
      state.isLoading = false;
      state.searchResults = action.payload;
    },
  },
});

// Reducer
export default slice.reducer;

// Actions
export const { startLoading, hasError } = slice.actions;

// ----------------------------------------------------------------------

export function getTenantMembers(tenantId: string) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.tenantsMembers(tenantId), {
        params: { page: 1, pageSize: 1000 },
      });
      dispatch(slice.actions.getMembersSuccess(response.data.items || response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function getAdminRoles() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.adminRoles);
      dispatch(slice.actions.getRolesSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function searchUsers(query: string) {
  return async () => {
    if (!query) {
      dispatch(slice.actions.searchUsersSuccess([]));
      return;
    }
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.usersList, {
        params: { search: query, page: 1, pageSize: 1000 },
      });
      dispatch(slice.actions.searchUsersSuccess(response.data.items || response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
    }
  };
}

export function assignTenantRole(userId: string, tenantId: string, roleCode: string) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      await axios.post(API_ENDPOINTS.assignUserTenant(userId), {
        tenantId,
        roleCode,
      });
      // Refresh list
      dispatch(getTenantMembers(tenantId));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}

export function revokeTenantRole(userId: string, tenantId: string) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      await axios.delete(API_ENDPOINTS.revokeUserTenant(userId, tenantId));
      // Refresh list
      dispatch(getTenantMembers(tenantId));
    } catch (error) {
      dispatch(slice.actions.hasError(error));
      throw error;
    }
  };
}
