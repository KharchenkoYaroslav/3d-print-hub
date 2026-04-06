import { useQuery } from '@tanstack/react-query';
import { ModelsListService } from '../api/services';

export const MODELS_QUERY_KEY = 'models';

export const useCatalogModelsQuery = (from: number, to: number, categoryId?: string, authorId?: string) => {
  return useQuery({
    queryKey: [MODELS_QUERY_KEY, 'list', { from, to, categoryId, authorId }],
    queryFn: () => ModelsListService.getByLikes(from, to, categoryId, authorId),
    staleTime: 60 * 1000,
  });
};

export const useModelsCountQuery = (categoryId?: string, authorId?: string) => {
  return useQuery({
    queryKey: [MODELS_QUERY_KEY, 'count', { categoryId, authorId }],
    queryFn: () => ModelsListService.getCount(categoryId, authorId),
  });
};


