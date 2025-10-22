# NMM Flow - Complete Process Flow

## 📋 User Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   LOGIN     │───▶│  DASHBOARD  │───▶│   UPLOAD    │
│ (Cognito)   │    │             │    │ Documents   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  DECISION   │◀───│ VERIFICATION│◀───│ EXTRACTION  │
│   MAKING    │    │   & REVIEW  │    │ Processing  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔄 Technical Flow

### Step 1: Document Upload
```
UI → S3 Presigned URL → Document Stored
```

### Step 2: Orchestration Trigger
```json
POST /nmm-orchestration-lambda
{
  "claimid": "CL222333",
  "s3filename": "claimassistv2/claimforms/document.pdf",
  "docid": "DID1122",
  "tasktype": "SEND_TO_QUEUE"
}
```

### Step 3: SQS Processing Chain
```
nmm-orchestration-lambda
         │
         ▼
NMMDocProcessingQueue
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              LAMBDA PROCESSING CHAIN                │
├─────────────────────────────────────────────────────┤
│ 1. nmm_document_extraction_lambda                   │
│    ├─ Extract raw text                              │
│    ├─ Extract tables                                │
│    └─ Extract key-value pairs                       │
│                                                     │
│ 2. nmm_document_classification_lambda               │
│    └─ Classify document type                        │
│                                                     │
│ 3. nmm_entityextraction_lambda                      │
│    └─ Extract business entities                     │
│                                                     │
│ 4. nmm_confidence_score_lambda                      │
│    └─ Calculate confidence scores                   │
│                                                     │
│ 5. nmm_update_modified_values_lambda                │
│    └─ Update database with results                  │
└─────────────────────────────────────────────────────┘
```

### Step 4: Integration & Updates
```
┌─────────────────┐    ┌─────────────────┐
│ Guidewire Fetch │───▶│ Guidewire Update│
│     Lambda      │    │     Lambda      │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Translation   │    │   DynamoDB      │
│     Service     │    │    Storage      │
└─────────────────┘    └─────────────────┘
```

## 🎯 User Roles & Paths

### NMM Uploader:
```
Login → Upload → Extract → Verify → Complete
```

### NMM Claim Adjuster:
```
Login → Dashboard → Review Claims → Decision → Update
```

## 📊 Data Flow

```
Document → S3 → Lambda Chain → DynamoDB → Guidewire → UI
```

## 🔧 Key Components

| Component | Purpose |
|-----------|---------|
| **React UI** | User interface |
| **AWS Cognito** | Authentication |
| **S3** | Document storage |
| **Lambda** | Processing logic |
| **SQS** | Queue management |
| **DynamoDB** | Data storage |
| **Guidewire** | External system |
