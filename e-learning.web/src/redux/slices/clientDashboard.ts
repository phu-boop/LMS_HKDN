import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { dispatch } from '../store';
import { CmsContent } from '../../@types/cmsContent';

export type ContentDetail = {
  contentId: string;
  title: string;
  type?: string;
  lastViewedAt?: string;
  favoritedAt?: string;
};

export type ClientDashboardData = {
  viewedThisWeekCount: number | string;
  favoriteCount: number | string;
  favoriteAddedThisWeekCount: number | string;
  lastLearningAt: string | null;
  viewedThisWeekDetails?: ContentDetail[];
  favoriteDetails?: ContentDetail[];
  favoriteAddedThisWeekDetails?: ContentDetail[];
};

type ClientDashboardState = {
  isLoading: boolean;
  error: string | null;
  data: ClientDashboardData | null;
  recentContents: CmsContent[];
};

const initialState: ClientDashboardState = {
  isLoading: false,
  error: null,
  data: null,
  recentContents: [],
};

const slice = createSlice({
  name: 'clientDashboard',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    getDashboardSuccess(state, action: PayloadAction<ClientDashboardData>) {
      state.isLoading = false;
      state.data = action.payload;
    },
    getRecentContentsSuccess(state, action: PayloadAction<CmsContent[]>) {
      state.isLoading = false;
      state.recentContents = action.payload;
    },
  },
});

export default slice.reducer;

// ----------------------------------------------------------------------

export function getClientDashboard() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.clientDashboard);
      dispatch(slice.actions.getDashboardSuccess(response.data));
    } catch (error) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}

export function getRecentContents() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.clientDashboardQuickAccess);
      dispatch(slice.actions.getRecentContentsSuccess(response.data?.items || response.data?.data || response.data || []));
    } catch (error) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}
