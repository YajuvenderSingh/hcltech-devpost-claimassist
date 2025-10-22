// Simple Validation Component - Add this to your ContentExtraction component

// 1. Add to state variables:
const [validationData, setValidationData] = useState<any>(null);
const [validationLoading, setValidationLoading] = useState(false);

// 2. Add validation function:
const handleGenerateValidationForDoc = async (docId: string) => {
  try {
    setValidationLoading(true);
    console.log('🔍 Generating validation for docId:', docId);
    
    const payload = { docid: docId };
    console.log('📤 Validation payload:', JSON.stringify(payload, null, 2));
    
    const response = await invokeLambda('nmm_doc_validation_lambda', payload);
    console.log('📥 Validation response:', response);
    
    if (response && response.statusCode === 200) {
      let validationContent;
      try {
        validationContent = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      } catch (parseError) {
        validationContent = {
          validation: response.body || 'Validation response received but could not be parsed',
          status: 'parsed_error'
        };
      }
      
      setValidationData(validationContent);
      console.log('✅ Validation set successfully');
    } else {
      setValidationData({
        validation: `Validation not available for document ${docId}`,
        status: 'unavailable'
      });
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
    setValidationData({
      validation: `Error generating validation for document ${docId}`,
      status: 'error'
    });
  } finally {
    setValidationLoading(false);
  }
};

// 3. Add JSX component (add this after the summary section):
{/* Validation Section */}
{selectedDocId && (
  <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">✅ Document Validation</h3>
      <button
        onClick={() => selectedDocId && handleGenerateValidationForDoc(selectedDocId)}
        disabled={validationLoading || !selectedDocId}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
      >
        {validationLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Run Validation
      </button>
    </div>
    
    <div className="p-4">
      {validationLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-green-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Running validation...</span>
        </div>
      ) : validationData ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
            {typeof validationData === 'object' ? JSON.stringify(validationData, null, 2) : validationData}
          </pre>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No validation data available. Click "Run Validation" to validate the document.</p>
        </div>
      )}
    </div>
  </div>
)}

// This will:
// - Call nmm_doc_validation_lambda with payload: {"docid": "DOC436075"}
// - Display the validation results
// - Handle loading states and errors
