import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '../api/services';

export const CATEGORIES_QUERY_KEY = 'categories';

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY, 'all'],
    queryFn: () => CategoryService.getAll(),
    staleTime: Infinity,
  });
};




