# Multiple Document Support - Test Guide

## Changes Made to ContentExtraction Component

### 1. **State Management Updates**
- Changed `dashboardData` from single object to `{[key: string]: any}` to store data for multiple documents
- Added `currentDocIndex` to track which document is currently being viewed

### 2. **Dashboard Data Loading**
- Modified `loadDashboardData()` to iterate through all uploaded files
- Each file gets its own docId and dashboard status
- Polling continues until all documents are processed

### 3. **Document Navigation**
- Updated `handleDocIdClick()` to accept both docId and fileIndex parameters
- Added navigation controls (Prev/Next buttons) when viewing individual documents
- Document counter shows "Document X of Y" in the header

### 4. **Table Display**
- Dashboard table now shows all uploaded documents in separate rows
- Added "File Name" column to identify each document
- Each document has its own processing status indicators

## Testing Instructions

### 1. **Upload Multiple Documents**
```
1. Go to Document Upload step
2. Upload 2-3 different files (PDF, DOC, images)
3. Proceed to Content Extraction step
```

### 2. **Verify Dashboard Display**
```
✅ Table shows all uploaded documents
✅ Each document has its own row with status
✅ File names are displayed correctly
✅ Document count appears in header
```

### 3. **Test Document Navigation**
```
✅ Click on any document ID to view details
✅ Use Prev/Next buttons to navigate between documents
✅ Document counter updates correctly
✅ Each document shows its own extracted entities
```

### 4. **Verify Individual Processing**
```
✅ Each document processes independently
✅ Status indicators work per document
✅ Entity extraction works for each document
✅ Save/Guidwire functions work per document
```

## Key Features Added

- **Multi-document dashboard table**
- **Document navigation controls**
- **Individual document processing status**
- **Per-document entity extraction**
- **File name identification**
- **Document counter in UI**

## Benefits

1. **Batch Processing**: Handle multiple documents simultaneously
2. **Individual Tracking**: Monitor each document's processing status
3. **Easy Navigation**: Switch between documents without going back
4. **Clear Identification**: File names help identify documents
5. **Scalable**: Works with any number of uploaded documents
