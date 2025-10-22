import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface MessagePopupProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ 
  type, 
  message, 
  onClose, 
  duration = 4000 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-6 w-6" />;
      case 'error': return <XCircle className="h-6 w-6" />;
      case 'warning': return <AlertCircle className="h-6 w-6" />;
      case 'info': return <Info className="h-6 w-6" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': 
        return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-200';
      case 'error': 
        return 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-200';
      case 'warning': 
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-200';
      case 'info': 
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${getStyles()} min-w-[320px] max-w-md`}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MessagePopup;
