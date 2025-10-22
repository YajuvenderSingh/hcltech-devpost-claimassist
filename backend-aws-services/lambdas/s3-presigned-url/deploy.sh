#!/bin/bash

# S3 Presigned URL Lambda Deployment Script
# Usage: ./deploy.sh [BUCKET_NAME] [FUNCTION_NAME]

set -e

# Configuration
BUCKET_NAME=${1:-"my-claim-documents-bucket"}
FUNCTION_NAME=${2:-"claimassist-presignedurl-lambda"}
STACK_NAME="claimassist-presigned-url-stack"
IAM_ROLE_NAME="HCL-User-Role-Aiml-lambda"

echo "Deploying S3 Presigned URL Lambda Function..."
echo "Bucket Name: $BUCKET_NAME"
echo "Function Name: $FUNCTION_NAME"
echo "Stack Name: $STACK_NAME"

# Check if IAM role exists
echo "Checking if IAM role exists..."
if ! aws iam get-role --role-name $IAM_ROLE_NAME >/dev/null 2>&1; then
    echo "ERROR: IAM role '$IAM_ROLE_NAME' not found!"
    echo "Please create the IAM role first using the files in ../iam/ directory"
    exit 1
fi

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        FunctionName=$FUNCTION_NAME \
        S3BucketName=$BUCKET_NAME \
        IAMRoleName=$IAM_ROLE_NAME \
    --capabilities CAPABILITY_IAM

# Get outputs
echo "Getting stack outputs..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
    --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

echo ""
echo "Deployment completed successfully!"
echo "Lambda Function ARN: $LAMBDA_ARN"
echo "S3 Bucket Name: $S3_BUCKET"
echo ""
echo "Test the function with:"
echo "aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"fileName\":\"test.pdf\",\"fileType\":\"application/pdf\"}' response.json"
