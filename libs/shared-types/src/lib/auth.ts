export interface AuthRequest {
  user: {
    sub: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  login: string;
  createdAt: Date;
}

export interface UserLogin {
  login: string;
}
