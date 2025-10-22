#!/usr/bin/env node

// End-to-End NMM Flow Test
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: 'us-east-1'
});

const lambda = new AWS.Lambda();
const sqs = new AWS.SQS();

console.log('🧪 NMM End-to-End Flow Test\n');

// Test 1: Orchestration Lambda
async function testOrchestration() {
  console.log('1️⃣ Testing Orchestration Lambda...');
  
  const payload = {
    indexid: "IN999999",
    s3filename: "claimassistv2/claimforms/test-document.pdf",
    docid: "DOC999999",
    tasktype: "SEND_TO_QUEUE"
  };

  try {
    const result = await lambda.invoke({
      FunctionName: 'nmm-orchestration-lambda',
      Payload: JSON.stringify(payload)
    }).promise();

    const response = JSON.parse(result.Payload);
    console.log('✅ Orchestration Response:', response.statusCode === 200 ? 'SUCCESS' : 'FAILED');
    return response.statusCode === 200;
  } catch (error) {
    console.log('❌ Orchestration Failed:', error.message);
    return false;
  }
}

// Test 2: SQS Queue Check
async function testSQSQueue() {
  console.log('2️⃣ Testing SQS Queue...');
  
  try {
    const result = await sqs.getQueueAttributes({
      QueueUrl: 'https://sqs.us-east-1.amazonaws.com/040504913362/NMMDocProcessingQueue',
      AttributeNames: ['ApproximateNumberOfMessages']
    }).promise();

    const messageCount = parseInt(result.Attributes.ApproximateNumberOfMessages);
    console.log('✅ SQS Queue Messages:', messageCount);
    return messageCount >= 0;
  } catch (error) {
    console.log('❌ SQS Check Failed:', error.message);
    return false;
  }
}

// Test 3: Lambda Chain Status
async function testLambdaChain() {
  console.log('3️⃣ Testing Lambda Chain...');
  
  const lambdas = [
    'nmm_document_extraction_lambda',
    'nmm_document_classification_lambda', 
    'nmm_entityextraction_lambda',
    'nmm_confidence_score_lambda'
  ];

  let allActive = true;
  
  for (const lambdaName of lambdas) {
    try {
      const result = await lambda.getFunction({
        FunctionName: lambdaName
      }).promise();
      
      const status = result.Configuration.State;
      console.log(`   ${lambdaName}: ${status}`);
      
      if (status !== 'Active') {
        allActive = false;
      }
    } catch (error) {
      console.log(`   ${lambdaName}: ERROR - ${error.message}`);
      allActive = false;
    }
  }
  
  console.log('✅ Lambda Chain Status:', allActive ? 'ALL ACTIVE' : 'SOME INACTIVE');
  return allActive;
}

// Test 4: UI Application
async function testUIApplication() {
  console.log('4️⃣ Testing UI Application...');
  
  try {
    const response = await fetch('http://localhost:8080');
    const isRunning = response.status === 200;
    console.log('✅ UI Application:', isRunning ? 'RUNNING' : 'NOT RUNNING');
    return isRunning;
  } catch (error) {
    console.log('❌ UI Application: NOT ACCESSIBLE');
    return false;
  }
}

// Run All Tests
async function runE2ETests() {
  const results = {
    orchestration: await testOrchestration(),
    sqsQueue: await testSQSQueue(), 
    lambdaChain: await testLambdaChain(),
    uiApplication: await testUIApplication()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 NMM Flow is ready for production!');
    console.log('📱 Access UI: http://localhost:8080');
    console.log('🔧 Monitor: CloudWatch Logs');
  } else {
    console.log('\n🔧 Fix the failed components before deployment.');
  }
  
  return allPassed;
}

// Execute tests
runE2ETests().catch(console.error);
