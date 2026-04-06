import { $api } from './axios';
import type {
  AuthCredentials, AuthResponse, UpdateUser,
  CategoryListResponse,
  ModelRankingItem, ModelWithLikes, UpdateModelParams
} from '@p3d-hub/shared-types';

export const AuthService = {
  login: async (credentials: AuthCredentials) => {
    const { data } = await $api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },
  register: async (credentials: AuthCredentials) => {
    const { data } = await $api.post<AuthResponse>('/auth/register', credentials);
    return data;
  },
  logout: async (refreshToken: string) => {
    return $api.post('/auth/logout', { refreshToken });
  },
  verify: async () => {
    const { data } = await $api.get<{ userId: string }>('/auth/verify');
    return data;
  }
};

export const UserService = {
  getProfile: async (id: string) => {
    const { data } = await $api.get(`/users/profile/${id}`);
    return data;
  },
  getUserLogin: async (id: string) => {
    const { data } = await $api.get(`/users/login/${id}`);
    return data;
  },
  updateProfile: async (userData: UpdateUser) => {
    const { data } = await $api.put('/users/profile', userData);
    return data;
  },
  deleteProfile: async () => {
    const { data } = await $api.delete('/users/profile');
    return data;
  }
};

export const CategoryService = {
  getAll: async () => {
    const { data } = await $api.get<CategoryListResponse[]>('/categories');
    return data;
  }
};

export const ModelsListService = {
  getCount: async (categoryId?: string, authorId?: string) => {
    const { data } = await $api.get<{ count: number }>('/models/count', { params: { categoryId, authorId } });
    return data;
  },
  getByLikes: async (from: number, to: number, categoryId?: string, authorId?: string) => {
    const { data } = await $api.get<ModelRankingItem[]>('/models/bylikes', {
      params: { from, to, categoryId, authorId }
    });
    return data;
  }
};

export const ModelService = {
  getById: async (id: string) => {
    const { data } = await $api.get<ModelWithLikes>(`/model/${id}`);
    return data;
  },
  create: async (title: string) => {
    const { data } = await $api.post('/model', { title });
    return data;
  },
  delete: async (id: string) => {
    return $api.delete(`/model/${id}`);
  },
  toggleLike: async (id: string) => {
    const { data } = await $api.post<{ liked: boolean }>(`/model/${id}/toggle-like`);
    return data;
  },
  updateCategories: async (id: string, categoryIds: string[]) => {
    return $api.patch(`/model/${id}/categories`, { categoryIds });
  },
  updateParams: async (id: string, params: UpdateModelParams) => {
    return $api.patch(`/model/${id}/params`, params);
  },

  addFile: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return $api.post(`/model/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
  },
  removeFile: async (id: string, filename: string) => {
    return $api.delete(`/model/${id}/files/${encodeURIComponent(filename)}`);
  },
  addGalleryPhoto: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return $api.post(`/model/${id}/gallery`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
  },
  removeGalleryPhoto: async (id: string, filename: string) => {
    return $api.delete(`/model/${id}/gallery/${encodeURIComponent(filename)}`);
  },
  reorderFiles: async (id: string, target: 'models' | 'gallery', newOrder: number[]) => {
    return $api.patch(`/model/${id}/reorder`, { target, newOrder });
  }
};
