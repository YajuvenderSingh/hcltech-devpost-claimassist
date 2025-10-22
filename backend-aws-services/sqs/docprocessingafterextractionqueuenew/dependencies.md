# NMM_DocProcessingAfterExtractionQueueNew Dependencies

## Required AWS Services
- **SQS**: Queue service
- **Lambda**: Function execution
- **DynamoDB**: Data storage
- **Bedrock**: AI model inference
- **Translate**: Language translation
- **Comprehend**: Language detection
- **CloudWatch**: Logging

## Required Resources

### 1. Lambda Function
- **Name**: `nmm_document_classification_lambda`
- **Runtime**: Python 3.9
- **Handler**: `lambda_function.lambda_handler`
- **Memory**: 512 MB
- **Timeout**: 300 seconds

### 2. DynamoDB Table
- **Name**: `nmm-doc-extraction`
- **Primary Key**: `docid` (String)
- **Required Fields**:
  - `document_name`
  - `rawtext`
  - `tbltxt`
  - `keyvaluesText`

### 3. IAM Role
- **Name**: `HCL-User-Role-Aiml-lambda`
- **Required Permissions**:
  ```json
  {
    "SQS": ["ReceiveMessage", "DeleteMessage", "GetQueueAttributes"],
    "DynamoDB": ["GetItem", "UpdateItem"],
    "Bedrock": ["InvokeModel"],
    "Translate": ["TranslateText"],
    "Comprehend": ["DetectDominantLanguage"],
    "Logs": ["CreateLogGroup", "CreateLogStream", "PutLogEvents"]
  }
  ```

## Upstream Dependencies
1. **Document Extraction Pipeline**
   - `NMMDocProcessingQueue` → `nmm_document_extraction_lambda`
   - Must populate `nmm-doc-extraction` table

## Message Format
```json
{
  "s3filename": "document.pdf",
  "indexid": "unique-index-id",
  "docid": "unique-document-id"
}
```

## Deployment Order
1. Create DynamoDB table
2. Deploy Lambda function with IAM role
3. Create SQS queue
4. Create event source mapping
5. Test with upstream pipeline
