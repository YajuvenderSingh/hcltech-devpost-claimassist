# NMM Flow - Complete User Guide

## 🔐 Login Instructions

### For NMM Uploader:
- **Username**: `uploader` (or any username without "adjuster")
- **Password**: `password` (any password)
- **Flow**: Login → Document Upload → Content Extraction → Verification → Complete

### For NMM Claim Adjuster:
- **Username**: `adjuster` (or any username containing "adjuster" or "adj")
- **Password**: `password` (any password)  
- **Flow**: Login → Dashboard → Claim Selection → Matching → Upload → Extract → Verify → Decision Making → Complete

## 📋 Complete Application Flow

### 1. **Login Screen**
- Beautiful gradient background with mountain landscape
- Role-based authentication
- Auto-detects role based on username

### 2. **Dashboard (Adjuster Only)**
- Shows low confidence claims requiring review
- Table with Claim ID, Type, Summary, Status
- "Get Matching Claims" button for each claim
- "New Claim Processing" button

### 3. **Claim Matching (Adjuster Only)**
- Shows matching GW (Guidewire) claims
- Select appropriate claim to map
- "Map to this GW Claim" button

### 4. **Document Upload**
- Drag & drop interface
- Multiple file support (PDF, DOC, DOCX, JPG, PNG)
- Real-time upload progress
- Automatic document classification
- "Update DMS System" button

### 5. **Content Extraction**
- Document preview panel
- AI-powered data extraction
- Confidence scoring with color coding
- Manual editing capabilities
- "Save Modifications" button
- "Update Guidewire System" button

### 6. **Verification**
- Claim summarization
- Database verification results
- Success/Warning/Error categorization
- Statistics dashboard
- Verification against policy dates

### 7. **Decision Making (Adjuster Only)**
- Claim summary input
- Three decision options:
  - **Approve** (Green)
  - **Reject** (Gray)
  - **Mark as Low Confidence** (Orange)
- Auto-generated email content based on decision
- "Submit Decision" button

## 🎨 UI Features

### Design Elements:
- **Color Scheme**: Blue (#3B82F6), White (#FFFFFF), Gray (#6B7280)
- **Typography**: Inter font family
- **Animations**: Smooth Framer Motion transitions
- **Icons**: Lucide React icon set
- **Responsive**: Mobile-friendly design

### Interactive Elements:
- Hover effects on buttons and cards
- Loading states with spinners
- Progress tracking breadcrumbs
- Real-time notifications (toast messages)
- Drag & drop file upload
- Confidence score indicators

## 🔄 User Workflows

### NMM Uploader Workflow:
```
Login → Upload Documents → Extract Content → Verify → Complete
```

### NMM Claim Adjuster Workflow:
```
Login → Dashboard → Select Claim → Match GW Claim → Upload → Extract → Verify → Make Decision → Complete
```

## 🚀 Key Features

1. **Role-Based Access Control**
   - Different starting points based on user role
   - Tailored workflows for each user type

2. **Advanced Document Processing**
   - AI-powered content extraction
   - Confidence scoring
   - Manual review and editing

3. **Comprehensive Verification**
   - Database cross-referencing
   - Policy validation
   - Detailed reporting

4. **Decision Support System**
   - Automated email generation
   - Multiple decision options
   - Audit trail

5. **Professional UI/UX**
   - Modern design patterns
   - Intuitive navigation
   - Real-time feedback

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen resolutions

## 🔧 Technical Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Hooks
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 🎯 Demo Instructions

1. **Start the application**: `npm start`
2. **Access**: `http://localhost:3000`
3. **Login as Uploader**: username: `uploader`, password: `password`
4. **Login as Adjuster**: username: `adjuster`, password: `password`
5. **Follow the workflow** based on your role

The application provides a complete, professional claims processing experience with modern UI/UX and comprehensive functionality!
