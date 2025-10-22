import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { invokeLambda } from '../../services/awsService';
import Loader from '../ui/Loader';

// Global cache to persist across component re-renders
const urlCache: {[key: string]: string} = {};

interface AdjusterPreviewProps {
  selectedFile: {
    fileName?: string;
    s3Key?: string;
    error?: string;
    dashboardData?: any;
    docId?: string;
  } | null;
}

const AdjusterPreview: React.FC<AdjusterPreviewProps> = ({ selectedFile }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      if (!selectedFile?.s3Key) {
        console.log('❌ No S3 key found in selectedFile, calling dashboard lambda');
        
        // Get s3Key from dashboard lambda first
        if (!selectedFile?.docId) {
          console.log('❌ No docId found in selectedFile');
          return;
        }

        // Check cache first
        const cacheKey = selectedFile.docId;
        if (urlCache[cacheKey]) {
          console.log('✅ Using cached URL for:', cacheKey);
          setPreviewUrl(urlCache[cacheKey]);
          return;
        }
        
        try {
          const dashboardPayload = { docid: selectedFile.docId };
          console.log('📤 Dashboard payload:', dashboardPayload);
          
          const dashboardResponse = await invokeLambda('nmm_dashboard_lambda', dashboardPayload);
          console.log('📥 Dashboard response:', dashboardResponse);
          
          if (dashboardResponse && dashboardResponse.statusCode === 200) {
            const responseBody = typeof dashboardResponse.body === 'string' 
              ? JSON.parse(dashboardResponse.body) 
              : dashboardResponse.body;
            
            if (responseBody.s3filename && responseBody.s3filename.length > 0) {
              const s3Key = responseBody.s3filename[0];
              console.log('🔑 Extracted s3Key from dashboard:', s3Key);
              
              // Now get presigned URL
              const presignedPayload = {
                tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
                s3Key: s3Key
              };
              
              console.log('📤 Presigned URL payload:', presignedPayload);
              
              const presignedResponse = await invokeLambda('claimassistv2-presignedurl-lambda', presignedPayload);
              console.log('📥 Presigned URL response:', presignedResponse);
              
              if (presignedResponse && presignedResponse.statusCode === 200) {
                const presignedBody = typeof presignedResponse.body === 'string' 
                  ? JSON.parse(presignedResponse.body) 
                  : presignedResponse.body;
                
                const previewUrl = presignedBody.viewUrl || presignedBody.uploadUrl;
                
                if (previewUrl) {
                  console.log('✅ Setting preview URL:', previewUrl);
                  setPreviewUrl(previewUrl);
                  // Cache the URL
                  urlCache[cacheKey] = previewUrl;
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error getting preview URL:', error);
        }
        
        setLoading(false);
        return;
      }

      // Check cache for existing s3Key
      const cacheKey = selectedFile.s3Key;
      if (urlCache[cacheKey]) {
        console.log('✅ Using cached URL for s3Key:', cacheKey);
        setPreviewUrl(urlCache[cacheKey]);
        return;
      }

      console.log('🔗 Using existing S3 key:', selectedFile.s3Key);
      setLoading(true);
      
      try {
        // Use presigned URL lambda with existing s3Key
        const presignedPayload = {
          tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
          s3Key: selectedFile.s3Key
        };
        
        console.log('📤 Presigned URL payload:', presignedPayload);
        
        const response = await invokeLambda('claimassistv2-presignedurl-lambda', presignedPayload);
        console.log('📥 Presigned URL response:', response);
        
        if (response && response.statusCode === 200) {
          const responseBody = typeof response.body === 'string' 
            ? JSON.parse(response.body) 
            : response.body;
          
          const previewUrl = responseBody.viewUrl || responseBody.uploadUrl;
          
          if (previewUrl && selectedFile?.s3Key) {
            console.log('✅ Setting preview URL:', previewUrl);
            setPreviewUrl(previewUrl);
            // Cache the URL
            urlCache[selectedFile.s3Key] = previewUrl;
          }
        }
      } catch (err: any) {
        console.error('❌ Failed to load preview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium">No document selected</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Loader text="Loading preview..." />
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium">Preview not available</p>
        </div>
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{selectedFile.fileName}</h3>
              <p className="text-xs text-gray-500">Document Preview</p>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-4">Preview Blocked</p>
            <p className="text-sm text-gray-600 mb-6">Browser blocked the preview. Click to open document.</p>
            <button
              onClick={() => window.open(previewUrl, '_blank')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Open Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* PDF Viewer */}
      <div className="flex-1 bg-white">
        <iframe
          src={`${previewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0&zoom=125`}
          className="w-full h-full border-0"
          style={{ minHeight: '100%' }}
          onError={() => setIframeError(true)}
          onLoad={() => setIframeError(false)}
        />
      </div>
    </div>
  );
};

export default AdjusterPreview;
