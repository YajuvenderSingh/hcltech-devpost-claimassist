export const handleError = (error: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error in ${context || 'Unknown context'}:`, error);
  }
  // In production, send to logging service
};

export const logInfo = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data);
  }
};
