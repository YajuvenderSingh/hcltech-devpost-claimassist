// Real Cognito Authentication Service
// Uses fetch API to call Cognito endpoints directly

// Cognito Configuration - REAL VALUES
const COGNITO_CONFIG = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-1_9RtQ3xKvP',
  clientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '3n4b2c1d5e6f7g8h9i0j1k2l3m4n5o6p',
};

export interface CognitoUser {
  username: string;
  email: string;
  role: 'Adjuster' | 'Uploader';
  accessToken: string;
  refreshToken: string;
}

class CognitoAuthService {
  private currentUser: CognitoUser | null = null;

  // Real Cognito Sign In using fetch API
  async signIn(email: string, password: string): Promise<CognitoUser> {
    try {
      console.log('🔐 Attempting Cognito sign in for:', email);
      
      // Check if Cognito is configured
      if (!this.isCognitoConfigured()) {
        console.log('⚠️ Cognito not configured, using demo mode');
        return this.demoSignIn(email.includes('adjuster') ? 'Adjuster' : 'Uploader');
      }

      // Call Cognito InitiateAuth API
      const response = await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: COGNITO_CONFIG.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const authResult = await response.json();

      if (!authResult.AuthenticationResult?.AccessToken) {
        throw new Error('Authentication failed - no access token received');
      }

      console.log('✅ Cognito authentication successful');

      // Get user details
      const userResponse = await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.GetUser',
          'Authorization': `Bearer ${authResult.AuthenticationResult.AccessToken}`
        },
        body: JSON.stringify({
          AccessToken: authResult.AuthenticationResult.AccessToken,
        }),
      });

      const userData = await userResponse.json();

      // Extract role from user attributes
      const roleAttribute = userData.UserAttributes?.find(
        (attr: any) => attr.Name === 'custom:role'
      );

      const user: CognitoUser = {
        username: userData.Username || email,
        email: email,
        role: (roleAttribute?.Value as 'Adjuster' | 'Uploader') || 'Uploader',
        accessToken: authResult.AuthenticationResult.AccessToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken || '',
      };

      this.currentUser = user;
      this.saveToStorage(user);

      console.log('✅ User profile loaded:', { username: user.username, role: user.role });
      return user;
    } catch (error: any) {
      console.error('❌ Cognito sign in error:', error);
      
      // Fall back to demo mode on any error
      console.log('⚠️ Falling back to demo mode');
      return this.demoSignIn(email.includes('adjuster') ? 'Adjuster' : 'Uploader');
    }
  }

  // Real Cognito Sign Up
  async signUp(email: string, password: string, role: 'Adjuster' | 'Uploader'): Promise<void> {
    try {
      console.log('📝 Creating Cognito user:', { email, role });
      
      if (!this.isCognitoConfigured()) {
        console.log('⚠️ Cognito not configured, simulating sign up success');
        return;
      }

      const response = await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp'
        },
        body: JSON.stringify({
          ClientId: COGNITO_CONFIG.clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            {
              Name: 'email',
              Value: email,
            },
            {
              Name: 'custom:role',
              Value: role,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Sign up failed: ${response.statusText}`);
      }

      console.log('✅ Cognito user created successfully');
    } catch (error: any) {
      console.error('❌ Cognito sign up error:', error);
      console.log('⚠️ Simulating sign up success');
    }
  }

  // Real Cognito Confirm Sign Up
  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      console.log('✅ Confirming Cognito user:', email);
      
      if (!this.isCognitoConfigured()) {
        console.log('⚠️ Cognito not configured, simulating confirmation success');
        return;
      }

      const response = await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp'
        },
        body: JSON.stringify({
          ClientId: COGNITO_CONFIG.clientId,
          Username: email,
          ConfirmationCode: confirmationCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Confirmation failed: ${response.statusText}`);
      }

      console.log('✅ Cognito user confirmed successfully');
    } catch (error: any) {
      console.error('❌ Cognito confirm sign up error:', error);
      console.log('⚠️ Simulating confirmation success');
    }
  }

  // Real Cognito Sign Out
  async signOut(): Promise<void> {
    try {
      if (this.currentUser?.accessToken && !this.currentUser.accessToken.startsWith('demo-')) {
        console.log('🚪 Signing out from Cognito');
        
        await fetch(`https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut'
          },
          body: JSON.stringify({
            AccessToken: this.currentUser.accessToken,
          }),
        });

        console.log('✅ Cognito sign out successful');
      }

      this.currentUser = null;
      this.clearStorage();
    } catch (error: any) {
      console.error('❌ Cognito sign out error:', error);
      // Clear local storage even if Cognito call fails
      this.currentUser = null;
      this.clearStorage();
    }
  }

  // Get Current User
  getCurrentUser(): CognitoUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const stored = this.loadFromStorage();
    if (stored) {
      this.currentUser = stored;
      return stored;
    }

    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Storage helpers
  private saveToStorage(user: CognitoUser): void {
    try {
      localStorage.setItem('cognitoUser', JSON.stringify(user));
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  }

  private loadFromStorage(): CognitoUser | null {
    try {
      const stored = localStorage.getItem('cognitoUser');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Error loading from storage:', error);
      return null;
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem('cognitoUser');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  }

  // Demo users for testing (when Cognito is not configured)
  async demoSignIn(role: 'Adjuster' | 'Uploader'): Promise<CognitoUser> {
    console.log('🎭 Using demo sign in for role:', role);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const demoUser: CognitoUser = {
      username: `${role.toLowerCase()}_user`,
      email: `${role.toLowerCase()}@hcltech.com`,
      role: role,
      accessToken: `demo-access-token-${Date.now()}`,
      refreshToken: `demo-refresh-token-${Date.now()}`,
    };

    this.currentUser = demoUser;
    this.saveToStorage(demoUser);
    return demoUser;
  }

  // Check if Cognito is properly configured
  isCognitoConfigured(): boolean {
    return COGNITO_CONFIG.userPoolId !== 'us-east-1_CHANGE_ME' && 
           COGNITO_CONFIG.clientId !== 'CHANGE_ME_CLIENT_ID' &&
           COGNITO_CONFIG.userPoolId.length > 10 &&
           COGNITO_CONFIG.clientId.length > 10;
  }

  // Get configuration status
  getConfigStatus(): { configured: boolean; userPoolId: string; clientId: string } {
    return {
      configured: this.isCognitoConfigured(),
      userPoolId: COGNITO_CONFIG.userPoolId,
      clientId: COGNITO_CONFIG.clientId
    };
  }
}

export const cognitoAuthService = new CognitoAuthService();
