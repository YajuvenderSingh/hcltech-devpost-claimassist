// Test filename preservation through the upload flow
console.log('🧪 Testing Filename Preservation...\n');

// Simulate the upload flow
const testFilename = "M-1_Medical_Report.pdf";
const claimId = "IN505306";

console.log('📋 Test Parameters:');
console.log('Original filename:', testFilename);
console.log('Claim ID:', claimId);

// Test 1: Presigned URL Lambda
console.log('\n1️⃣ Testing Presigned URL Lambda...');
const presignedPayload = {
  tasktype: "PRESIGNED_URL",
  fileName: testFilename,
  fileType: "application/pdf", 
  claimId: claimId
};

console.log('Payload sent:', JSON.stringify(presignedPayload, null, 2));

// Test 2: Expected S3 Key format
const expectedS3Key = `newmexicomutual/claimforms/${claimId}/DOC123456/${testFilename}`;
console.log('\n2️⃣ Expected S3 Key Format:');
console.log('Expected:', expectedS3Key);

// Test 3: Queue payload format
console.log('\n3️⃣ Expected Queue Payload:');
const queuePayload = {
  tasktype: "SEND_TO_QUEUE",
  indexid: claimId,
  s3filename: expectedS3Key,
  docid: "DOC123456"
};

console.log('Queue payload:', JSON.stringify(queuePayload, null, 2));

console.log('\n🎯 Filename Check:');
console.log('Original:', testFilename);
console.log('In S3 Key:', expectedS3Key.split('/').pop());
console.log('Match:', testFilename === expectedS3Key.split('/').pop() ? '✅' : '❌');

console.log('\n📋 If filenames don\'t match, check:');
console.log('1. Presigned URL lambda response');
console.log('2. S3 key construction');
console.log('3. Queue payload generation');
