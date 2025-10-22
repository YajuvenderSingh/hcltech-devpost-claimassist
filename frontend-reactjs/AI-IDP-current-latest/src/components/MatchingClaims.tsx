import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { invokeLambda } from '../services/awsService';
import { Step } from '../App';

interface MatchingClaimsProps {
  onNavigate: (step: Step) => void;
  onDocIdSelect?: (docId: string) => void;
  claimsData?: any;
  docId?: string;
  employeeData?: {
    firstName: string;
    lastName: string;
    lossDate: string;
    docId?: string;
  };
}

const MatchingClaims: React.FC<MatchingClaimsProps> = ({ onNavigate, onDocIdSelect, claimsData, docId, employeeData }) => {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const fetchClaims = async () => {
      if (claimsData) {
        setClaims(Array.isArray(claimsData) ? claimsData : [claimsData]);
        setLoading(false);
        return;
      }

      if (employeeData) {
        try {
          setLoading(true);
          const payload = {
            "FirstName": employeeData.firstName,
            "LastName": employeeData.lastName,
            "LossDate": employeeData.lossDate
          };

          const response = await invokeLambda('nmm_guidewire_fetch_matchingclaims_lambda', payload);
          
          let data = [];
          if (response?.body) {
            try {
              data = JSON.parse(response.body);
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
          
          setClaims(Array.isArray(data) ? data : [data]);
        } catch (error) {
          console.error('Error fetching claims:', error);
          setClaims([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [claimsData, employeeData]);

  const handleMapGW = async () => {
    if (!selectedClaim) return;
    
    const currentDocId = docId || employeeData?.docId;
    if (!currentDocId) return;
    
    try {
      setMappingLoading(true);
      
      const payload = {
        "docid": currentDocId,
        "gw_claim_number": selectedClaim.ClaimNumber || selectedClaim.claimNumber || selectedClaim.claim_number
      };
      
      console.log('Mapping payload:', payload);
      
      const response = await invokeLambda('nmm_map_guidewire_claimnumber', payload);
      console.log('Mapping response:', response);
      
      if (response && response.statusCode === 200) {
        // Call nmm_update_modified_values_lambda after successful mapping
        // Get document classification from dashboard to determine section
        const dashboardPayload = { docid: currentDocId };
        const dashboardResponse = await invokeLambda('nmm_dashboard_lambda', dashboardPayload);
        
        let isLegalDoc = false;
        if (dashboardResponse?.statusCode === 200) {
          const dashboardData = typeof dashboardResponse.body === 'string' 
            ? JSON.parse(dashboardResponse.body) 
            : dashboardResponse.body;
          isLegalDoc = dashboardData.classification?.toLowerCase().includes('legal');
          console.log('🔍 Dashboard classification:', dashboardData.classification);
        }
        
        const sectionName = isLegalDoc ? 'legal_section' : 'claim_details_section';
        console.log('🔍 Is legal document:', isLegalDoc);
        console.log('🔍 Using section:', sectionName);

        const modifiedPayload = {
          "docid": currentDocId,
          "modified_entities": {
            [sectionName]: {
              "claim_administrator_claim_number": {
                "value": selectedClaim.ClaimNumber || selectedClaim.claimNumber || selectedClaim.claim_number
              }
            }
          }
        };
        
        await invokeLambda('nmm_update_modified_values_lambda', modifiedPayload);
        
        // Show success message
        toast.success('GW Claim mapped successfully!');
        
        // Wait 2 seconds then navigate
        setTimeout(() => {
          if (onDocIdSelect) {
            onDocIdSelect(currentDocId);
          }
          onNavigate('extract' as Step);
        }, 2000);
      } else {
        toast.error('Failed to map GW claim');
      }
      
    } catch (error) {
      console.error('Error mapping GW claim:', error);
      toast.error('Error mapping claim. Please try again.');
    } finally {
      setMappingLoading(false);
    }
  };

  const handleRowSelect = (claim: any) => {
    setSelectedClaim(selectedClaim?.ClaimNumber === claim.ClaimNumber ? null : claim);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading matching claims...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('dashboard' as Step)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Matching GW Claims</h2>
              <p className="text-sm text-gray-600">
                {employeeData ? `${employeeData.firstName} ${employeeData.lastName}${employeeData.lossDate ? ` - ${employeeData.lossDate}` : ''}` : 'Select matching claims'}
              </p>
            </div>
          </div>
        </div>

        {/* Records Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {claims.length} matching claims
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Claims Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {claims.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Select
                      </th>
                      {Object.keys(claims[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {claims.map((claim, index) => {
                      const isSelected = selectedClaim?.ClaimNumber === claim.ClaimNumber;
                      return (
                        <tr 
                          key={index} 
                          className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
                          onClick={() => handleRowSelect(claim)}
                        >
                          <td className="px-4 py-4 text-center align-middle">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => handleRowSelect(claim)}
                              className="w-4 h-4 text-blue-600"
                            />
                          </td>
                          {Object.entries(claim).map(([key, value]) => (
                            <td key={key} className="px-4 py-4 text-sm text-gray-900 text-center align-middle">
                              {String(value || 'N/A')}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Map GW Button */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedClaim ? `Selected: ${selectedClaim.ClaimNumber || 'N/A'}` : 'Please select a claim to map'}
                  </div>
                  <button
                    onClick={handleMapGW}
                    disabled={!selectedClaim || mappingLoading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {mappingLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Mapping...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        MAP GW CLAIM
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Claims Found</h3>
                <p className="text-gray-600">No claims match the search criteria.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingClaims;
