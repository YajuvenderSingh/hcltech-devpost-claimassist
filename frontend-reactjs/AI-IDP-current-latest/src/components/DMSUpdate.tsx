import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, ArrowRight } from 'lucide-react';
import { documentAPI } from '../services/api';
import toast from 'react-hot-toast';

interface DMSUpdateProps {
  documents: any[];
  onNext: () => void;
}

const DMSUpdate: React.FC<DMSUpdateProps> = ({ documents, onNext }) => {
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleUpdateDMS = async () => {
    setUpdating(true);
    try {
      const documentIds = documents.map(doc => doc.documentId);
      await documentAPI.updateDMS(documentIds);
      setUpdated(true);
      toast.success('Documents updated to GW DMS successfully!');
    } catch (error) {
      toast.error('Failed to update DMS');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-hcl-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Indexing and Uploading to DMS System
          </h2>
          <p className="text-gray-600">Update documents to Guidewire DMS</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-center mb-6">
            Indexing and Uploading to DMS System
          </h3>
          
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-hcl-primary text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">DMS Document Name</th>
                  <th className="px-6 py-3 text-left font-medium">Indexing</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 text-blue-600 underline">{doc.name}</td>
                    <td className="px-6 py-4 text-gray-900">{doc.classification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleUpdateDMS}
            disabled={updating || updated}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
              updated 
                ? 'bg-green-600 cursor-not-allowed' 
                : updating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {updating ? 'Updating...' : updated ? 'Updated to GW DMS ✓' : 'Update docs to GW DMS'}
          </button>
        </div>

        {updated && (
          <div className="flex justify-end">
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-3 bg-hcl-primary text-white rounded-lg hover:bg-hcl-darkblue transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DMSUpdate;
