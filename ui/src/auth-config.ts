import { Amplify } from 'aws-amplify';

/**
 * This configuration will be populated by values from your infra worktree.
 * These are public identifiers, not secrets.
 */
export const authConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || '', // e.g. 'auth.example.com'
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:5173'],
          redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:5173'],
          responseType: 'code' // PKCE flow
        }
      }
    }
  }
};

export function configureAuth() {
  if (authConfig.Auth.Cognito.userPoolId) {
    Amplify.configure(authConfig);
  } else {
    console.warn("Auth is not configured. Please provide VITE_USER_POOL_ID and VITE_USER_POOL_CLIENT_ID.");
  }
}
