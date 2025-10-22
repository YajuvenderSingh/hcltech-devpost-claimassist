import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FileTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FileTypeSelector: React.FC<FileTypeSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    'Claim Form',
    'Medical Report', 
    'Receipt/Invoice',
    'Identification',
    'Other Document'
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-700 hover:border-gray-300 flex items-center justify-between"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-32 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span>{option}</span>
                {value === option && <Check className="w-3 h-3 text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FileTypeSelector;
