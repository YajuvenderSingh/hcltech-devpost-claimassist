import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Search } from 'lucide-react';

interface MatchingClaim {
  gwClaimId: string;
  claimType: string;
  name: string;
  address: string;
  selected: boolean;
}

interface ClaimMatchingProps {
  onNext: (selectedClaim: MatchingClaim) => void;
}

const ClaimMatching: React.FC<ClaimMatchingProps> = ({ onNext }) => {
  const [matchingClaims, setMatchingClaims] = useState<MatchingClaim[]>([
    { gwClaimId: 'CL12345', claimType: 'Cancer', name: 'Wdsdsdd', address: '', selected: false },
    { gwClaimId: 'CL12346', claimType: 'Cancer', name: 'Wdsdsdd', address: '', selected: true },
    { gwClaimId: 'CL12347', claimType: 'HI', name: 'Wdsdsdd', address: '', selected: false },
    { gwClaimId: 'CL12348', claimType: 'HI', name: 'Wdsdsdd', address: '', selected: false }
  ]);

  const handleSelect = (gwClaimId: string) => {
    setMatchingClaims(prev => 
      prev.map(claim => ({
        ...claim,
        selected: claim.gwClaimId === gwClaimId
      }))
    );
  };

  const handleMapToClaim = () => {
    const selectedClaim = matchingClaims.find(claim => claim.selected);
    if (selectedClaim) {
      onNext(selectedClaim);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            <h2 className="font-medium text-sm">Claim Matching</h2>
          </div>
          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Step 4 of 4
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Matching GW Claims</h2>
        
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left font-medium">GW Claim Id</th>
                <th className="px-6 py-3 text-left font-medium">Claim Type</th>
                <th className="px-6 py-3 text-left font-medium">Name</th>
                <th className="px-6 py-3 text-left font-medium">Address</th>
                <th className="px-6 py-3 text-left font-medium">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {matchingClaims.map((claim, index) => (
                <motion.tr
                  key={claim.gwClaimId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`hover:bg-gray-50 transition-colors ${
                    claim.selected ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{claim.gwClaimId}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{claim.claimType}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{claim.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{claim.address}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSelect(claim.gwClaimId)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        claim.selected 
                          ? 'bg-black border-black text-white' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {claim.selected && <CheckCircle className="w-5 h-5" />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMapToClaim}
            disabled={!matchingClaims.some(claim => claim.selected)}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Map to this GW Claim
          </motion.button>
        </div>
      </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimMatching;
