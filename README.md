# hcltech-devpost-claimassist
This repo is from HCLTech for Claim Assist Solution for AWS Devpost Hackathon
A comprehensive AWS-based solution for processing and analyzing worker compensation documents using AI/ML services including Amazon Bedrock, Textract, and Lambda functions.

## 🏗️ Architecture Overview

This repository contains the complete infrastructure and application code for an intelligent document processing system designed for worker compensation claims.

## 📁 Repository Structure

```
claimassist-devpost/
├── backend-aws-services/          # AWS Infrastructure & Services
│   ├── iam/                      # IAM Roles, Policies & Permissions
│   ├── lambdas/                  # Lambda Functions
│   └── sqs/                      # SQS Queue Configurations
└── frontend-reactjs/             # React.js Frontend Application
```

## 🔧 Backend AWS Services

### IAM Configuration
- **HCL-User-Role-Aiml-lambda**: Main execution role for Lambda functions
- **HCL-Permissions-Boundary**: Security boundary policy
- **HCL-User-Policy-Aiml-1**: Custom policy with required permissions

### Lambda Functions

| Function | Purpose | Runtime |
|----------|---------|---------|
| `document_classification_lambda` | AI-powered document classification using Bedrock | Python 3.9 |
| `document_extraction_lambda` | Text extraction using Amazon Textract | Python 3.12 |
| `entityextraction_lambda` | Extract structured entities from documents | Python 3.9 |
| `doc_validation_lambda` | Validate document data consistency | Python 3.9 |
| `claim_adjuster_dashboard` | Dashboard data aggregation | Python 3.9 |
| `chatbot_lambda` | AI chatbot for claim assistance | Python 3.12 |
| `confidence_score_lambda` | Calculate confidence scores for extractions | Python 3.9 |
| `dashboard_lambda` | Main dashboard backend | Python 3.9 |
| `document_summary_lambda` | Generate document summaries | Python 3.9 |
| `fetch_extracted_entities_lambda` | Retrieve extracted entity data | Python 3.9 |
| `fetch_doc_details` | Fetch document metadata | Python 3.9 |
| `guidewire_integration_lambda` | Integration with Guidewire system | Python 3.12 |
| `history_dashboard_lambda` | Historical data dashboard | Python 3.9 |
| `map_guidewire_claimnumber` | Map claim numbers to Guidewire | Python 3.9 |
| `mark_for_review_lambda` | Flag documents for manual review | Python 3.9 |
| `orchestration` | Main orchestration workflow | Python 3.9 |
| `s3-presigned-url` | Generate S3 presigned URLs | Python 3.9 |

### SQS Queues

| Queue | Purpose | Trigger |
|-------|---------|---------|
| `docprocessingqueue` | Initial document processing | `document_extraction_lambda` |
| `docprocessingafterextractionqueuenew` | Post-extraction classification | `document_classification_lambda` |

## 🚀 Key Features

- **AI-Powered Document Classification**: Uses Amazon Bedrock for intelligent document categorization
- **Multi-Language Support**: Automatic language detection and translation (English/Spanish)
- **Automated Text Extraction**: Amazon Textract integration for OCR and form processing
- **Entity Extraction**: Structured data extraction from claim forms
- **Validation Engine**: Business rule validation for claim data consistency
- **Dashboard Analytics**: Real-time dashboards for claim adjusters
- **Guidewire Integration**: Seamless integration with existing claim management systems
- **Confidence Scoring**: ML-based confidence assessment for extracted data

## 🛠️ Technology Stack

### AWS Services
- **Amazon Bedrock**: AI/ML model inference
- **Amazon Textract**: Document text extraction
- **AWS Lambda**: Serverless compute
- **Amazon SQS**: Message queuing
- **Amazon DynamoDB**: NoSQL database
- **Amazon S3**: Document storage
- **Amazon Translate**: Language translation
- **Amazon Comprehend**: Language detection
- **AWS IAM**: Identity and access management

### Development Tools
- **Python 3.9/3.12**: Primary backend language
- **React.js**: Frontend framework
- **CloudFormation**: Infrastructure as Code
- **Terraform**: Alternative IaC option
- **Docker**: Containerization for some Lambda functions

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Python 3.9+ installed
- Node.js and npm (for frontend)
- Docker (for containerized Lambda functions)

## 🚀 Deployment

### Quick Start

1. **Deploy IAM Resources**
   ```bash
   cd backend-aws-services/iam/
   # Follow IAM setup instructions
   ```

2. **Deploy SQS Queues**
   ```bash
   cd backend-aws-services/sqs/docprocessingqueue/
   ./deploy.sh us-east-1 YOUR_ACCOUNT_ID
   ```

3. **Deploy Lambda Functions**
   ```bash
   cd backend-aws-services/lambdas/document_classification_lambda/
   ./deploy.sh
   ```

### Infrastructure as Code

Each component includes multiple deployment options:
- AWS CLI scripts
- CloudFormation templates
- Terraform configurations

## 📊 Document Processing Workflow

1. **Document Upload** → S3 Storage
2. **Text Extraction** → Amazon Textract
3. **Language Detection** → Amazon Comprehend
4. **Translation** → Amazon Translate (if needed)
5. **Classification** → Amazon Bedrock
6. **Entity Extraction** → Custom ML models
7. **Validation** → Business rules engine
8. **Dashboard Update** → Real-time analytics

## 🔒 Security Features

- IAM roles with least privilege access
- Permission boundaries for enhanced security
- SQS message encryption
- VPC integration for Lambda functions
- Secure API endpoints

## 📈 Monitoring & Logging

- CloudWatch Logs integration
- Lambda function metrics
- SQS queue monitoring
- Custom dashboards for operational insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions and support, please contact the development team or create an issue in this repository.

---

**Note**: This system is designed specifically for worker compensation claim processing. Ensure all compliance and regulatory requirements are met before deployment in production environments.

