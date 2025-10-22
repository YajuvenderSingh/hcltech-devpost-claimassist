#!/bin/bash

# Document Classification Lambda Deployment Script
# Usage: ./deploy.sh [FUNCTION_NAME] [SQS_QUEUE_ARN]

set -e

# Configuration
FUNCTION_NAME=${1:-"nmm_document_classification_lambda"}
SQS_QUEUE_ARN=${2:-"arn:aws:sqs:us-east-1:ACCOUNT_ID:NMM_DocProcessingAfterExtractionQueueNew"}
STACK_NAME="document-classification-lambda-stack"
IAM_ROLE_NAME="HCL-User-Role-Aiml-lambda"
ENTITY_LAMBDA_NAME="nmm_entityextraction_lambda"

echo "Deploying Document Classification Lambda Function..."
echo "Function Name: $FUNCTION_NAME"
echo "SQS Queue ARN: $SQS_QUEUE_ARN"
echo "Stack Name: $STACK_NAME"

# Check if IAM role exists
echo "Checking if IAM role exists..."
if ! aws iam get-role --role-name $IAM_ROLE_NAME >/dev/null 2>&1; then
    echo "ERROR: IAM role '$IAM_ROLE_NAME' not found!"
    echo "Please create the IAM role first using the files in ../iam/ directory"
    exit 1
fi

# Create deployment package
echo "Creating deployment package..."
zip -r lambda-deployment.zip lambda_function.py utility.py

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        FunctionName=$FUNCTION_NAME \
        IAMRoleName=$IAM_ROLE_NAME \
        SQSQueueArn=$SQS_QUEUE_ARN \
        EntityExtractionLambdaName=$ENTITY_LAMBDA_NAME \
    --capabilities CAPABILITY_IAM

# Update function code with actual implementation
echo "Updating function code..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://lambda-deployment.zip

# Get outputs
echo "Getting stack outputs..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
    --output text)

EXTRACTION_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ExtractionTableName`].OutputValue' \
    --output text)

DASHBOARD_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardTableName`].OutputValue' \
    --output text)

# Clean up
rm lambda-deployment.zip

echo ""
echo "Deployment completed successfully!"
echo "Lambda Function ARN: $LAMBDA_ARN"
echo "Extraction Table: $EXTRACTION_TABLE"
echo "Dashboard Table: $DASHBOARD_TABLE"
echo ""
echo "Test the function with:"
echo "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"Records\":[{\"body\":\"{\\\"indexid\\\":\\\"IN123456\\\",\\\"s3filename\\\":\\\"test.pdf\\\",\\\"docid\\\":\\\"DOC123\\\"}\"}]}' response.json"
