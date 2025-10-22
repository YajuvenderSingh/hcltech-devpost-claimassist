#!/bin/bash

# NMM Document Processing SQS Queue Deployment Script
# Usage: ./deploy.sh [QUEUE_NAME] [REGION]

set -e

# Configuration
QUEUE_NAME=${1:-"NMMDocProcessingQueue"}
REGION=${2:-"us-east-1"}
STACK_NAME="nmm-doc-processing-queue-stack"

echo "Deploying NMM Document Processing SQS Queue..."
echo "Queue Name: $QUEUE_NAME"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        QueueName=$QUEUE_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM

# Get outputs
echo "Getting stack outputs..."
QUEUE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`QueueUrl`].OutputValue' \
    --output text)

QUEUE_ARN=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`QueueArn`].OutputValue' \
    --output text)

DLQ_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DLQUrl`].OutputValue' \
    --output text)

echo ""
echo "Deployment completed successfully!"
echo "Queue URL: $QUEUE_URL"
echo "Queue ARN: $QUEUE_ARN"
echo "Dead Letter Queue URL: $DLQ_URL"
echo ""
echo "Test the queue with:"
echo "aws sqs send-message --queue-url $QUEUE_URL --message-body '{\"test\":\"message\"}' --region $REGION"
echo ""
echo "Next steps:"
echo "1. Create Lambda function for document processing"
echo "2. Create event source mapping between queue and Lambda"
echo "3. Configure orchestration Lambda to send messages to this queue"
