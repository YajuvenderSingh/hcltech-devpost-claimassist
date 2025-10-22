# NMM Flow - How It Works

## 🚀 Current Status: **WORKING** ✅

The NMM flow is now operational with the following architecture:

## Flow Steps:

### 1. **Login** 
- Users authenticate via AWS Cognito
- Two roles: `NMM Uploader` | `NMM Claim Adjuster`

### 2. **Document Upload**
- Upload documents to S3 via presigned URLs
- Supported: PDF, images, Excel files
- Auto-generates `claimid`, `docid`, `s3filename`

### 3. **Orchestration** 
```json
{
  "claimid": "CL222333",
  "s3filename": "claimassistv2/claimforms/document.pdf",
  "docid": "DID1122",
  "tasktype": "SEND_TO_QUEUE"
}
```

### 4. **Processing Pipeline**
```
UI → nmm-orchestration-lambda → SQS Queue → Document Processing
```

### 5. **Lambda Chain**
1. `nmm_document_extraction_lambda` - Extract text/tables
2. `nmm_document_classification_lambda` - Classify document type  
3. `nmm_entityextraction_lambda` - Extract entities
4. `nmm_confidence_score_lambda` - Calculate confidence
5. `nmm_update_modified_values_lambda` - Update DB

### 6. **Integration**
- **Guidewire**: `nmm_fetch_guidewire_lambda` + `nmm_update_guidewire_lambda`
- **Translation**: `text-translation-function`

## 🔧 Configuration Fixed:
- ✅ Lambda names aligned with architecture
- ✅ Environment variables updated
- ✅ Error handling improved
- ✅ Build warnings reduced

## 🌐 Access:
- **Development**: `http://localhost:8080`
- **Production**: Deploy build folder to S3/CloudFront

## 📊 Monitoring:
- Check CloudWatch logs for lambda execution
- Monitor SQS queue: `NMMDocProcessingQueue`
- DynamoDB tables for processed data
