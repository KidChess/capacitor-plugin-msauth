import { PublicClientApplication } from '@azure/msal-browser';
import { WebPlugin } from '@capacitor/core';

import type { BaseOptions, MsAuthPlugin } from './definitions';

interface WebBaseOptions extends BaseOptions {
  redirectUri?: string;
}

interface WebLoginOptions extends WebBaseOptions {
  scopes: string[];
  native?: boolean;
}

type WebLogoutOptions = WebBaseOptions;

interface AuthResult {
  accessToken: string;
  idToken: string;
  scopes: string[];
}

export class MsAuth extends WebPlugin implements MsAuthPlugin {
  async login(options: WebLoginOptions): Promise<AuthResult> {
    const context = this.createContext(options);
    const useNative = options.native !== false; // Default to true for backwards compatibility

    try {
      // First check if we're returning from a redirect
      const redirectResponse = await context.handleRedirectPromise();
      if (redirectResponse !== null) {
        // We're returning from a redirect, return the tokens
        return { 
          accessToken: redirectResponse.accessToken, 
          idToken: redirectResponse.idToken, 
          scopes: redirectResponse.scopes 
        };
      }

      // // Try to acquire token silently first
      // return await this.acquireTokenSilently(context, options.scopes).catch(() => {
      //   // If silent acquisition fails, use interactive method
      //   if (useNative) {
      //     return this.acquireTokenInteractively(context, options.scopes);
      //   } else {
      //     // For redirect flow, we need to initiate the redirect
      //     // Note: This will navigate away from the page
      //     return this.acquireTokenWithRedirect(context, options.scopes);
      //   }
      // });
      // Always go straight to interactive login
      if (useNative) {
        return this.acquireTokenInteractively(context, options.scopes);
      } else {
        return this.acquireTokenWithRedirect(context, options.scopes);
      }
    } catch (error) {
      console.error('MSAL: Error occurred while logging in', error);
      throw error;
    }
  }

  logout(options: WebLogoutOptions): Promise<void> {
    const context = this.createContext(options);

    if (!context.getAllAccounts()[0]) {
      return Promise.reject(new Error('Nothing to sign out from.'));
    } else {
      return context.logoutRedirect();
    }
  }

  logoutAll(options: WebLogoutOptions): Promise<void> {
    return this.logout(options);
  }

  async acquireTokenSilent(options: WebLoginOptions): Promise<AuthResult> {
    const context = this.createContext(options);
    
    try {
      // First check if we're returning from a redirect
      const redirectResponse = await context.handleRedirectPromise();
      if (redirectResponse !== null) {
        return { 
          accessToken: redirectResponse.accessToken, 
          idToken: redirectResponse.idToken, 
          scopes: redirectResponse.scopes 
        };
      }

      // // Only try silent acquisition - no fallback
      return await this.acquireTokenSilently(context, options.scopes);
      // // Mock 401 error
      // throw new Error('[MsAuthPlugin] Mock 401 error');
    } catch (error) {
      // Let the error bubble up so the calling code can handle it
      console.error('MSAL: Silent token acquisition failed', error);
      throw error;
    }
  }

  private createContext(options: WebBaseOptions) {
    const config = {
      auth: {
        clientId: options.clientId,
        domainHint: options.domainHint,
        authority: options.authorityUrl ?? `https://login.microsoftonline.com/${options.tenant ?? 'common'}`,
        knownAuthorities: options.knownAuthorities,
        redirectUri: options.redirectUri ?? this.getCurrentUrl(),
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    };

    return new PublicClientApplication(config);
  }

  private getCurrentUrl(): string {
    return window.location.href.split(/[?#]/)[0];
  }

  private async acquireTokenInteractively(context: PublicClientApplication, scopes: string[]): Promise<AuthResult> {
    const { accessToken, idToken } = await context.acquireTokenPopup({
      scopes,
      prompt: 'select_account',
    });

    return { accessToken, idToken, scopes };
  }

  private async acquireTokenSilently(context: PublicClientApplication, scopes: string[]): Promise<AuthResult> {
    const { accessToken, idToken } = await context.acquireTokenSilent({
      scopes,
      account: context.getAllAccounts()[0],
    });

    return { accessToken, idToken, scopes };
  }

  private async acquireTokenWithRedirect(context: PublicClientApplication, scopes: string[]): Promise<AuthResult> {
    // This method initiates a redirect and will not return immediately
    // The actual token will be retrieved when the page loads again
    await context.acquireTokenRedirect({
      scopes,
      prompt: 'select_account',
    });

    // This code will not execute due to the redirect
    // We need to return something to satisfy TypeScript, but this will never be reached
    throw new Error('Page will redirect for authentication');
  }
}
