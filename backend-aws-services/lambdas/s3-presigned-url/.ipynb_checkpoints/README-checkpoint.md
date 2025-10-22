# S3 Presigned URL Lambda Function

This Lambda function generates presigned URLs for secure S3 file operations in a claim assistance application.

## Function Overview

**Purpose**: Generate presigned URLs for uploading and viewing claim documents
**Runtime**: Python 3.13
**Handler**: `presigned-url-lambda.lambda_handler`

## Features

- **Upload URLs**: Generate presigned URLs for uploading files to S3
- **View URLs**: Generate presigned URLs for viewing/downloading files from S3
- **Claim ID Management**: Auto-generate or validate claim IDs (format: IN######)
- **Document Organization**: Organize files by claim ID and document ID
- **CORS Support**: Handle preflight OPTIONS requests

## API Usage

### Upload File
```json
{
    "fileName": "document.pdf",
    "fileType": "application/pdf",
    "claimId": "IN123456"
}
```

### View File
```json
{
    "tasktype": "GET_PRESIGNED_URL_FOR_VIEW",
    "s3Key": "newmexicomutual/claimforms/IN123456/DOC789012/document.pdf"
}
```

## File Structure

```
s3-presigned-url/
├── presigned-url-lambda.py      # Main Lambda function code
├── requirements.txt             # Python dependencies
├── lambda-config.json          # Lambda configuration template
├── s3-config.json              # S3 bucket configuration
├── cloudformation-template.yaml # Infrastructure as Code
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## Prerequisites

1. **IAM Role**: Create the `HCL-User-Role-Aiml-lambda` role first
   - Use the files in `../iam/` directory
   - Role must have S3 permissions

2. **AWS CLI**: Configured with appropriate permissions

## Quick Deployment

### Option 1: CloudFormation (Recommended)
```bash
# Deploy with default settings
./deploy.sh

# Deploy with custom bucket name
./deploy.sh my-custom-bucket-name

# Deploy with custom bucket and function name
./deploy.sh my-bucket my-function-name
```

### Option 2: Manual Deployment

**Step 1: Create S3 Bucket**
```bash
export BUCKET_NAME="my-claim-documents-bucket"
aws s3 mb s3://$BUCKET_NAME

# Set bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://s3-config.json

# Set CORS configuration
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://s3-config.json
```

**Step 2: Create Lambda Function**
```bash
# Create deployment package
zip lambda-deployment.zip presigned-url-lambda.py

# Create function
aws lambda create-function \
    --function-name claimassist-presignedurl-lambda \
    --runtime python3.13 \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/HCL-User-Role-Aiml-lambda \
    --handler presigned-url-lambda.lambda_handler \
    --zip-file fileb://lambda-deployment.zip \
    --timeout 600 \
    --memory-size 2046 \
    --environment Variables="{BUCKET_NAME=$BUCKET_NAME}"
```

## Configuration

### Environment Variables
- `BUCKET_NAME`: S3 bucket for storing claim documents

### Lambda Settings
- **Memory**: 2,046 MB
- **Timeout**: 600 seconds (10 minutes)
- **Runtime**: Python 3.13

### S3 Bucket Requirements
- Public read access for document viewing
- CORS enabled for web application access
- Organized folder structure: `newmexicomutual/claimforms/{claimId}/{docId}/{fileName}`

## Response Format

### Upload Response
```json
{
    "uploadUrl": "https://s3.amazonaws.com/bucket/key?...",
    "s3Key": "newmexicomutual/claimforms/IN123456/DOC789012/document.pdf",
    "claimId": "IN123456",
    "docId": "DOC789012",
    "documentId": "IN123456"
}
```

### View Response
```json
{
    "uploadUrl": "https://s3.amazonaws.com/bucket/key?...",
    "s3Key": "newmexicomutual/claimforms/IN123456/DOC789012/document.pdf"
}
```

## Testing

### Test Upload URL Generation
```bash
aws lambda invoke \
    --function-name claimassist-presignedurl-lambda \
    --payload '{"fileName":"test.pdf","fileType":"application/pdf","claimId":"IN123456"}' \
    response.json

cat response.json
```

### Test View URL Generation
```bash
aws lambda invoke \
    --function-name claimassist-presignedurl-lambda \
    --payload '{"tasktype":"GET_PRESIGNED_URL_FOR_VIEW","s3Key":"newmexicomutual/claimforms/IN123456/DOC789012/test.pdf"}' \
    response.json

cat response.json
```

## Security Considerations

- Presigned URLs expire after 1 hour (3600 seconds)
- Claim ID validation prevents unauthorized access patterns
- CORS headers restrict cross-origin access
- IAM role limits Lambda permissions via permissions boundary

## Troubleshooting

### Common Issues

1. **IAM Role Not Found**
   - Ensure `HCL-User-Role-Aiml-lambda` role exists
   - Check role has S3 permissions

2. **S3 Bucket Access Denied**
   - Verify bucket policy allows Lambda role access
   - Check bucket exists and is in same region

3. **CORS Errors**
   - Verify CORS configuration on S3 bucket
   - Check allowed origins match your application domain

### Logs
```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/claimassist"
aws logs tail /aws/lambda/claimassist-presignedurl-lambda --follow
```

## Customization

### Modify File Organization
Edit the `s3_key` generation in `presigned-url-lambda.py`:
```python
s3_key = f'your-prefix/{claim_id}/{doc_id}/{file_name}'
```

### Change Expiration Time
Modify the `ExpiresIn` parameter:
```python
presigned_url = s3.generate_presigned_url(
    'put_object',
    Params={'Bucket': BUCKET_NAME, 'Key': s3_key, 'ContentType': file_type},
    ExpiresIn=7200  # 2 hours
)
```

### Add Validation Rules
Extend the claim ID validation:
```python
if not re.match(r'^YOUR_PATTERN$', claim_id):
    return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid format'})}
```

## Integration

This Lambda function is designed to work with:
- Web applications requiring file upload/download
- API Gateway for HTTP endpoints
- Other Lambda functions in the claim processing pipeline
- Frontend applications with CORS support

## Notes

- Original function uses bucket `aimlusecases-pvt` (hardcoded)
- Environment variable `BUCKET_NAME` is set to `aimlusecasesv1` but not used in code
- Consider updating code to use environment variable for better portability
