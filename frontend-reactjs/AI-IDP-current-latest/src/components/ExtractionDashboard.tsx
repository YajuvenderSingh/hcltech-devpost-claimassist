import React, { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, FileText, Target, Brain, Hash, BarChart3, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ExtractionStatus {
  classification_status: string;
  extraction_status: string;
  entity_extraction_status: string;
  gw_claim_id: string;
  indexid: string;
  docid: string;
  confidence_score_status: string;
}

interface ExtractionDashboardProps {
  status: ExtractionStatus;
  onClose: () => void;
}

const ExtractionDashboard: React.FC<ExtractionDashboardProps> = ({ status, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (statusValue: string) => {
    if (statusValue === "To Be Processed") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (statusValue === "Completed") return "bg-green-50 text-green-700 border-green-200";
    if (statusValue === "Processing") return "bg-blue-50 text-blue-700 border-blue-200";
    if (statusValue === "Failed") return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (statusValue: string) => {
    if (statusValue === "To Be Processed") return <Clock className="h-3 w-3" />;
    if (statusValue === "Completed") return <CheckCircle className="h-3 w-3" />;
    if (statusValue === "Processing") return <Target className="h-3 w-3 animate-spin" />;
    if (statusValue === "Failed") return <AlertTriangle className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  const statusItems = [
    { label: "Classification", value: status.classification_status, icon: <FileText className="h-4 w-4" /> },
    { label: "Extraction", value: status.extraction_status, icon: <Target className="h-4 w-4" /> },
    { label: "Entity", value: status.entity_extraction_status, icon: <Brain className="h-4 w-4" /> },
    { label: "Confidence", value: status.confidence_score_status, icon: <BarChart3 className="h-4 w-4" /> }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4">
      {/* Compact Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-gray-900">Extraction Status</span>
            </div>
            <div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {status.docid}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Status Row */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {statusItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{item.label}</div>
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(item.value)}`}>
                {getStatusIcon(item.value)}
                <span className="hidden sm:inline">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Index ID:</span>
              <span className="ml-2 font-mono text-gray-900">{status.indexid}</span>
            </div>
            <div>
              <span className="text-gray-500">GW Claim:</span>
              <span className="ml-2 font-mono text-gray-900">{status.gw_claim_id}</span>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            {statusItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-600">{item.icon}</div>
                  <span className="text-gray-700">{item.label}</span>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded border ${getStatusColor(item.value)}`}>
                  {getStatusIcon(item.value)}
                  <span>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractionDashboard;
