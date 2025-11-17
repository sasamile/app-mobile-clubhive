export interface SocialLoginResponse {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SocialLoginRequest {
  socialToken: string;
  authType: "GOOGLE" | "APPLE" | "FACEBOOK";
}

