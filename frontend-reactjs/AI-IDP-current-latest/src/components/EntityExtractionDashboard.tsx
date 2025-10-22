import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Brain,
  Target,
  BarChart3,
  X
} from 'lucide-react';
import { fetchDashboardStatus, fetchExtractedEntities } from '../services/awsService';
import { usePolling } from '../hooks/usePolling';

interface DocumentStatus {
  docid: string;
  classification_status: string;
  extraction_status: string;
  entity_extraction_status: string;
  confidence_score_status: string;
  gw_claim_id?: string;
  indexid?: string;
}

interface ExtractedEntity {
  entity_type: string;
  entity_value: string;
  confidence: number;
  page_number?: number;
  bounding_box?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface EntityExtractionDashboardProps {
  onClose: () => void;
}

const EntityExtractionDashboard: React.FC<EntityExtractionDashboardProps> = ({ onClose }) => {
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetchDashboardStatus();
      
      if (response && response.documents) {
        setDocuments(response.documents);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to fetch document status');
    }
  }, []);

  // Check if all documents have completed entity extraction
  const allEntitiesCompleted = useCallback(() => {
    return documents.length > 0 && documents.every((doc: DocumentStatus) => 
      doc.entity_extraction_status === 'Completed'
    );
  }, [documents]);

  const { isPolling, stopPolling, startPolling } = usePolling(
    fetchDashboardData,
    {
      interval: 5000,
      enabled: true,
      stopCondition: allEntitiesCompleted
    }
  );

  const fetchEntities = useCallback(async (docId: string) => {
    setIsLoadingEntities(true);
    try {
      const response = await fetchExtractedEntities(docId);
      
      if (response && response.entities) {
        setExtractedEntities(response.entities);
      } else {
        setExtractedEntities([]);
      }
    } catch (err) {
      console.error('Failed to fetch extracted entities:', err);
      setExtractedEntities([]);
    } finally {
      setIsLoadingEntities(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedDocId) {
      fetchEntities(selectedDocId);
    }
  }, [selectedDocId, fetchEntities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'To Be Processed': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4 animate-spin" />;
      case 'To Be Processed': return <Clock className="w-4 h-4" />;
      case 'Failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleDocIdClick = (docId: string) => {
    setSelectedDocId(docId);
  };

  const handleRefresh = () => {
    startPolling();
    fetchDashboardData();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-5/6 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Entity Extraction Dashboard</h2>
            {isPolling() && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Auto-refreshing...</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Document List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Document Status</h3>
              <p className="text-sm text-gray-600">
                {documents.length} documents • Click on Doc ID to view entities
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.docid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDocId === doc.docid 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDocIdClick(doc.docid)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-mono text-sm font-medium flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{doc.docid}</span>
                    </button>
                    {doc.gw_claim_id && (
                      <span className="text-xs text-gray-500 font-mono">
                        {doc.gw_claim_id}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Classification:</span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${getStatusColor(doc.classification_status)}`}>
                        {getStatusIcon(doc.classification_status)}
                        <span>{doc.classification_status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Extraction:</span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${getStatusColor(doc.extraction_status)}`}>
                        {getStatusIcon(doc.extraction_status)}
                        <span>{doc.extraction_status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Entity:</span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${getStatusColor(doc.entity_extraction_status)}`}>
                        {getStatusIcon(doc.entity_extraction_status)}
                        <span>{doc.entity_extraction_status}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${getStatusColor(doc.confidence_score_status)}`}>
                        {getStatusIcon(doc.confidence_score_status)}
                        <span>{doc.confidence_score_status}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {documents.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No documents found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Extracted Entities */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Extracted Entities</h3>
              {selectedDocId ? (
                <p className="text-sm text-gray-600">
                  Entities for document: <span className="font-mono text-blue-600">{selectedDocId}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-600">Select a document to view extracted entities</p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {!selectedDocId ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Select a Document</p>
                  <p>Click on a document ID to view its extracted entities</p>
                </div>
              ) : isLoadingEntities ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-gray-600">Loading entities...</p>
                </div>
              ) : extractedEntities.length > 0 ? (
                <div className="space-y-3">
                  {extractedEntities.map((entity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{entity.entity_type}</h4>
                          <p className="text-gray-700 font-mono text-sm bg-white px-2 py-1 rounded border">
                            {entity.entity_value}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {(entity.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          {entity.page_number && (
                            <p className="text-xs text-gray-500 mt-1">
                              Page {entity.page_number}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {entity.bounding_box && (
                        <div className="text-xs text-gray-500 mt-2 font-mono">
                          Position: ({entity.bounding_box.left}, {entity.bounding_box.top}) 
                          Size: {entity.bounding_box.width}×{entity.bounding_box.height}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No Entities Found</p>
                  <p>No extracted entities available for this document</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EntityExtractionDashboard;
