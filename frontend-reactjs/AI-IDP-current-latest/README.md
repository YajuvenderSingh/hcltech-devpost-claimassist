# HCLTech AI IDP - Intelligent Document Processing System

A modern, responsive web application for intelligent document processing with AI-powered document extraction and verification.

## Features

### 🔐 Authentication
- Role-based access control (Document Processor / Document Reviewer)
- Secure login with JWT tokens
- User session management

### 📄 Document Management
- Drag & drop file upload
- Multiple file format support (PDF, DOC, DOCX, JPG, PNG)
- Real-time upload progress
- Document classification (Medical, Invoice, X-ray)
- DMS (Document Management System) integration

### 🤖 AI-Powered Extraction
- Automated content extraction from documents
- Confidence scoring for extracted data
- Manual review and editing capabilities
- Real-time processing status

### ✅ Verification & Validation
- Database cross-referencing
- Policy validation
- Claim summarization
- Comprehensive verification reports

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Real-time notifications
- Progress tracking
- Professional color scheme (Blue, White, Grey)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Build Tool**: Create React App

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd nmm-flow-complete
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update environment variables in \`.env\`

5. Start the development server:
\`\`\`bash
npm start
\`\`\`

The application will open at \`http://localhost:3000\`

## Demo Credentials

- **Processor Role**: username: \`processor\`, password: any
- **Reviewer Role**: username: \`reviewer\`, password: any

## API Integration

The application is designed to integrate with AWS Lambda functions through API Gateway. Update the \`REACT_APP_API_URL\` in your \`.env\` file to point to your API endpoints.

### Expected API Endpoints:

- \`POST /auth/login\` - User authentication
- \`POST /documents/upload\` - Document upload
- \`POST /documents/{id}/classify\` - Document classification
- \`POST /documents/{id}/extract\` - Content extraction
- \`POST /dms/update\` - DMS system update
- \`POST /claims/verify\` - Claim verification
- \`POST /claims/summarize\` - Claim summarization

## Deployment

### Build for Production
\`\`\`bash
npm run build
\`\`\`

### Deploy to AWS S3 + CloudFront
1. Build the application
2. Upload \`build/\` folder contents to S3 bucket
3. Configure CloudFront distribution
4. Update API Gateway CORS settings

## Project Structure

\`\`\`
src/
├── components/          # React components
│   ├── Login.tsx       # Authentication component
│   ├── Layout.tsx      # Main layout with navigation
│   ├── DocumentUpload.tsx    # File upload interface
│   ├── ContentExtraction.tsx # AI extraction interface
│   └── Verification.tsx      # Verification results
├── services/           # API integration
│   └── api.ts         # HTTP client and API calls
├── types/             # TypeScript type definitions
└── App.tsx           # Main application component
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
