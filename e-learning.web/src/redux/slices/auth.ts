import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/@types/auth';

type AuthSliceState = {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AuthUser;
  workspaces: any[];
};

const initialState: AuthSliceState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  workspaces: [],
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState(state, action: PayloadAction<Omit<AuthSliceState, 'workspaces'>>) {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.isInitialized = action.payload.isInitialized;
      state.user = action.payload.user;
    },
    setWorkspaces(state, action: PayloadAction<any[]>) {
      state.workspaces = action.payload;
    },
    clearAuthState(state) {
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.user = null;
      state.workspaces = [];
    },
  },
});

export const { setAuthState, setWorkspaces, clearAuthState } = slice.actions;
export default slice.reducer;
