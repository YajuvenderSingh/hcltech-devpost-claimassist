#!/bin/bash

# Deploy NMM_DocProcessingAfterExtractionQueueNew SQS Queue
# Usage: ./deploy-queue.sh <region> <account-id>

REGION=${1:-us-east-1}
ACCOUNT_ID=${2:-"YOUR_ACCOUNT_ID"}

echo "Creating SQS Queue: NMM_DocProcessingAfterExtractionQueueNew"

# Create the queue
QUEUE_URL=$(aws sqs create-queue \
  --queue-name NMM_DocProcessingAfterExtractionQueueNew \
  --attributes '{
    "VisibilityTimeout":"300",
    "MaximumMessageSize":"1048576",
    "MessageRetentionPeriod":"240",
    "DelaySeconds":"0",
    "ReceiveMessageWaitTimeSeconds":"0",
    "SqsManagedSseEnabled":"true"
  }' \
  --region $REGION \
  --query 'QueueUrl' \
  --output text)

echo "Queue created: $QUEUE_URL"

# Create Lambda event source mapping (requires Lambda function to exist)
echo "Creating Lambda event source mapping..."
aws lambda create-event-source-mapping \
  --event-source-arn arn:aws:sqs:$REGION:$ACCOUNT_ID:NMM_DocProcessingAfterExtractionQueueNew \
  --function-name nmm_document_classification_lambda \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 0 \
  --region $REGION

echo "Deployment complete!"
