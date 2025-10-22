# 🔐 Real AWS Cognito Setup Guide

## 🚀 Step 1: Create Cognito User Pool (AWS Console)

### 1. Go to AWS Cognito Console
```
https://console.aws.amazon.com/cognito/
```

### 2. Create User Pool
- Click **"Create user pool"**
- **Step 1 - Configure sign-in experience:**
  - Provider types: `Cognito user pool`
  - Cognito user pool sign-in options: ✅ `Email`
  - Click **Next**

- **Step 2 - Configure security requirements:**
  - Password policy: `Cognito defaults` (or customize)
  - Multi-factor authentication: `No MFA` (for demo)
  - Click **Next**

- **Step 3 - Configure sign-up experience:**
  - Self-service sign-up: ✅ `Enable self-registration`
  - Attribute verification: ✅ `Send email verification messages`
  - Required attributes: ✅ `email`
  - Custom attributes: Add `role` (String, Mutable)
  - Click **Next**

- **Step 4 - Configure message delivery:**
  - Email provider: `Send email with Cognito`
  - Click **Next**

- **Step 5 - Integrate your app:**
  - User pool name: `HCLTech-AI-IDP-Users`
  - App client name: `HCLTech-AI-IDP-Client`
  - Client secret: `Don't generate a client secret`
  - Authentication flows: ✅ `ALLOW_USER_PASSWORD_AUTH`
  - Click **Next**

- **Step 6 - Review and create:**
  - Review settings and click **Create user pool**

## 🔧 Step 2: Configure Environment Variables

### Update `.env` file:
```bash
# Copy your User Pool ID and Client ID from AWS Console
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_AWS_REGION=us-east-1
```

### Find these values in AWS Console:
- **User Pool ID**: In User Pool overview page
- **Client ID**: In "App integration" tab → App clients

## 👥 Step 3: Create Test Users (AWS Console)

### Create Adjuster User:
1. Go to your User Pool → **Users** tab
2. Click **Create user**
3. Fill details:
   - **Username**: `adjuster@hcltech.com`
   - **Email**: `adjuster@hcltech.com`
   - **Temporary password**: `TempPass123!`
   - **Custom attributes**: `role = Adjuster`
4. Uncheck "Send an invitation to this new user"
5. Click **Create user**

### Create Uploader User:
1. Click **Create user** again
2. Fill details:
   - **Username**: `uploader@hcltech.com`
   - **Email**: `uploader@hcltech.com`
   - **Temporary password**: `TempPass123!`
   - **Custom attributes**: `role = Uploader`
3. Click **Create user**

## 🔑 Step 4: Set Permanent Passwords (AWS CLI)

```bash
# Set permanent password for adjuster
aws cognito-idp admin-set-user-password \
  --user-pool-id "us-east-1_XXXXXXXXX" \
  --username "adjuster@hcltech.com" \
  --password "AdjusterPass123!" \
  --permanent

# Set permanent password for uploader
aws cognito-idp admin-set-user-password \
  --user-pool-id "us-east-1_XXXXXXXXX" \
  --username "uploader@hcltech.com" \
  --password "UploaderPass123!" \
  --permanent
```

## 🎯 Step 5: Test Real Authentication

### Real Cognito Credentials:
- **Adjuster**: `adjuster@hcltech.com` / `AdjusterPass123!`
- **Uploader**: `uploader@hcltech.com` / `UploaderPass123!`

### Demo Mode (Fallback):
- Click **Adjuster** or **Uploader** demo buttons
- Works without Cognito configuration

## ✅ Verification

### Check Configuration Status:
- **Green badge**: "Cognito Configured" = Real Cognito working
- **Amber badge**: "Demo Mode" = Using fallback authentication

### Test Features:
1. **Real Sign In** - Use test credentials above
2. **Sign Up** - Create new accounts with email verification
3. **Role-based routing** - Adjuster → Dashboard, Uploader → Upload
4. **Session persistence** - Auto-login on page refresh
5. **Secure logout** - Proper token cleanup

## 🔒 Security Features

### Production Ready:
- ✅ **JWT Tokens** - Secure authentication
- ✅ **Email Verification** - Confirmed accounts only
- ✅ **Role-based Access** - Custom user attributes
- ✅ **Session Management** - Automatic token refresh
- ✅ **Secure Storage** - Encrypted local storage

### Development Friendly:
- ✅ **Demo Mode** - Works without setup
- ✅ **Configuration Detection** - Shows current status
- ✅ **Fallback Authentication** - Never blocks development
- ✅ **Error Handling** - Graceful degradation

## 🚀 Quick Start

1. **Immediate Use**: Click demo buttons (no setup required)
2. **Real Cognito**: Follow steps above for production authentication
3. **Hybrid Mode**: Demo + Real Cognito work together seamlessly

**Perfect for both development and production!** 🎉
