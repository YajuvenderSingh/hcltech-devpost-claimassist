import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface EntityCarouselProps {
  entitiesBySection: any;
  selectedDocId: string | null;
  onTabSelect: (sectionName: string) => void;
  onReset?: () => void;
}

const EntityCarousel: React.FC<EntityCarouselProps> = ({
  entitiesBySection,
  selectedDocId,
  onTabSelect,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const sectionNames = Object.keys(entitiesBySection);

  // Set initial active tab
  useEffect(() => {
    if (sectionNames.length > 0 && !activeTab) {
      setActiveTab(sectionNames[0]);
    }
  }, [sectionNames, activeTab]);

  const handleTabClick = (sectionName: string) => {
    setActiveTab(sectionName);
    onTabSelect(sectionName); // This no longer changes document ID
  };

  const handlePrevious = () => {
    const currentIndex = sectionNames.indexOf(activeTab);
    if (currentIndex > 0) {
      const prevSection = sectionNames[currentIndex - 1];
      handleTabClick(prevSection);
    }
  };

  const handleNext = () => {
    const currentIndex = sectionNames.indexOf(activeTab);
    if (currentIndex < sectionNames.length - 1) {
      const nextSection = sectionNames[currentIndex + 1];
      handleTabClick(nextSection);
    }
  };

  if (sectionNames.length === 0) {
    return null;
  }

  const currentIndex = sectionNames.indexOf(activeTab);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Document Sections:</span>
          <span className="text-xs text-gray-500">({sectionNames.length} sections)</span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close document"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex items-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-2 ${
            currentIndex === 0 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          } transition-colors`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tabs Container */}
        <div className="flex-1 flex overflow-x-auto scrollbar-hide">
          {sectionNames.map((sectionName) => (
            <button
              key={sectionName}
              onClick={() => handleTabClick(sectionName)}
              className={`flex-shrink-0 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap ${
                activeTab === sectionName
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              {sectionName}
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={currentIndex === sectionNames.length - 1}
          className={`p-2 ${
            currentIndex === sectionNames.length - 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          } transition-colors`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EntityCarousel;
