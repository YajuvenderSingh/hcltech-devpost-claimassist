#!/bin/bash

# NMM Orchestration Lambda Deployment Script
# Usage: ./deploy.sh [FUNCTION_NAME] [DYNAMODB_TABLE_NAME]

set -e

# Configuration
FUNCTION_NAME=${1:-"nmm-orchestration-lambda"}
DYNAMODB_TABLE_NAME=${2:-"claimassistv2-claimdetails"}
STACK_NAME="nmm-orchestration-stack"
IAM_ROLE_NAME="HCL-User-Role-Aiml-lambda"

echo "Deploying NMM Orchestration Lambda Function..."
echo "Function Name: $FUNCTION_NAME"
echo "DynamoDB Table: $DYNAMODB_TABLE_NAME"
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
zip -r lambda-deployment.zip lambda_function.py utilities.py

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        FunctionName=$FUNCTION_NAME \
        DynamoDBTableName=$DYNAMODB_TABLE_NAME \
        IAMRoleName=$IAM_ROLE_NAME \
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

DYNAMODB_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
    --output text)

DOC_QUEUE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DocumentProcessingQueueUrl`].OutputValue' \
    --output text)

PS_QUEUE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PSProcessingQueueUrl`].OutputValue' \
    --output text)

# Clean up
rm lambda-deployment.zip

echo ""
echo "Deployment completed successfully!"
echo "Lambda Function ARN: $LAMBDA_ARN"
echo "DynamoDB Table: $DYNAMODB_TABLE"
echo "Document Queue URL: $DOC_QUEUE_URL"
echo "PS Queue URL: $PS_QUEUE_URL"
echo ""
echo "Test the function with:"
echo "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"tasktype\":\"FETCH_ALL_CLAIMS\"}' response.json"
