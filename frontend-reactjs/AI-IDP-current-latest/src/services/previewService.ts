import { invokeLambda } from './awsService';

const LAMBDA_FUNCTION_NAME = 'claimassistv2-presignedurl-lambda'; // Same as upload

export interface PreviewRequest {
  s3Key: string;
}

export interface PreviewResponse {
  url: string;
  error?: string;
}

export const generatePreviewUrl = async (s3Key: string): Promise<string | null> => {
  try {
    console.log("🔗 Generating preview URL for:", s3Key);

    const response = await invokeLambda(LAMBDA_FUNCTION_NAME, {
      tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
      s3Key: s3Key,
    });

    if (response && response.statusCode === 200) {
      const data = typeof response.body === "string" 
        ? JSON.parse(response.body) 
        : response.body;
      
      const presignedUrl = data.uploadUrl || data.presignedUrl || data.viewUrl;
      console.log("✅ Preview URL generated:", presignedUrl);
      return presignedUrl;
    } else {
      console.error("❌ Failed to generate preview URL:", response?.statusCode);
      throw new Error(`Preview service unavailable (Status: ${response?.statusCode || 'Unknown'})`);
    }
  } catch (error: any) {
    console.error("❌ Error generating preview URL:", error);
    
    // Provide user-friendly error messages
    if (error.name === 'ResourceNotFoundException') {
      throw new Error('Preview service not found. Please contact support.');
    } else if (error.message?.includes('AccessDenied')) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('Preview service timeout. Please try again.');
    } else if (error.message?.includes('NetworkingError')) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Unable to load document preview. Please try again later.');
    }
  }
};

export const createFileObject = (fileName: string, url: string, type: string = 'application/pdf') => ({
  name: fileName,
  type: type,
  url: url,
  size: 0
});
