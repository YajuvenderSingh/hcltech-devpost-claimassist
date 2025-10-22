import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import EntityExtractionDashboard from './EntityExtractionDashboard';

const EntityDashboardTest: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Entity Extraction Dashboard Test
          </h2>
          <p className="text-gray-600 mb-6">
            Click the button below to test the Entity Extraction Dashboard functionality.
          </p>
          <button
            onClick={() => setShowDashboard(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Brain className="w-5 h-5" />
            <span>Open Entity Dashboard</span>
          </button>
        </div>
      </div>

      {showDashboard && (
        <EntityExtractionDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
};

export default EntityDashboardTest;
