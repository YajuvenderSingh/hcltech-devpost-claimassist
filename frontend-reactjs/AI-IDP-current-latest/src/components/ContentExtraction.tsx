import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCw, Eye, X, Save, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { fetchDashboardStatus, fetchExtractedEntities, updateModifiedValues, updateGuidwire, invokeLambda } from '../services/awsService';
import { generatePreviewUrl } from '../services/previewService';
import { dataStore } from '../services/dataStore';
import PDFViewer from './ui/PDFViewer';
import ImagePreview from './ui/ImagePreview';
import DashboardTable from './extraction/DashboardTable';
import EntityCarousel from './extraction/EntityCarousel';
import EntityList from './extraction/EntityList';
import PDFPreview from './extraction/PDFPreview';
import AdjusterPreview from './extraction/AdjusterPreview';
import MessagePopup from './ui/MessagePopup';

interface ContentExtractionProps 
{
  files: any[];
  selectedDocId?: string | null;
  userRole?: string;
  onNext: (data: any[]) => void;
  onBack?: () => void;
  onDocIdSelect?: (docId: string) => void;
}

const ContentExtraction: React.FC<ContentExtractionProps> = ({ 
  files = [], 
  selectedDocId: propSelectedDocId,
  userRole,
  onNext,
  onBack,
  onDocIdSelect
}) => {
  const [dashboardData, setDashboardData] = useState<{[key: string]: any}>({});
  const [isPolling, setIsPolling] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(propSelectedDocId || null);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [entitiesBySection, setEntitiesBySection] = useState<{[key: string]: any[]}>({});
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [editingEntity, setEditingEntity] = useState<string | null>(null);
  const [modifiedValues, setModifiedValues] = useState<{[key: string]: any}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingGuidwire, setIsUpdatingGuidwire] = useState(false);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastGuidwireClickTime, setLastGuidwireClickTime] = useState(0);
  const [claimValidationStatus, setClaimValidationStatus] = useState<'checking' | 'available' | 'unavailable' | 'no-claim' | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  
  // PDF Modal state
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [modalPDFFile, setModalPDFFile] = useState<any>(null);
  
  // Summary Modal state
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showDashboardFirst, setShowDashboardFirst] = useState(false);
  
  // Preview section state
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'summary' | 'validation'>('preview');

  // Load data when selectedDocId is provided without files (from dashboard navigation)
  useEffect(() => {
    if (selectedDocId && files.length === 0) {
      console.log('🔍 Loading data for selectedDocId without files:', selectedDocId);
      setShowDashboardFirst(true); // Show dashboard first when navigating from MatchingClaims
      loadDataForDocId(selectedDocId);
    }
  }, [selectedDocId, files.length]);

  const loadDataForDocId = async (docId: string) => {
    try {
      setIsPolling(true);
      setIsDashboardLoading(true);
      
      // Load dashboard status
      const response = await fetchDashboardStatus(docId);
      if (response && response.statusCode === 200) {
        let data: any;
        if (typeof response.body === 'string') {
          try {
            data = JSON.parse(response.body);
          } catch (parseError) {
            console.error('Failed to parse response body:', parseError);
            data = response.body;
          }
        } else {
          data = response.body || response;
        }
        
        setDashboardData(prev => ({
          ...prev,
          [docId]: data
        }));
        console.log('🔍 Dashboard data set for docId:', docId, 'Data:', data);
        console.log('🔍 Available fields:', Object.keys(data || {}));
        
        // Validate claim number if gw_claim_id exists (from mapping)
        if (data.gw_claim_id && data.gw_claim_id !== 'Not Available') {
          console.log('🔍 Found mapped GW Claim ID, validating:', data.gw_claim_id);
          validateClaimNumber(data.gw_claim_id);
        }
        
        // Load entities if extraction is complete - force reload to get updated values
        if (data.entity_extraction_status === "Completed") {
          await loadEntitiesForDoc(docId, true);
        }
        
        setIsDashboardLoading(false);
      }
    } catch (error) {
      console.error('Error loading data for docId:', error);
    } finally {
      setIsPolling(false);
    }
  };

  const loadEntitiesForDoc = async (docId: string, forceReload: boolean = false) => {
    // Always reload when coming from dashboard to get updated values
    if (!forceReload && entitiesBySection && Object.keys(entitiesBySection).length > 0 && Object.keys(modifiedValues).length > 0) {
      console.log('🔄 Skipping entity reload - preserving modifications');
      return;
    }
    
    try {
      setIsLoadingEntities(true);
      
      // Clear cache to force fresh data from API
      if (forceReload) {
        dataStore.clearCache('entities');
        console.log('🔄 Cleared entities cache to get updated values');
      }
      
      // Use dataStore for efficient caching
      const entitiesData = await dataStore.getEntitiesData(docId);
      
      if (entitiesData && typeof entitiesData === 'object') {
        console.log('🎯 Loaded entities from dataStore for docId:', docId, entitiesData);
        
        // Process entities the same way as before
        const groupedEntities: {[key: string]: any[]} = {};
        const initialExpanded: {[key: string]: boolean} = {};
        let claimId: string | null = null;
        
        // Process sections from JSON response
        console.log('🔍 DEBUG: All sections in entitiesData:', Object.keys(entitiesData));
        for (const section in entitiesData) {
          console.log(`📂 Processing section: ${section}`);
          let sectionName = section.replace(/_/g, ' ').replace(/section/g, '').trim().toUpperCase();
          console.log(`🔄 Original section: "${section}" -> Processed: "${sectionName}"`);
          
          // Merge DB validation data into validation section
          if (sectionName === 'DB VALIDATION') {
            sectionName = 'VALIDATION';
            console.log(`🔄 Merging DB VALIDATION data into VALIDATION section`);
          }
          
          // Initialize section if it doesn't exist
          if (!groupedEntities[sectionName]) {
            groupedEntities[sectionName] = [];
            initialExpanded[sectionName] = true;
            console.log(`✅ Created new section: "${sectionName}"`);
          } else {
            console.log(`📝 Adding to existing section: "${sectionName}"`);
          }
          
          const sectionData = entitiesData[section];
          
          if (!sectionData || typeof sectionData !== 'object') {
            console.warn(`⚠️ Section ${section} has invalid data:`, sectionData);
            continue;
          }
          
          for (const field in sectionData) {
            const entity = sectionData[field];
            
            // Handle entity value - check for current_value first, then fallback to other formats
            let entityValue;
            if (entity?.value) {
              if (typeof entity.value === 'object' && entity.value.current_value) {
                entityValue = entity.value.current_value; // Use current_value if available
              } else if (typeof entity.value === 'string') {
                // Try to parse JSON string that might contain current_value
                try {
                  const parsed = JSON.parse(entity.value);
                  if (parsed.current_value) {
                    entityValue = parsed.current_value;
                  } else {
                    entityValue = entity.value;
                  }
                } catch {
                  entityValue = entity.value; // Use as-is if not valid JSON
                }
              } else {
                entityValue = entity.value;
              }
            } else {
              entityValue = entity?.text || entity || 'N/A';
            }
            
            let entityConfidence = entity?.confidence || 0.5;
            
            // Parse confidence
            if (typeof entityConfidence === 'string') {
              const percentMatch = entityConfidence.match(/(\d+(?:\.\d+)?)%?/);
              if (percentMatch) {
                entityConfidence = parseFloat(percentMatch[1]) / 100;
              }
            } else if (typeof entityConfidence === 'number') {
              entityConfidence = entityConfidence > 1 ? entityConfidence / 100 : entityConfidence;
            }
            
            groupedEntities[sectionName].push({
              entity_type: field.replace(/_/g, ' ').toUpperCase(),
              entity_value: entityValue,
              confidence: entityConfidence
            });
            
            // Extract Claim ID if found
            const fieldLower = field.toLowerCase();
            if (fieldLower.includes('claim') && (fieldLower.includes('id') || fieldLower.includes('number'))) {
              claimId = entityValue;
              console.log(`🆔 Found Claim ID in field "${field}":`, claimId);
            }
          }
          
          console.log(`✅ Section "${sectionName}" has ${groupedEntities[sectionName].length} entities`);
        }
        
        // Don't overwrite dashboard GW Claim ID - keep original from dashboard
        // if (claimId) {
        //   console.log(`✅ Updating dashboard with Claim ID for ${docId}:`, claimId);
        //   setDashboardData(prev => ({
        //     ...prev,
        //     [docId]: {
        //       ...prev[docId],
        //       gw_claim_id: claimId
        //     }
        //   }));
        // }
        
        setEntitiesBySection(groupedEntities);
        setExpandedSections(initialExpanded);
        
        // Set initial active tab to first section
        const firstSection = Object.keys(groupedEntities)[0];
        if (firstSection) {
          setActiveTab(firstSection);
        }
        
        // Auto-generate summary if user is adjuster
        if (userRole === 'adjuster' && !summaryData && !summaryLoading) {
          setTimeout(() => {
            handleGenerateSummaryForDoc(docId);
          }, 1000);
        }
      } else {
        console.log('❌ No entities data received');
        setEntitiesBySection({});
      }
    } catch (error) {
      console.error('❌ Error loading entities:', error);
      setEntitiesBySection({});
      showMessage('error', '❌ Failed to fetch entities');
    } finally {
      setIsLoadingEntities(false);
    }
  };

  // Auto-select first tab when entities load
  // Auto-select first document if none selected
  useEffect(() => {
    if (files.length > 0 && !selectedDocId) {
      // Use the first file's document ID
      const firstFile = files[0];
      if (firstFile && firstFile.docid) {
        setSelectedDocId(firstFile.docid);
        setSelectedFile(firstFile);
      }
    }
  }, [files, selectedDocId]);

  // Set selectedFile when selectedDocId and dashboard data are available
  useEffect(() => {
    if (selectedDocId && dashboardData[selectedDocId] && !selectedFile) {
      const docData = dashboardData[selectedDocId];
      console.log('🔗 Setting selectedFile from dashboard data for docId:', selectedDocId);
      
      setSelectedFile({
        fileName: `Document_${selectedDocId}.pdf`,
        s3Key: docData.s3filename?.[0] || null,
        docId: selectedDocId,
        url: null,
        error: undefined
      });
    }
  }, [selectedDocId, dashboardData, selectedFile]);

  // Pre-load summary and validation when dashboard data is available
  useEffect(() => {
    if (selectedDocId && dashboardData[selectedDocId] && !summaryData && !validationData) {
      console.log('🚀 Pre-loading summary and validation for docId:', selectedDocId);
      setTimeout(() => {
        handleGenerateSummaryForDoc(selectedDocId);
        handleGenerateValidationForDoc(selectedDocId);
      }, 100);
    }
  }, [selectedDocId, dashboardData, summaryData, validationData]);

  // Track entitiesBySection changes
  useEffect(() => {
    console.log('🎠 entitiesBySection changed:', entitiesBySection);
    console.log('🎠 Section count:', Object.keys(entitiesBySection).length);
    console.log('🎠 Section names:', Object.keys(entitiesBySection));
  }, [entitiesBySection]);

  // Keyboard support for closing modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showPDFModal) {
          setShowPDFModal(false);
          setModalPDFFile(null);
        } else if (showPreview) {
          setShowPreview(false);
          setPreviewFile(null);
        } else if (selectedDocId) {
          handleCloseDocument();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPDFModal, showPreview, selectedDocId]);

  const validateClaimNumber = async (claimNumber: string) => {
    console.log('🔍 validateClaimNumber called with:', claimNumber);
    
    if (!claimNumber) {
      console.log('❌ No claim number - setting status to no-claim');
      setClaimValidationStatus('no-claim');
      return;
    }
    
    try {
      console.log('🚀 Calling nmm_check_claimnumber_in_guidewire_lambda with ClaimNumber:', claimNumber);
      setClaimValidationStatus('checking');
      
      const response = await invokeLambda('nmm_check_claimnumber_in_guidewire_lambda', {
        ClaimNumber: claimNumber
      });
      
      console.log('📥 Lambda response received:', response);
      
      if (response?.body === 'Available') {
        console.log('✅ Claim available in Guidewire');
        setClaimValidationStatus('available');
        showMessage('success', 'Claim available in Guidewire');
      } else {
        console.log('❌ Claim not found in Guidewire');
        setClaimValidationStatus('unavailable');
        showMessage('error', 'Claim not found in Guidewire');
      }
    } catch (error) {
      console.error('❌ Error calling lambda:', error);
      setClaimValidationStatus('unavailable');
      showMessage('error', 'Error validating claim');
    }
  };

  const handleLegalClassification = async (docData: any) => {
    console.log('⚖️ Legal classification detected - calling nmm_update_guidewire_legal_lambda');
    
    if (docData?.classification === 'Legal') {
      try {
        // Get current entity values (including UI modifications)
        const getCurrentEntityValue = (entityType: string) => {
          for (const [sectionName, entities] of Object.entries(entitiesBySection)) {
            const entity = (entities as any[]).find(e => 
              e.entity_type?.toLowerCase().includes(entityType.toLowerCase())
            );
            if (entity) {
              const entityKey = `${sectionName}_${(entities as any[]).indexOf(entity)}`;
              return modifiedValues[entityKey] || entity.entity_value;
            }
          }
          return null;
        };

        const legalPayload = {
          ClaimNumber: getCurrentEntityValue('claim') || docData.gw_claim_id || "xxxxxxxxxx",
          case_number: getCurrentEntityValue('case') || "533489",
          name: getCurrentEntityValue('name') || "DAVID BONET",
          category: "Legal",
          matter_type: getCurrentEntityValue('matter') || "Hearing",
          legal_speciality: getCurrentEntityValue('legal_speciality') || "Worker Compensation",
          primary_cause: getCurrentEntityValue('primary_cause') || "Delay or insufficient claimant",
          sensitivity_type: getCurrentEntityValue('sensitivity') || "Non Sensitive Document"
        };
        
        console.log('📤 Legal lambda payload (with UI values):', legalPayload);
        await invokeLambda('nmm_update_guidewire_legal_lambda', legalPayload);
        console.log('✅ Legal lambda success');
        
        showMessage('success', 'Legal document processed successfully');
      } catch (error) {
        console.error('❌ Legal lambda error:', error);
        showMessage('error', 'Error processing legal document');
      }
    }
  };

  const hasClaimNumber = () => {
    return Object.values(entitiesBySection).some((entities: any) =>
      entities.some((entity: any) => 
        entity.entity_type?.toLowerCase().includes('claim') && 
        entity.entity_type?.toLowerCase().includes('number') &&
        entity.entity_value?.trim()
      )
    );
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleViewDocumentDetails = () => {
    setShowDashboardFirst(false);
  };

  const handleCloseDocument = () => {
    console.log('🔄 Closing document view - returning to dashboard');
    
    // Clear all document-related state
    setSelectedDocId(null);
    setSelectedFile(null);
    setEntitiesBySection({});
    setCurrentDocIndex(0);
    setEditingEntity(null);
    setModifiedValues({});
    
    showMessage('info', '📋 Returning to dashboard view');
  };

  const handlePDFPreview = () => {
    console.log('🔍 PDF Preview requested for:', selectedFile);
    
    if (selectedFile?.url) {
      setModalPDFFile({
        ...selectedFile,
        url: selectedFile.url,
        fileName: selectedFile.fileName || 'Document.pdf'
      });
      setShowPDFModal(true);
      showMessage('success', '📄 Opening PDF in full screen...');
    } else {
      showMessage('error', '❌ PDF not available for preview');
    }
  };

  // Call lambda when MAP GW CLAIM is clicked, but no auto-preview
  useEffect(() => {
    console.log('🔍 ADJUSTER ROLE USEEFFECT - propSelectedDocId:', propSelectedDocId);
    console.log('🔍 ADJUSTER ROLE USEEFFECT - userRole:', userRole);
    
    if (propSelectedDocId) {
      console.log('🔄 ADJUSTER ROLE - Calling nmm_dashboard_lambda for:', propSelectedDocId);
      
      const loadDashboardData = async () => {
        try {
          console.log('📤 ADJUSTER ROLE - Dashboard payload:', { docid: propSelectedDocId });
          const dashboardResponse = await invokeLambda('nmm_dashboard_lambda', { docid: propSelectedDocId });
          console.log('📥 ADJUSTER ROLE - Dashboard response:', dashboardResponse);
          
          if (dashboardResponse?.statusCode === 200) {
            // Check for legal classification in adjuster flow
            const responseBody = typeof dashboardResponse.body === 'string' 
              ? JSON.parse(dashboardResponse.body) 
              : dashboardResponse.body;
            
            console.log('🔍 TESTING - Classification check:', responseBody?.classification);
            
            if (responseBody?.classification === 'Legal') {
              console.log('🔍 TESTING - Legal detected, calling handler');
              await handleLegalClassification(responseBody);
            }
            
            // Removed auto-preview: handlePreview(propSelectedDocId);
          } else {
            console.log('❌ ADJUSTER ROLE - nmm_dashboard_lambda failed:', dashboardResponse);
          }
        } catch (error) {
          console.error('❌ ADJUSTER ROLE - Error calling nmm_dashboard_lambda:', error);
        }
      };
      
      loadDashboardData();
    } else {
      console.log('⚠️ ADJUSTER ROLE - No propSelectedDocId provided');
    }
  }, [propSelectedDocId]);

  const handlePreview = async (docId: string) => {
    console.log('🔍 Preview requested for docId:', docId);
    
    try {
      showMessage('info', '👁️ Loading document preview...');
      
      // First get dashboard response to get s3filename
      const dashboardPayload = { docid: docId };
      console.log('📤 Dashboard payload:', dashboardPayload);
      
      const dashboardResponse = await invokeLambda('nmm_dashboard_lambda', dashboardPayload);
      console.log('📥 Dashboard response:', dashboardResponse);
      
      if (dashboardResponse && dashboardResponse.statusCode === 200) {
        const responseBody = typeof dashboardResponse.body === 'string' 
          ? JSON.parse(dashboardResponse.body) 
          : dashboardResponse.body;
        
        console.log('📋 Dashboard response body:', responseBody);
        
        // Check for legal classification
        if (responseBody.classification === 'Legal') {
          console.log('🔍 PREVIEW - Legal classification detected');
          await handleLegalClassification(responseBody);
        }
        
        // FORCE TEST - Always call legal lambda for testing
        console.log('🔍 FORCE TEST - Calling legal lambda');
        await handleLegalClassification({ classification: 'Legal' });
        
        if (responseBody.s3filename && responseBody.s3filename.length > 0) {
          const s3Key = responseBody.s3filename[0];
          console.log('🔑 Extracted s3Key:', s3Key);
          
          // Now get presigned URL
          const presignedPayload = {
            tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
            s3Key: s3Key
          };
          
          console.log('📤 Presigned URL payload:', presignedPayload);
          console.log('🚀 Calling lambda: claimassistv2-presignedurl-lambda');
          
          const presignedResponse = await invokeLambda('claimassistv2-presignedurl-lambda', presignedPayload);
          console.log('📥 Presigned URL response:', presignedResponse);
          
          if (presignedResponse && presignedResponse.statusCode === 200) {
            const presignedBody = typeof presignedResponse.body === 'string' 
              ? JSON.parse(presignedResponse.body) 
              : presignedResponse.body;
            
            console.log('📋 Presigned response body:', presignedBody);
            
            if (presignedBody.viewUrl || presignedBody.uploadUrl) {
              const previewUrl = presignedBody.viewUrl || presignedBody.uploadUrl;
              const fileToPreview = {
                name: `Document_${docId}.pdf`,
                type: 'application/pdf',
                url: previewUrl,
                size: 0
              };
              
              setPreviewFile(fileToPreview);
              setShowPreview(true);
              showMessage('success', '✅ Preview loaded with presigned URL');
            } else {
              console.error('❌ No viewUrl or uploadUrl in presigned response');
              showMessage('error', '❌ No view URL in presigned response');
            }
          } else {
            console.error('❌ Presigned URL lambda failed:', presignedResponse);
            showMessage('error', `❌ Presigned URL failed: ${presignedResponse?.statusCode || 'No response'}`);
          }
        } else {
          console.error('❌ No s3filename in dashboard response');
          showMessage('error', '❌ No s3filename in dashboard response');
        }
      } else {
        console.error('❌ Dashboard lambda failed:', dashboardResponse);
        showMessage('error', `❌ Dashboard failed: ${dashboardResponse?.statusCode || 'No response'}`);
      }
    } catch (error) {
      console.error('❌ Preview error:', error);
      showMessage('error', `❌ Failed to load preview: ${error}`);
    }
  };

  const loadDashboardData = async () => {
    console.log('🔄 Loading dashboard data...');
    try {
      // Only show loading if we don't have any dashboard data yet (initial load)
      const isInitialLoad = Object.keys(dashboardData).length === 0;
      if (isInitialLoad) {
        setIsDashboardLoading(true);
      }
      
      const docIds = files.map((file, i) => 
        file.docId || file.s3Data?.docId || file.s3Data?.docid || file.documentId || `DOC${Date.now()}_${i}`
      );

      console.log('📋 Loading dashboard for docIds:', docIds);

      // Clear dashboard cache to force fresh data
      dataStore.clearCache('dashboard');

      // Use dataStore for efficient caching and parallel loading
      const dashboardResults = await dataStore.getDashboardData(docIds);
      
      console.log('📊 Dashboard results received:', dashboardResults);
      
      // FIRST: Sort dashboard data by docId to maintain consistent order
      const sortedDashboardResults: {[key: string]: any} = {};
      const sortedKeys = Object.keys(dashboardResults).sort();
      sortedKeys.forEach(key => {
        sortedDashboardResults[key] = dashboardResults[key];
      });
      
      setDashboardData(sortedDashboardResults);
      if (isInitialLoad) {
        setIsDashboardLoading(false);
      }
      console.log('✅ Dashboard data displayed');

      // THEN: Check if we need to continue polling for updates
      console.log('🔍 Checking polling status for documents:', Object.keys(dashboardResults));
      
      const anyToBeProcessed = Object.values(dashboardResults).some((data: any) => {
        const isToBeProcessed = data.classification_status === "To Be Processed" ||
                               data.extraction_status === "To Be Processed" ||
                               data.entity_extraction_status === "To Be Processed" ||
                               data.confidence_score_status === "To Be Processed";
        
        console.log(`📋 Document ${data.docid || 'unknown'}:`, {
          classification_status: data.classification_status,
          extraction_status: data.extraction_status,
          entity_extraction_status: data.entity_extraction_status,
          confidence_score_status: data.confidence_score_status,
          needsProcessing: isToBeProcessed
        });
        
        return isToBeProcessed;
      });
      
      if (anyToBeProcessed) {
        console.log('📊 Some documents still need processing, continuing polling...');
        setIsPolling(true);
      } else {
        console.log('✅ All documents fully processed, stopping polling');
        setIsPolling(false);
        // Only call other APIs after all documents are complete
        dataStore.preloadData(docIds);
      }
      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setIsDashboardLoading(false);
    }
  };

  const handleDocIdClick = async (docId: string, fileIndex: number) => {
    if (showDashboardFirst) {
      // If showing dashboard first, transition to document detail view
      setShowDashboardFirst(false);
      return;
    }
    
    showMessage('info', '📄 Loading document details...');
    setSelectedDocId(docId);
    setCurrentDocIndex(fileIndex);
    
    // Notify App.tsx about selected Doc ID
    if (onDocIdSelect) {
      onDocIdSelect(docId);
    }
    
    // Set selectedFile from files array
    if (files && files[fileIndex]) {
      setSelectedFile(files[fileIndex]);
    }
    
    // Clear cached summary data when switching documents
    setSummaryData(null);
    console.log('🔄 Cleared summary data for new document');
    
    console.log('=== Document Debug Info ===');
    console.log('Clicked docId:', docId);
    console.log('File index:', fileIndex);
    console.log('Available files:', files);
    
    // Handle email navigation (no files array)
    if (files.length === 0) {
      console.log('📧 Email navigation detected - setting selectedFile from dashboard data');
      
      // For email processing, extract s3filename from dashboardData
      const emailFile = files.find(f => f.docId === docId);
      if (emailFile && emailFile.dashboardData) {
        try {
          const dashboardResponse = typeof emailFile.dashboardData === 'string' 
            ? JSON.parse(emailFile.dashboardData) 
            : emailFile.dashboardData;
          
          if (dashboardResponse.s3filename && dashboardResponse.s3filename.length > 0) {
            const s3Key = dashboardResponse.s3filename[0];
            console.log('📧 Extracted s3Key from email dashboardData:', s3Key);
            
            setSelectedFile({
              fileName: `Document_${docId}.pdf`,
              s3Key: s3Key,
              docId: docId,
              url: null, // Will be generated by PDFPreview using presigned URL
              error: undefined
            });
            console.log('📧 Set selectedFile with s3Key for presigned URL generation');
          } else {
            console.error('❌ No s3filename in email dashboardData');
            setSelectedFile({
              fileName: `Document_${docId}.pdf`,
              s3Key: null,
              docId: docId,
              url: null,
              error: 'No s3filename in dashboard data'
            });
          }
        } catch (error) {
          console.error('❌ Error parsing email dashboardData:', error);
          setSelectedFile({
            fileName: `Document_${docId}.pdf`,
            s3Key: null,
            docId: docId,
            url: null,
            error: 'Failed to parse dashboard data'
          });
        }
      } else {
        // Fallback for old dashboard data structure
        const dashboardInfo = dashboardData[docId];
        if (dashboardInfo?.s3_key) {
          setSelectedFile({
            fileName: dashboardInfo?.fileName || dashboardInfo?.file_name || `Document_${docId}.pdf`,
            s3Key: dashboardInfo.s3_key,
            docId: docId,
            url: null,
            error: undefined
          });
        } else {
          setSelectedFile({
            fileName: `Document_${docId}.pdf`,
            s3Key: null,
            docId: docId,
            url: null,
            error: 'S3 key not found in dashboard data'
          });
        }
      }
      return;
    }
    
    // Find matching file by index (original upload flow)
    const matchingFile = files[fileIndex];
    
    if (matchingFile && matchingFile.file) {
      // Use S3 URL only - no local file handling
      console.log('File selection changed to index:', fileIndex);
      
      // Get S3 key from files data (uploaded files contain s3Key)
      console.log('🔍 Looking for S3 key in files for docId:', docId);
      console.log('🔍 Available files:', files);
      
      let s3Key: string | null = null;
      
      // First try to find S3 key in files data - check actual structure
      const matchingFile = files.find(f => {
        console.log('🔍 Checking file:', f);
        console.log('🔍 File s3Data:', f.s3Data);
        console.log('🔍 Comparing docId:', docId, 'with f.s3Data?.docId:', f.s3Data?.docId);
        const matches = f.s3Data?.docId === docId || 
                       f.s3Data?.docid === docId ||
                       f.docId === docId ||
                       f.id === docId;
        console.log('🔍 Match result:', matches);
        return matches;
      });
      
      console.log('🔍 Matching file found:', matchingFile);
      
      if (matchingFile?.s3Data?.s3Key) {
        s3Key = matchingFile.s3Data.s3Key;
        console.log('✅ Found S3 key in files:', s3Key);
      } else if (matchingFile?.s3Data?.s3filename) {
        s3Key = matchingFile.s3Data.s3filename;
        console.log('✅ Found S3 key in files (s3filename):', s3Key);
      } else {
        // Fallback: try dashboard data
        const dashboardInfo = dashboardData[docId];
        s3Key = dashboardInfo?.s3_key;
        console.log('🔍 Fallback to dashboard S3 key:', s3Key);
      }
      
      console.log('🔍 Final S3 key:', s3Key);
      
      console.log('🔍 Setting selectedFile with S3 key:', s3Key);
      
      // Generate preview URL asynchronously
      const generateUrl = async () => {
        if (s3Key) {
          try {
            const previewUrl = await generatePreviewUrl(s3Key);
            setSelectedFile({
              fileName: `Document ${fileIndex + 1}`,
              s3Key: s3Key,
              url: previewUrl,
              error: undefined
            });
            console.log('✅ Set selectedFile with preview URL:', previewUrl);
          } catch (error) {
            console.error('❌ Error generating preview URL:', error);
            setSelectedFile({
              fileName: `Document ${fileIndex + 1}`,
              s3Key: s3Key,
              url: null,
              error: 'Failed to generate preview URL'
            });
          }
        } else {
          setSelectedFile({
            fileName: `Document ${fileIndex + 1}`,
            s3Key: null,
            url: null,
            error: 'S3 key not found'
          });
        }
      };
      
      generateUrl();
    }
    
    // Don't reload entities if we already have them and modifications exist
    if (entitiesBySection && Object.keys(entitiesBySection).length > 0 && Object.keys(modifiedValues).length > 0) {
      console.log('🔄 Skipping entity reload - preserving modifications');
      setIsLoadingEntities(false);
      return;
    }
    
    // Fetch extracted entities
    setIsLoadingEntities(true);
    try {
      console.log('🔍 Fetching entities for docId:', docId);
      const response = await fetchExtractedEntities(docId);
      
      console.log('=== Entity Extraction Debug ===');
      console.log('DocId used:', docId);
      console.log('Raw response:', response);
      
      if (response && response.statusCode === 200) {
        let responseBody = response.body;
        
        // Validate and parse response body
        if (typeof responseBody === 'string') {
          try {
            responseBody = JSON.parse(responseBody);
          } catch (parseError) {
            console.error('❌ Failed to parse response body JSON:', parseError);
            throw new Error('Invalid JSON response from server');
          }
        }
        
        console.log('✅ Parsed response body:', responseBody);
        console.log('🔍 DEBUG: responseBody type:', typeof responseBody);
        console.log('🔍 DEBUG: responseBody keys:', Object.keys(responseBody || {}));
        console.log('🔍 DEBUG: extracted_entities exists?', !!responseBody?.extracted_entities);
        console.log('🔍 DEBUG: extracted_entities type:', typeof responseBody?.extracted_entities);
        
        if (responseBody && responseBody.extracted_entities) {
          let extractedEntities = responseBody.extracted_entities;
          
          // Validate and parse extracted_entities
          if (typeof extractedEntities === 'string') {
            try {
              extractedEntities = JSON.parse(extractedEntities);
            } catch (parseError) {
              console.error('❌ Failed to parse extracted_entities JSON:', parseError);
              throw new Error('Invalid extracted_entities JSON format');
            }
          }
          
          console.log('📋 Using JSON extracted entities:', extractedEntities);
          
          // Validate that we have actual JSON data
          if (!extractedEntities || typeof extractedEntities !== 'object') {
            throw new Error('Extracted entities is not a valid JSON object');
          }
          
          console.log('📋 Raw extracted entities:', extractedEntities);
          
          const groupedEntities: {[key: string]: any[]} = {};
          const initialExpanded: {[key: string]: boolean} = {};
          let claimId: string | null = null;
          
          // Process sections from JSON response
          for (const section in extractedEntities) {
            console.log(`📂 Processing JSON section: ${section}`);
            let sectionName = section.replace(/_/g, ' ').replace(/section/g, '').trim().toUpperCase();
            
            // Merge DB validation data into validation section
            if (sectionName === 'DB VALIDATION') {
              sectionName = 'VALIDATION';
              console.log(`🔄 Merging DB VALIDATION data into VALIDATION section`);
            }
            
            // Initialize section if it doesn't exist
            if (!groupedEntities[sectionName]) {
              groupedEntities[sectionName] = [];
              initialExpanded[sectionName] = true;
            }
            
            const sectionData = extractedEntities[section];
            
            // Validate section data is an object
            if (!sectionData || typeof sectionData !== 'object') {
              console.warn(`⚠️ Section ${section} has invalid data:`, sectionData);
              continue;
            }
            
            for (const field in sectionData) {
              const entity = sectionData[field];
              console.log(`📝 Processing JSON field: ${field} =`, entity);
              
              // Extract entity data from JSON response
              const entityValue = entity?.value || entity?.text || entity || 'N/A';
              let entityConfidence = entity?.confidence || 0.5;
              
              // Parse confidence - handle both string percentages and numeric values
              if (typeof entityConfidence === 'string') {
                // Handle string percentages like "100%"
                const percentMatch = entityConfidence.match(/(\d+(?:\.\d+)?)%?/);
                if (percentMatch) {
                  entityConfidence = parseFloat(percentMatch[1]) / 100;
                }
              } else if (typeof entityConfidence === 'number') {
                // Handle numeric values (0-1 or 0-100)
                entityConfidence = entityConfidence > 1 ? entityConfidence / 100 : entityConfidence;
              }
              
              groupedEntities[sectionName].push({
                entity_type: field.replace(/_/g, ' ').toUpperCase(),
                entity_value: entityValue,
                confidence: entityConfidence
              });
              
              // Extract Claim Number if found
              const fieldLower = field.toLowerCase();
              if (
                (fieldLower.includes('claim') && fieldLower.includes('number')) ||
                fieldLower.includes('claimnumber') ||
                fieldLower.includes('claim_number') ||
                fieldLower.includes('administrator_claim_number')
              ) {
                // Extract simple string value, not object
                let claimValue = entityValue;
                if (typeof entityValue === 'object' && entityValue.current_value) {
                  claimValue = entityValue.current_value;
                } else if (typeof entityValue === 'string') {
                  claimValue = entityValue;
                }
                claimId = claimValue;
                console.log(`🆔 Found Claim Number in field "${field}":`, claimId);
              }
            }
            
            console.log(`✅ Section "${sectionName}" has ${groupedEntities[sectionName].length} entities`);
          }
          
          // Don't overwrite dashboard GW Claim ID - keep original from dashboard
          // if (claimId) {
          //   console.log(`✅ Updating dashboard with Claim ID for ${docId}:`, claimId);
          //   setDashboardData(prev => ({
          //     ...prev,
          //     [docId]: {
          //       ...prev[docId],
          //       gw_claim_id: claimId
          //     }
          //   }));
          // } else {
          //   console.log(`❌ No Claim ID found in entities for ${docId}`);
          // }
          
          console.log('Grouped entities:', groupedEntities);
          setEntitiesBySection(groupedEntities);
          setExpandedSections(initialExpanded);
          
          // Set initial active tab to first section
          const firstSection = Object.keys(groupedEntities)[0];
          if (firstSection) {
            setActiveTab(firstSection);
          }
          
          // Auto-generate summary in background (regardless of Claim ID)
          console.log('🔄 Auto-generating summary for docId:', docId);
          console.log('🔍 Current userRole:', userRole);
          console.log('🔍 Current summaryData:', summaryData);
          console.log('🔍 Current summaryLoading:', summaryLoading);
          console.log('🔍 Claim ID found:', claimId || 'None - but proceeding with summary anyway');
          
          // Always validate claim number - call with claimId or empty string
          console.log('🔍 Starting claim validation for:', claimId || 'No claim number found');
          validateClaimNumber(claimId || '');
          
          // Use docId parameter instead of selectedDocId state
          setTimeout(() => {
            if (docId) {
              console.log('🚀 Calling handleGenerateSummaryForDoc with:', docId);
              handleGenerateSummaryForDoc(docId);
            }
          }, 100);
        } else {
          console.log('No extracted_entities in response body');
          setEntitiesBySection({});
        }
      } else {
        console.log('Response not successful:', response?.statusCode);
        setEntitiesBySection({});
        showMessage('error', '❌ Failed to load entities - invalid response');
      }
    } catch (error) {
      console.error('Failed to fetch entities:', error);
      setEntitiesBySection({});
      showMessage('error', '❌ Failed to fetch entities');
    } finally {
      setIsLoadingEntities(false);
    }
  };

  const handleEditEntity = (sectionName: string, entityIndex: number, currentValue: string) => {
    const entityKey = `${sectionName}_${entityIndex}`;
    console.log('✏️ handleEditEntity called:', { sectionName, entityIndex, currentValue, entityKey });
    setEditingEntity(entityKey);
    setModifiedValues(prev => {
      const newValues = {
        ...prev,
        [entityKey]: currentValue
      };
      console.log('💾 Updated modifiedValues:', newValues);
      return newValues;
    });
  };

  const handleMarkForReview = async () => {
    if (!selectedDocId) {
      showMessage('error', 'No document selected for review');
      return;
    }
    
    try {
      showMessage('info', '🔄 Marking document for review...');
      
      const response = await invokeLambda('nmm_mark_for_review_lambda', {
        docid: selectedDocId
      });
      
      if (response && response.statusCode === 200) {
        showMessage('success', '✅ Document marked for review successfully!');
      } else {
        throw new Error(`Review marking failed: ${response?.statusCode || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error marking for review:', error);
      showMessage('error', `❌ Failed to mark for review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle tab selection without changing document ID
  const handleTabSelect = (tabName: string) => {
    // Set active tab but keep document ID unchanged
    setActiveTab(tabName);
    console.log('🔄 Tab selected:', tabName, '(keeping docId:', selectedDocId, ')');
  };

  const handleGenerateSummary = async () => {
    if (!selectedDocId) {
      console.log('❌ No document selected for summary');
      return;
    }
    
    await handleGenerateSummaryForDoc(selectedDocId);
  };

  const formatSummaryText = (text: string) => {
    if (!text) return null;
    
    // Split by numbered points (1., 2., 3., etc.)
    const points = text.split(/\d+\.\s+/).filter(point => point.trim());
    
    if (points.length <= 1) {
      // If no numbered points found, return as single paragraph
      return (
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed text-sm">{text}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {points.map((point, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
            <p className="text-gray-700 leading-relaxed text-sm flex-1">{point.trim()}</p>
          </div>
        ))}
      </div>
    );
  };

  const handleGenerateValidationForDoc = async (docId: string) => {
    console.log('📋 handleGenerateValidationForDoc called with docId:', docId);
    
    if (validationLoading) {
      console.log('⏳ Validation already in progress, skipping');
      return;
    }

    setValidationLoading(true);
    
    try {
      console.log('🔍 Generating validation for docId:', docId);
      
      const payload = {
        docid: docId
      };
      
      console.log('📤 Validation payload:', JSON.stringify(payload, null, 2));
      console.log('🎯 Using lambda function: nmm_doc_validation_lambda');
      
      const response = await invokeLambda('nmm_doc_validation_lambda', payload);
      console.log('📄 Validation response:', response);
      
      if (response && response.statusCode === 200) {
        const validationResult = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
        setValidationData(validationResult);
        console.log('✅ Validation set successfully');
      } else {
        console.error('❌ Failed to generate validation:', response);
        setValidationData('Failed to generate validation');
      }
    } catch (error) {
      console.error('❌ Error generating validation:', error);
      setValidationData('Error generating validation');
    } finally {
      setValidationLoading(false);
    }
  };

  const handleGenerateSummaryForDoc = async (docId: string) => {
    console.log('📋 handleGenerateSummaryForDoc called with docId:', docId);
    
    if (summaryLoading) {
      console.log('⏳ Summary already in progress, skipping');
      return;
    }

    setSummaryLoading(true);
    
    try {
      const payload = { docid: docId };
      const lambdaFunction = 'nmm_document_summary_lambda';
      
      const response = await invokeLambda(lambdaFunction, payload);
      
      if (response?.statusCode === 200) {
        setSummaryData(response.body || response);
      } else {
        setSummaryData({ summary: `Summary not available for document ${docId}` });
      }
    } catch (error) {
      console.error('❌ Summary error:', error);
      setSummaryData({ summary: `Error generating summary for document ${docId}` });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCombinedSave = async (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime < 1000) return;
    setLastClickTime(now);
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 SAVE BUTTON PAYLOAD TEST - START');
    console.log('📄 selectedDocId:', selectedDocId);
    console.log('📊 entitiesBySection:', entitiesBySection);
    console.log('✏️ modifiedValues:', modifiedValues);
    console.log('🔑 modifiedValues keys:', Object.keys(modifiedValues));
    
    if (!selectedDocId || isSaving || isUpdatingGuidwire) return;
    
    console.log('💾 Combined Save button clicked');
    showMessage('info', '💾 Saving and updating all systems...');
    setIsSaving(true);
    setIsUpdatingGuidwire(true);
    
    try {
      // 1. Save modified values if any
      if (Object.keys(modifiedValues).length > 0) {
        const modifiedEntitiesPayload: any = {};
        
        Object.entries(modifiedValues).forEach(([entityKey, newValue]) => {
          console.log('🔍 DEBUG: Processing entityKey:', entityKey, 'newValue:', newValue);
          
          const parts = entityKey.split('_');
          const entityIndex = parts.pop();
          const sectionKey = parts.join('_');
          
          console.log('🔍 DEBUG: parts:', parts, 'entityIndex:', entityIndex, 'sectionKey:', sectionKey);
          
          const sectionEntities = entitiesBySection[sectionKey.replace(/_/g, ' ').toUpperCase()];
          console.log('🔍 DEBUG: Looking for section:', sectionKey.replace(/_/g, ' ').toUpperCase());
          console.log('🔍 DEBUG: Available sections:', Object.keys(entitiesBySection));
          
          if (sectionEntities && sectionEntities[parseInt(entityIndex!)]) {
            const originalEntity = sectionEntities[parseInt(entityIndex!)];
            console.log('🔍 DEBUG: originalEntity:', originalEntity);
            
            const fieldKey = originalEntity.entity_type.toLowerCase().replace(/\s+/g, '_');
            console.log('🔍 DEBUG: fieldKey:', fieldKey);
            
            // Map to the correct section based on the actual section name
            let payloadSectionKey;
            const actualSectionName = sectionKey.replace(/_/g, ' ').toUpperCase();
            console.log('🔍 DEBUG: actualSectionName:', actualSectionName);
            
            if (actualSectionName.includes('CLAIM DETAILS')) {
              payloadSectionKey = 'claim_details';
            } else if (actualSectionName.includes('EMPLOYEE INFORMATION')) {
              payloadSectionKey = 'employee_information';
            } else if (actualSectionName.includes('EMPLOYEE INJURY')) {
              payloadSectionKey = 'employee_injury_section';
            } else if (actualSectionName.includes('INSURER')) {
              payloadSectionKey = 'insurer_claim_administrator_information';
            } else if (actualSectionName.includes('WORK STATUS')) {
              payloadSectionKey = 'work_status';
            } else if (actualSectionName.includes('INSURED')) {
              payloadSectionKey = 'insured_information';
            } else {
              // Fallback: convert section name to lowercase with underscores (keep _section)
              payloadSectionKey = actualSectionName.toLowerCase().replace(/\s+/g, '_');
            }
            
            console.log('🔍 DEBUG: payloadSectionKey:', payloadSectionKey);
            
            if (!modifiedEntitiesPayload[payloadSectionKey]) {
              modifiedEntitiesPayload[payloadSectionKey] = {};
            }
            
            modifiedEntitiesPayload[payloadSectionKey][fieldKey] = {
              value: newValue
            };
          }
        });
        
        const modifiedPayload = {
          docid: selectedDocId,
          modified_entities: modifiedEntitiesPayload
        };
        
        console.log('📤 MODIFIED VALUES PAYLOAD:', JSON.stringify(modifiedPayload, null, 2));
        
        const modifiedResponse = await updateModifiedValues(modifiedPayload);
        
        if (!modifiedResponse || modifiedResponse.statusCode !== 200) {
          throw new Error(`Modified values update failed: ${modifiedResponse?.statusCode || 'Unknown error'}`);
        }
        
        console.log('✅ Modified values saved successfully');
      
      // NOTE: Same modifiedValues variable is now used for Guidwire payload below
      }
      
      // 2. Update Guidewire - Handle processed entity arrays
      const guidwirePayload: any = {};
      let entityCount = 0;
      
      console.log('🔍 DEBUG: modifiedValues:', modifiedValues);
      console.log('🔍 DEBUG: modifiedValues keys:', Object.keys(modifiedValues));
      
      // Process the entity arrays from entitiesBySection
      if (entitiesBySection && typeof entitiesBySection === 'object') {
        Object.entries(entitiesBySection).forEach(([sectionName, entities]: [string, any]) => {
          console.log('🔍 DEBUG: Processing section:', sectionName);
          if (Array.isArray(entities)) {
            entities.forEach((entity: any, index: number) => {
              // Get the entity value
              const originalValue = entity.entity_value;
              
              // Check for user modifications using section + index key
              const entityKey = `${sectionName.toUpperCase()}_${index}`;
              const entityKeyAlt = `${sectionName}_${index}`;  // Alternative key format
              
              console.log(`🔍 DEBUG: Looking for keys: "${entityKey}" or "${entityKeyAlt}"`);
              console.log(`🔍 DEBUG: Entity: ${entity.entity_type} = ${originalValue}`);
              
              const finalValue = modifiedValues[entityKey] || modifiedValues[entityKeyAlt] || originalValue;
              
              if (modifiedValues[entityKey] || modifiedValues[entityKeyAlt]) {
                console.log(`🔥 FOUND MODIFICATION: ${entity.entity_type} = ${finalValue}`);
              }
              
              // Map entity_type to Guidewire field names
              const entityType = entity.entity_type.toLowerCase().replace(/\s+/g, '_');
              let guidewireField = entityType;
              
              // Field mapping
              if (entityType.includes('claim') && entityType.includes('number')) {
                guidewireField = 'ClaimNumber';
              } else if (entityType === 'employee_name') {
                guidewireField = 'employee_name';
              } else if (entityType === 'employee_first_name') {
                guidewireField = 'employee_first_name';
              } else if (entityType === 'employee_last_name') {
                guidewireField = 'employee_last_name';
              } else if (entityType === 'date_of_birth') {
                guidewireField = 'date_of_birth';
              } else if (entityType === 'date_of_injury') {
                guidewireField = 'date_of_injury';
              } else if (entityType === 'nature_of_injury') {
                guidewireField = 'nature_of_injury';
              } else if (entityType === 'part_of_body') {
                guidewireField = 'part_of_body';
              } else if (entityType === 'mailing_address') {
                guidewireField = 'mailing_address';
              } else if (entityType === 'wcb_case_number_jcn') {
                guidewireField = 'wcb_case_number_jcn';
              } else if (entityType === 'initial_return_to_work_date') {
                guidewireField = 'initial_return_to_work_date';
              } else if (entityType === 'policy_number_id') {
                guidewireField = 'policy_number_id';
              }
              
              if (finalValue && finalValue.toString().trim()) {
                guidwirePayload[guidewireField] = finalValue;
                entityCount++;
                const isModified = (modifiedValues[entityKey] || modifiedValues[entityKeyAlt]) ? '(MODIFIED)' : '(EXTRACTED)';
                console.log(`✅ ${guidewireField}: ${finalValue} ${isModified}`);
              }
            });
          }
        });
      }
      
      console.log(`📤 DYNAMIC GUIDEWIRE PAYLOAD (${entityCount} fields):`, JSON.stringify(guidwirePayload, null, 2));
      
      // Call Guidewire update with fully dynamic payload
      const guidewireResponse = await Promise.race([
        updateGuidwire(guidwirePayload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Guidewire timeout after 8 seconds')), 8000))
      ]);
      
      if (!guidewireResponse || guidewireResponse.statusCode !== 200) {
        throw new Error(`Guidewire update failed: ${guidewireResponse?.statusCode || 'Unknown error'}`);
      }
      
      console.log('✅ Guidweere updated successfully');
      
      // 3. Update DMS - Dynamic payload
      const dmsPayload: any = {};
      
      // Get ClaimNumber from actual entities (with modified value priority)
      let claimNumber = null;
      Object.entries(entitiesBySection).forEach(([sectionName, entities]) => {
        entities.forEach((entity: any, index: number) => {
          if (entity.entity_type.toLowerCase().includes('claim') && entity.entity_type.toLowerCase().includes('number')) {
            const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
            claimNumber = modifiedValues[entityKey] || entity.entity_value;
          }
        });
      });
      
      // Build DMS payload
      dmsPayload.ClaimNumber = claimNumber || `000-00-${selectedDocId?.replace('DOC', '') || '000'}`;
      dmsPayload.DocumentType = "email";
      dmsPayload.DocumentSection = "ClaimForm";
      
      // Extract actual filename from s3filename path
      let documentName = `Document_${selectedDocId}.pdf`; // fallback
      const dashboardInfo = dashboardData[selectedDocId!];
      
      if (dashboardInfo?.s3filename && Array.isArray(dashboardInfo.s3filename) && dashboardInfo.s3filename.length > 0) {
        const s3Path = dashboardInfo.s3filename[0];
        // Extract filename from path like "newmexicomutual/claimforms/IN195266/DOC547714/Without_Claim_ID-NY_WCB–C-2F_Employer's_Report_of_Work-Related_Injury.pdf"
        const pathParts = s3Path.split('/');
        const filename = pathParts[pathParts.length - 1]; // Get last part
        if (filename && filename.includes('.')) {
          documentName = filename;
        }
      }
      
      dmsPayload.DocumentName = documentName;
      
      console.log('📤 DYNAMIC DMS PAYLOAD:', JSON.stringify(dmsPayload, null, 2));
      
      // Try DMS update but don't fail if it doesn't work
      try {
        const dmsResponse = await invokeLambda('nmm_update_guidewire_dms_lambda', dmsPayload);
        
        if (dmsResponse && dmsResponse.statusCode === 200) {
          console.log('✅ DMS updated successfully');
          showMessage('success', '🎉 All updates completed successfully! Modified values saved, Guidwire updated, and DMS synchronized.');
        } else {
          console.warn('⚠️ DMS update failed but continuing:', dmsResponse?.statusCode);
          showMessage('success', '✅ Guidewire updated successfully! (DMS sync skipped)');
        }
      } catch (dmsError) {
        console.warn('⚠️ DMS update failed but continuing:', dmsError);
        showMessage('success', '✅ Guidewireupdated successfully! (DMS sync skipped)');
      }
      
      setModifiedValues({});
      
    } catch (error) {
      console.error('❌ Error in handleCombinedSave:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage('error', `❌ Save operation failed: ${errorMessage}. Please try again.`);
    } finally {
      setIsSaving(false);
      setIsUpdatingGuidwire(false);
    }
  };

  const handleSaveModifiedValues = async (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime < 1000) return;
    setLastClickTime(now);
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedDocId || isSaving) return;
    
    if (Object.keys(modifiedValues).length === 0) {
      showMessage('info', 'No changes to save');
      return;
    }
    
    console.log('💾 Save button clicked - Modified values:', modifiedValues);
    showMessage('info', 'Saving changes...');
    setIsSaving(true);
    
    try {
      const modifiedEntitiesPayload: any = {};
      
      Object.entries(modifiedValues).forEach(([entityKey, newValue]) => {
        console.log('🔍 DEBUG: Processing entityKey:', entityKey, 'newValue:', newValue);
        
        const parts = entityKey.split('_');
        const entityIndex = parts.pop();
        const sectionKey = parts.join('_');
        
        console.log('🔍 DEBUG: parts:', parts, 'entityIndex:', entityIndex, 'sectionKey:', sectionKey);
        
        const sectionEntities = entitiesBySection[sectionKey.replace(/_/g, ' ').toUpperCase()];
        console.log('🔍 DEBUG: Looking for section:', sectionKey.replace(/_/g, ' ').toUpperCase());
        console.log('🔍 DEBUG: Available sections:', Object.keys(entitiesBySection));
        
        if (sectionEntities && sectionEntities[parseInt(entityIndex!)]) {
          const originalEntity = sectionEntities[parseInt(entityIndex!)];
          console.log('🔍 DEBUG: originalEntity:', originalEntity);
          
          const fieldKey = originalEntity.entity_type.toLowerCase().replace(/\s+/g, '_');
          console.log('🔍 DEBUG: fieldKey:', fieldKey);
          
          // Map to the correct section based on the actual section name
          let payloadSectionKey;
          const actualSectionName = sectionKey.replace(/_/g, ' ').toUpperCase();
          console.log('🔍 DEBUG: actualSectionName:', actualSectionName);
          
          if (actualSectionName.includes('CLAIM DETAILS')) {
            payloadSectionKey = 'claim_details';
          } else if (actualSectionName.includes('EMPLOYEE INFORMATION')) {
            payloadSectionKey = 'employee_information';
          } else if (actualSectionName.includes('EMPLOYEE INJURY')) {
            payloadSectionKey = 'employee_injury_section';
          } else if (actualSectionName.includes('INSURER')) {
            payloadSectionKey = 'insurer_claim_administrator_information';
          } else if (actualSectionName.includes('WORK STATUS')) {
            payloadSectionKey = 'work_status';
          } else if (actualSectionName.includes('INSURED')) {
            payloadSectionKey = 'insured_information';
          } else {
            // Fallback: convert section name to lowercase with underscores
            payloadSectionKey = actualSectionName.toLowerCase().replace(/\s+/g, '_').replace('_section', '');
          }
          
          console.log('🔍 DEBUG: payloadSectionKey:', payloadSectionKey);
          
          if (!modifiedEntitiesPayload[payloadSectionKey]) {
            modifiedEntitiesPayload[payloadSectionKey] = {};
          }
          
          modifiedEntitiesPayload[payloadSectionKey][fieldKey] = {
            value: newValue
          };
        }
      });
      
      const payload = {
        docid: selectedDocId,
        modified_entities: modifiedEntitiesPayload
      };
      
      console.log('📤 Sending only modified entities:', payload);
      
      try {
        const response = await updateModifiedValues(payload);
        console.log('✅ Save Modified Values successful:', response);
        showMessage('success', 'Changes saved successfully');
        
        // Update the original entities with modified values instead of clearing
        Object.entries(modifiedValues).forEach(([entityKey, newValue]) => {
          const parts = entityKey.split('_');
          const entityIndex = parts.pop();
          const sectionKey = parts.join('_').replace(/_/g, ' ').toUpperCase();
          
          if (entitiesBySection[sectionKey] && entitiesBySection[sectionKey][parseInt(entityIndex!)]) {
            entitiesBySection[sectionKey][parseInt(entityIndex!)].entity_value = newValue;
          }
        });
        
        // Clear modified values after updating original entities
        setModifiedValues({});
      } catch (apiError) {
        console.error('API Error:', apiError);
        showMessage('success', 'Changes saved locally');
        
        // Still update the original entities even if API fails
        Object.entries(modifiedValues).forEach(([entityKey, newValue]) => {
          const parts = entityKey.split('_');
          const entityIndex = parts.pop();
          const sectionKey = parts.join('_').replace(/_/g, ' ').toUpperCase();
          
          if (entitiesBySection[sectionKey] && entitiesBySection[sectionKey][parseInt(entityIndex!)]) {
            entitiesBySection[sectionKey][parseInt(entityIndex!)].entity_value = newValue;
          }
        });
        
        setModifiedValues({});
      }
      
    } catch (error) {
      console.error('❌ Error in handleSaveModifiedValues:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage('error', `Failed to save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGuidwireUpdate = async (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastGuidwireClickTime < 1000) return;
    setLastGuidwireClickTime(now);
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedDocId || isUpdatingGuidwire) return;
    
    console.log('🔗 Guidwire button clicked');
    console.log('🔍 Current modifiedValues:', modifiedValues);
    console.log('🔍 ModifiedValues keys:', Object.keys(modifiedValues));
    showMessage('info', 'Updating Guidewire...');
    setIsUpdatingGuidwire(true);
    
    try {
      const guidwirePayload: any = {};
      
      // Field mapping
      const fieldMapping: {[key: string]: string} = {
        'claim_administrator_claim_number': 'ClaimNumber',
        'employee_name': 'employee_name',
        'wcb_case_number_jcn': 'wcb_case_number_jcn',
        'date_of_injury': 'date_of_injury',
        'employee_first_name': 'employee_first_name',
        'employee_last_name': 'employee_last_name',
        'mailing_address': 'mailing_address',
        'city': 'city',
        'state': 'state',
        'postal_code': 'postal_code',
        'date_of_birth': 'date_of_birth',
        'nature_of_injury': 'nature_of_injury',
        'part_of_body': 'part_of_body',
        'initial_return_to_work_date': 'initial_return_to_work_date',
        'policy_number_id': 'policy_number_id',
        'insurer_name': 'insurer_name',
        'insurer_id': 'insurer_id'
      };
      
      // Process actual extracted entities dynamically
      Object.entries(entitiesBySection).forEach(([sectionName, entities]) => {
        entities.forEach((entity: any, index: number) => {
          const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
          const currentValue = modifiedValues[entityKey] || entity.entity_value;
          
          // Map to Guidwire field using entity type
          const entityType = entity.entity_type.toLowerCase().replace(/\s+/g, '_');
          const guidwireField = fieldMapping[entityType] || entityType;
          
          if (currentValue) {
            guidwirePayload[guidwireField] = currentValue;
            console.log(`✅ ${guidwireField} = ${currentValue} ${modifiedValues[entityKey] ? '(MODIFIED)' : '(ORIGINAL)'}`);
          }
        });
      });
      
      console.log('📤 Dynamic Guidwire payload:', JSON.stringify(guidwirePayload, null, 2));
      
      // DEBUG: Apply modifications
      console.log('🔍 DEBUGGING MODIFIED VALUES:');
      console.log('Available modifiedValues:', modifiedValues);
      
      if (Object.keys(modifiedValues).length > 0) {
        console.log('🔄 Applying modifications to Guidwire...');
        Object.entries(modifiedValues).forEach(([key, value]) => {
          console.log(`Checking modification: ${key} = ${value}`);
          
          if (key.toLowerCase().includes('employee_name') || key.toLowerCase().includes('name')) {
            guidwirePayload.employee_name = value;
            console.log(`✅ APPLIED: employee_name = ${value}`);
          }
          if (key.toLowerCase().includes('claim') && key.toLowerCase().includes('number')) {
            guidwirePayload.ClaimNumber = value;
            console.log(`✅ APPLIED: ClaimNumber = ${value}`);
          }
          if (key.toLowerCase().includes('first_name')) {
            guidwirePayload.employee_first_name = value;
            console.log(`✅ APPLIED: employee_first_name = ${value}`);
          }
          if (key.toLowerCase().includes('nature') && key.toLowerCase().includes('injury')) {
            guidwirePayload.nature_of_injury = value;
            console.log(`✅ APPLIED: nature_of_injury = ${value}`);
          }
          if (key.toLowerCase().includes('part') && key.toLowerCase().includes('body')) {
            guidwirePayload.part_of_body = value;
            console.log(`✅ APPLIED: part_of_body = ${value}`);
          }
        });
        
        console.log('📤 FINAL GUIDWIRE PAYLOAD WITH MODIFICATIONS:', JSON.stringify(guidwirePayload, null, 2));
      }
      
      if (Object.keys(guidwirePayload).length === 0) {
        showMessage('error', 'No entities found to send to Guidwire');
        return;
      }
      
      const response = await updateGuidwire(guidwirePayload);
      console.log('✅ Guidewire Update successful:', response);
      showMessage('success', 'Guidewire updated successfully!');
      
    } catch (error) {
      console.error('❌ Error in handleGuidwireUpdate:', error);
      showMessage('error', `Guidewire update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingGuidwire(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      "Completed": "bg-green-100 text-green-700",
      "Processing": "bg-blue-100 text-blue-700", 
      "To Be Processed": "bg-yellow-100 text-yellow-700",
      "Failed": "bg-red-100 text-red-700"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  useEffect(() => {
    if (files.length > 0) {
      setIsPolling(true); // Start polling immediately
      loadDashboardData();
    }
  }, [files.length]); // Only run when files change

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      console.log('🔄 Starting polling interval (every 5 seconds)');
      interval = setInterval(() => {
        console.log('⏰ Polling interval tick - calling loadDashboardData');
        loadDashboardData();
      }, 5000);
    } else {
      console.log('⏹️ Polling stopped');
    }
    return () => {
      if (interval) {
        console.log('🛑 Clearing polling interval');
        clearInterval(interval);
      }
    };
  }, [isPolling]);

  // Document detail view - but show dashboard first if coming from MatchingClaims
  if (selectedDocId && !showDashboardFirst) {
    return (
    <div className="h-screen flex flex-col bg-gray-50">
      {message && (
        <MessagePopup
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}
        {/* Header section */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Current DOC ID */}
          <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium">
            {selectedDocId}
          </div>
            {files.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border">
                <span className="font-medium">Document {currentDocIndex + 1} of {files.length}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      showMessage('info', '⬅️ Loading previous document...');
                      const prevIndex = currentDocIndex > 0 ? currentDocIndex - 1 : files.length - 1;
                      const prevFile = files[prevIndex];
                      const prevDocId = prevFile.docId || prevFile.s3Data?.docId || prevFile.s3Data?.docid || prevFile.documentId || `DOC${Date.now()}_${prevIndex}`;
                      handleDocIdClick(prevDocId, prevIndex);
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => {
                      showMessage('info', '➡️ Loading next document...');
                      const nextIndex = currentDocIndex < files.length - 1 ? currentDocIndex + 1 : 0;
                      const nextFile = files[nextIndex];
                      const nextDocId = nextFile.docId || nextFile.s3Data?.docId || nextFile.s3Data?.docid || nextFile.documentId || `DOC${Date.now()}_${nextIndex}`;
                      handleDocIdClick(nextDocId, nextIndex);
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleCloseDocument}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors border border-gray-300 hover:border-gray-400"
            title="Close document view"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Main content with proper width handling */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF Preview Section - Fixed width */}
          <div className="w-1/2 min-w-0 border-r bg-gray-100 flex flex-col">
            <div className="bg-white px-3 py-2 border-b flex-shrink-0">
              {selectedFile?.url && (
                <p className="text-xs text-gray-500 truncate">
                  View: PDF Document
                </p>
              )}
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Preview Section with Tabs */}
              <div className="bg-white border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActivePreviewTab('preview')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activePreviewTab === 'preview'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 Summary tab clicked - showing existing summary');
                      setActivePreviewTab('summary');
                      // Only generate summary if we don't have it and not currently loading
                      if (selectedDocId && !summaryData && !summaryLoading) {
                        handleGenerateSummaryForDoc(selectedDocId);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activePreviewTab === 'summary'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Summary
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('🔍 Validation tab clicked');
                      setActivePreviewTab('validation');
                      // Only generate validation if we don't have it and not currently loading
                      if (selectedDocId && !validationData && !validationLoading) {
                        handleGenerateValidationForDoc(selectedDocId);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activePreviewTab === 'validation'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Validation
                      {validationLoading && (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      )}
                    </div>
                  </button>
                  
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activePreviewTab === 'preview' ? (
                  userRole === 'Adjuster' ? (
                    <AdjusterPreview selectedFile={selectedFile} />
                  ) : (
                    <PDFPreview
                      selectedFile={selectedFile}
                      files={files}
                      onPreview={handlePDFPreview}
                    />
                  )
                ) : activePreviewTab === 'summary' ? (
                  <div className="h-full overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-white">
                    {summaryLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-600">Generating summary...</p>
                        </div>
                      </div>
                    ) : summaryData ? (
                      <div className="space-y-4">
                        {/* Summary Content */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Document Summary
                          </h4>
                          <div className="prose max-w-none">
                            {typeof summaryData === 'string' ? (
                              formatSummaryText(summaryData)
                            ) : summaryData.summary ? (
                              formatSummaryText(summaryData.summary)
                            ) : (
                              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-auto border">
                                {JSON.stringify(summaryData, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>

                        {/* Key Points */}
                        {summaryData.keyPoints && (
                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              Key Points
                            </h4>
                            <ul className="space-y-3">
                              {summaryData.keyPoints.map((point: string, index: number) => (
                                <li key={index} className="flex items-start gap-3">
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Metadata */}
                        {summaryData.metadata && (
                          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              Document Details
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {Object.entries(summaryData.metadata).map(([key, value]) => (
                                <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  <div className="text-sm text-gray-900 font-medium">{String(value)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
                          <p className="text-gray-600 text-sm">Click Summary tab to generate...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
                
                {activePreviewTab === 'validation' && (
                  <div className="h-full overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="space-y-6">
                      {/* Document Validation Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Document Validation
                        </h3>
                        
                        {/* Guidewire Claim Validation */}
                        <div className={`border rounded-lg p-4 ${
                          claimValidationStatus === 'available' ? 'bg-green-50 border-green-200' :
                          claimValidationStatus === 'unavailable' ? 'bg-red-50 border-red-200' :
                          claimValidationStatus === 'checking' ? 'bg-yellow-50 border-yellow-200' :
                          claimValidationStatus === 'no-claim' ? 'bg-gray-50 border-gray-300' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            {claimValidationStatus === 'checking' ? (
                              <RefreshCw className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5 animate-spin" />
                            ) : claimValidationStatus === 'available' ? (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : claimValidationStatus === 'unavailable' ? (
                              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            ) : claimValidationStatus === 'no-claim' ? (
                              <XCircle className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <FileText className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <h4 className={`font-semibold text-sm mb-2 ${
                                claimValidationStatus === 'available' ? 'text-green-800' : 
                                claimValidationStatus === 'unavailable' ? 'text-red-800' : 
                                claimValidationStatus === 'checking' ? 'text-yellow-800' :
                                claimValidationStatus === 'no-claim' ? 'text-gray-800' :
                                'text-gray-800'
                              }`}>
                                {claimValidationStatus === 'checking' ? 'Checking Guidewire...' :
                                 claimValidationStatus === 'available' ? 'Guidewire Validation Passed' :
                                 claimValidationStatus === 'unavailable' ? 'Guidewire Validation Failed' :
                                 claimValidationStatus === 'no-claim' ? 'No Claim Number Found' :
                                 'Guidewire Validation Pending'}
                              </h4>
                              <p className={`text-sm leading-relaxed ${
                                claimValidationStatus === 'available' ? 'text-green-700' : 
                                claimValidationStatus === 'unavailable' ? 'text-red-700' : 
                                claimValidationStatus === 'checking' ? 'text-yellow-700' :
                                claimValidationStatus === 'no-claim' ? 'text-gray-700' :
                                'text-gray-700'
                              }`}>
                                {claimValidationStatus === 'checking' ? 'Validating claim number in Guidewire system...' :
                                 claimValidationStatus === 'available' ? 'Claim number exists in Guidewire system' :
                                 claimValidationStatus === 'unavailable' ? 'Claim number not found in Guidewire system' :
                                 claimValidationStatus === 'no-claim' ? 'Claim number is not present in the document' :
                                 'Claim validation will start when document is processed'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {validationLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-gray-600">Generating validation...</p>
                            </div>
                          </div>
                        ) : validationData ? (
                          <div>
                            {(() => {
                              try {
                                let validationResult;
                                if (typeof validationData === 'string') {
                                  const parsed = JSON.parse(validationData);
                                  validationResult = parsed.validation_result || validationData;
                                } else {
                                  validationResult = validationData.validation_result || JSON.stringify(validationData);
                                }
                                
                                const isPass = validationResult.toLowerCase().includes('pass');
                                const isFail = validationResult.toLowerCase().includes('fail');
                                
                                return (
                                  <div className={`border rounded-lg p-4 ${
                                    isPass ? 'bg-green-50 border-green-200' : 
                                    isFail ? 'bg-red-50 border-red-200' : 
                                    'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-start gap-3">
                                      {isPass && <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />}
                                      {isFail && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />}
                                      {!isPass && !isFail && <FileText className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />}
                                      <div className="flex-1">
                                        <h4 className={`font-semibold text-sm mb-2 ${
                                          isPass ? 'text-green-800' : 
                                          isFail ? 'text-red-800' : 
                                          'text-gray-800'
                                        }`}>
                                          {isPass ? 'Validation Passed' : isFail ? 'Validation Failed' : 'Validation Result'}
                                        </h4>
                                        <p className={`text-sm leading-relaxed ${
                                          isPass ? 'text-green-700' : 
                                          isFail ? 'text-red-700' : 
                                          'text-gray-700'
                                        }`}>
                                          {validationResult}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } catch {
                                return (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                      <FileText className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-sm mb-2 text-gray-800">Validation Result</h4>
                                        <p className="text-sm text-gray-700 leading-relaxed">{validationData}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Click Validation tab to generate...</p>
                          </div>
                        )}
                      </div>

                      {/* Database Validation Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Database Validation
                        </h3>
                        <div className="grid gap-3">
                          {/* Policy Coverage DB */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900">Policy Coverage DB</h4>
                                <p className="text-xs text-gray-600">Employer covered under policy on DOI?</p>
                              </div>
                            </div>
                          </div>

                          {/* Provider Registry */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900">Provider Registry</h4>
                                <p className="text-xs text-gray-600">NPI/license matches active provider?</p>
                              </div>
                            </div>
                          </div>

                          {/* Claims History DB */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-yellow-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900">Claims History (ISO)</h4>
                                <p className="text-xs text-gray-600">Similar WC claims filed before?</p>
                              </div>
                            </div>
                          </div>

                          {/* Medical Coding DB */}
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900">Medical Coding DB</h4>
                                <p className="text-xs text-gray-600">ICD/CPT codes valid and consistent?</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* Entities Section - Fixed width with proper overflow */}
          <div className="w-1/2 min-w-0 flex flex-col bg-gradient-to-b from-gray-50 to-white">
            {/* Header - Fixed height */}
            <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm px-3 py-2.5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2 min-w-0">
                  {isLoadingEntities ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent flex-shrink-0"></div>
                      <span className="truncate">🧠 Loading Entities...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700 truncate">🧠 Extracted Entities</span>
                      {Object.keys(entitiesBySection).length > 0 && (() => {
                        // Count entities from backend structure
                        let totalCount = 0;
                        Object.values(entitiesBySection).forEach((sectionData: any) => {
                          if (sectionData && typeof sectionData === 'object') {
                            totalCount += Object.keys(sectionData).length;
                          }
                        });
                        return (
                          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm flex-shrink-0">
                            {totalCount}
                          </span>
                        );
                      })()}
                    </>
                  )}
                </h3>
                
                {/* Action Buttons - Fixed width */}
                {Object.keys(entitiesBySection).length > 0 && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleMarkForReview}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Mark for Review
                    </button>
                    <button
                      type="button"
                      onClick={handleCombinedSave}
                      disabled={isSaving || isUpdatingGuidwire || claimValidationStatus === 'unavailable' || claimValidationStatus === 'checking' || claimValidationStatus === 'no-claim'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors ${
                        claimValidationStatus === 'unavailable' || claimValidationStatus === 'no-claim'
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : claimValidationStatus === 'checking'
                          ? 'bg-yellow-500'
                          : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
                      }`}
                      title={
                        claimValidationStatus === 'no-claim'
                          ? 'Claim number is not present in the document'
                          : claimValidationStatus === 'unavailable' 
                          ? 'Claim number not found in Guidewire' 
                          : claimValidationStatus === 'checking'
                          ? 'Validating claim number...'
                          : 'Update Guidewire'
                      }
                    >
                      {(isSaving || isUpdatingGuidwire) ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      ) : claimValidationStatus === 'checking' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      {claimValidationStatus === 'checking' ? 'Validating...' : 'Update Guidewire'}
                    </button>
                    
                    
                  </div>
                )}
              </div>
            </div>
            
            {/* Entity Content Area - Scrollable */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {(() => {
                console.log('🔍 Entity loading state - isLoadingEntities:', isLoadingEntities);
                console.log('🔍 Entity sections - entitiesBySection:', entitiesBySection);
                console.log('🔍 Entity sections count:', Object.keys(entitiesBySection).length);
                return null;
              })()}
              {isLoadingEntities ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="font-medium text-gray-600">Extracting entities...</p>
                    <p className="text-sm text-gray-500">Please wait while we process the document</p>
                  </div>
                </div>
              ) : Object.keys(entitiesBySection).length > 0 ? (
                <>
                  {(() => {
                    console.log('🎠 Rendering EntityCarousel with sections:', Object.keys(entitiesBySection));
                    return null;
                  })()}
                  {/* Entity Carousel - Fixed height */}
                  <div className="flex-shrink-0">
                    <EntityCarousel
                      entitiesBySection={entitiesBySection}
                      selectedDocId={selectedDocId}
                      onTabSelect={handleTabSelect}
                      onReset={handleCloseDocument}
                    />
                  </div>
                  
                  {/* Entity List - Scrollable area */}
                  <div className="flex-1 overflow-hidden min-h-0">
                    {(() => {
                      console.log('🔍 DEBUG: entitiesBySection structure:', entitiesBySection);
                      console.log('🔍 DEBUG: activeTab:', activeTab);
                      
                      // Get current section data and apply modifications
                      const currentSectionData = activeTab && entitiesBySection[activeTab] 
                        ? entitiesBySection[activeTab].map((entity, index) => {
                            const entityKey = `${activeTab.replace(/\s+/g, '_').toUpperCase()}_${index}`;
                            const modifiedValue = modifiedValues[entityKey];
                            return modifiedValue ? { ...entity, entity_value: modifiedValue } : entity;
                          })
                        : Object.values(entitiesBySection)[0]?.map((entity, index) => {
                            const sectionName = Object.keys(entitiesBySection)[0];
                            const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
                            const modifiedValue = modifiedValues[entityKey];
                            return modifiedValue ? { ...entity, entity_value: modifiedValue } : entity;
                          }) || [];
                      
                      console.log('🔍 DEBUG: currentSectionData:', currentSectionData);
                      
                      // currentSectionData is already an array of entities, no need to convert
                      const currentEntities = Array.isArray(currentSectionData) ? currentSectionData : [];
                      
                      console.log('🔍 DEBUG: Final currentEntities:', currentEntities);
                      
                      if (currentEntities.length === 0) {
                        return (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center p-4">
                              <div className="text-2xl mb-2">📋</div>
                              <p className="text-sm font-medium">No entities in this section</p>
                              <p className="text-xs text-gray-500">Try selecting a different section</p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <EntityList
                          entities={currentEntities}
                          selectedDocId={selectedDocId}
                          entitiesBySection={entitiesBySection}
                          editingEntity={editingEntity}
                          modifiedValues={modifiedValues}
                          onEditEntity={handleEditEntity}
                          onValueChange={(entityKey, value) => {
                            setModifiedValues(prev => ({
                              ...prev,
                              [entityKey]: value
                            }));
                            
                            // Also update the original entities to prevent reload issues
                            const parts = entityKey.split('_');
                            const entityIndex = parseInt(parts.pop() || '0');
                            const sectionKey = parts.join('_').replace(/_/g, ' ');
                            
                            setEntitiesBySection(prev => ({
                              ...prev,
                              [sectionKey]: prev[sectionKey]?.map((entity, index) => 
                                index === entityIndex ? { ...entity, entity_value: value } : entity
                              ) || []
                            }));
                          }}
                          onStopEditing={() => setEditingEntity(null)}
                          currentSectionName={activeTab || Object.keys(entitiesBySection)[0]}
                        />
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-2">✨</div>
                    <p className="text-sm font-medium">No entities extracted yet</p>
                    {(() => {
                      console.log('❌ No entities condition - entitiesBySection:', entitiesBySection);
                      console.log('❌ isLoadingEntities:', isLoadingEntities);
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF Modal */}
        <AnimatePresence>
          {showPDFModal && modalPDFFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowPDFModal(false);
                  setModalPDFFile(null);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl border"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">PDF Document Viewer</h3>
                      <p className="text-blue-100 text-sm">{modalPDFFile.fileName || 'Document'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Download Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = modalPDFFile.url;
                        link.download = modalPDFFile.fileName || 'document.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showMessage('success', '📥 Download started');
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 PDF Modal close button clicked');
                        setShowPDFModal(false);
                        setModalPDFFile(null);
                        showMessage('info', '📄 PDF viewer closed');
                      }}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors hover:bg-red-500/20 group"
                      title="Close PDF Viewer"
                    >
                      <X className="w-5 h-5 group-hover:text-red-200 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* PDF Viewer Content */}
                <div className="relative w-full bg-gray-100" style={{ height: 'calc(90vh - 80px)' }}>
                  <iframe
                    src={`${modalPDFFile.url}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0"
                    title={modalPDFFile.fileName || 'PDF Document'}
                    style={{ minHeight: '100%' }}
                    onLoad={() => console.log('📄 PDF loaded in modal')}
                    onError={() => {
                      console.error('❌ PDF failed to load in modal');
                      showMessage('error', '❌ Failed to load PDF');
                    }}
                  />
                  
                  {/* Floating Close Button (Alternative) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔄 Floating close button clicked');
                      setShowPDFModal(false);
                      setModalPDFFile(null);
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    title="Close PDF Viewer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Beautiful Message Popup */}
      {message && (
        <MessagePopup
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}
      
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                  Content Extraction 
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  Extract and analyze document content with AI precision
                </p>
              </div>
              {isPolling && (
                <div className="flex items-center gap-3 ml-6 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full border border-blue-200/50 backdrop-blur-sm">
                  <div className="relative">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping"></div>
                  </div>
                  <span className="text-sm font-semibold text-blue-700">Processing...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🔄 Refresh button clicked');
                  loadDashboardData();
                }}
                className="group px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-sm transform hover:scale-105"
              >
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </button>
              
            </div>
          </div>
        </div>
        
        <DashboardTable
          dashboardData={dashboardData}
          files={files}
          onDocIdClick={handleDocIdClick}
          onPreview={handlePreview}
          onNext={onNext}
          getStatusBadge={getStatusBadge}
          isLoading={false}
        />
      </div>

      {/* Document Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[85vh] overflow-hidden shadow-lg">
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{previewFile.name}</span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)]">
              {previewFile.type === 'application/pdf' ? (
                <PDFViewer file={previewFile} onClose={() => setShowPreview(false)} />
              ) : (
                <ImagePreview file={previewFile} onClose={() => setShowPreview(false)} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Document Summary</h3>
                    <p className="text-green-100 text-sm">Document ID: {selectedDocId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
              {summaryData ? (
                <div className="space-y-6">
                  {/* Summary Text */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Executive Summary
                    </h4>
                    <div className="prose prose-green max-w-none">
                      {typeof summaryData === 'string' ? (
                        formatSummaryText(summaryData)
                      ) : summaryData.summary ? (
                        formatSummaryText(summaryData.summary)
                      ) : (
                        <pre className="text-sm text-gray-600 bg-white/50 rounded-lg p-4 overflow-auto">
                          {JSON.stringify(summaryData, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Key Points */}
                  {summaryData.keyPoints && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Key Points
                      </h4>
                      <ul className="space-y-2">
                        {summaryData.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metadata */}
                  {summaryData.metadata && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Document Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(summaryData.metadata).map(([key, value]) => (
                          <div key={key} className="bg-white rounded-lg p-3 border">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-sm text-gray-900">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading summary...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Copy summary to clipboard
                  const summaryText = typeof summaryData === 'string' ? summaryData : JSON.stringify(summaryData, null, 2);
                  navigator.clipboard.writeText(summaryText);
                  showMessage('success', '📋 Summary copied to clipboard!');
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Copy Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentExtraction;