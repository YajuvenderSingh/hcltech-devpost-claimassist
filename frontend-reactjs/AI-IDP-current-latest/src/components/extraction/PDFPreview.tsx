import React, { useState, useEffect } from 'react';
import { invokeLambda } from '../../services/awsService';
import Loader from '../ui/Loader';

// Global cache to persist across component re-renders
const urlCache: {[key: string]: string} = {};

interface PDFPreviewProps {
  selectedFile: any;
  files: any[];
  onPreview: () => void;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  selectedFile,
  files,
  onPreview
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    console.log('🔍 PDFPreview selectedFile:', selectedFile);
    
    // Check cache first if we have an s3Key
    if (selectedFile?.s3Key && urlCache[selectedFile.s3Key]) {
      console.log('✅ Using cached URL for:', selectedFile.s3Key);
      setPreviewUrl(urlCache[selectedFile.s3Key]);
      return;
    }
    
    const loadPreview = async () => {
      // If URL is already provided, use it directly
      if (selectedFile?.url) {
        console.log('✅ Using existing URL from selectedFile:', selectedFile.url);
        setPreviewUrl(selectedFile.url);
        setLoading(false);
        return;
      }
      
      // Extract s3Key from dashboard data
      let s3Key = null;
      
      if (selectedFile?.s3Key) {
        s3Key = selectedFile.s3Key;
      } else if (selectedFile?.dashboardData) {
        try {
          const dashboardResponse = typeof selectedFile.dashboardData === 'string' 
            ? JSON.parse(selectedFile.dashboardData) 
            : selectedFile.dashboardData;
          
          if (dashboardResponse.s3filename && dashboardResponse.s3filename.length > 0) {
            s3Key = dashboardResponse.s3filename[0];
          }
        } catch (error) {
          console.error('❌ Error parsing dashboard data:', error);
        }
      }
      
      if (!s3Key) {
        console.log('❌ No S3 key found');
        return;
      }

      console.log('🔗 Using S3 key for presigned URL:', s3Key);
      setLoading(true);
      
      try {
        const payload = {
          tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
          s3Key: s3Key
        };
        
        console.log('📤 Presigned URL payload:', payload);
        
        const response = await invokeLambda('claimassistv2-presignedurl-lambda', payload);
        console.log('📥 Presigned URL response:', response);
        
        if (response && response.statusCode === 200) {
          const responseBody = typeof response.body === 'string' 
            ? JSON.parse(response.body) 
            : response.body;
          
          // The lambda returns uploadUrl, not viewUrl
          const previewUrl = responseBody.viewUrl || responseBody.uploadUrl;
          
          if (previewUrl) {
            console.log('✅ Setting preview URL:', previewUrl);
            setPreviewUrl(previewUrl);
          } else {
            console.error('❌ No viewUrl or uploadUrl in presigned response');
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
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm">No document selected</p>
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
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm">Preview not available</p>
        </div>
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-4">Document Preview</p>
          <p className="text-sm text-gray-600 mb-6">Preview blocked by browser. Click to open document.</p>
          <button
            onClick={() => window.open(previewUrl, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Open Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-100">
        <iframe
          src={`${previewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0&zoom=125`}
          className="w-full h-full border-0"
          title="PDF Preview"
          style={{ minHeight: '100%' }}
          onError={() => setIframeError(true)}
          onLoad={() => setIframeError(false)}
        />
      </div>
    </div>
  );
};

export default PDFPreview;
