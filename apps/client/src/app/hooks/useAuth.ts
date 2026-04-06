import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../api/services';
import { AuthCredentials } from '@p3d-hub/shared-types';

export const AUTH_QUERY_KEY = 'auth';

export const useLoginMutation = () => {
  return useMutation({
    mutationKey: [AUTH_QUERY_KEY, 'login'],
    mutationFn: (credentials: AuthCredentials) => AuthService.login(credentials),
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationKey: [AUTH_QUERY_KEY, 'register'],
    mutationFn: (credentials: AuthCredentials) => AuthService.register(credentials),
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [AUTH_QUERY_KEY, 'logout'],
    mutationFn: (refreshToken: string) => AuthService.logout(refreshToken),
    onSuccess: () => {
      queryClient.clear();
    }
  });
};

export const useVerifyQuery = () => {
  return useQuery({
    queryKey: [AUTH_QUERY_KEY, 'verify'],
    queryFn: () => AuthService.verify(),
    enabled: !!localStorage.getItem('accessToken'),
    retry: false, 
  });
};
