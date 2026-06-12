import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { dispatch } from '../store';

type CmsContent = {
  id: string;
  type: 'VIDEO' | 'DOCUMENT' | 'ASSIGNMENT';
  title: string;
  description: string;
  duration?: string;
  status: string;
  watermark?: boolean;
  download?: boolean;
  date: string;
  image?: string;
  isDraft?: boolean;
};

type CmsState = {
  isLoading: boolean;
  activeNodeId: string | null;
  activeNodeTitle: string;
  contents: CmsContent[];
  error: string | null;
};

const initialState: CmsState = {
  isLoading: false,
  activeNodeId: null,
  activeNodeTitle: '',
  contents: [],
  error: null,
};

const slice = createSlice({
  name: 'cms',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setActiveNode(state, action: PayloadAction<{ id: string; title: string }>) {
      state.activeNodeId = action.payload.id;
      state.activeNodeTitle = action.payload.title;
    },
    getContentsSuccess(state, action: PayloadAction<CmsContent[]>) {
      state.isLoading = false;
      state.contents = action.payload;
      state.error = null;
    },
  },
});

export default slice.reducer;
export const { setActiveNode } = slice.actions;

export function fetchContents(tenantId: string, nodeId: string) {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.tenantsContents(tenantId), {
        params: { nodeId },
      });
      // In a real app, you'd normalize the data here
      dispatch(slice.actions.getContentsSuccess(response.data?.items || []));
    } catch (error) {
      dispatch(slice.actions.hasError(error.message));
    }
  };
}
