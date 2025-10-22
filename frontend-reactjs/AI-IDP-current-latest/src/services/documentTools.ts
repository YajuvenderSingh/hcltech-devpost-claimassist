export interface DocumentTool {
  name: string;
  description: string;
  parameters: any;
}

export const documentTools: DocumentTool[] = [
  {
    name: "search_documents",
    description: "Search for documents by type, status, or content",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        document_type: { type: "string", enum: ["medical", "invoice", "xray", "all"] },
        status: { type: "string", enum: ["uploaded", "processing", "extracted", "verified", "all"] }
      },
      required: ["query"]
    }
  },
  {
    name: "get_document_status",
    description: "Get the current status of a specific document",
    parameters: {
      type: "object",
      properties: {
        document_id: { type: "string", description: "Document ID to check" }
      },
      required: ["document_id"]
    }
  },
  {
    name: "explain_extraction",
    description: "Explain the extracted data from a document",
    parameters: {
      type: "object",
      properties: {
        document_id: { type: "string", description: "Document ID" },
        field: { type: "string", description: "Specific field to explain (optional)" }
      },
      required: ["document_id"]
    }
  },
  {
    name: "processing_guidance",
    description: "Provide guidance for the current processing step",
    parameters: {
      type: "object",
      properties: {
        step: { type: "string", enum: ["upload", "extract", "verify", "decision"] },
        user_role: { type: "string", enum: ["Uploader", "Adjuster"] }
      },
      required: ["step"]
    }
  }
];

export class DocumentToolHandler {
  static async executeToolCall(toolName: string, parameters: any, context: any): Promise<string> {
    switch (toolName) {
      case "search_documents":
        return this.searchDocuments(parameters, context);
      
      case "get_document_status":
        return this.getDocumentStatus(parameters, context);
      
      case "explain_extraction":
        return this.explainExtraction(parameters, context);
      
      case "processing_guidance":
        return this.getProcessingGuidance(parameters, context);
      
      default:
        return "I don't recognize that command. I can help you search documents, check status, explain extractions, or provide processing guidance.";
    }
  }

  private static searchDocuments(params: any, context: any): string {
    const { documents = [] } = context;
    const { query, document_type, status } = params;
    
    let filtered = documents;
    
    if (document_type && document_type !== 'all') {
      filtered = filtered.filter((doc: any) => doc.type?.toLowerCase() === document_type);
    }
    
    if (status && status !== 'all') {
      filtered = filtered.filter((doc: any) => doc.status?.toLowerCase() === status);
    }
    
    if (query) {
      filtered = filtered.filter((doc: any) => 
        doc.name?.toLowerCase().includes(query.toLowerCase()) ||
        doc.content?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (filtered.length === 0) {
      return `No documents found matching your criteria. You have ${documents.length} total documents.`;
    }
    
    return `Found ${filtered.length} documents: ${filtered.map((doc: any) => doc.name || doc.id).join(', ')}`;
  }

  private static getDocumentStatus(params: any, context: any): string {
    const { documents = [], currentStep } = context;
    const { document_id } = params;
    
    const doc = documents.find((d: any) => d.id === document_id || d.name?.includes(document_id));
    
    if (!doc) {
      return `Document ${document_id} not found. Please check the document ID.`;
    }
    
    const statusMap = {
      upload: "uploaded and ready for processing",
      extract: "being processed for content extraction",
      verify: "extracted and awaiting verification",
      decision: "verified and ready for decision"
    };
    
    return `Document ${doc.name || doc.id} is currently ${statusMap[currentStep as keyof typeof statusMap] || 'in processing'}.`;
  }

  private static explainExtraction(params: any, context: any): string {
    const { extractedData = [] } = context;
    const { document_id, field } = params;
    
    const extraction = extractedData.find((e: any) => e.documentId === document_id);
    
    if (!extraction) {
      return `No extraction data found for document ${document_id}.`;
    }
    
    if (field) {
      const fieldData = extraction.data?.[field];
      if (fieldData) {
        return `The ${field} field contains: ${fieldData.value || fieldData} with ${fieldData.confidence || 'unknown'}% confidence.`;
      }
      return `Field ${field} not found in extraction data.`;
    }
    
    const fields = Object.keys(extraction.data || {});
    return `Extracted ${fields.length} fields: ${fields.join(', ')}. Ask about a specific field for details.`;
  }

  private static getProcessingGuidance(params: any, context: any): string {
    const { step, user_role } = params;
    
    const guidance = {
      upload: {
        Uploader: "Upload your documents using drag & drop. Supported formats: PDF, DOC, DOCX, JPG, PNG. Select the document type for better processing.",
        Adjuster: "Review uploaded documents in the dashboard. Click on any document to view details and processing status."
      },
      extract: {
        Uploader: "The system is extracting key information from your documents. This includes text, entities, and structured data.",
        Adjuster: "Review the extracted data for accuracy. You can edit any fields that need correction before verification."
      },
      verify: {
        Uploader: "Your documents are being verified against our database. This ensures data accuracy and policy compliance.",
        Adjuster: "Cross-reference the extracted data with existing records. Approve or flag any discrepancies."
      },
      decision: {
        Uploader: "Processing complete! Your documents have been verified and are ready for final review.",
        Adjuster: "Make the final decision on the processed documents. You can approve, reject, or request additional information."
      }
    };
    
    return guidance[step as keyof typeof guidance]?.[user_role as keyof typeof guidance[keyof typeof guidance]] || 
           "I can provide guidance for upload, extract, verify, or decision steps.";
  }
}
