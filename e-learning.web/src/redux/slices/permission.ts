import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { ContentPermission, PermissionState } from '@/@types/permission';
import { dispatch } from '../store';

const initialState: PermissionState = {
  isLoading: false,
  error: null,
  permissions: [],
  selectedNodeId: null,
  selectedNodeTitle: null,
  checkedNodeIds: [],
};

const slice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    getPermissionsSuccess(state, action: PayloadAction<ContentPermission[]>) {
      state.isLoading = false;
      state.permissions = action.payload;
    },
    setSelectedNode(state, action: PayloadAction<{ id: string; title: string } | null>) {
      state.selectedNodeId = action.payload?.id || null;
      state.selectedNodeTitle = action.payload?.title || null;
    },
    setCheckedNodeIds(state, action: PayloadAction<string[]>) {
      state.checkedNodeIds = action.payload;
    },
    addPermissionSuccess(state, action: PayloadAction<ContentPermission>) {
      if (state.selectedNodeId === action.payload.curriculumNodeId) {
        state.permissions.push(action.payload);
      }
    },
    updatePermissionSuccess(state, action: PayloadAction<ContentPermission>) {
      const index = state.permissions.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.permissions[index] = action.payload;
      }
    },
    deletePermissionSuccess(state, action: PayloadAction<string>) {
      state.permissions = state.permissions.filter((p) => p.id !== action.payload);
    },
    clearSelectedNode(state) {
      state.selectedNodeId = null;
      state.selectedNodeTitle = null;
      state.permissions = [];
      state.checkedNodeIds = [];
    },
  },
});

export default slice.reducer;

export const { setSelectedNode, setCheckedNodeIds, clearSelectedNode } = slice.actions;

// ----------------------------------------------------------------------

export function fetchNodePermissions(tenantId: string, nodeId: string) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      // Use query parameter to filter by node
      const response = await axios.get(API_ENDPOINTS.tenantsPermissions(tenantId), {
        params: { curriculumNodeId: nodeId, page: 1, pageSize: 1000 },
      });
      dispatch(slice.actions.getPermissionsSuccess(response.data.items || response.data || []));
    } catch (error: any) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}

export function fetchNodesPermissions(tenantId: string, nodeIds: string[]) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.post(API_ENDPOINTS.tenantsCurriculumPermissions(tenantId), {
        nodeIds,
      });
      const payload = response.data?.items || response.data || [];
      const flattened = (payload as any[]).flatMap((item) => item.permissions || []);
      const uniquePermissions = Array.from(
        new Map(flattened.map((permission: any) => [permission.id, permission])).values()
      );
      dispatch(slice.actions.getPermissionsSuccess(uniquePermissions));
    } catch (error: any) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}

export function grantPermission(tenantId: string, permission: Partial<ContentPermission>) {
  return async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.tenantsPermissions(tenantId), permission);
      dispatch(slice.actions.addPermissionSuccess(response.data));
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Không thể thêm phân quyền';
      dispatch(slice.actions.hasError(message));
      throw new Error(message);
    }
  };
}

export function updatePermission(tenantId: string, permission: ContentPermission) {
  return async (dispatch: any, getState: any) => {
    const previousPermissions = getState().permission.permissions;
    dispatch(slice.actions.updatePermissionSuccess(permission));
    try {
      const response = await axios.post(API_ENDPOINTS.tenantsPermissions(tenantId), permission);
      if (response.data) {
        dispatch(slice.actions.updatePermissionSuccess(response.data));
      }
    } catch (error: any) {
      dispatch(slice.actions.getPermissionsSuccess(previousPermissions));
      dispatch(slice.actions.hasError(error.message));
    }
  };
}

export function revokePermission(tenantId: string, permissionId: string) {
  return async () => {
    try {
      await axios.delete(`${API_ENDPOINTS.tenantsPermissions(tenantId)}/${permissionId}`);
      dispatch(slice.actions.deletePermissionSuccess(permissionId));
    } catch (error) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}
