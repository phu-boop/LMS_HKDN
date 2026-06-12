import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TenantBranding } from '@/types/identity';

type TenantBrandingState = {
  branding: TenantBranding | null;
};

const initialState: TenantBrandingState = {
  branding: null,
};

const slice = createSlice({
  name: 'tenantBranding',
  initialState,
  reducers: {
    setBranding(state, action: PayloadAction<TenantBranding | null>) {
      state.branding = action.payload;
    },
    clearBranding(state) {
      state.branding = null;
    },
  },
});

export const { setBranding, clearBranding } = slice.actions;
export default slice.reducer;
