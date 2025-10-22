import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface SimpleDocumentPreviewProps {
  document: {
    docId: string;
    filename: string;
    s3Key: string;
    classification: string;
  };
}

const SimpleDocumentPreview: React.FC<SimpleDocumentPreviewProps> = ({ document }) => {
  const handleDownload = () => {
    // Simple download approach - open in new tab
    const downloadUrl = `/api/download/${document.docId}`;
    window.open(downloadUrl, '_blank');
  };

  const handleViewInNewTab = () => {
    // Open document in new tab for viewing
    const viewUrl = `/api/view/${document.docId}`;
    window.open(viewUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <FileText className="w-8 h-8 text-red-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {document.filename}
          </h3>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Document ID:</span> {document.docId}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Classification:</span> {document.classification}
            </p>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleViewInNewTab}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Document
            </button>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
      
      {/* Fallback preview area */}
      <div className="mt-6 bg-gray-50 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Document Preview</p>
        <p className="text-sm text-gray-500">
          Click "View Document" to open in a new tab or download to view locally
        </p>
      </div>
    </div>
  );
};

export default SimpleDocumentPreview;
