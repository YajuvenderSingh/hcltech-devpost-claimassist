# NMM Document Processing After Extraction Queue

This directory contains the configuration and deployment files for the `NMM_DocProcessingAfterExtractionQueueNew` SQS queue.

## Files

- `queue-config.json` - Complete queue configuration
- `deploy-queue.sh` - AWS CLI deployment script
- `cloudformation-template.yaml` - CloudFormation template
- `terraform.tf` - Terraform configuration
- `event-source-mapping.json` - Lambda trigger configuration
- `dependencies.md` - Detailed dependency documentation

## Quick Deployment

### Using AWS CLI
```bash
chmod +x deploy-queue.sh
./deploy-queue.sh us-east-1 YOUR_ACCOUNT_ID
```

### Using CloudFormation
```bash
aws cloudformation create-stack \
  --stack-name nmm-doc-processing-queue \
  --template-body file://cloudformation-template.yaml \
  --parameters ParameterKey=LambdaFunctionName,ParameterValue=nmm_document_classification_lambda
```

### Using Terraform
```bash
terraform init
terraform plan
terraform apply
```

## Queue Configuration

- **Visibility Timeout**: 300 seconds
- **Message Retention**: 240 seconds (4 minutes)
- **Max Message Size**: 1MB
- **Batch Size**: 10 messages per Lambda invocation
- **Encryption**: SQS-managed SSE enabled

## Prerequisites

1. Lambda function `nmm_document_classification_lambda` must exist
2. DynamoDB table `nmm-doc-extraction` must be created
3. IAM role with required permissions must be configured
4. Bedrock model access must be enabled

## Testing

Send a test message:
```bash
aws sqs send-message \
  --queue-url https://queue.amazonaws.com/ACCOUNT-ID/NMM_DocProcessingAfterExtractionQueueNew \
  --message-body '{"s3filename":"test.pdf","indexid":"test-123","docid":"doc-456"}'
```
