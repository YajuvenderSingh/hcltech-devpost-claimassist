import React, { useState, useEffect } from 'react';

interface EmailRecord {
  docId: string;
  indexId: string;
  subject: string;
}

const EmailProcessing: React.FC = () => {
  const [records, setRecords] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/email-records');
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocIdClick = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const payload = { docid: docId };
    console.log('DOC ID clicked - Payload:', JSON.stringify(payload));
    
    try {
      await fetch('/api/email-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error sending DOC ID payload:', error);
    }
  };

  const handleIndexIdClick = async (e: React.MouseEvent, indexId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const payload = { indexid: indexId };
    console.log('Index ID clicked - Payload:', JSON.stringify(payload));
    
    try {
      await fetch('/api/email-processing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error sending Index ID payload:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading email records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Email Processing</h2>
        <p className="text-gray-600 mt-1">Click on Document ID or Index ID to process</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No email records found
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => handleDocIdClick(e, record.docId)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        {record.docId}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => handleIndexIdClick(e, record.indexId)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                      >
                        {record.indexId}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={record.subject}>
                        {record.subject}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailProcessing;
