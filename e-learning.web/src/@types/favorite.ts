import { CmsContent } from './cmsContent';

export type Favorite = {
  id: string;
  userId: string;
  contentId: string;
  createdAt: string;
  content?: CmsContent;
};

export type FavoriteState = {
  isLoading: boolean;
  error: string | null;
  favorites: Favorite[];
};
