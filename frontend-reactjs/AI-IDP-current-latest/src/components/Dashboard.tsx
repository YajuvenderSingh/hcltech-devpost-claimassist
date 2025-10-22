import React, { useState, useEffect } from 'react';
import { FileText, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { invokeLambda } from '../services/awsService';
import { Step } from '../App';

interface DashboardProps {
  onNavigate: (step: Step) => void;
  onDocIdSelect: (docId: string) => void;
  onClaimsNavigate?: (employeeData: any) => void;
  userRole: string;
}

interface DashboardItem {
  doc_id: string;
  indexid: string;
  classification: string;
  employee_first_name?: string;
  employee_last_name?: string;
  [key: string]: any; // Allow additional fields from API
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onDocIdSelect, onClaimsNavigate, userRole }) => {
  const [dashboardData, setDashboardData] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('payload {}');
      
      const response = await invokeLambda('nmm_claim_adjuster_dashboard', {});
      console.log('response', response);
      
      let data: DashboardItem[] = [];
      
      if (response?.statusCode === 200 && response?.body) {
        try {
          // Parse the response body which contains JSON string
          const parsedBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
          data = Array.isArray(parsedBody) ? parsedBody : [];
          console.log('Parsed dashboard data:', data); // Debug log
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
      
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboardData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    if (userRole === 'adjuster' || userRole === 'Adjuster') {
      loadDashboardData();
    } else {
      // For non-adjuster users, still show loading briefly to prevent flash
      setTimeout(() => setLoading(false), 100);
    }
  }, [userRole]);

  // Filter data by search term
  const getFilteredData = React.useCallback(() => {
    if (!searchTerm) return dashboardData;
    
    return dashboardData.filter(item =>
      item.doc_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indexid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee_last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dashboardData, searchTerm]);

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDocIdClick = (docId: string) => {
    if (onDocIdSelect) {
      onDocIdSelect(docId);
    }
    onNavigate('extract' as Step);
  };

  const handleGetMatchingClaims = async (docId: string) => {
    try {
      setLoadingClaims(prev => ({ ...prev, [docId]: true }));
      
      const docData = dashboardData.find(item => item.doc_id === docId);
      if (!docData) return;

      console.log('🔍 Full docData:', docData);
      console.log('🔍 All docData keys:', Object.keys(docData));

      // Call the actual lambda function
      const employeeData = {
        firstName: docData.employee_first_name,
        lastName: docData.employee_last_name,
        lossDate: docData.date_of_injury || docData.loss_date,
        docId: docId
      };

      // Call lambda but don't auto-navigate
      if (onClaimsNavigate) {
        await onClaimsNavigate(employeeData);
      }

      // Also call nmm_update_modified_values_lambda with claim number
      const gwClaimId = docData.gw_claim_id;
      console.log('🔍 GW Claim ID found:', gwClaimId);
      
      if (gwClaimId && gwClaimId !== 'Not Available') {
        try {
          // Determine section based on document classification
          const isLegalDoc = docData.classification?.toLowerCase().includes('legal') || 
                           docData.document_type?.toLowerCase().includes('legal') ||
                           docData.type?.toLowerCase().includes('legal');
          const sectionName = isLegalDoc ? 'legal_section' : 'claim_details_section';
          
          console.log('🔍 Document classification:', docData.classification);
          console.log('🔍 Is legal document:', isLegalDoc);
          console.log('🔍 Using section:', sectionName);

          const updatePayload = {
            docid: docId,
            modified_entities: {
              [sectionName]: {
                claim_administrator_claim_number: {
                  value: gwClaimId
                }
              }
            }
          };
          
          console.log('📤 Calling nmm_update_modified_values_lambda with payload:', JSON.stringify(updatePayload, null, 2));
          const updateResponse = await invokeLambda('nmm_update_modified_values_lambda', updatePayload);
          console.log('📥 Update response:', updateResponse);
          
          if (updateResponse?.statusCode === 200) {
            console.log('✅ Modified values updated successfully');
            toast.success('Claim number updated in system');
          } else {
            console.log('⚠️ Update response not 200:', updateResponse?.statusCode);
            toast.error('Claim mapping completed but update may have failed');
          }
        } catch (updateError) {
          console.error('❌ Failed to update modified values:', updateError);
          toast.error('Failed to update claim number in system');
        }
      } else {
        console.log('⚠️ No valid GW Claim ID to update');
      }
      
      // Show success message instead of auto-navigation
      toast.success('Claims mapping completed successfully');
      
    } catch (error) {
      console.error('Error getting matching claims:', error);
      toast.error('Failed to map claims');
    } finally {
      setLoadingClaims(prev => ({ ...prev, [docId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Claims Dashboard</h2>
              <p className="text-sm text-gray-600">Review and process insurance claims</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
            </div>
            
            <button
              onClick={() => {
                setLoading(true);
                setDashboardData([]);
                if (userRole === 'adjuster' || userRole === 'Adjuster') {
                  loadDashboardData();
                } else {
                  setTimeout(() => setLoading(false), 100);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Records Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredData.length)} of {filteredData.length} records
          {searchTerm && (
            <span className="ml-2 text-blue-600 font-medium">
              (filtered from {dashboardData.length} total)
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading claims data...</p>
              </div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Document ID</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Index ID</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Classification</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item) => (
                    <tr key={item.doc_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-center align-middle">
                        <button
                          onClick={() => handleDocIdClick(item.doc_id)}
                          className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          {item.doc_id}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <span className="text-sm text-gray-900 font-medium">
                          {item.indexid}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.classification}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-center align-middle">
                        {item.employee_first_name && item.employee_last_name 
                          ? `${item.employee_first_name} ${item.employee_last_name}`
                          : item.employee_first_name || item.employee_last_name || 'N/A'
                        }
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <button
                          onClick={() => handleGetMatchingClaims(item.doc_id)}
                          disabled={loadingClaims[item.doc_id]}
                          className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                        >
                          {loadingClaims[item.doc_id] ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              Loading...
                            </>
                          ) : (
                            'GET CLAIMS'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No matching claims found' : 'No Claims Available'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search term or clear the search to see all claims.'
                    : 'There are no claims to review at this time.'
                  }
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredData.length > recordsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
