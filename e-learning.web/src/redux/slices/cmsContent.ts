import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CmsContent } from '../../@types/cmsContent';
import { dispatch } from '../store';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

type CmsContentState = {
  isLoading: boolean;
  loaded: boolean;
  error: string | null;
  items: CmsContent[];
  activeNodeId: string | null;
  activeNodeTitle: string;
};

const initialState: CmsContentState = {
  isLoading: false,
  loaded: false,
  error: null,
  items: [],
  activeNodeId: null,
  activeNodeTitle: '',
};

const slice = createSlice({
  name: 'cmsContent',
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
    loadSuccess(state, action: PayloadAction<CmsContent[]>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      state.items = action.payload;
    },
    setActiveNode(state, action: PayloadAction<{ id: string; title: string }>) {
      state.activeNodeId = action.payload.id;
      state.activeNodeTitle = action.payload.title;
    },
    upsertSuccess(state, action: PayloadAction<CmsContent>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      const idx = state.items.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items = [action.payload, ...state.items];
    },
    removeSuccess(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = null;
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
  },
});

export const { startLoading, hasError, loadSuccess, upsertSuccess, removeSuccess, setActiveNode } = slice.actions;
export default slice.reducer;

export function fetchClientCmsContents(nodeId: string) {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.get(API_ENDPOINTS.clientCurriculumContents(nodeId));
      dispatch(loadSuccess(res.data?.items || res.data || []));
    } catch {
      dispatch(hasError('Không tải được danh sách nội dung'));
    }
  };
}

export function fetchCmsContents(tenantId: string, nodeId: string) {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.get(API_ENDPOINTS.tenantsContents(tenantId), {
        params: { nodeId },
      });
      dispatch(loadSuccess(res.data?.items || []));
    } catch {
      dispatch(hasError('Không tải được danh sách nội dung'));
    }
  };
}

export function upsertCmsContent(tenantId: string, item: any, isEdit: boolean) {
  return async () => {
    dispatch(startLoading());
    try {
      let response;
      if (isEdit) {
        response = await axios.put(API_ENDPOINTS.tenantsContentById(tenantId, item.id), item);
      } else {
        response = await axios.post(API_ENDPOINTS.tenantsContents(tenantId), item);
      }
      const savedItem = response.data || item;
      dispatch(upsertSuccess(savedItem));
      return savedItem;
    } catch (error) {
      dispatch(hasError('Không lưu được nội dung'));
      throw error;
    }
  };
}

export function uploadCmsContent(uploadUrl: string, file: File) {
  return async () => {
    try {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (error) {
      console.error('Upload failed', error);
      dispatch(hasError('Không tải được tệp lên'));
      throw error;
    }
  };
}

export function confirmUpload(tenantId: string, contentId: string, payload: { fileName: string, objectKey: string, mimeType: string, fileSizeBytes: number }) {
  return async () => {
    try {
      await axios.post(API_ENDPOINTS.tenantsContentUpload(tenantId, contentId), payload);
    } catch (error) {
      console.error('Confirm upload failed', error);
      throw error;
    }
  };
}

export function publishContentStatus(tenantId: string, contentId: string, publishStatus: string) {
  return async () => {
    try {
      await axios.patch(API_ENDPOINTS.tenantsContentStatus(tenantId, contentId), { publishStatus });
    } catch (error) {
      console.error('Publish content failed', error);
      throw error;
    }
  };
}

export function pollProcessingStatus(tenantId: string, contentId: string) {
  return async () => {
    try {
      // Basic polling logic - should ideally be handled asynchronously in a saga or background task,
      // but providing simple one-shot check here. You can call this repeatedly.
      const res = await axios.get(API_ENDPOINTS.tenantsContentProcessingStatus(tenantId, contentId));
      return res.data;
    } catch (error) {
      console.error('Poll processing status failed', error);
      throw error;
    }
  };
}

export function reprocessContent(tenantId: string, contentId: string) {
  return async () => {
    try {
      await axios.post(API_ENDPOINTS.tenantsContentReprocess(tenantId, contentId));
    } catch (error) {
      console.error('Reprocess content failed', error);
      throw error;
    }
  };
}

export function removeCmsContent(tenantId: string, id: string) {
  return async () => {
    dispatch(startLoading());
    try {
      await axios.delete(API_ENDPOINTS.tenantsContentById(tenantId, id));
      dispatch(removeSuccess(id));
    } catch {
      dispatch(hasError('Không xóa được nội dung'));
    }
  };
}
