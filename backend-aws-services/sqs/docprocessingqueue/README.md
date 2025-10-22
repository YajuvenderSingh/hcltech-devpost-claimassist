# NMM Document Processing SQS Queue

This SQS queue handles document processing requests in the New Mexico Mutual (NMM) claim processing workflow.

## Queue Overview

**Purpose**: Asynchronous document processing for claim documents
**Type**: Standard SQS queue with short message retention for rapid processing
**Integration**: Part of the claim assistance document extraction pipeline

## Configuration Details

### Queue Settings
- **Queue Name**: NMMDocProcessingQueue
- **Visibility Timeout**: 300 seconds (5 minutes)
- **Message Retention**: 240 seconds (4 minutes) - Very short for rapid processing
- **Max Message Size**: 1 MB
- **Delay Seconds**: 1 second
- **Encryption**: SQS-managed server-side encryption

### Key Characteristics
- **Short Retention**: Messages expire in 4 minutes if not processed
- **Rapid Processing**: Designed for real-time document processing
- **Batch Processing**: Supports up to 10 messages per batch
- **Dead Letter Queue**: Included for failed message handling

## File Structure

```
docprocessingqueue/
├── queue-config.json           # Raw queue configuration
├── cloudformation-template.yaml # Infrastructure as Code
├── event-source-mapping.json   # Lambda consumer configuration
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## Message Format

Messages sent to this queue follow this structure:
```json
{
    "indexid": "IN123456",
    "s3filename": "newmexicomutual/claimforms/IN123456/DOC789012/document.pdf",
    "docid": "DOC789012",
    "source": "ManualUpload"
}
```

### Message Fields
- **indexid**: Claim ID (format: IN######)
- **s3filename**: Full S3 path to the document
- **docid**: Document ID (format: DOC######)
- **source**: Upload source (ManualUpload, API, etc.)

## Consumer Lambda Functions

### Primary Consumer
- **Function**: `nmm_document_extraction_lambda`
- **Batch Size**: 10 messages
- **State**: Enabled
- **Purpose**: Main document processing and extraction

### Secondary Consumer
- **Function**: `nmm-document-extraction-new`
- **Batch Size**: 1 message
- **State**: Disabled (standby/alternative version)
- **Purpose**: Alternative processing logic

## Deployment

### Quick Deployment
```bash
# Deploy with default settings
./deploy.sh

# Deploy with custom queue name and region
./deploy.sh MyDocQueue us-west-2
```

### Manual Deployment

**Step 1: Create SQS Queue**
```bash
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name nmm-doc-processing-queue-stack \
    --parameter-overrides QueueName=NMMDocProcessingQueue
```

**Step 2: Create Event Source Mapping (after Lambda exists)**
```bash
# Replace placeholders with actual values
aws lambda create-event-source-mapping \
    --event-source-arn arn:aws:sqs:us-east-1:YOUR_ACCOUNT_ID:NMMDocProcessingQueue \
    --function-name nmm_document_extraction_lambda \
    --batch-size 10 \
    --enabled
```

## Integration Points

### Message Producers
- **nmm-orchestration-lambda**: Sends document processing requests via `sendtodocproQ()` function
- **API Gateway**: Direct document upload triggers
- **S3 Events**: Automatic processing of uploaded documents

### Message Consumers
- **Document Extraction Lambda**: Processes documents using AI/ML services
- **Textract Integration**: OCR and document analysis
- **DynamoDB Updates**: Store extraction results

## Workflow Integration

```
Document Upload → Orchestration Lambda → SQS Queue → Processing Lambda → Results Storage
```

1. **Document Upload**: User uploads claim document
2. **Orchestration**: nmm-orchestration-lambda validates and queues processing request
3. **Queue**: Message waits in SQS queue for processing
4. **Processing**: Document extraction Lambda processes the document
5. **Storage**: Results stored in DynamoDB and/or S3

## Monitoring

### CloudWatch Metrics
- **ApproximateNumberOfMessages**: Messages waiting in queue
- **ApproximateNumberOfMessagesNotVisible**: Messages being processed
- **NumberOfMessagesSent**: Rate of incoming messages
- **NumberOfMessagesReceived**: Rate of processing

### Alarms to Set Up
```bash
# High message count alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "NMMDocQueue-HighMessageCount" \
    --alarm-description "Too many messages in doc processing queue" \
    --metric-name ApproximateNumberOfMessages \
    --namespace AWS/SQS \
    --statistic Average \
    --period 300 \
    --threshold 50 \
    --comparison-operator GreaterThanThreshold
```

## Security Considerations

- **IAM Permissions**: Only account root has full access by default
- **Encryption**: Messages encrypted at rest with SQS-managed keys
- **VPC**: Queue accessible from VPC-enabled Lambda functions
- **Access Logging**: Enable CloudTrail for API call logging

## Troubleshooting

### Common Issues

1. **Messages Disappearing Quickly**
   - Check 4-minute retention period
   - Ensure consumers are processing messages
   - Monitor dead letter queue

2. **Processing Delays**
   - Check Lambda function errors
   - Verify event source mapping is enabled
   - Monitor visibility timeout settings

3. **Permission Errors**
   - Verify IAM roles have SQS permissions
   - Check queue policy allows Lambda access
   - Ensure cross-account permissions if needed

### Debug Commands
```bash
# Check queue attributes
aws sqs get-queue-attributes --queue-url QUEUE_URL --attribute-names All

# Send test message
aws sqs send-message \
    --queue-url QUEUE_URL \
    --message-body '{"indexid":"IN123456","s3filename":"test.pdf","docid":"DOC123","source":"Test"}'

# Check event source mappings
aws lambda list-event-source-mappings --function-name nmm_document_extraction_lambda
```

## Performance Optimization

### Batch Size Tuning
- **Current**: 10 messages per batch
- **Consideration**: Balance between throughput and processing time
- **Recommendation**: Monitor Lambda duration and adjust accordingly

### Visibility Timeout
- **Current**: 5 minutes
- **Consideration**: Should exceed maximum Lambda execution time
- **Recommendation**: Adjust based on document processing complexity

## Cost Optimization

- **Short Retention**: Reduces storage costs
- **Batch Processing**: Reduces Lambda invocation costs
- **Dead Letter Queue**: Prevents infinite retry costs
- **Regional Deployment**: Keep queue and consumers in same region

## Notes

- **Critical**: 4-minute message retention requires rapid processing
- **Scaling**: Queue can handle high throughput with proper Lambda scaling
- **Reliability**: Dead letter queue captures failed processing attempts
- **Integration**: Designed specifically for NMM claim document workflow
