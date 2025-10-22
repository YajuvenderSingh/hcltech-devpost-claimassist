// Debug script for adjuster login issues
const { Amplify } = require('aws-amplify');
const { signIn, signUp, getCurrentUser } = require('aws-amplify/auth');

// Configure Amplify
const authConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_BkFQfgXOk',
      userPoolClientId: '1mq0rnmgmb8edt0v1npgm5rf60',
      identityPoolId: 'us-east-1:896efff8-cd15-4b26-a376-189b81e902f8',
      region: 'us-east-1',
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      allowGuestAccess: false,
    },
  },
};

Amplify.configure(authConfig);

async function testAdjusterLogin() {
  console.log('🔍 Testing Adjuster Login Issues...');
  
  // Test cases
  const testCases = [
    {
      email: 'adjuster@test.com',
      password: 'TestPass123!',
      role: 'Adjuster'
    },
    {
      email: 'test.adjuster@example.com', 
      password: 'AdjusterPass123!',
      role: 'Adjuster'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📧 Testing login for: ${testCase.email}`);
    
    try {
      const result = await signIn({
        username: testCase.email,
        password: testCase.password
      });
      
      console.log('✅ Login successful:', {
        isSignedIn: result.isSignedIn,
        nextStep: result.nextStep
      });
      
      if (result.isSignedIn) {
        const user = await getCurrentUser();
        console.log('👤 User details:', user);
      }
      
    } catch (error) {
      console.log('❌ Login failed:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
      
      // Check if it's a user not found error (expected for test users)
      if (error.name === 'UserNotFoundException') {
        console.log('ℹ️  This is expected - test user does not exist');
      }
    }
  }
  
  console.log('\n🔧 Configuration Check:');
  console.log('User Pool ID:', authConfig.Auth.Cognito.userPoolId);
  console.log('Client ID:', authConfig.Auth.Cognito.userPoolClientId);
  console.log('Region:', authConfig.Auth.Cognito.region);
}

// Run the test
testAdjusterLogin().catch(console.error);
