import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModelService } from '../api/services';
import { MODELS_QUERY_KEY } from './useModelsList';
import type { ModelWithLikes, UpdateModelParams } from '@p3d-hub/shared-types';

export const MODEL_DETAILS_KEY = 'model-details';

export const useModelQuery = (id: string) => {
  return useQuery({
    queryKey: [MODEL_DETAILS_KEY, id],
    queryFn: () => ModelService.getById(id),
    enabled: !!id,
  });
};

export const useCreateModelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MODELS_QUERY_KEY, 'create'],
    mutationFn: (params: { title: string }) => ModelService.create(params.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
    },
  });
};

export const useToggleLikeMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ModelService.toggleLike(id),
    onSuccess: (data) => {
      queryClient.setQueryData<ModelWithLikes | undefined>(
        [MODEL_DETAILS_KEY, id],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            hasLiked: data.liked,
            likesCount: oldData.likesCount + (data.liked ? 1 : -1)
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

export const useUpdateModelParamsMutation = (modelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'update-params', modelId],
    mutationFn: (params: UpdateModelParams) => {
      return ModelService.updateParams(modelId, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] });
      queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
    },
  });
};

export const useUploadModelFileMutation = (modelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'upload-file', modelId],
    mutationFn: (file: File) => ModelService.addFile(modelId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] });
    },
  });
};

export const useUpdateCategoriesMutation = (modelId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'update-categories', modelId],
    mutationFn: (categoryIds: string[]) => ModelService.updateCategories(modelId, categoryIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] }),
  });
};

export const useUploadGalleryPhotoMutation = (modelId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'upload-photo', modelId],
    mutationFn: (file: File) => ModelService.addGalleryPhoto(modelId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] });
      queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
    },
  });
};

export const useDeleteGalleryPhotoMutation = (modelId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'delete-photo', modelId],
    mutationFn: (filename: string) => ModelService.removeGalleryPhoto(modelId, filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] });
      queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
    },
  });
};
export const useDeleteModelFileMutation = (modelId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'delete-file', modelId],
    mutationFn: (filename: string) => ModelService.removeFile(modelId, filename),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] }),
  });
};

export const useReorderFilesMutation = (modelId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [MODEL_DETAILS_KEY, 'reorder-files', modelId],
    mutationFn: ({ target, newOrder }: { target: 'models' | 'gallery', newOrder: number[] }) =>
      ModelService.reorderFiles(modelId, target, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODEL_DETAILS_KEY, modelId] });
      queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
    },
  });
};

export const useDeleteModelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MODELS_QUERY_KEY, 'delete'],
    mutationFn: (id: string) => ModelService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODELS_QUERY_KEY] });
    },
  });
};
