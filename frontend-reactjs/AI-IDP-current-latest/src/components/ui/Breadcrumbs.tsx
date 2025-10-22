import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Step } from '../../App';

interface BreadcrumbsProps {
  currentStep: Step;
  userRole: 'Uploader' | 'Adjuster';
  onNavigate: (step: Step) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentStep, userRole, onNavigate }) => {
  const getStepLabel = (step: Step): string => {
    const labels: { [key in Step]: string } = {
      login: 'Login',
      dashboard: 'Dashboard',
      upload: 'Upload',
      extract: 'Extract',
      verify: 'Verify',
      matching: 'Matching',
      'matching-claims': 'Claims',
      dms: 'DMS',
      decision: 'Decision'
    };
    return labels[step] || step;
  };

  const getBreadcrumbPath = (): { step: Step; label: string; clickable: boolean }[] => {
    if (currentStep === 'dashboard') {
      return [];
    }

    const path: { step: Step; label: string; clickable: boolean }[] = [];

    // Role-specific paths
    if (userRole === 'Adjuster') {
      // Adjuster workflow: Claims > Decision
      if (currentStep === 'matching-claims') {
        path.push({ step: currentStep, label: getStepLabel(currentStep), clickable: false });
      } else if (currentStep === 'decision') {
        path.push({ step: 'matching-claims' as Step, label: 'Claims', clickable: true });
        path.push({ step: currentStep, label: getStepLabel(currentStep), clickable: false });
      } else {
        // Other steps for adjuster
        path.push({ step: currentStep, label: getStepLabel(currentStep), clickable: false });
      }
    } else {
      // Uploader workflow: Upload > Extract > Verify > Matching > DMS
      const uploaderFlow: Step[] = ['upload', 'extract', 'verify', 'matching', 'dms'];
      const currentIndex = uploaderFlow.indexOf(currentStep);
      
      if (currentIndex >= 0) {
        // Add all steps up to current
        for (let i = 0; i <= currentIndex; i++) {
          path.push({
            step: uploaderFlow[i],
            label: getStepLabel(uploaderFlow[i]),
            clickable: i < currentIndex
          });
        }
      } else {
        // Fallback for other steps
        path.push({ step: currentStep, label: getStepLabel(currentStep), clickable: false });
      }
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-center space-x-2 text-sm">
          <Home className="w-4 h-4 text-gray-500" />
          
          {breadcrumbPath.length > 0 && (
            <>
              {breadcrumbPath.map((item, index) => (
                <React.Fragment key={item.step}>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  
                  {item.clickable ? (
                    <button
                      onClick={() => onNavigate(item.step)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium bg-blue-50 px-2 py-1 rounded">
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumbs;
