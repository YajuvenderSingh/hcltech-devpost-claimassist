import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  ArrowRight, 
  Eye, 
  Trash2,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Mail,
  Inbox
} from 'lucide-react';
import PDFViewer from './ui/PDFViewer';
import ImagePreview from './ui/ImagePreview';
import OrchestrationStatus from './ui/OrchestrationStatus';
import { 
  uploadFileToS3, 
  resetClaimSession,
  getClaimSessionInfo,
  invokeLambda
} from '../services/awsService';
import { generatePreviewUrl } from '../services/previewService';
import { useOrchestration } from '../hooks/useOrchestration';

interface DocumentUploadProps {
  onNext: (files: any[]) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  classification: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  s3Data?: any;
}

interface EmailData {
  id: string;
  docId?: string;
  subject: string;
  sender: string;
  date: string;
  attachments: number;
  status: string;
  body?: string;
  channel?: string;
  docLoading?: boolean;
  indexLoading?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onNext }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'email'>('dashboard');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [emailData, setEmailData] = useState<EmailData[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailData[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardCurrentPage, setDashboardCurrentPage] = useState(1);
  const [dashboardDocLoading, setDashboardDocLoading] = useState<{[key: string]: boolean}>({});
  const dashboardRecordsPerPage = 5;
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { orchestrateFullFlow, state: orchestrationState } = useOrchestration();
  const [sessionId] = useState(() => 'session-' + Date.now()); // Generate once per component

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (dashboardLoading) return;
    
    setDashboardLoading(true);
    try {
      const response = await invokeLambda('nmm_history_dashboard_lambda', {});
      
      if (response && response.statusCode === 200) {
        const responseBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        setDashboardData(responseBody.data || []);
      } else {
        setDashboardData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setDashboardData([]);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Auto-fetch dashboard data when dashboard tab is activated
  useEffect(() => {
    if (activeTab === 'dashboard' && dashboardData.length === 0 && !dashboardLoading) {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Fetch emails when email tab is activated
  const fetchEmails = async () => {
    if (emailLoading) return;
    
    setEmailLoading(true);
    try {
      console.log('🔍 Fetching emails...');
      const response = await invokeLambda('nmm_email_reader', { "task_type": "process_emails" });
      
      if (response && response.statusCode === 200) {
        const responseBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        const recordDetails = JSON.parse(responseBody.record_details || '[]');
        
        // Transform the data to match our email structure
        const transformedEmails = recordDetails.map((record: any) => ({
          id: record.claim_id, // Use claim_id as the main ID (IN202912)
          docId: record.doc_id, // Separate doc_id (DOC215590)
          subject: record.subject,
          sender: 'System',
          date: record.open_date, // Use actual date from response
          attachments: record.attachment ? 1 : 0,
          attachment: record.attachment,
          channel: record.doc_source, // Use doc_source instead of channel
          status: record.doc_status, // Keep original case (New, Processing, Completed)
          body: record.attachment
        }));
        
        setEmailData(transformedEmails);
        console.log('✅ Emails loaded:', transformedEmails);
      } else {
        console.error('❌ Failed to fetch emails:', response);
        setEmailData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching emails:', error);
      setEmailData([]);
    } finally {
      setEmailLoading(false);
    }
  };

  // Auto-fetch emails when email tab is first activated
  useEffect(() => {
    if (activeTab === 'email' && emailData.length === 0 && !emailLoading) {
      fetchEmails();
    }
  }, [activeTab]);

  // Sort and search emails
  const applySortingAndSearch = React.useCallback((emails: EmailData[]) => {
    let filtered = [...emails];
    
    // Apply search filter
    if (emailSearchTerm) {
      filtered = filtered.filter(email => 
        email.id?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
        email.docId?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
        email.subject?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
        email.body?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
        email.status?.toLowerCase().includes(emailSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [emailSearchTerm]);

  // Get paginated emails
  const getPaginatedEmails = React.useCallback((emails: EmailData[]) => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return emails.slice(startIndex, endIndex);
  }, [currentPage, recordsPerPage]);

  const sortedEmails = React.useMemo(() => applySortingAndSearch(emailData), [emailData, emailSearchTerm]);
  const totalPages = Math.ceil(sortedEmails.length / recordsPerPage);
  const paginatedEmails = React.useMemo(() => getPaginatedEmails(sortedEmails), [sortedEmails, currentPage, recordsPerPage]);

  // Update filtered emails when paginated emails change
  React.useEffect(() => {
    setFilteredEmails(paginatedEmails);
  }, [paginatedEmails]);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [emailSearchTerm]);

  // Filter dashboard data by search term
  const getFilteredDashboardData = React.useCallback(() => {
    if (!dashboardSearchTerm) return dashboardData;
    
    return dashboardData.filter(item =>
      item.indexid?.toLowerCase().includes(dashboardSearchTerm.toLowerCase()) ||
      item.docid?.toLowerCase().includes(dashboardSearchTerm.toLowerCase()) ||
      item.classification?.toLowerCase().includes(dashboardSearchTerm.toLowerCase()) ||
      item.doc_source?.toLowerCase().includes(dashboardSearchTerm.toLowerCase()) ||
      item.classification_status?.toLowerCase().includes(dashboardSearchTerm.toLowerCase())
    );
  }, [dashboardData, dashboardSearchTerm]);

  const filteredDashboardData = getFilteredDashboardData();
  const dashboardTotalPages = Math.ceil(filteredDashboardData.length / dashboardRecordsPerPage);

  // Reset dashboard page when search changes
  React.useEffect(() => {
    setDashboardCurrentPage(1);
  }, [dashboardSearchTerm]);

  const handleDashboardDocIdClick = async (docId: string) => {
    setDashboardDocLoading(prev => ({ ...prev, [docId]: true }));
    
    try {
      const payload = { docid: docId };
      const response = await invokeLambda('nmm_dashboard_lambda', payload);
      
      if (response && response.statusCode === 200) {
        onNext([{ 
          id: docId, 
          docId: docId, 
          dashboardData: response.body,
          type: 'dashboard-doc',
          showPreview: true
        }]);
      }
    } catch (error) {
      console.error('Error processing DOC ID:', error);
    } finally {
      setDashboardDocLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleDocIdClick = async (emailId: string, docId: string) => {
    const uniqueKey = `${emailId}-${docId}`;
    setEmailData(prev => prev.map(email => 
      email.id === emailId && email.docId === docId ? { ...email, docLoading: true } : email
    ));
    
    try {
      const payload = { docid: docId };
      console.log('DOC ID clicked:', payload);
      
      const response = await invokeLambda('nmm_dashboard_lambda', payload);
      console.log('DOC ID response:', response);
      
      if (response && response.statusCode === 200) {
        toast.success(`DOC ID ${docId} processed successfully`);
        onNext([{ 
          id: docId, 
          docId: docId, 
          dashboardData: response.body,
          type: 'email-doc',
          showPreview: true
        }]);
      } else {
        toast.error('Failed to process DOC ID');
      }
    } catch (error) {
      console.error('Error processing DOC ID:', error);
      toast.error('Failed to process DOC ID');
    } finally {
      setEmailData(prev => prev.map(email => 
        email.id === emailId && email.docId === docId ? { ...email, docLoading: false } : email
      ));
    }
  };

  const handleIndexIdClick = async (emailId: string, indexId: string) => {
    setEmailData(prev => prev.map(email => 
      email.id === emailId ? { ...email, indexLoading: true } : email
    ));
    
    try {
      const payload = { indexid: indexId };
      console.log('Index ID clicked:', payload);
      
      const response = await invokeLambda('nmm_dashboard_lambda', payload);
      console.log('Index ID response:', response);
      
      if (response && response.statusCode === 200) {
        toast.success(`Index ID ${indexId} processed successfully`);
        // Navigate to dashboard with the response data
        onNext([{ 
          id: indexId, 
          indexId: indexId, 
          dashboardData: response.body,
          type: 'email-index',
          showPreview: true
        }]);
      } else {
        toast.error('Failed to process Index ID');
      }
    } catch (error) {
      console.error('Error processing Index ID:', error);
      toast.error('Failed to process Index ID');
    } finally {
      setEmailData(prev => prev.map(email => 
        email.id === emailId ? { ...email, indexLoading: false } : email
      ));
    }
  };

  const maxFileSize = 10 * 1024 * 1024;
  const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

  const generateFileId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const getAutoClassification = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('claim') || name.includes('form')) return 'Claim Form';
    if (name.includes('medical') || name.includes('report')) return 'Medical Report';
    if (name.includes('receipt') || name.includes('invoice')) return 'Receipt/Invoice';
    if (name.includes('id') || name.includes('license')) return 'Identification';
    return 'Other Document';
  };

  const validateFile = useCallback((file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      toast.error(`Only PDF and image files allowed`);
      return false;
    }
    if (file.size > maxFileSize) {
      toast.error(`File must be less than 10MB`);
      return false;
    }
    return true;
  }, [acceptedTypes, maxFileSize]);

  const uploadSingleFile = useCallback(async (uploadedFile: UploadedFile, isNewClaim: boolean = false): Promise<void> => {
    const fileId = uploadedFile.id;
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading' as const, uploadProgress: 10 } : f
    ));

    try {
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileId && f.status === 'uploading') {
            const newProgress = Math.min(f.uploadProgress + Math.random() * 30, 90);
            return { ...f, uploadProgress: newProgress };
          }
          return f;
        }));
      }, 300);

      const s3Data = await uploadFileToS3(uploadedFile.file, sessionId);
      clearInterval(progressInterval);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed' as const, 
          uploadProgress: 100, 
          s3Data 
        } : f
      ));

      if (s3Data) {
        toast.success('Document uploaded successfully');
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error' as const, 
          error: errorMessage 
        } : f
      ));
      toast.error(`Upload failed`);
    }
  }, [sessionId]);

  const processFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter(validateFile);
    
    // Remove maxFiles limit - allow unlimited uploads

    if (validFiles.length === 0) return;

    try {
      const processedFiles: UploadedFile[] = validFiles.map(file => ({
        id: generateFileId(),
        file,
        uploadProgress: 0,
        classification: getAutoClassification(file.name),
        status: 'pending'
      }));

      setFiles(prev => [...prev, ...processedFiles]);

      processedFiles.forEach((uploadedFile, index) => {
        setTimeout(() => {
          uploadSingleFile(uploadedFile, files.length === 0 && index === 0);
        }, index * 100);
      });

    } catch (error) {
      toast.error('Failed to process files');
    }
  }, [files.length, uploadSingleFile, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
    if (e.target) e.target.value = '';
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (fileToRetry) {
      uploadSingleFile(fileToRetry, false);
    }
  };

  const startNewClaim = () => {
    resetClaimSession();
    setFiles([]);
    toast.success('New claim started');
  };

  const handleContinue = async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    
    if (completedFiles.length === 0) {
      toast.error('Upload at least one file');
      return;
    }

    const pendingFiles = files.filter(f => f.status === 'uploading' || f.status === 'pending');
    if (pendingFiles.length > 0) {
      toast.error('Wait for uploads to complete');
      return;
    }

    const documentsData = completedFiles.map(f => ({
      ...f.file,
      id: f.id,
      classification: f.classification,
      file: f.file, // Preserve the original File object for preview
      s3Data: {
        claimId: f.s3Data?.claimId || f.s3Data?.indexid || f.id,
        s3Key: f.s3Data?.s3Key || f.s3Data?.key || f.s3Data?.s3filename || '', // Store as s3Key
        docId: f.s3Data?.docId || f.s3Data?.docid || f.id
      },
      documentId: f.id,
      s3Location: f.s3Data?.s3Key || f.s3Data?.key // Fixed: use s3Key first
    }));

    try {
      // Skip orchestration workflow to prevent double submission
      // The direct queue submission in awsService handles processing
      console.log('📋 Skipping orchestration workflow - using direct queue submission');
      
      // await orchestrateFullFlow({
      //   documents: documentsData,
      //   userId: 'current-user-id' // This should come from auth context
      // });

      onNext(documentsData);
    } catch (error) {
      console.error('Failed to start orchestration:', error);
      // Still proceed with the normal flow even if orchestration fails
      onNext(documentsData);
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const uploadingCount = files.filter(f => f.status === 'uploading' || f.status === 'pending').length;
  const sessionInfo = getClaimSessionInfo();

  return (
    <div className="max-w-[65rem] mx-auto p-4 space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Dashboard
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Documents
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('email')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Processing
              {emailLoading && (
                <RefreshCw className="w-3 h-3 animate-spin" />
              )}
            </div>
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-600">Document processing history and status</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Search dashboard..."
                      value={dashboardSearchTerm}
                      onChange={(e) => setDashboardSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                    />
                  </div>
                  
                  <button
                    onClick={fetchDashboardData}
                    disabled={dashboardLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center space-x-2"
                  >
                    {dashboardLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

             

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                  </div>
                ) : filteredDashboardData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">DOC ID</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Index ID</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Classification</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confidence</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDashboardData
                          .slice((dashboardCurrentPage - 1) * dashboardRecordsPerPage, dashboardCurrentPage * dashboardRecordsPerPage)
                          .map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-center align-middle">
                              <button
                                onClick={() => handleDashboardDocIdClick(item.docid)}
                                disabled={dashboardDocLoading[item.docid]}
                                className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                              >
                                {dashboardDocLoading[item.docid] ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                    Loading...
                                  </>
                                ) : (
                                  item.docid
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-center align-middle font-medium">
                              {item.indexid}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-center align-middle">
                              {item.classification || '-'}
                            </td>
                            <td className="px-4 py-4 text-center align-middle">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.document_conf_score === '100%' ? 'bg-green-100 text-green-800' :
                                item.document_conf_score ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.document_conf_score || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 text-center align-middle">
                              {item.doc_source}
                            </td>
                            <td className="px-4 py-4 text-center align-middle">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.classification_status === 'Completed' ? 'bg-green-100 text-green-800' :
                                item.classification_status === 'To Be Processed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.classification_status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 text-center align-middle">
                              {item.current_datetime ? new Date(item.current_datetime).toLocaleDateString('en-GB') + ' ' + 
                               new Date(item.current_datetime).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {dashboardSearchTerm ? 'No matching records found' : 'No dashboard data found'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {dashboardSearchTerm ? 'Try adjusting your search term' : 'Click "Refresh" to fetch the latest data'}
                      </p>
                      <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Refresh Data
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard Pagination Controls */}
              {filteredDashboardData.length > dashboardRecordsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDashboardCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={dashboardCurrentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: dashboardTotalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setDashboardCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            dashboardCurrentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setDashboardCurrentPage(prev => Math.min(prev + 1, dashboardTotalPages))}
                      disabled={dashboardCurrentPage === dashboardTotalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Page {dashboardCurrentPage} of {dashboardTotalPages}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Existing Upload Content */}
      {/* Orchestration Status */}
      <OrchestrationStatus state={orchestrationState} />
      
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Document Upload</h2>
            </div>
          </div>
          
        </div>

        {/* Claim Session Info */}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Upload Zone */}
        <div className="col-span-2">
          <div
            className={`relative h-48 rounded-lg border-2 border-dashed transition-all ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Upload className={`w-8 h-8 mb-2 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {dragActive ? 'Drop files here' : 'Upload Documents'}
              </h3>
              <p className="text-xs text-gray-600 mb-3 text-center">
                PDF, JPG, PNG up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-xs hover:bg-blue-700 transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm border h-48 flex flex-col">
            <div className="px-3 py-2 bg-gray-900 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium">Files ({files.length})</h4>
              </div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
              {files.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-gray-500">No files</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="bg-gray-50 rounded p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate flex-1 mr-2">{file.file.name}</span>
                        <div className="flex items-center space-x-1">
                          {file.status === 'error' && (
                            <button
                              onClick={() => retryUpload(file.id)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{(file.file.size / 1024).toFixed(0)} KB</span>
                        {file.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-600" />}
                        {file.status === 'uploading' && <Cloud className="w-3 h-3 text-blue-600 animate-bounce" />}
                        {file.status === 'error' && <AlertTriangle className="w-3 h-3 text-red-600" />}
                      </div>

                      {file.status === 'uploading' && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all"
                            style={{ width: `${file.uploadProgress}%` }}
                          />
                        </div>
                      )}

                      {file.status === 'error' && (
                        <p className="mt-1 text-red-600 text-xs">{file.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {completedCount > 0 && (
              <span className="text-green-600 font-medium">
                ✓ {completedCount} file{completedCount > 1 ? 's' : ''} ready
              </span>
            )}
            {uploadingCount > 0 && (
              <span className="text-blue-600 font-medium ml-3">
                ↑ {uploadingCount} uploading
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={completedCount === 0 || uploadingCount > 0 || orchestrationState.status === 'starting'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {orchestrationState.status === 'starting' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Starting Workflow...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedFile && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedFile.file.type === 'application/pdf' ? (
                <PDFViewer 
                  file={{ name: selectedFile.file.name, type: selectedFile.file.type, url: previewUrl, size: selectedFile.file.size }}
                  onClose={() => setShowPreview(false)} 
                />
              ) : (
                <ImagePreview 
                  file={{ name: selectedFile.file.name, type: selectedFile.file.type, url: previewUrl, size: selectedFile.file.size }}
                  onClose={() => setShowPreview(false)} 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
            </div>
          )}
          
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Email Processing</h2>
                    <p className="text-sm text-gray-600">Process emails and attachments automatically</p>
                    <div className="mt-2">
                      {(() => {
                        const totalEmails = dashboardData.reduce((sum, item) => 
                          sum + (parseInt(item.processed_new_emails) || 0), 0
                        );
                        return (
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            totalEmails > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            Processed New Emails: {totalEmails}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
                    />
                  </div>
                  
                  <button
                    onClick={fetchEmails}
                    disabled={emailLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center space-x-2"
                  >
                    {emailLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Records Summary - Removed */}

              {/* Email Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {emailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Processing emails...</p>
                    </div>
                  </div>
                ) : filteredEmails.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">DOC ID</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Claim ID</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attachment</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmails.map((email) => (
                          <tr key={email.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-center align-middle">
                              {email.docId ? (
                                <button
                                  onClick={() => handleDocIdClick(email.id, email.docId!)}
                                  disabled={email.docLoading}
                                  className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                                >
                                  {email.docLoading ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                      Processing...
                                    </>
                                  ) : (
                                    email.docId
                                  )}
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">No DOC ID</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center align-middle">
                              <span className="text-sm text-gray-900 font-medium">
                                {email.id || 'No Claim ID'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-center align-middle">
                              {email.subject || 'Claim forms'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900 text-center align-middle max-w-xs truncate" title={email.body}>
                              {email.body || 'No attachment'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 text-center align-middle">
                              email
                            </td>
                            <td className="px-4 py-4 text-center align-middle">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                email.status === 'completed' || email.status === 'Completed'
                                  ? 'bg-green-100 text-green-800' 
                                  : email.status === 'processing' || email.status === 'Processing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {email.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 text-center align-middle">
                              {email.date ? (() => {
                                const dateStr = email.date.replace(/(\d{4})(\d{2})(\d{2}):(\d{2}):(\d{2}):(\d{2})/, '$3/$2/$1 $4:$5:$6');
                                return dateStr;
                              })() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {emailData.length > 0 ? 'No emails match your filters' : 'No emails found'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {emailData.length > 0 
                          ? 'Try adjusting your filters or refresh to get new emails'
                          : 'Click "Refresh" to fetch the latest emails'
                        }
                      </p>
                      <button
                        onClick={fetchEmails}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Refresh Emails
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {emailData.length > recordsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
