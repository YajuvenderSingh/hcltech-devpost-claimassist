import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { OrchestrationState } from '../../hooks/useOrchestration';

interface OrchestrationStatusProps {
  state: OrchestrationState;
  className?: string;
}

const OrchestrationStatus: React.FC<OrchestrationStatusProps> = ({ state, className = '' }) => {
  if (state.status === 'idle') return null;

  const getStatusIcon = () => {
    switch (state.status) {
      case 'starting':
      case 'processing':
      case 'validating':
      case 'completing':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'starting':
        return 'Starting workflow...';
      case 'processing':
        return 'Processing documents...';
      case 'validating':
        return 'Validating claims...';
      case 'completing':
        return 'Completing workflow...';
      case 'completed':
        return 'Workflow completed successfully';
      case 'error':
        return `Error: ${state.error}`;
      default:
        return 'Workflow status unknown';
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border rounded-lg p-3 ${getStatusColor()} ${className}`}
    >
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">{getStatusText()}</p>
          {state.workflowId && (
            <p className="text-xs opacity-75 mt-1">
              Workflow ID: {state.workflowId.split(':').pop()?.substring(0, 8)}...
            </p>
          )}
        </div>
        {state.progress > 0 && state.status !== 'completed' && state.status !== 'error' && (
          <div className="w-16">
            <div className="bg-white bg-opacity-50 rounded-full h-2">
              <motion.div
                className="bg-current h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-center mt-1">{state.progress}%</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrchestrationStatus;
