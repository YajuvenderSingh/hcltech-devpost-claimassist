import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, FileText, Upload, CheckCircle, BarChart3, Search, Database } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  currentStep: string;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentStep, onLogout }) => {
  const steps = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'upload', label: 'Document Upload', icon: Upload },
    { id: 'extract', label: 'Content Extraction', icon: FileText },
    { id: 'verify', label: 'Verification', icon: CheckCircle },
    { id: 'matching', label: 'Claim Matching', icon: Search },
    { id: 'dms', label: 'DMS Update', icon: Database },
    { id: 'decision', label: 'Decision Making', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-hcl-gray-50">
      {/* Header */}
      <header className="bg-hcl-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white">
                  Manage Claims
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-white">
                <span>{user?.role}</span>
                <User className="w-5 h-5" />
                <span className="font-medium">{user.name}</span>
                <span className="text-hcl-gray-500">({user.role})</span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 text-hcl-gray-500 hover:text-hcl-primary transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-hcl-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: isActive ? '#007bff' : isCompleted ? '#28a745' : '#e9ecef',
                        color: isActive || isCompleted ? '#FFFFFF' : '#6c757d'
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-hcl-primary' : isCompleted ? 'text-hcl-success' : 'text-hcl-gray-500'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div className="h-0.5 bg-hcl-gray-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          className="h-full bg-hcl-success"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
