# NMM Orchestration Lambda Function

This Lambda function serves as the central orchestrator for claim processing workflows, handling multiple task types and coordinating between different AWS services.

## Function Overview

**Purpose**: Central orchestration hub for claim processing operations
**Runtime**: Python 3.12
**Handler**: `lambda_function.lambda_handler`
**Memory**: 4,096 MB (high memory for complex operations)
**Timeout**: 180 seconds (3 minutes)

## Features

### Task Types Supported

1. **SEND_TO_QUEUE** - Send documents to processing queue
2. **SEND_TO_PS_QUEUE** - Send claims to PS processing queue
3. **FETCH_ALL_CLAIMS** - Retrieve all claims from database
4. **FETCH_SINGLE_CLAIM** - Get specific claim details
5. **FETCH_ALL_ACT_CLAIMS** - Get all active claims
6. **FETCH_SINGLE_ACT_CLAIM** - Get specific active claim
7. **VERIFY_CLAIM** - Verify claim with PS ID
8. **GENERATE_EMAIL** - Generate email for claim
9. **FETCH_EMAIL** - Retrieve email template

## File Structure

```
nmm-orchestration/
├── lambda_function.py           # Main orchestration logic
├── utilities.py                 # Helper functions for AWS services
├── requirements.txt             # Python dependencies
├── lambda-config.json          # Lambda configuration template
├── cloudformation-template.yaml # Infrastructure as Code
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## Dependencies

### AWS Services
- **DynamoDB**: Store and retrieve claim data
- **SQS**: Queue management for document and PS processing
- **SES**: Email generation and sending
- **S3**: Document storage (referenced in utilities)

### Python Modules
- `boto3`: AWS SDK
- `json`: JSON processing
- `decimal`: Handle DynamoDB Decimal types
- `uuid`: Generate unique identifiers

## API Usage Examples

### Send Document to Processing Queue
```json
{
    "tasktype": "SEND_TO_QUEUE",
    "indexid": "IN123456",
    "s3filename": "document.pdf",
    "docid": "DOC789012",
    "source": "ManualUpload"
}
```

### Fetch All Claims
```json
{
    "tasktype": "FETCH_ALL_CLAIMS"
}
```

### Fetch Single Claim
```json
{
    "tasktype": "FETCH_SINGLE_CLAIM",
    "claimid": "IN123456"
}
```

### Verify Claim
```json
{
    "tasktype": "VERIFY_CLAIM",
    "claimid": "IN123456",
    "psid": "PS789012"
}
```

### Generate Email
```json
{
    "tasktype": "GENERATE_EMAIL",
    "claimid": "IN123456",
    "psid": "PS789012"
}
```

## Prerequisites

1. **IAM Role**: Create the `HCL-User-Role-Aiml-lambda` role
   - Use files in `../iam/` directory
   - Must have DynamoDB, SQS, SES, and S3 permissions

2. **DynamoDB Table**: `claimassistv2-claimdetails`
   - Primary key: `claimid` (String)

3. **SQS Queues**: For document and PS processing

## Quick Deployment

### Option 1: CloudFormation (Recommended)
```bash
# Deploy with default settings
./deploy.sh

# Deploy with custom names
./deploy.sh my-orchestration-function my-claims-table
```

### Option 2: Manual Deployment

**Step 1: Create DynamoDB Table**
```bash
aws dynamodb create-table \
    --table-name claimassistv2-claimdetails \
    --attribute-definitions AttributeName=claimid,AttributeType=S \
    --key-schema AttributeName=claimid,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

**Step 2: Create SQS Queues**
```bash
# Document processing queue
aws sqs create-queue --queue-name doc-processing-queue

# PS processing queue
aws sqs create-queue --queue-name ps-processing-queue
```

**Step 3: Deploy Lambda Function**
```bash
# Create deployment package
zip -r lambda-deployment.zip lambda_function.py utilities.py

# Create function
aws lambda create-function \
    --function-name nmm-orchestration-lambda \
    --runtime python3.12 \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/HCL-User-Role-Aiml-lambda \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://lambda-deployment.zip \
    --timeout 180 \
    --memory-size 4096
```

## Configuration

### Environment Variables (Recommended)
```bash
# Set environment variables for the Lambda function
aws lambda update-function-configuration \
    --function-name nmm-orchestration-lambda \
    --environment Variables="{
        DYNAMODB_TABLE_NAME=claimassistv2-claimdetails,
        SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/doc-queue,
        PS_SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/ps-queue
    }"
```

### Lambda Settings
- **Memory**: 4,096 MB (for handling large datasets)
- **Timeout**: 180 seconds
- **Runtime**: Python 3.12
- **Ephemeral Storage**: 4,096 MB

## Response Formats

### Success Response
```json
{
    "statusCode": 200,
    "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
    },
    "body": {
        "message": "Operation completed successfully",
        "data": "..."
    }
}
```

### Error Response
```json
{
    "statusCode": 400/500,
    "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
    },
    "body": {
        "error": "Error description",
        "details": "Detailed error information"
    }
}
```

## Testing

### Test Different Task Types
```bash
# Test fetch all claims
aws lambda invoke \
    --function-name nmm-orchestration-lambda \
    --payload '{"tasktype":"FETCH_ALL_CLAIMS"}' \
    response.json

# Test send to queue
aws lambda invoke \
    --function-name nmm-orchestration-lambda \
    --payload '{"tasktype":"SEND_TO_QUEUE","indexid":"IN123456","s3filename":"test.pdf","docid":"DOC123"}' \
    response.json

# Test fetch single claim
aws lambda invoke \
    --function-name nmm-orchestration-lambda \
    --payload '{"tasktype":"FETCH_SINGLE_CLAIM","claimid":"IN123456"}' \
    response.json
```

## Utility Functions

### Key Functions in utilities.py
- `fetchsinglerec(claimid)`: Fetch single claim record
- `allitemscan()`: Scan all items from DynamoDB
- `allclaimsfetch()`: Fetch all active claims
- `sendtodocproQ(indexid, s3filename, docid, source)`: Send to document processing queue
- `sendtoPSproQ(claimid, s3filename, actionn)`: Send to PS processing queue
- `singleclaimfetch(claimid)`: Fetch single active claim
- `verifyclaim(claimid, psid)`: Verify claim with PS ID
- `GenerateEmail(claimid, psid)`: Generate email content
- `fetchtmpltemail(claimid)`: Fetch email template

## Security Considerations

- CORS headers allow all origins (adjust for production)
- IAM role provides least-privilege access
- Input validation for required parameters
- Error handling prevents information leakage
- DynamoDB access patterns optimized for performance

## Troubleshooting

### Common Issues

1. **DynamoDB Access Denied**
   - Check IAM role has DynamoDB permissions
   - Verify table exists and is accessible

2. **SQS Queue Not Found**
   - Ensure SQS queues exist
   - Check queue URLs in environment variables

3. **Memory/Timeout Issues**
   - Increase memory allocation for large datasets
   - Optimize DynamoDB queries
   - Consider pagination for large results

### Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/nmm-orchestration-lambda --follow

# Get specific log group
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/nmm"
```

## Performance Optimization

### DynamoDB Best Practices
- Use appropriate partition keys
- Implement pagination for large scans
- Consider using GSI for different access patterns
- Monitor consumed capacity

### Lambda Optimization
- Reuse connections outside handler
- Use connection pooling
- Implement proper error handling
- Monitor cold start times

## Integration

This Lambda function integrates with:
- **Frontend Applications**: Via API Gateway
- **Document Processing Pipeline**: Through SQS queues
- **Email System**: Via SES integration
- **Database Layer**: DynamoDB for persistence
- **File Storage**: S3 for document management

## Notes

- Original function uses different IAM role (`aegonlambda-role-ojk2l07c`)
- VPC configuration removed for cross-account portability
- Environment variables should be configured post-deployment
- Consider implementing retry logic for external service calls
- Monitor function performance and adjust memory/timeout as needed
