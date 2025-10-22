# 📧 AWS SES Real Email Setup

## 🚀 AWS SES Configuration for Real Email Delivery

### 1. Verify Your Email Address in SES

```bash
# Verify your email address (replace with your email)
aws ses verify-email-identity --email-address your-email@domain.com --region us-east-1

# Check verification status
aws ses get-identity-verification-attributes --identities your-email@domain.com --region us-east-1
```

### 2. Create IAM User for SES Access

```bash
# Create IAM policy for SES sending
aws iam create-policy --policy-name SESEmailSendingPolicy --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}'

# Create IAM user
aws iam create-user --user-name ses-email-sender

# Attach policy to user
aws iam attach-user-policy --user-name ses-email-sender --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/SESEmailSendingPolicy

# Create access keys
aws iam create-access-key --user-name ses-email-sender
```

### 3. Update Environment Variables

Add to `.env` file:
```bash
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### 4. Test Email Sending

The system will now send real emails via AWS SES to any verified email address.

## 📧 Email Features

### ✅ Real AWS SES Integration:
- **Professional HTML emails** - Branded HCLTech templates
- **Real email delivery** - Sent via AWS infrastructure
- **No alert fallbacks** - Only real emails
- **Delivery tracking** - AWS SES message IDs
- **Spam compliance** - Proper email headers

### 📱 Email Template:
- **Subject**: HCLTech AI IDP - Email Verification Code
- **HTML Format**: Professional branded design
- **Text Format**: Plain text fallback
- **6-digit code**: Prominently displayed
- **Expiry warning**: 10-minute timeout notice

### 🔐 Security:
- **IAM permissions** - Least privilege access
- **Encrypted delivery** - AWS SES security
- **Code expiration** - 10-minute timeout
- **Single use codes** - Each code is unique

## 🎯 How to Test:

1. **Verify your email** in AWS SES console
2. **Update .env** with your AWS credentials
3. **Sign up** with your verified email
4. **Check your inbox** for verification code
5. **No alerts** - only real emails!

## 📧 Email Content Example:

```
Subject: HCLTech AI IDP - Email Verification Code

[Professional HTML email with:]
- HCLTech AI IDP branding
- Large 6-digit verification code
- 10-minute expiry warning
- Professional styling
- Plain text fallback
```

**Now you'll receive real verification codes in your email inbox via AWS SES!** 📧✨
