import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Upload, 
  FileText, 
  CheckCircle, 
  Search, 
  Database, 
  Gavel,
  X,
  Activity,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';
import { User, Step } from '../../App';

interface SidebarProps {
  user: User;
  currentStep: Step;
  onNavigate: (step: Step) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentStep, onNavigate, onClose }) => {
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'indigo' },
    { id: 'upload', label: 'Document Upload', icon: Upload, color: 'blue' },
    { id: 'extract', label: 'Content Extraction', icon: FileText, color: 'green' },
    { id: 'verify', label: 'Verification', icon: CheckCircle, color: 'emerald' },
    { id: 'matching', label: 'Claim Matching', icon: Search, color: 'orange' },
    { id: 'dms', label: 'DMS Update', icon: Database, color: 'purple' },
    { id: 'decision', label: 'Decision Making', icon: Gavel, color: 'red' }
  ];

  const quickStats = [
    { label: 'Active Claims', value: '24', trend: '+12%' },
    { label: 'Processed Today', value: '8', trend: '+5%' },
    { label: 'Success Rate', value: '94%', trend: '+2%' }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">NMM-FLOW</h2>
              <p className="text-xs text-gray-500">Claims System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 m-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-600 truncate">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
        <div className="space-y-3">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-3"
            >
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-600">{stat.label}</p>
                <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Navigation</h3>
        <nav className="space-y-2">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentStep === item.id;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onNavigate(item.id as Step);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  isActive 
                    ? 'bg-white/20' 
                    : `bg-${item.color}-100`
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isActive 
                      ? 'text-white' 
                      : `text-${item.color}-600`
                  }`} />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeStep"
                    className="ml-auto w-2 h-2 bg-white rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">Help & Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;