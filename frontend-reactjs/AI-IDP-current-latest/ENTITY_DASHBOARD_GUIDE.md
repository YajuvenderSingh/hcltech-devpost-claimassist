# Entity Extraction Dashboard Guide

## Overview

The Entity Extraction Dashboard provides real-time monitoring of document processing status and displays extracted entities from processed documents. It automatically polls the dashboard lambda until entity extraction is completed and allows users to view detailed entity information.

## Features

### 1. Real-time Status Monitoring
- Automatically calls `nmm_dashboard_lambda` every 5 seconds
- Displays document processing status for:
  - Classification Status
  - Extraction Status  
  - Entity Extraction Status
  - Confidence Score Status
- Stops polling when all documents reach "Completed" status for entity extraction

### 2. Interactive Document List
- Left panel shows all documents with their current status
- Each document displays:
  - Document ID (clickable)
  - GW Claim ID
  - Status indicators with color coding
  - Progress icons (spinning for "Processing", checkmark for "Completed", etc.)

### 3. Entity Viewer
- Right panel shows extracted entities for selected document
- Calls `nmm_fetch_extracted_entities` lambda with payload: `{"docid": "DOC436075"}`
- Displays:
  - Entity Type
  - Entity Value
  - Confidence Score (as percentage)
  - Page Number (if available)
  - Bounding Box coordinates (if available)

## Usage

### From Dashboard
1. Navigate to the main Dashboard
2. Click on "Entity Dashboard" in the Quick Actions section
3. The Entity Extraction Dashboard will open as a modal

### Direct Integration
```tsx
import EntityExtractionDashboard from './components/EntityExtractionDashboard';

// In your component
const [showEntityDashboard, setShowEntityDashboard] = useState(false);

// Render the dashboard
{showEntityDashboard && (
  <EntityExtractionDashboard onClose={() => setShowEntityDashboard(false)} />
)}
```

## Lambda Functions Required

### 1. Dashboard Lambda (`nmm_dashboard_lambda`)
**Purpose**: Returns current status of all documents in processing

**Expected Response Format**:
```json
{
  "documents": [
    {
      "docid": "DOC436075",
      "classification_status": "Completed",
      "extraction_status": "Completed", 
      "entity_extraction_status": "Processing",
      "confidence_score_status": "To Be Processed",
      "gw_claim_id": "CLM-2024-001",
      "indexid": "IDX123"
    }
  ]
}
```

### 2. Entity Extraction Lambda (`nmm_fetch_extracted_entities`)
**Purpose**: Returns extracted entities for a specific document

**Input Payload**:
```json
{
  "docid": "DOC436075"
}
```

**Expected Response Format**:
```json
{
  "entities": [
    {
      "entity_type": "PERSON",
      "entity_value": "John Doe",
      "confidence": 0.95,
      "page_number": 1,
      "bounding_box": {
        "left": 100,
        "top": 200,
        "width": 150,
        "height": 25
      }
    }
  ]
}
```

## Status Values

### Classification Status
- `"To Be Processed"` - Yellow indicator
- `"Processing"` - Blue indicator with spinning icon
- `"Completed"` - Green indicator with checkmark
- `"Failed"` - Red indicator with warning icon

### Extraction Status
- Same values and indicators as Classification Status

### Entity Extraction Status  
- Same values and indicators as Classification Status
- **Important**: Polling stops when ALL documents reach `"Completed"`

### Confidence Score Status
- Same values and indicators as Classification Status

## Polling Behavior

1. **Auto-start**: Polling begins immediately when dashboard opens
2. **Interval**: Polls every 5 seconds
3. **Stop Condition**: When all documents have `entity_extraction_status: "Completed"`
4. **Manual Refresh**: Users can click "Refresh" button to restart polling
5. **Error Handling**: Continues polling even if individual requests fail

## UI Components

### Left Panel - Document List
- Scrollable list of all documents
- Click on any document ID to view its entities
- Selected document is highlighted in blue
- Status indicators use consistent color coding

### Right Panel - Entity Details
- Shows "Select a Document" message when no document is selected
- Loading spinner while fetching entities
- Scrollable list of extracted entities with:
  - Entity type and value
  - Confidence percentage with bar chart icon
  - Page number (if available)
  - Bounding box coordinates (if available)

### Header Controls
- Auto-refresh indicator (spinning icon when polling active)
- Manual refresh button
- Close button (X) to exit dashboard

## Error Handling

- Network errors are logged to console
- Error messages displayed in red banner
- Polling continues despite individual request failures
- Empty states handled gracefully with appropriate messages

## Responsive Design

- Full-screen modal overlay
- Two-panel layout (50/50 split)
- Mobile-friendly with proper spacing
- Smooth animations using Framer Motion

## Integration Notes

1. Ensure AWS credentials are properly configured
2. Lambda functions must be deployed and accessible
3. Response formats must match expected structure
4. Consider rate limiting for high-frequency polling
5. Test with various document states and error conditions
