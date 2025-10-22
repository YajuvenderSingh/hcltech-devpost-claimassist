#!/usr/bin/env node

// Configuration alignment script for NMM Flow
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing NMM Flow Configuration Issues...\n');

// 1. Update .env with correct lambda names
const envPath = '.env';
const envContent = `REACT_APP_USER_POOL_ID=us-east-1_BkFQfgXOk
REACT_APP_USER_POOL_CLIENT_ID=1mq0rnmgmb8edt0v1npgm5rf60
REACT_APP_IDENTITY_POOL_ID=us-east-1:896efff8-cd15-4b26-a376-189b81e902f8
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ORCHESTRATION_LAMBDA=nmm-orchestration-lambda
REACT_APP_DOC_EXTRACTION_LAMBDA=nmm_document_extraction_lambda
REACT_APP_CLASSIFICATION_LAMBDA=nmm_document_classification_lambda
REACT_APP_ENTITY_EXTRACTION_LAMBDA=nmm_entityextraction_lambda
REACT_APP_CONFIDENCE_SCORE_LAMBDA=nmm_confidence_score_lambda
`;

fs.writeFileSync(envPath, envContent);
console.log('✅ Updated .env configuration');

// 2. Create error handling utility
const errorHandlerPath = 'src/utils/errorHandler.ts';
const errorHandlerContent = `export const handleError = (error: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(\`Error in \${context || 'Unknown context'}:\`, error);
  }
  // In production, send to logging service
};

export const logInfo = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  }
};
`;

if (!fs.existsSync('src/utils')) {
  fs.mkdirSync('src/utils', { recursive: true });
}
fs.writeFileSync(errorHandlerPath, errorHandlerContent);
console.log('✅ Created error handling utility');

console.log('\n🎉 Configuration fixes completed!');
console.log('\nNext steps:');
console.log('1. Run: npm run build');
console.log('2. Test the application');
console.log('3. Deploy with updated configuration');
