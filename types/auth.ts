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
  /**
   * El backend solo lo mira cuando el usuario es nuevo: sin esto responde
   * CUSTOMER_TERMS_ACCEPTANCE_REQUIRED y no crea la cuenta. En usuarios ya
   * existentes se ignora. La pantalla de login avisa que al continuar se aceptan,
   * igual que la web.
   */
  termsAccepted?: boolean;
  /**
   * Solo Apple. Su identityToken no lleva el nombre y Apple lo entrega una unica vez,
   * en el primer inicio de sesion. El backend lo necesita porque la columna del nombre
   * no admite nulos.
   */
  fullName?: string;
}

