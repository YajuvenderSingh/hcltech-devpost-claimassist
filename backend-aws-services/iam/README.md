# HCL-User-Role-Aiml-lambda IAM Role

This directory contains the complete IAM role configuration for AI/ML Lambda functions with all dependencies.

## Files Included

- `role.json` - Complete role configuration with metadata
- `trust-policy.json` - Trust relationship policy (Lambda service)
- `attached-policies.json` - List of attached policies
- `HCL-User-Policy-Aiml-1.json` - Custom AI/ML policy document
- `HCL-Permissions-Boundary.json` - Security permissions boundary policy

## Role Overview

**Purpose**: IAM role for Lambda functions requiring extensive AI/ML service access
**Trust Policy**: Only AWS Lambda service can assume this role
**Security**: Protected by permissions boundary to prevent privilege escalation

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate permissions
- Target AWS account with IAM permissions

### Step 1: Create Permissions Boundary
```bash
aws iam create-policy \
  --policy-name HCL-Permissions-Boundary \
  --policy-document file://HCL-Permissions-Boundary.json \
  --description "Security boundary for HCL user roles"
```

### Step 2: Create Custom Policy
```bash
aws iam create-policy \
  --policy-name HCL-User-Policy-Aiml-1 \
  --policy-document file://HCL-User-Policy-Aiml-1.json \
  --description "AIML-Policy for common services"
```

### Step 3: Create IAM Role
```bash
# Replace YOUR_ACCOUNT_ID with your actual AWS account ID
export ACCOUNT_ID="YOUR_ACCOUNT_ID"

aws iam create-role \
  --role-name HCL-User-Role-Aiml-lambda \
  --assume-role-policy-document file://trust-policy.json \
  --description "Allows Lambda functions to call AWS services on your behalf" \
  --permissions-boundary "arn:aws:iam::${ACCOUNT_ID}:policy/HCL-Permissions-Boundary"
```

### Step 4: Attach Policies
```bash
# Attach AWS managed policies
aws iam attach-role-policy \
  --role-name HCL-User-Role-Aiml-lambda \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaENIManagementAccess

aws iam attach-role-policy \
  --role-name HCL-User-Role-Aiml-lambda \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Attach custom policy
aws iam attach-role-policy \
  --role-name HCL-User-Role-Aiml-lambda \
  --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/HCL-User-Policy-Aiml-1"
```

## Services Accessible

### AI/ML Services
- Amazon Bedrock (all operations)
- Amazon SageMaker (all operations)
- Amazon Comprehend, Rekognition, Textract
- Amazon Polly, Transcribe, Translate

### Data & Storage
- Amazon S3 (all operations)
- Amazon DynamoDB (all operations)
- Amazon RDS (all operations)
- Amazon OpenSearch Serverless

### Compute & Integration
- AWS Lambda (all operations)
- Amazon ECS, EC2 (all operations)
- API Gateway, SQS, SNS, EventBridge
- AWS Step Functions

### Security & Monitoring
- AWS KMS (key operations)
- AWS Secrets Manager
- Amazon CloudWatch, X-Ray
- AWS CloudFormation

## Security Boundary

The permissions boundary prevents:
- IAM privilege escalation
- VPC/networking modifications
- Organizational changes
- Route53 DNS management
- Load balancer creation

## Usage in Lambda

```python
# The role ARN to use in Lambda function configuration
role_arn = "arn:aws:iam::YOUR_ACCOUNT_ID:role/HCL-User-Role-Aiml-lambda"
```

## Notes

- Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID in all commands
- Ensure you have sufficient IAM permissions to create roles and policies
- The permissions boundary is critical for security - do not skip it
- Test the role with a simple Lambda function before production use
