import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../api/services';
import { UpdateUser } from '@p3d-hub/shared-types';

export const USER_QUERY_KEY = 'user';

export const useProfileQuery = (userId: string) => {
  return useQuery({
    queryKey: [USER_QUERY_KEY, 'profile', userId],
    queryFn: () => UserService.getProfile(userId),
    enabled: !!localStorage.getItem('accessToken') && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserLoginQuery = (userId: string) => {
  return useQuery({
    queryKey: [USER_QUERY_KEY, 'login', userId],
    queryFn: () => UserService.getUserLogin(userId),
    enabled: !!userId,
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [USER_QUERY_KEY, 'update-profile'],
    mutationFn: (userData: UpdateUser) => UserService.updateProfile(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] });
    },
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [USER_QUERY_KEY, 'delete-profile'],
    mutationFn: () => UserService.deleteProfile(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
