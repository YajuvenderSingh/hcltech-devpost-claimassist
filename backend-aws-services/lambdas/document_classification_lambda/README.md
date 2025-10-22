# Document Classification Lambda Function

This Lambda function classifies worker compensation documents using AI/ML after text extraction, supporting multi-language processing.

## Function Overview

**Purpose**: Classify extracted documents using Amazon Bedrock Claude 3 Haiku model
**Runtime**: Python 3.9
**Memory**: 512 MB
**Timeout**: 300 seconds (5 minutes)
**Trigger**: SQS queue messages from document extraction pipeline

## Features

### AI-Powered Classification
- **Model**: Amazon Bedrock Claude 3 Haiku
- **Classification Types**: 
  - MedicalReport
  - ClaimForm
  - DoctorReportMMI
  - PhysicalTherapy
  - Prescription
  - CMS1500
  - Legal
  - Invoice
  - Unidentified Type (fallback)

### Multi-Language Support
- **Language Detection**: Amazon Comprehend
- **Translation**: Amazon Translate (Spanish to English)
- **Supported Languages**: English (native), Spanish (translated)

### Workflow Integration
- **Input**: SQS messages from extraction pipeline
- **Output**: Classification results stored in DynamoDB
- **Next Step**: Triggers entity extraction Lambda

## File Structure

```
document_classification_lambda/
├── lambda_function.py          # Main Lambda function code
├── utility.py                  # Helper functions for DynamoDB and Bedrock
├── requirements.txt            # Python dependencies
├── lambda-config.json         # Lambda configuration template
├── cloudformation-template.yaml # Infrastructure as Code
├── deploy.sh                  # Deployment script
└── README.md                  # This file
```

## SQS Message Format

The function expects SQS messages with this structure:
```json
{
    "indexid": "IN123456",
    "s3filename": "newmexicomutual/claimforms/IN123456/DOC789012/document.pdf",
    "docid": "DOC789012"
}
```

## Processing Workflow

1. **Receive SQS Message**: Extract document metadata from queue
2. **Retrieve Extracted Data**: Fetch text from `nmm-doc-extraction` DynamoDB table
3. **Language Detection**: Use Amazon Comprehend to detect document language
4. **Translation** (if needed): Translate non-English documents using Amazon Translate
5. **Generate Prompt**: Create classification prompt with extracted text
6. **AI Classification**: Use Bedrock Claude 3 Haiku for document classification
7. **Store Results**: Update DynamoDB tables with classification and metadata
8. **Trigger Next Step**: Invoke entity extraction Lambda for further processing

## Dependencies

### AWS Services
- **Amazon Bedrock**: Claude 3 Haiku model for classification
- **Amazon DynamoDB**: 
  - `nmm-doc-extraction` (read extracted text, store classification)
  - `nmm-dashboard` (update processing status)
- **Amazon Comprehend**: Language detection
- **Amazon Translate**: Document translation
- **AWS Lambda**: Invoke next processing step
- **Amazon SQS**: Message queue integration

### Python Libraries
- **boto3**: AWS SDK
- **json**: JSON processing (built-in)
- **datetime**: Date/time handling (built-in)
- **traceback**: Error handling (built-in)

## Environment Variables

- **EXTRACTION_TABLE**: DynamoDB table for extraction results (default: nmm-doc-extraction)
- **DASHBOARD_TABLE**: DynamoDB table for dashboard updates (default: nmm-dashboard)
- **ENTITY_EXTRACTION_LAMBDA**: Next Lambda function name (default: nmm_entityextraction_lambda)

## Data Storage

### Extraction Table Schema
```json
{
    "docid": "DOC789012",
    "document_name": "claim_form.pdf",
    "rawtext": "Extracted document text...",
    "tbltxt": "Table data...",
    "keyvaluesText": "Key-value pairs...",
    "classification": "ClaimForm",
    "translated_text": "Translated text (if applicable)"
}
```

### Dashboard Table Schema
```json
{
    "docid": "DOC789012",
    "classification_status": "Completed",
    "classification": "ClaimForm",
    "doc_language": "English",
    "s3filename": ["path/to/document.pdf"]
}
```

## Deployment

### Prerequisites
1. **IAM Role**: HCL-User-Role-Aiml-lambda with required permissions
2. **SQS Queue**: Post-extraction processing queue
3. **DynamoDB Tables**: Extraction and dashboard tables
4. **Bedrock Access**: Claude 3 Haiku model access

### Quick Deployment
```bash
# Deploy with default settings
./deploy.sh

# Deploy with custom parameters
./deploy.sh my-classification-function arn:aws:sqs:us-east-1:123456789012:MyQueue
```

### Manual Deployment Steps

**Step 1: Create Deployment Package**
```bash
zip -r lambda-deployment.zip lambda_function.py utility.py
```

**Step 2: Deploy Infrastructure**
```bash
aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name document-classification-lambda-stack \
    --parameter-overrides \
        SQSQueueArn=arn:aws:sqs:us-east-1:ACCOUNT_ID:NMM_DocProcessingAfterExtractionQueueNew \
    --capabilities CAPABILITY_IAM
```

**Step 3: Update Function Code**
```bash
aws lambda update-function-code \
    --function-name nmm_document_classification_lambda \
    --zip-file fileb://lambda-deployment.zip
```

## Configuration

### Bedrock Model Configuration
- **Model ID**: `anthropic.claude-3-haiku-20240307-v1:0`
- **Max Tokens**: 5000
- **API Version**: `bedrock-2023-05-31`

### Classification Prompt Template
The function uses a structured prompt that includes:
- Raw text content
- Key-value pair data
- Tabular data
- Specific classification categories
- JSON output format requirements

## Testing

### Unit Testing
```bash
# Test with sample SQS event
aws lambda invoke \
    --function-name nmm_document_classification_lambda \
    --payload file://test-event.json \
    response.json
```

### Sample Test Event (test-event.json)
```json
{
    "Records": [
        {
            "body": "{\"indexid\":\"IN123456\",\"s3filename\":\"test/document.pdf\",\"docid\":\"DOC123456\"}"
        }
    ]
}
```

## Monitoring

### CloudWatch Metrics
- **Duration**: Function execution time
- **Errors**: Failed invocations
- **Throttles**: Concurrent execution limits
- **IteratorAge**: SQS message processing delay

### Custom Logging
The function includes comprehensive logging:
- Event processing details
- Language detection results
- Translation status
- Classification results
- Database update responses
- Error details with stack traces

## Error Handling

### Common Error Scenarios
1. **Missing Document**: Document not found in extraction table
2. **Language Detection Failure**: Comprehend service errors
3. **Translation Errors**: Translate service limitations
4. **Bedrock Errors**: Model invocation failures
5. **DynamoDB Errors**: Database access issues
6. **Lambda Invocation Errors**: Next step trigger failures

### Error Response Format
```json
{
    "statusCode": 500,
    "body": "{\"error\": \"Error description\"}"
}
```

## Performance Optimization

### Bedrock Optimization
- Uses efficient Claude 3 Haiku model
- Structured prompts for consistent results
- Proper error handling for model failures

### DynamoDB Optimization
- Efficient key-based lookups
- Batch operations where possible
- Proper error handling and retries

### Memory and Timeout
- 512 MB memory allocation (sufficient for text processing)
- 5-minute timeout (adequate for AI model calls)
- Optimized for document classification workloads

## Security Considerations

- **IAM Permissions**: Least privilege access to required services
- **Data Encryption**: DynamoDB encryption at rest
- **Logging**: Avoid logging sensitive document content
- **Model Access**: Secure Bedrock model invocation

## Integration Points

### Upstream Integration
- **Document Extraction Lambda**: Provides extracted text data
- **SQS Queue**: Receives processing requests

### Downstream Integration
- **Entity Extraction Lambda**: Triggered after classification
- **Dashboard Applications**: Status updates via DynamoDB
- **Reporting Systems**: Classification metrics and analytics

## Troubleshooting

### Debug Commands
```bash
# Check Lambda logs
aws logs tail /aws/lambda/nmm_document_classification_lambda --follow

# Check DynamoDB items
aws dynamodb get-item \
    --table-name nmm-doc-extraction \
    --key '{"docid":{"S":"DOC123456"}}'

# Check SQS queue
aws sqs get-queue-attributes \
    --queue-url https://sqs.us-east-1.amazonaws.com/ACCOUNT/NMM_DocProcessingAfterExtractionQueueNew \
    --attribute-names All
```

### Common Issues
1. **Bedrock Access Denied**: Verify model access permissions
2. **Translation Limits**: Check Translate service quotas
3. **DynamoDB Throttling**: Monitor table capacity
4. **Lambda Timeout**: Increase timeout for complex documents

## Cost Optimization

- **Bedrock Usage**: Efficient prompt design to minimize tokens
- **Translation**: Only translate when necessary (non-English)
- **DynamoDB**: Use on-demand billing for variable workloads
- **Lambda**: Right-sized memory allocation

## Notes

- **Language Support**: Currently supports English and Spanish
- **Classification Accuracy**: Depends on document quality and content
- **Scalability**: Serverless architecture scales automatically
- **Reliability**: Built-in error handling and retry mechanisms
- **Audit Trail**: Comprehensive logging for troubleshooting and compliance
