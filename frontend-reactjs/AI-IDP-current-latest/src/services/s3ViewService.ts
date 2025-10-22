// Simple S3 view service without authentication issues
export const generateViewUrl = (s3Key: string): string => {
  // Direct S3 URL construction (public bucket approach)
  const bucket = 'aimlusecases-pvt';
  return `https://${bucket}.s3.amazonaws.com/${s3Key}`;
};

export const generateDownloadUrl = (s3Key: string, filename: string): string => {
  // Force download with content-disposition
  const bucket = 'aimlusecases-pvt';
  return `https://${bucket}.s3.amazonaws.com/${s3Key}?response-content-disposition=attachment;filename="${filename}"`;
};
