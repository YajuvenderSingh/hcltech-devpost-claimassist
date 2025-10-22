import React from 'react';

interface EmailRecord {
  subject: string;
  claim_id: string;
  doc_id: string;
  doc_source: string;
  attachment: string;
  doc_status: string;
  open_date: string;
}

const RecordsDisplay: React.FC = () => {
  const testingData = {
    "statusCode": 200,
    "body": "{\"processed_new_emails\": 0, \"record_details\": \"[{\\\"subject\\\": \\\"Claim forms\\\", \\\"claim_id\\\": \\\"IN307256\\\", \\\"doc_id\\\": \\\"DOC725542\\\", \\\"doc_source\\\": \\\"email\\\", \\\"attachment\\\": \\\"C-2F.pdf\\\", \\\"doc_status\\\": \\\"Processing\\\", \\\"open_date\\\": \\\"20250923:07:30:59\\\"}, {\\\"subject\\\": \\\"Claim forms\\\", \\\"claim_id\\\": \\\"IN307256\\\", \\\"doc_id\\\": \\\"DOC870394\\\", \\\"doc_source\\\": \\\"email\\\", \\\"attachment\\\": \\\"NY_WCB_C-2F.pdf\\\", \\\"doc_status\\\": \\\"Processing\\\", \\\"open_date\\\": \\\"20250923:07:31:01\\\"}, {\\\"subject\\\": \\\"Claim forms\\\", \\\"claim_id\\\": \\\"IN109909\\\", \\\"doc_id\\\": \\\"DOC694455\\\", \\\"doc_source\\\": \\\"email\\\", \\\"attachment\\\": \\\"C-2F.pdf\\\", \\\"doc_status\\\": \\\"New\\\", \\\"open_date\\\": \\\"20250923:06:38:43\\\"}, {\\\"subject\\\": \\\"Claim forms\\\", \\\"claim_id\\\": \\\"IN589630\\\", \\\"doc_id\\\": \\\"DOC115604\\\", \\\"doc_source\\\": \\\"email\\\", \\\"attachment\\\": \\\"NY_WCB_C-2F.pdf\\\", \\\"doc_status\\\": \\\"Completed\\\", \\\"open_date\\\": \\\"20250923:06:51:59\\\"}, {\\\"subject\\\": \\\"Claim forms\\\", \\\"claim_id\\\": \\\"IN109909\\\", \\\"doc_id\\\": \\\"DOC398338\\\", \\\"doc_source\\\": \\\"email\\\", \\\"attachment\\\": \\\"NY_WCB_C-2F.pdf\\\", \\\"doc_status\\\": \\\"New\\\", \\\"open_date\\\": \\\"20250923:06:38:44\\\"}, {\\\"subject\\\": \\\"Claim forms\\\", \\\"claim_id\\\": \\\"IN589630\\\", \\\"doc_id\\\": \\\"DOC253295\\\", \\\"doc_source\\\": \\\"email\\\", \\\"attachment\\\": \\\"C-2F.pdf\\\", \\\"doc_status\\\": \\\"Processing\\\", \\\"open_date\\\": \\\"20250923:06:51:57\\\"}]\"}"
  };

  const parseRecords = (): EmailRecord[] => {
    try {
      const body = JSON.parse(testingData.body);
      return JSON.parse(body.record_details);
    } catch {
      return [];
    }
  };

  const records = parseRecords();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Email Records Details</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doc ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{record.claim_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{record.doc_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.doc_source}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attachment}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    record.doc_status === 'Completed' ? 'bg-green-100 text-green-800' :
                    record.doc_status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {record.doc_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.open_date.replace(/(\d{8}):(\d{2}):(\d{2}):(\d{2})/, '$1 $2:$3:$4')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Total Records: {records.length}
      </div>
    </div>
  );
};

export default RecordsDisplay;
