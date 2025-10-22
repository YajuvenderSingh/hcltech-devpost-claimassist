
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Settings,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Home,
  ChevronRight
} from 'lucide-react';
import { User, Step } from '../../App';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  currentStep: Step;
  onNavigate: (step: Step) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar, sidebarOpen, currentStep, onNavigate }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

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

    if (user.role === 'Adjuster') {
      // Adjuster workflow: Dashboard → Claims Dashboard → Matching Claims → Decision
      if (currentStep === 'matching-claims') {
        path.push({ step: 'dashboard' as Step, label: 'Claims Dashboard', clickable: true });
        path.push({ step: currentStep, label: 'Matching Claims', clickable: false });
      } else if (currentStep === 'decision') {
        path.push({ step: 'dashboard' as Step, label: 'Claims Dashboard', clickable: true });
        path.push({ step: 'matching-claims' as Step, label: 'Matching Claims', clickable: true });
        path.push({ step: currentStep, label: 'Decision', clickable: false });
      } else if (currentStep === 'extract') {
        // When adjuster is viewing document details
        path.push({ step: 'dashboard' as Step, label: 'Claims Dashboard', clickable: true });
        path.push({ step: 'matching-claims' as Step, label: 'Matching Claims', clickable: true });
        path.push({ step: currentStep, label: 'Document Details', clickable: false });
      }
      // For dashboard or any other step, path remains empty
    } else {
      const uploaderFlow: Step[] = ['upload', 'extract', 'verify', 'matching', 'dms'];
      const currentIndex = uploaderFlow.indexOf(currentStep);
      
      if (currentIndex >= 0) {
        for (let i = 0; i <= currentIndex; i++) {
          path.push({
            step: uploaderFlow[i],
            label: getStepLabel(uploaderFlow[i]),
            clickable: i < currentIndex
          });
        }
      } else {
        path.push({ step: currentStep, label: getStepLabel(currentStep), clickable: false });
      }
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="px-16">
        <div className="flex justify-between items-center h-12">
          
          {/* Left: App Title as Logo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleSidebar}
              className="p-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                // Navigate back one step based on current step and user role
                if (currentStep === 'extract') {
                  onNavigate(user.role === 'Adjuster' ? 'dashboard' : 'upload');
                } else if (currentStep === 'verify') {
                  onNavigate('extract');
                } else if (currentStep === 'matching-claims') {
                  onNavigate('dashboard');
                } else {
                  // Default: go to role-appropriate home
                  onNavigate(user.role === 'Adjuster' ? 'dashboard' : 'upload');
                }
              }}
              className="hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <h1 className="text-base font-semibold tracking-tight text-blue-600 hover:text-blue-800">
                HCLTech AI IDP
              </h1>
              <p className="text-[11px] text-gray-600">
                Intelligent Document Processing
              </p>
            </button>
          </div>

          {/* Center: Empty space */}
          <div className="flex-1"></div>

          {/* Right: User */}
          <div className="flex items-center space-x-1">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.email} className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Email */}
                <p className="text-sm text-gray-600 font-medium truncate max-w-[150px]">
                  {user.email}
                </p>

                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900 text-sm">{user.role}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </button>

                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    <hr className="my-1" />

                    <button
                      onClick={onLogout}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
