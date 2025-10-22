import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DecisionMakingProps {
  onComplete: () => void;
}

const DecisionMaking: React.FC<DecisionMakingProps> = ({ onComplete }) => {
  const [claimSummary, setClaimSummary] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | 'low-confidence' | null>(null);

  const handleDecision = (type: 'approve' | 'reject' | 'low-confidence') => {
    setDecision(type);
    
    // Generate email content based on decision
    let content = '';
    switch (type) {
      case 'approve':
        content = 'Dear Claimant,\n\nWe are pleased to inform you that your claim has been approved after thorough review. The medical documentation provided supports your claim, and all verification checks have passed successfully.\n\nNext steps will be communicated to you shortly.\n\nBest regards,\nNMM Claims Team';
        break;
      case 'reject':
        content = 'Dear Claimant,\n\nAfter careful review of your claim and supporting documentation, we regret to inform you that your claim cannot be approved at this time due to insufficient documentation or policy coverage limitations.\n\nIf you have additional information, please contact our office.\n\nBest regards,\nNMM Claims Team';
        break;
      case 'low-confidence':
        content = 'Dear Claimant,\n\nYour claim is currently under additional review due to some inconsistencies in the documentation. Our team will conduct a more detailed analysis and contact you within 5-7 business days.\n\nThank you for your patience.\n\nBest regards,\nNMM Claims Team';
        break;
    }
    setEmailContent(content);
  };

  const handleSubmit = () => {
    if (!decision) {
      toast.error('Please make a decision first');
      return;
    }
    
    toast.success(`Claim ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'marked for review'} successfully!`);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'approve':
        return <CheckCircle className="w-5 h-5" />;
      case 'reject':
        return <XCircle className="w-5 h-5" />;
      case 'low-confidence':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getDecisionColor = (type: string) => {
    switch (type) {
      case 'approve':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'reject':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'low-confidence':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      default:
        return 'bg-gray-300 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Decision Making and Email Generation</h2>
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            Manage Claims → Breadcrumbs
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claim Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Claim Summary - (Dynamic)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claim Summary
              </label>
              <textarea
                value={claimSummary}
                onChange={(e) => setClaimSummary(e.target.value)}
                placeholder="Enter claim summary details..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Decision Buttons */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Make Decision:</h4>
              <div className="flex flex-col space-y-2">
                {[
                  { type: 'approve', label: 'Approve' },
                  { type: 'reject', label: 'Reject' },
                  { type: 'low-confidence', label: 'Mark as Low Confidence' }
                ].map((option) => (
                  <motion.button
                    key={option.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDecision(option.type as any)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      decision === option.type 
                        ? getDecisionColor(option.type)
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {getDecisionIcon(option.type)}
                    <span className="font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Draft Email Content</h3>
            </div>
            
            <div>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Email content will be generated based on your decision..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {decision && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getDecisionIcon(decision)}
                  <span className="font-medium text-gray-700">
                    Decision: {decision.charAt(0).toUpperCase() + decision.slice(1).replace('-', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Email template has been generated based on your decision.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!decision}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Submit Decision
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default DecisionMaking;
