# Role Simplification: Uploader and Adjuster Only

## Changes Made

### 1. **Updated User Interface (App.tsx)**
```typescript
// Before: 'Document Processor' | 'Document Reviewer' | 'Adjuster'
// After: 'Uploader' | 'Adjuster'
export interface User {
  role: 'Uploader' | 'Adjuster';
}
```

### 2. **Updated Authentication Service (authService.ts)**
```typescript
// AuthUser and SignUpData interfaces now use:
role: "Uploader" | "Adjuster"

// Role mapping logic:
// - 'Adjuster' or 'Document Reviewer' → 'Adjuster'
// - Everything else → 'Uploader'
```

### 3. **Updated Login Component (Login.tsx)**
- Signup form now shows only 2 role options:
  - **Uploader**: For document upload and processing
  - **Adjuster**: For reviewing and decision making

### 4. **Updated Application Flow (App.tsx)**
- **Uploader**: Starts at 'upload' step
- **Adjuster**: Starts at 'dashboard' step (can review)
- Dashboard component receives correct role mapping

## Role Responsibilities

### **Uploader**
- Upload documents
- Process through extraction pipeline
- Basic document management

### **Adjuster** (Reviewer)
- Access dashboard with claims overview
- Review low confidence claims
- Make decisions on claims
- Full review capabilities

## Backward Compatibility

The system maintains backward compatibility:
- Existing 'Document Reviewer' users → mapped to 'Adjuster'
- Existing 'Document Processor' users → mapped to 'Uploader'
- Existing 'Adjuster' users → remain 'Adjuster'

## Build Status
✅ Application builds successfully
✅ All TypeScript types updated
✅ No breaking changes for existing users

## Testing
1. Create new accounts with 'Uploader' or 'Adjuster' roles
2. Verify Uploaders start at upload page
3. Verify Adjusters start at dashboard with review capabilities
4. Test existing accounts still work with role mapping
