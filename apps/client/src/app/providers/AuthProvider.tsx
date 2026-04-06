import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVerifyQuery, useLogoutMutation } from '../hooks/useAuth';
import { ScaleLoader } from "react-spinners";
import { isAxiosError } from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('accessToken'),
  );

  const navigate = useNavigate();
  const location = useLocation();

  const { data: verifyData, isLoading, error } = useVerifyQuery();
  const logoutMutation = useLogoutMutation();

  const clearTokensAndRedirect = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    navigate('/auth');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      logoutMutation.mutate(refreshToken, {
        onSettled: () => {
          clearTokensAndRedirect();
        },
      });
    } else {
      clearTokensAndRedirect();
    }
  }, [logoutMutation, clearTokensAndRedirect]);

  useEffect(() => {
    if (verifyData?.userId) {
      setIsAuthenticated(true);
    } else if (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 401 ) {
          handleLogout();
        }
      }
    }
  }, [verifyData, error, handleLogout]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const login = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setIsAuthenticated(true);
      navigate('/');
    },
    [navigate],
  );

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout: handleLogout }}
    >
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            height: '100vh',
            alignItems: 'center',
          }}
        >
          <ScaleLoader
            color="#fff"
            height={80}
            width={10}
            radius={8}
            margin={5}
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
