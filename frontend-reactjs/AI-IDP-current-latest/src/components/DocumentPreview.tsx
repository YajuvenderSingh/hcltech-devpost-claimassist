import React, { useState, useEffect } from 'react';
import { invokeLambda } from '../services/awsService';
import { RefreshCw, Eye } from 'lucide-react';

interface DocumentPreviewProps {
  dashboardResponse: any;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ dashboardResponse }) => {
  const [s3Key, setS3Key] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dashboardResponse) {
      try {
        const responseBody = typeof dashboardResponse === 'string' 
          ? JSON.parse(dashboardResponse) 
          : dashboardResponse;
        
        // Extract s3filename from dashboard response
        if (responseBody.s3filename && responseBody.s3filename.length > 0) {
          setS3Key(responseBody.s3filename[0]);
        }
      } catch (error) {
        console.error('Error parsing dashboard response:', error);
      }
    }
  }, [dashboardResponse]);

  const handlePreview = async () => {
    if (!s3Key) return;
    
    setLoading(true);
    try {
      const payload = {
        tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
        s3Key: s3Key
      };
      
      console.log('Presigned URL payload:', payload);
      
      const response = await invokeLambda('presigned_url_lambda', payload);
      
      if (response && response.statusCode === 200) {
        const responseBody = typeof response.body === 'string' 
          ? JSON.parse(response.body) 
          : response.body;
        
        if (responseBody.viewUrl) {
          setPreviewUrl(responseBody.viewUrl);
        }
      }
    } catch (error) {
      console.error('Error getting presigned URL:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-bold mb-4">Document Preview</h2>
        
        {s3Key && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <label className="text-sm font-medium text-gray-700">S3 Key:</label>
            <div className="text-sm font-mono break-all">{s3Key}</div>
          </div>
        )}
        
        <button
          onClick={handlePreview}
          disabled={loading || !s3Key}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview Document
            </>
          )}
        </button>
        
        {previewUrl && (
          <div className="mt-6">
            <img 
              src={previewUrl} 
              alt="Document preview"
              className="max-w-full h-auto border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;
