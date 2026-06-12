import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LocalPartner } from '@/@types/localPartner';
import { LOCAL_PARTNERS_INITIAL } from '@/_mock/_localPartners';
import { dispatch } from '../store';
import type { RootState } from '../store';

type LocalPartnerState = {
  isLoading: boolean;
  loaded: boolean;
  error: string | null;
  items: LocalPartner[];
};

const initialState: LocalPartnerState = {
  isLoading: false,
  loaded: false,
  error: null,
  items: [],
};

const slice = createSlice({
  name: 'localPartner',
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
    loadSuccess(state, action: PayloadAction<LocalPartner[]>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      state.items = action.payload;
    },
    upsertSuccess(state, action: PayloadAction<LocalPartner>) {
      const idx = state.items.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items = [action.payload, ...state.items];
      state.error = null;
    },
    updateStatusSuccess(state, action: PayloadAction<{ id: string; status: LocalPartner['status'] }>) {
      state.items = state.items.map((x) =>
        x.id === action.payload.id ? { ...x, status: action.payload.status, updatedAt: new Date().toISOString() } : x
      );
      state.error = null;
    },
    assignSchoolSuccess(state, action: PayloadAction<{ partnerId: string; schoolId: string }>) {
      state.items = state.items.map((x) =>
        x.id === action.payload.partnerId ? { ...x, schoolIds: [...x.schoolIds, action.payload.schoolId] } : x
      );
      state.error = null;
    },
    unassignSchoolSuccess(state, action: PayloadAction<{ partnerId: string; schoolId: string }>) {
      state.items = state.items.map((x) =>
        x.id === action.payload.partnerId
          ? { ...x, schoolIds: x.schoolIds.filter((id) => id !== action.payload.schoolId) }
          : x
      );
      state.error = null;
    },
  },
});

export const {
  startLoading,
  hasError,
  loadSuccess,
  upsertSuccess,
  updateStatusSuccess,
  assignSchoolSuccess,
  unassignSchoolSuccess,
} = slice.actions;
export default slice.reducer;

export function fetchLocalPartners() {
  return async () => {
    dispatch(startLoading());
    dispatch(loadSuccess(LOCAL_PARTNERS_INITIAL));
  };
}

export function upsertLocalPartner(item: LocalPartner) {
  return async () => {
    dispatch(upsertSuccess(item));
  };
}

export function toggleLocalPartnerStatus(id: string) {
  return async (_dispatch: unknown, getState: () => RootState) => {
    const target = getState().localPartner.items.find((x) => x.id === id);
    if (!target) return;
    dispatch(updateStatusSuccess({ id, status: target.status === 'active' ? 'inactive' : 'active' }));
  };
}

export function assignSchoolToPartner(partnerId: string, schoolId: string) {
  return async (_dispatch: unknown, getState: () => RootState) => {
    const state = getState();
    const partner = state.localPartner.items.find((x) => x.id === partnerId);
    if (!partner) return;
    if (partner.status !== 'active') {
      dispatch(hasError('Partner đang ngừng hoạt động, không thể gán trường'));
      return;
    }
    if (partner.schoolIds.includes(schoolId)) {
      dispatch(hasError('Trường đã thuộc partner này'));
      return;
    }
    if (partner.schoolIds.length >= partner.quotaSchools) {
      dispatch(hasError('Vượt quota số trường tối đa của partner'));
      return;
    }
    const isAssignedElsewhere = state.localPartner.items.some(
      (x) => x.id !== partnerId && x.schoolIds.includes(schoolId)
    );
    if (isAssignedElsewhere) {
      dispatch(hasError('Trường đã được gán cho partner khác'));
      return;
    }
    dispatch(assignSchoolSuccess({ partnerId, schoolId }));
  };
}

export function unassignSchoolFromPartner(partnerId: string, schoolId: string) {
  return async () => {
    dispatch(unassignSchoolSuccess({ partnerId, schoolId }));
  };
}
