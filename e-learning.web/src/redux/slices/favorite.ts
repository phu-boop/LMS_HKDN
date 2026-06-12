import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { Favorite, FavoriteState } from '@/@types/favorite';
import { dispatch } from '../store';

const initialState: FavoriteState = {
  isLoading: false,
  error: null,
  favorites: [],
};

const slice = createSlice({
  name: 'favorite',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    getFavoritesSuccess(state, action: PayloadAction<Favorite[]>) {
      state.isLoading = false;
      state.favorites = action.payload;
    },
    addFavoriteSuccess(state, action: PayloadAction<Favorite>) {
      state.favorites.push(action.payload);
    },
    removeFavoriteSuccess(state, action: PayloadAction<string>) {
      state.favorites = state.favorites.filter((f) => f.contentId !== action.payload);
    },
  },
});

export default slice.reducer;

// ----------------------------------------------------------------------

export function getFavorites() {
  return async () => {
    dispatch(slice.actions.startLoading());
    try {
      const response = await axios.get(API_ENDPOINTS.clientFavorites);
      const rawItems = response.data?.items || response.data || [];
      const normalized = rawItems.map((item: any) => {
        if (item.contentId && item.content) {
          return {
            ...item,
            content: {
              ...item.content,
              description: item.contentItemDescription || item.content?.contentItemDescription || item.content?.description || '',
              contentItemDescription: item.contentItemDescription || item.content?.contentItemDescription || item.content?.description || ''
            }
          };
        }
        return {
          id: item.id,
          userId: '',
          contentId: item.contentItemId || item.contentId || item.id,
          createdAt: item.createdAt || new Date().toISOString(),
          content: {
            id: item.contentItemId || item.contentId || item.id,
            title: item.contentItemTitle || item.title || 'Bài giảng / Tài liệu',
            description: item.contentItemDescription || item.description || '',
            contentItemDescription: item.contentItemDescription || item.description || '',
            type: item.type || 'DOCUMENT',
            fileSizeBytes: item.fileSizeBytes || 0
          }
        };
      });
      dispatch(slice.actions.getFavoritesSuccess(normalized));
    } catch (error: any) {
      dispatch(slice.actions.hasError(error.message || 'Error'));
    }
  };
}

export function addFavorite(contentId: string, content?: any) {
  return async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.clientFavoriteAdd(contentId));
      const favoriteData = response.data?.contentId ? response.data : {
        id: response.data?.id || contentId,
        contentId,
        content,
        createdAt: new Date().toISOString()
      };
      dispatch(slice.actions.addFavoriteSuccess(favoriteData));
    } catch (error: any) {
      dispatch(slice.actions.hasError(error.message || 'Error'));
    }
  };
}

export function removeFavorite(contentId: string) {
  return async () => {
    try {
      await axios.delete(API_ENDPOINTS.clientFavoriteRemove(contentId));
      dispatch(slice.actions.removeFavoriteSuccess(contentId));
    } catch (error: any) {
      dispatch(slice.actions.hasError(error.message || 'Error'));
    }
  };
}
