import { FileItem } from './file-item';

export interface ModelFiles {
  gallery: FileItem[];
  models: FileItem[];
}

export interface ModelWithLikes {
  id: string;
  title: string;
  description: string;
  authorId: string;
  categoryIds: string[];
  size: string;
  recommendedMaterial: string;
  estimatedPrintTime: number;
  estimatedVolume: number;
  allowCommercialUse: boolean;
  files: ModelFiles;
  likesCount: number;
  hasLiked: boolean;
}

export interface ModelRankingItem {
  id: string;
  title: string;
  cover: FileItem | null;
  likes: number;
}

export interface UpdateModelParams {
  title?: string;
  description?: string;
  size?: string;
  recommendedMaterial?: string;
  estimatedPrintTime?: number;
  estimatedVolume?: number;
  allowCommercialUse?: boolean;
}
