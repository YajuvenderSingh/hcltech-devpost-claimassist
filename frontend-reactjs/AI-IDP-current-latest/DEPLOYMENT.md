# NMM-FLOW Deployment Guide

## 🚀 Quick Start

### Development Environment
```bash
# Install dependencies
npm install

# Start development server (Cloud9 optimized)
npm run dev

# Access application
http://localhost:8080
```

### Production Build
```bash
# Create production build
npm run build

# Serve static files
npx serve -s build -l 8080
```

## 🔧 Architecture Validation

### Run Architecture Alignment Check
```bash
npm run align
```

This validates:
- Component structure and naming conventions
- Service layer implementation
- Dependency management
- HCLTech branding configuration
- TypeScript usage patterns

## 🌐 Cloud9 Environment Setup

### Environment Variables
Create `.env` file:
```
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com
REACT_APP_ENV=development
BROWSER=none
HOST=0.0.0.0
PORT=8080
```

### Preview Configuration
- **Preview URL**: `https://your-workspace-id.vfs.cloud9.region.amazonaws.com`
- **Port**: 8080 (configured for Cloud9 preview)
- **Host**: 0.0.0.0 (allows external access)

## 📦 AWS Deployment Options

### Option 1: S3 + CloudFront
```bash
# Build for production
npm run build

# Deploy to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 2: Amplify Hosting
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 3: Elastic Beanstalk
```bash
# Create deployment package
npm run build
zip -r nmm-flow-app.zip build/

# Deploy via EB CLI or Console
eb init
eb create
eb deploy
```

## 🔐 Security Configuration

### Environment Variables (Production)
```
REACT_APP_API_URL=https://prod-api-gateway-url.amazonaws.com
REACT_APP_ENV=production
HTTPS=true
```

### Content Security Policy
Add to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;">
```

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# Type checking
npm run type-check

# Lint code
npm run lint
```

### Lighthouse Audit
- Performance: Target 90+
- Accessibility: Target 95+
- Best Practices: Target 90+
- SEO: Target 85+

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy NMM-FLOW
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run align
      - run: npm run build
      - run: aws s3 sync build/ s3://${{ secrets.S3_BUCKET }}
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test
```

### E2E Testing
```bash
# Install Cypress
npm install --save-dev cypress

# Run tests
npx cypress open
```

## 📱 Mobile Optimization

### PWA Configuration
Add to `public/manifest.json`:
```json
{
  "name": "NMM Flow",
  "short_name": "NMM-FLOW",
  "theme_color": "#007bff",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

## 🔍 Monitoring & Analytics

### Error Tracking
```bash
# Install Sentry
npm install @sentry/react

# Configure in src/index.tsx
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "YOUR_DSN" });
```

### Performance Monitoring
```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 🔧 Troubleshooting

### Common Issues

1. **Port 3000 in use**
   ```bash
   npm run dev  # Uses port 8080
   ```

2. **Cloud9 preview not working**
   - Ensure HOST=0.0.0.0 in environment
   - Check security group allows port 8080

3. **Build fails**
   ```bash
   npm run type-check  # Check TypeScript errors
   npm run align       # Validate architecture
   ```

4. **API connection issues**
   - Verify REACT_APP_API_URL in .env
   - Check CORS configuration on API Gateway

### Debug Commands
```bash
# Check environment
echo $REACT_APP_API_URL

# Verify dependencies
npm ls

# Clear cache
npm start -- --reset-cache
```

## 📋 Deployment Checklist

- [ ] Architecture alignment check passes
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] HTTPS enabled (production)
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] Error tracking enabled
- [ ] Monitoring dashboard setup

## 🎯 Production Readiness

### Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Security Requirements
- HTTPS enforcement
- Content Security Policy
- Input validation
- Authentication tokens secured
- API rate limiting

### Scalability Considerations
- CDN distribution
- Caching strategies
- Load balancing
- Auto-scaling groups
- Database optimization

---

This deployment guide ensures the NMM-FLOW application is production-ready with proper architecture alignment, security, and performance optimization.
