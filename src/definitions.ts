export interface BaseOptions {
  clientId: string;
  tenant?: string;
  domainHint?: string;
  authorityType?: 'AAD' | 'B2C' | 'CIAM';
  authorityUrl?: string;
  knownAuthorities?: string[];
  keyHash?: string;
  brokerRedirectUriRegistered?: boolean;
}

export interface LoginOptions extends BaseOptions {
  /** MSAL always sends the scopes 'openid profile offline_access'.  Do not include any of these scopes in the scopes parameter. */
  scopes?: string[];
  prompt?: 'login' | 'none' | 'consent' | 'create' | 'select_account';
  /** 
   * Whether to use native browser features (popup) or redirect flow for web platform.
   * Defaults to true (popup flow). Set to false to use redirect flow.
   * This option only affects the web platform.
   */
  native?: boolean;
}

export type LogoutOptions = BaseOptions;

export interface MsAuthPlugin {
  login(options: LoginOptions): Promise<{ accessToken: string; idToken: string; scopes: string[] }>;
  logout(options: LogoutOptions): Promise<void>;
  logoutAll(options: LogoutOptions): Promise<void>;
  // Add this new method
  acquireTokenSilent(options: LoginOptions): Promise<{ accessToken: string; idToken: string; scopes: string[] }>;
}
