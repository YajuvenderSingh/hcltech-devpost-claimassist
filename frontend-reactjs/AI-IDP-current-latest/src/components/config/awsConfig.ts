import { Amplify } from 'aws-amplify';

// Log environment variables to see what's being loaded
console.log('Environment variables:', {
  REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID,
  REACT_APP_USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  REACT_APP_IDENTITY_POOL_ID: process.env.REACT_APP_IDENTITY_POOL_ID,
  REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION,
});

// Force the correct configuration to avoid any environment variable issues
const authConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_BkFQfgXOk', // Hardcoded to ensure correctness
      userPoolClientId: '1mq0rnmgmb8edt0v1npgm5rf60', // Hardcoded
      identityPoolId: 'us-east-1:896efff8-cd15-4b26-a376-189b81e902f8', // Hardcoded
      region: 'us-east-1', // Explicitly set region
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

// Configure Amplify
Amplify.configure(authConfig);

console.log('Amplify configured with hardcoded values:', {
  userPoolId: authConfig.Auth.Cognito.userPoolId,
  userPoolClientId: authConfig.Auth.Cognito.userPoolClientId,
  identityPoolId: authConfig.Auth.Cognito.identityPoolId,
  region: authConfig.Auth.Cognito.region,
});

export default authConfig;