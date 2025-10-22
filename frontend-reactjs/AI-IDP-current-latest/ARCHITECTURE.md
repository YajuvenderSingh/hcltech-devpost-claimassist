# NMM-FLOW Technical Architecture

## 🏗️ System Architecture Overview

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 + TypeScript                    │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                           │
│  ├── Login.tsx (Authentication)                            │
│  ├── Layout.tsx (Navigation & Shell)                       │
│  ├── Dashboard.tsx (Adjuster Entry Point)                  │
│  ├── DocumentUpload.tsx (File Management)                  │
│  ├── ContentExtraction.tsx (AI Processing)                 │
│  ├── Verification.tsx (Data Validation)                    │
│  ├── ClaimMatching.tsx (Guidewire Integration)             │
│  └── DecisionMaking.tsx (Workflow Completion)              │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  └── api.ts (AWS Lambda Integration)                       │
├─────────────────────────────────────────────────────────────┤
│  Styling & UI Framework                                     │
│  ├── Tailwind CSS (HCLTech Branding)                      │
│  ├── Framer Motion (Animations)                           │
│  └── Lucide React (Icons)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Backend Integration Points
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │───▶│  API Gateway    │───▶│  AWS Lambda     │
│                 │    │                 │    │                 │
│ - Authentication│    │ - /auth/login   │    │ - Auth Service  │
│ - File Upload   │    │ - /documents/*  │    │ - Document Proc │
│ - Data Extract  │    │ - /claims/*     │    │ - AI/ML Service │
│ - Verification  │    │ - /dms/*        │    │ - DMS Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  External APIs  │
                       │                 │
                       │ - Guidewire     │
                       │ - DMS System    │
                       │ - Email Service │
                       └─────────────────┘
```

## 🔧 Technology Stack

### Core Technologies
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework with HCLTech branding
- **Framer Motion**: Smooth animations and transitions
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API communication

### UI/UX Libraries
- **React Dropzone**: Drag-and-drop file upload
- **React Hot Toast**: User notifications
- **Lucide React**: Modern icon library
- **Open Sans**: HCLTech official font family

### Development Tools
- **Create React App**: Build toolchain
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

## 📁 Project Structure

```
nmm-flow-complete/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Login.tsx           # Authentication component
│   │   ├── Layout.tsx          # App shell and navigation
│   │   ├── Dashboard.tsx       # Adjuster dashboard
│   │   ├── DocumentUpload.tsx  # File upload interface
│   │   ├── ContentExtraction.tsx # AI data extraction
│   │   ├── Verification.tsx    # Data validation
│   │   ├── ClaimMatching.tsx   # Guidewire integration
│   │   └── DecisionMaking.tsx  # Workflow completion
│   ├── services/
│   │   └── api.ts             # API service layer
│   ├── App.tsx                # Main application component
│   ├── index.tsx              # Application entry point
│   ├── index.css              # Global styles
│   └── react-app-env.d.ts     # TypeScript declarations
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── postcss.config.js         # PostCSS configuration
├── README.md                 # Project documentation
├── FLOW_GUIDE.md            # User workflow guide
└── ARCHITECTURE.md          # This file
```

## 🔄 Data Flow Architecture

### Authentication Flow
```
User Input → Login Component → API Service → AWS Lambda → JWT Token → App State
```

### Document Processing Flow
```
File Upload → DocumentUpload → API Gateway → Lambda → S3 Storage → DMS Update
     ↓
Content Extraction → AI/ML Service → Confidence Scoring → Manual Review
     ↓
Verification → Database Lookup → Policy Validation → Status Update
```

### Role-Based Workflow
```
Login → Role Detection → Route Assignment
   ├── NMM Uploader: Upload → Extract → Verify → Complete
   └── NMM Adjuster: Dashboard → Match → Upload → Extract → Verify → Decision
```

## 🎨 Design System

### HCLTech Branding
- **Primary Color**: #007bff (HCL Blue)
- **Typography**: Open Sans font family
- **Color Palette**: Bootstrap-based color system
- **Spacing**: Tailwind's 4px base unit system
- **Animations**: Subtle transitions with Framer Motion

### Component Design Patterns
- **Consistent Layout**: Header, main content, navigation
- **Card-based UI**: Information grouped in cards
- **Progressive Disclosure**: Step-by-step workflow
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

## 🔐 Security Architecture

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Secure API endpoints
- Session management

### Data Security
- File upload validation
- Input sanitization
- HTTPS communication
- Environment variable configuration

## 🚀 Performance Optimizations

### Frontend Optimizations
- React 18 concurrent features
- Component lazy loading
- Optimized bundle size
- Efficient re-rendering with React hooks

### API Optimizations
- Axios interceptors for error handling
- Request/response caching
- Optimistic UI updates
- Loading states management

## 🔧 Configuration Management

### Environment Variables
```
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com
REACT_APP_ENV=production
```

### Build Configuration
- TypeScript strict mode
- Tailwind CSS purging
- PostCSS optimization
- Production build optimization

## 📊 Monitoring & Analytics

### Error Handling
- Comprehensive error boundaries
- API error interceptors
- User-friendly error messages
- Toast notifications for feedback

### Performance Monitoring
- React DevTools integration
- Bundle analyzer support
- Lighthouse performance metrics
- Core Web Vitals tracking

## 🔄 Deployment Architecture

### Development Environment
```
Local Development → npm start → localhost:3000
```

### Production Deployment
```
Build Process → npm run build → Static Assets → AWS S3 → CloudFront CDN
```

### CI/CD Pipeline
```
Code Commit → Build → Test → Deploy → Monitor
```

## 🧪 Testing Strategy

### Unit Testing
- React Testing Library
- Jest test runner
- Component testing
- Service layer testing

### Integration Testing
- API integration tests
- End-to-end workflow testing
- Cross-browser compatibility
- Mobile responsiveness testing

## 📈 Scalability Considerations

### Frontend Scalability
- Component modularity
- State management optimization
- Code splitting strategies
- Progressive web app features

### Backend Integration
- API rate limiting
- Caching strategies
- Load balancing
- Auto-scaling capabilities

## 🔮 Future Enhancements

### Planned Features
- Real-time notifications
- Advanced analytics dashboard
- Multi-language support
- Offline capability
- Enhanced accessibility features

### Technical Improvements
- GraphQL integration
- State management library (Redux/Zustand)
- Advanced caching strategies
- Micro-frontend architecture
- Progressive Web App (PWA) features

---

This architecture document provides a comprehensive overview of the NMM-FLOW system's technical implementation, ensuring maintainability, scalability, and alignment with modern web development best practices.
