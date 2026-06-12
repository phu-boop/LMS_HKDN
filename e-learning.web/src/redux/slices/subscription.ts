import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { Subscription } from '@/@types/subscription';
import { dispatch } from '../store';
import { sanitizeUiMessage } from '@/utils/sanitizeUiMessage';
import {
  extractSubscriptionsFromResponse,
  mapApiSubscriptionToModel,
} from '@/sections/admin/subscriptions/subscriptionApiHelpers';

type SubscriptionState = {
  isLoading: boolean;
  loaded: boolean;
  error: string | null;
  items: Subscription[];
};

const initialState: SubscriptionState = {
  isLoading: false,
  loaded: false,
  error: null,
  items: [],
};

const slice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
      state.error = null;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = action.payload;
    },
    loadSuccess(state, action: PayloadAction<Subscription[]>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      state.items = action.payload;
    },
    upsertSuccess(state, action: PayloadAction<Subscription>) {
      const idx = state.items.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items = [action.payload, ...state.items];
      state.isLoading = false;
      state.error = null;
    },
    deleteSuccess(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x.id !== action.payload);
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { startLoading, hasError, loadSuccess, upsertSuccess, deleteSuccess } = slice.actions;
export default slice.reducer;

export function fetchSubscriptions() {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.get(API_ENDPOINTS.subscriptionsList, {
        params: { page: 1, pageSize: 1000 },
      });
      const rows = extractSubscriptionsFromResponse(res.data);
      dispatch(loadSuccess(rows));
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể tải danh sách hợp đồng')));
    }
  };
}

export function fetchSubscriptionsBySchool(schoolId: string) {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.get(API_ENDPOINTS.schoolSubscriptions(schoolId));
      const rows = extractSubscriptionsFromResponse(res.data);
      dispatch(loadSuccess(rows));
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể tải danh sách hợp đồng theo trường')));
    }
  };
}

export function createSubscription(schoolId: string, data: any) {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.post(API_ENDPOINTS.schoolSubscriptions(schoolId), data);
      const rows = extractSubscriptionsFromResponse(res.data);
      if (rows.length > 0) {
        rows.forEach((created) => {
          dispatch(upsertSuccess(created));
        });
      } else {
        const raw = res.data.data || res.data;
        const created = mapApiSubscriptionToModel(raw);
        if (created) dispatch(upsertSuccess(created));
      }
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể tạo hợp đồng')));
      throw e;
    }
  };
}

export function updateSubscription(schoolId: string, subscriptionId: string, data: any) {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.put(API_ENDPOINTS.schoolSubscriptionById(schoolId, subscriptionId), data);
      const rows = extractSubscriptionsFromResponse(res.data);
      if (rows.length > 0) {
        rows.forEach((updated) => {
          dispatch(upsertSuccess(updated));
        });
      } else {
        const raw = res.data.data || res.data;
        const updated = mapApiSubscriptionToModel(raw);
        if (updated) dispatch(upsertSuccess(updated));
      }
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể cập nhật hợp đồng')));
      throw e;
    }
  };
}

export function deleteSubscription(schoolId: string, subscriptionId: string) {
  return async () => {
    dispatch(startLoading());
    try {
      await axios.delete(API_ENDPOINTS.schoolSubscriptionById(schoolId, subscriptionId));
      dispatch(deleteSuccess(subscriptionId));
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể xóa hợp đồng')));
      throw e;
    }
  };
}
