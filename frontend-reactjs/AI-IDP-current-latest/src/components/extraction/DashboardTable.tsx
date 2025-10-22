import React from 'react';
import { Eye, RefreshCw, FileText, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import Loader from '../ui/Loader';

interface DashboardTableProps {
  dashboardData: any;
  files: any[];
  onDocIdClick: (docId: string, index: number) => void;
  onPreview: (docId: string) => void;
  onNext: (files: any[]) => void;
  getStatusBadge: (status: string) => string;
  isLoading?: boolean;
}

const DashboardTable: React.FC<DashboardTableProps> = ({
  dashboardData,
  files,
  onDocIdClick,
  onPreview,
  onNext,
  getStatusBadge,
  isLoading = false
}) => {
  const getData = (data: any, key: string, fallback: string = 'N/A') => {
    return data?.[key] || fallback;
  };

  const getStatusIcon = (status: string) => {
    if (status === "Completed") return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === "Processing") return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    if (status === "To Be Processed") return <Clock className="h-4 w-4 text-yellow-600" />;
    if (status === "Failed") return <AlertTriangle className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-green-100 text-green-800 border-green-200";
    if (status === "Processing") return "bg-blue-100 text-blue-800 border-blue-200";
    if (status === "To Be Processed") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (status === "Failed") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const renderConfidenceScore = (score: string) => {
    if (!score || score === 'N/A') {
      return (
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">N/A</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
      );
    }
    
    const numericScore = parseInt(score.replace('%', ''));
    let colorClass = 'bg-gray-400';
    
    if (numericScore >= 90) {
      colorClass = 'bg-green-500';
    } else if (numericScore >= 70) {
      colorClass = 'bg-yellow-500';
    } else if (numericScore >= 50) {
      colorClass = 'bg-orange-500';
    } else {
      colorClass = 'bg-red-500';
    }
    
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-700 font-medium">{score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`${colorClass} h-2 rounded-full transition-all duration-300`} 
            style={{ width: `${numericScore}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader text="Loading documents..." />
        </div>
      ) : Object.keys(dashboardData).length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-16 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Doc ID</th>
                <th className="w-16 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Classification</th>
                <th className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Extraction Status</th>
                <th className="w-24 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Classification Status</th>
                <th className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Entity Extraction</th>
                <th className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Confidence Score</th>
                <th className="w-20 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>GW Claim ID</th>
                <th className="w-16 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Doc Source</th>
                <th className="w-12 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{fontSize: '10px'}}>Language</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(dashboardData).map(([docId, data], index) => (
                <tr key={docId} className="hover:bg-gray-50 transition-colors">
                  <td className="w-16 px-2 py-2 text-center">
                    <button
                      onClick={() => onDocIdClick(docId, index)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline font-mono truncate block w-full text-center transition-colors"
                      title={docId}
                    >
                      {docId}
                    </button>
                  </td>
                  
                  <td className="w-16 px-2 py-2 text-center">
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 truncate">
                      {getData(data, 'classification')}
                    </span>
                  </td>
                  
                  <td className="w-20 px-2 py-2 text-center">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(getData(data, 'extraction_status'))}
                      <span className={`ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium border ${getStatusColor(getData(data, 'extraction_status'))}`}>
                        {getData(data, 'extraction_status')}
                      </span>
                    </div>
                  </td>
                  
                  <td className="w-24 px-2 py-2 text-center">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(getData(data, 'classification_status'))}
                      <span className={`ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium border ${getStatusColor(getData(data, 'classification_status'))}`}>
                        {getData(data, 'classification_status')}
                      </span>
                    </div>
                  </td>
                  
                  <td className="w-20 px-2 py-2 text-center">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(getData(data, 'entity_extraction_status'))}
                      <span className={`ml-1 inline-flex items-center px-1 py-0.5 rounded text-xs font-medium border ${getStatusColor(getData(data, 'entity_extraction_status'))}`}>
                        {getData(data, 'entity_extraction_status')}
                      </span>
                    </div>
                  </td>
                  
                  <td className="w-20 px-2 py-2 text-center">
                    <div className="w-full flex justify-center">
                      {renderConfidenceScore(getData(data, 'document_conf_score'))}
                    </div>
                  </td>
                  
                  <td className="w-20 px-2 py-2 text-center">
                    <span className="text-xs font-mono text-gray-900 truncate block" title={getData(data, 'gw_claim_id')}>
                      {getData(data, 'gw_claim_id') === 'Not Available' ? (
                        <span className="text-gray-400 italic">Not Available</span>
                      ) : (
                        getData(data, 'gw_claim_id')
                      )}
                    </span>
                  </td>
                  
                  <td className="w-16 px-2 py-2 text-center">
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {getData(data, 'doc_source')}
                    </span>
                  </td>
                  
                  <td className="w-12 px-2 py-2 text-center">
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {getData(data, 'doc_language', 'Unknown')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">Upload documents to see processing status</p>
        </div>
      )}
    </div>
  );
};

export default DashboardTable;
