# 📧 Real Email Verification Setup Guide

## 🚀 Quick Setup for Real Email Sending

### 1. Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for free account
3. Verify your email

### 2. Create Email Service
1. Go to **Email Services** in dashboard
2. Click **Add New Service**
3. Choose **Gmail** (or your preferred provider)
4. Connect your email account
5. Note the **Service ID** (e.g., `service_hcltech`)

### 3. Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

```html
Subject: HCLTech AI IDP - Email Verification

Hello,

Your verification code for HCLTech AI IDP is:

{{verification_code}}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
HCLTech AI IDP Team
```

4. Template variables to include:
   - `{{to_email}}`
   - `{{verification_code}}`
   - `{{company_name}}`
   - `{{app_name}}`

5. Note the **Template ID** (e.g., `template_verification`)

### 4. Get Public Key
1. Go to **Account** → **General**
2. Copy your **Public Key**

### 5. Configure in Application

Add to your `.env` file:
```bash
REACT_APP_EMAILJS_SERVICE_ID=service_hcltech
REACT_APP_EMAILJS_TEMPLATE_ID=template_verification
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Or configure programmatically:
```javascript
import { realAuthService } from './services/realAuth';

realAuthService.configureEmail(
  'service_hcltech',
  'template_verification', 
  'your_public_key_here'
);
```

## 🎯 How It Works Now

### **Real Email Flow:**
1. **User signs up** → Enters email, password, role
2. **Real email sent** → EmailJS sends verification code to actual email
3. **User checks email** → Gets 6-digit code in inbox
4. **User verifies** → Enters code from email
5. **Account activated** → Can now sign in

### **Fallback for Demo:**
- If EmailJS not configured → Shows code in alert
- Perfect for development and testing
- No setup required for immediate use

## 📧 Email Template Example

```
Subject: HCLTech AI IDP - Verify Your Email

Hello,

Welcome to HCLTech AI IDP (Intelligent Document Processing System)!

Your verification code is: 123456

This code will expire in 10 minutes.

Please enter this code in the application to complete your registration.

If you didn't create an account, please ignore this email.

Best regards,
HCLTech AI IDP Team
```

## 🔧 Features

### **✅ Real Email Sending:**
- **Actual emails** - Sent to user's real email address
- **Professional templates** - Branded verification emails
- **Secure codes** - 6-digit random codes
- **Expiration** - 10-minute timeout for security
- **Resend functionality** - Get new codes if needed

### **✅ Fallback System:**
- **Demo mode** - Works without EmailJS setup
- **Alert display** - Shows code in popup for testing
- **Console logging** - Easy code copying for development
- **No blocking** - Never prevents development

### **✅ Production Ready:**
- **Real SMTP** - Uses actual email services
- **Rate limiting** - Built-in EmailJS limits
- **Error handling** - Graceful fallbacks
- **Security** - No sensitive data in frontend

## 🎉 Test It Now

1. **Without Setup** - Works immediately with alert fallback
2. **With EmailJS** - Follow setup guide for real emails
3. **Hybrid Mode** - Real emails in production, alerts in development

**Perfect for both development and production use!** 📧✨
