import { Lambda, LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";

// AWS Configuration
const REGION = "us-east-1";
const IDENTITY_POOL_ID = "us-east-1:896efff8-cd15-4b26-a376-189b81e902f8";
const LAMBDA_FUNCTION_NAME = "claimassistv2-presignedurl-lambda"; // Use correct presigned URL lambda
const ORCHESTRATION_LAMBDA_NAME = "nmm-orchestration-lambda"; // Orchestration lambda for queue operations

let lambdaClient: Lambda | null = null;

// Type definitions
interface DocumentInfo {
  docId: string;
  filename: string;
  s3Key: string;
  documentFolder: string;
  uploadTime: string;
  classification: string;
  queueStatus?: "pending" | "queued" | "failed";
  messageId?: string;
}

interface ClaimSession {
  claimId: string | null;
  documentCount: number;
  maxDocuments: number;
  documents: DocumentInfo[];
  claimFolder: string | null;
  status: "active" | "full" | "closed";
  fileType: string;
}

interface UploadResult {
  documentId: string;
  claimId: string;
  docId: string;
  s3Key: string;
  status: string;
  fileName: string;
  classification: string;
  remainingSlots: number;
  queueResult?: QueueResponse;
}

interface UploadError {
  fileName: string;
  error: string;
  status: string;
}

interface QueueResponse {
  status: string;
  message?: string;
  messageId?: string;
  error?: string;
}

interface ClaimData {
  claimid: string;
  total_extracted_data?: string;
  [key: string]: any;
}

type BatchUploadResult = UploadResult | UploadError;

let currentClaimSession: ClaimSession = {
  claimId: null,
  documentCount: 0,
  maxDocuments: 4,
  documents: [],
  claimFolder: null,
  status: "active",
  fileType: "CL",
};

// Generate session ID once and reuse
let uploadSessionId: string | null = null;

// Helper function to generate valid claim ID
const generateClaimId = (): string => {
  return "IN" + Math.floor(Math.random() * 900000 + 100000).toString();
};

// Helper function to validate claim ID format
const isValidClaimIdFormat = (claimId: string): boolean => {
  return /^IN\d{6}$/.test(claimId);
};

const initializeAWSClient = (): Lambda => {
  if (!lambdaClient) {
    lambdaClient = new Lambda({
      region: REGION,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: REGION }),
        identityPoolId: IDENTITY_POOL_ID,
      }),
    });
  }
  return lambdaClient;
};

// Reset claim session (call this when starting a new claim)
export const resetClaimSession = (): void => {
  uploadSessionId = null;
  currentClaimSession = {
    claimId: null,
    documentCount: 0,
    maxDocuments: 4,
    documents: [],
    claimFolder: null,
    status: "active",
    fileType: "CL",
  };
  console.log("🔄 Claim session reset");
};

// Get current claim session info
export const getClaimSessionInfo = () => {
  return {
    claimId: currentClaimSession.claimId,
    documentCount: currentClaimSession.documentCount,
    maxDocuments: currentClaimSession.maxDocuments,
    remainingSlots:
      currentClaimSession.maxDocuments - currentClaimSession.documentCount,
    documents: currentClaimSession.documents,
    claimFolder: currentClaimSession.claimFolder,
    status: currentClaimSession.status,
    fileType: currentClaimSession.fileType,
  };
};

// Check if we can add more documents to current claim
export const canAddMoreDocuments = (): boolean => {
  return (
    currentClaimSession.documentCount < currentClaimSession.maxDocuments &&
    currentClaimSession.status === "active"
  );
};

// Send document to processing queue using your existing Lambda
export const sendDocumentToQueue = async (
  claimId: string,
  s3Key: string,
  docId: string,
): Promise<QueueResponse> => {
  try {
    const client = initializeAWSClient();

    // Send directly to orchestration lambda with correct payload format
    const queueData = {
      tasktype: "SEND_TO_QUEUE",
      indexid: claimId,
      s3filename: s3Key, // Use the full s3Key which includes the correct filename
      docid: docId,
    };

    console.log("📤 Sending document to orchestration lambda:", queueData);

    const params = {
      FunctionName: ORCHESTRATION_LAMBDA_NAME,
      InvocationType: "RequestResponse" as const,
      Payload: new TextEncoder().encode(JSON.stringify(queueData)),
    };

    const response = await client.invoke(params);

    if (!response.Payload) {
      throw new Error("No payload received from processing Lambda");
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log("Queue processing response:", result);

    if (result.statusCode === 200) {
      // Handle empty body response
      if (!result.body || result.body === "") {
        return {
          status: "queued",
          message: "Document successfully queued for processing",
        };
      }

      const responseBody =
        typeof result.body === "string" ? JSON.parse(result.body) : result.body;

      const queueResponse = {
        status: "queued",
        message:
          responseBody.message || "Document successfully queued for processing",
        messageId: responseBody.messageId,
      };

      // Call dashboard lambda if SQS message ID is found
      if (responseBody.messageId) {
        try {
          await invokeLambda("nmm_dashboard_lambda", {
            docid: docId,
          });
          console.log("✅ Dashboard lambda called successfully");
        } catch (dashboardError) {
          console.error("⚠️ Dashboard lambda call failed:", dashboardError);
          // Don't fail the main operation if dashboard call fails
        }
      }

      return queueResponse;
    } else {
      const errorMsg = result.body
        ? typeof result.body === "string"
          ? JSON.parse(result.body).error || result.body
          : result.body.error || result.body
        : "Unknown queue processing error";

      return {
        status: "failed",
        error: `Queue error: ${errorMsg}`,
      };
    }
  } catch (error) {
    console.error("Failed to send document to queue:", error);
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Queue submission failed",
    };
  }
};

// Fetch single claim data
export const fetchSingleClaim = async (
  claimId: string,
): Promise<ClaimData | null> => {
  try {
    const client = initializeAWSClient();

    const requestData = {
      tasktype: "FETCH_SINGLE_CLAIM",
      claimid: claimId,
    };

    console.log("🔍 Fetching claim data for:", claimId);

    const params = {
      FunctionName: ORCHESTRATION_LAMBDA_NAME,
      InvocationType: "RequestResponse" as const,
      Payload: new TextEncoder().encode(JSON.stringify(requestData)),
    };

    const response = await client.invoke(params);

    if (!response.Payload) {
      throw new Error("No payload received from Lambda");
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode === 200) {
      const responseBody =
        typeof result.body === "string" ? JSON.parse(result.body) : result.body;

      const claimData = responseBody.singleclaimdata;

      if (claimData && claimData !== "claim data not present") {
        console.log("✅ Successfully fetched claim data");
        return claimData as ClaimData;
      } else {
        console.log("❌ No claim data found");
        return null;
      }
    } else {
      console.error("❌ Error fetching claim data:", result);
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch claim data:", error);
    return null;
  }
};

// Fetch all claims data
export const fetchAllClaims = async (): Promise<ClaimData[]> => {
  try {
    const client = initializeAWSClient();

    const requestData = {
      tasktype: "FETCH_ALL_CLAIMS",
    };

    console.log("📋 Fetching all claims data");

    const params = {
      FunctionName: ORCHESTRATION_LAMBDA_NAME,
      InvocationType: "RequestResponse" as const,
      Payload: new TextEncoder().encode(JSON.stringify(requestData)),
    };

    const response = await client.invoke(params);

    if (!response.Payload) {
      throw new Error("No payload received from Lambda");
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode === 200) {
      const responseBody =
        typeof result.body === "string" ? JSON.parse(result.body) : result.body;

      console.log(
        `✅ Successfully fetched ${responseBody.allclaimdata?.length || 0} claims`,
      );
      return responseBody.allclaimdata || [];
    } else {
      console.error("❌ Error fetching all claims:", result);
      return [];
    }
  } catch (error) {
    console.error("Failed to fetch all claims:", error);
    return [];
  }
};

// Main upload function
export const uploadFileToS3 = async (
  file: File,
  providedClaimId?: string,
  sendToQueue: boolean = true,
): Promise<UploadResult> => {
  try {
    const client = initializeAWSClient();

    // Determine the claim ID to use with proper validation
    let claimIdToUse: string;

    // Check if we have a valid provided claim ID
    if (providedClaimId && isValidClaimIdFormat(providedClaimId)) {
      claimIdToUse = providedClaimId;
      console.log("✅ Using provided valid claim ID:", claimIdToUse);
    }
    // Check if we have a valid session claim ID
    else if (
      currentClaimSession.claimId &&
      isValidClaimIdFormat(currentClaimSession.claimId)
    ) {
      claimIdToUse = currentClaimSession.claimId;
      console.log("✅ Using session claim ID:", claimIdToUse);
    }
    // Generate a new valid claim ID
    else {
      claimIdToUse = generateClaimId();
      currentClaimSession.claimId = claimIdToUse;
      console.log("🆔 Generated new claim ID:", claimIdToUse);

      // Log warning if invalid claim ID was provided
      if (providedClaimId && !isValidClaimIdFormat(providedClaimId)) {
        console.warn("⚠️ Invalid claim ID provided, generated new one:", {
          provided: providedClaimId,
          generated: claimIdToUse,
        });
      }
    }

    console.log("📤 Uploading with claim ID:", claimIdToUse);

    // Double-check claim ID format before sending to Lambda
    if (!isValidClaimIdFormat(claimIdToUse)) {
      throw new Error(
        `Invalid claim ID format generated: ${claimIdToUse}. Must be IN followed by 6 digits.`,
      );
    }

    const params = {
      FunctionName: LAMBDA_FUNCTION_NAME,
      InvocationType: "RequestResponse" as const,
      Payload: new TextEncoder().encode(
        JSON.stringify({
          tasktype: "PRESIGNED_URL", // Add the required tasktype
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          claimId: claimIdToUse,
        }),
      ),
    };

    const response = await client.invoke(params);

    if (!response.Payload) {
      throw new Error("No payload received from Lambda");
    }

    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log("Lambda response:", payload);

    if (payload.statusCode !== 200) {
      const errorMsg = payload.body
        ? typeof payload.body === "string"
          ? JSON.parse(payload.body).error
          : payload.body.error
        : "Unknown lambda error";
      throw new Error(`Lambda error: ${errorMsg}`);
    }

    const presignedData =
      typeof payload.body === "string"
        ? JSON.parse(payload.body)
        : payload.body;

    // Update session with claim ID
    currentClaimSession.claimId = presignedData.claimId;

    // Upload to S3
    const uploadResponse = await fetch(presignedData.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status}`);
    }

    console.log("✅ S3 upload successful");

    // Send to processing queue if requested
    let queueResult: QueueResponse | undefined;
    if (sendToQueue) {
      console.log("📋 Sending to processing queue...");
      queueResult = await sendDocumentToQueue(
        presignedData.claimId,
        presignedData.s3Key,
        presignedData.docId,
      );

      // Don't auto-retry on failure to prevent double submissions
      console.log("📤 Queue submission completed:", queueResult?.status);
    }

    // Update session with document info
    const documentInfo: DocumentInfo = {
      docId: presignedData.docId,
      filename: file.name,
      s3Key: presignedData.s3Key,
      documentFolder: `claimforms/${presignedData.claimId}/${presignedData.docId}`,
      uploadTime: new Date().toISOString(),
      classification: getAutoClassification(file.name),
      queueStatus:
        queueResult?.status === "queued"
          ? "queued"
          : queueResult?.status === "failed"
            ? "failed"
            : "pending",
      messageId: queueResult?.messageId,
    };

    currentClaimSession.documents.push(documentInfo);
    currentClaimSession.documentCount++;

    // Update status if claim is full
    if (currentClaimSession.documentCount >= currentClaimSession.maxDocuments) {
      currentClaimSession.status = "full";
    }

    const remainingSlots =
      currentClaimSession.maxDocuments - currentClaimSession.documentCount;

    console.log("✅ Upload process completed:", {
      claimId: presignedData.claimId,
      docId: presignedData.docId,
      fileName: file.name,
      remainingSlots,
      queueStatus: queueResult?.status,
    });

    return {
      documentId: presignedData.docId,
      claimId: presignedData.claimId,
      docId: presignedData.docId,
      s3Key: presignedData.s3Key,
      status: "uploaded",
      fileName: file.name,
      classification: documentInfo.classification,
      remainingSlots,
      queueResult,
    };
  } catch (error: unknown) {
    console.error("Upload failed:", error);
    throw error;
  }
};

// Sequential upload to ensure same claim ID
export const uploadMultipleFilesToSameClaim = async (
  files: File[],
  sendToQueue: boolean = true,
  progressCallback?: (
    fileIndex: number,
    progress: number,
    result?: BatchUploadResult,
  ) => void,
): Promise<BatchUploadResult[]> => {
  const results: BatchUploadResult[] = [];
  let batchClaimId: string | null = null;

  console.log("🗂️ Starting batch upload of", files.length, "files");
  console.log("📊 Current session before upload:", getClaimSessionInfo());

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      progressCallback?.(i, 0);

      try {
        // Use the batch claim ID for all files after the first
        let claimIdToUse: string | undefined;

        if (batchClaimId && isValidClaimIdFormat(batchClaimId)) {
          claimIdToUse = batchClaimId;
        } else if (
          currentClaimSession.claimId &&
          isValidClaimIdFormat(currentClaimSession.claimId)
        ) {
          claimIdToUse = currentClaimSession.claimId;
        } else {
          claimIdToUse = undefined; // Let uploadFileToS3 generate a new one
        }

        console.log(`📎 Uploading file ${i + 1}/${files.length}:`, {
          fileName: file.name,
          claimIdToUse,
          batchClaimId,
        });

        const result: UploadResult = await uploadFileToS3(
          file,
          claimIdToUse,
          sendToQueue,
        );

        // Store the claim ID from first upload for subsequent files
        if (i === 0) {
          batchClaimId = result.claimId;
          currentClaimSession.claimId = result.claimId;
        }

        results.push(result);
        progressCallback?.(i, 100, result);

        console.log(`✅ File ${i + 1}/${files.length} uploaded:`, {
          fileName: file.name,
          claimId: result.claimId,
          docId: result.docId,
          queueStatus: result.queueResult?.status,
        });

        // Check if claim is full
        if (
          currentClaimSession.documentCount >= currentClaimSession.maxDocuments
        ) {
          console.warn("⚠️ Claim reached maximum capacity");
          if (i < files.length - 1) {
            console.log("⚠️ Remaining files will need a new claim");
            // Reset session for remaining files
            resetClaimSession();
            batchClaimId = null;
          }
        }
      } catch (fileError) {
        console.error(
          `❌ Failed to upload file ${i + 1}:`,
          file.name,
          fileError,
        );

        const errorResult: UploadError = {
          fileName: file.name,
          error:
            fileError instanceof Error ? fileError.message : "Upload failed",
          status: "error",
        };

        results.push(errorResult);
        progressCallback?.(i, 100, errorResult);
      }

      // Small delay between uploads to ensure sequential processing
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const successfulUploads = results.filter(
      (r): r is UploadResult => !("error" in r),
    );
    const queuedDocuments = successfulUploads.filter(
      (r) => r.queueResult?.status === "queued",
    );
    const claimId = successfulUploads[0]?.claimId;

    console.log("🎉 Batch upload completed:", {
      totalFiles: files.length,
      successful: successfulUploads.length,
      failed: results.length - successfulUploads.length,
      queued: queuedDocuments.length,
      claimId: claimId,
      finalSession: getClaimSessionInfo(),
    });

    return results;
  } catch (error) {
    console.error("❌ Batch upload failed:", error);
    throw error;
  }
};

// Helper functions
const getAutoClassification = (filename: string): string => {
  const name = filename.toLowerCase();
  if (name.includes("claim") || name.includes("form")) return "Claim Form";
  if (name.includes("medical") || name.includes("report"))
    return "Medical Report";
  if (name.includes("receipt") || name.includes("invoice"))
    return "Receipt/Invoice";
  if (name.includes("id") || name.includes("license")) return "Identification";
  if (name.includes("policy")) return "Policy Document";
  if (name.includes("estimate")) return "Estimate";
  if (name.includes("photo") || name.includes("image")) return "Photo Evidence";
  return "Other Document";
};

// Export additional helper functions
export const startNewClaim = async (): Promise<void> => {
  resetClaimSession();
  console.log("🆕 New claim session prepared");
};

export const getDocumentFolders = (): Array<{
  docId: string;
  filename: string;
  folder: string;
  s3Key: string;
  classification: string;
  queueStatus?: string;
  messageId?: string;
}> => {
  return currentClaimSession.documents.map((doc) => ({
    docId: doc.docId,
    filename: doc.filename,
    folder: doc.documentFolder,
    s3Key: doc.s3Key,
    classification: doc.classification,
    queueStatus: doc.queueStatus,
    messageId: doc.messageId,
  }));
};

export const debugSession = (): ClaimSession => {
  console.log("🔍 Current Session State:", currentClaimSession);
  return currentClaimSession;
};

// Additional utility functions
export const isValidClaimId = (claimId: string): boolean => {
  return isValidClaimIdFormat(claimId);
};

export const getCurrentClaimId = (): string | null => {
  return currentClaimSession.claimId;
};

export const setClaimId = (claimId: string): boolean => {
  if (isValidClaimIdFormat(claimId)) {
    currentClaimSession.claimId = claimId;
    return true;
  }
  console.warn("⚠️ Attempted to set invalid claim ID:", claimId);
  return false;
};

// Function to generate a new claim ID and start fresh session
export const generateNewClaimSession = (): string => {
  const newClaimId = generateClaimId();
  resetClaimSession();
  currentClaimSession.claimId = newClaimId;
  console.log("🆕 Generated new claim session:", newClaimId);
  return newClaimId;
};

// Retry failed queue submissions
export const retryQueueSubmission = async (
  docId: string,
): Promise<QueueResponse> => {
  const document = currentClaimSession.documents.find(
    (doc) => doc.docId === docId,
  );

  if (!document) {
    throw new Error(`Document with ID ${docId} not found in current session`);
  }

  if (!currentClaimSession.claimId) {
    throw new Error("No claim ID available for retry");
  }

  console.log("🔄 Retrying queue submission for document:", docId);

  const queueResult = await sendDocumentToQueue(
    currentClaimSession.claimId,
    document.s3Key,
    document.docId,
  );

  // Update document queue status
  document.queueStatus = queueResult.status === "queued" ? "queued" : "failed";
  document.messageId = queueResult.messageId;

  return queueResult;
};

// Get queue status for all documents in current session
export const getQueueStatus = (): Array<{
  docId: string;
  filename: string;
  queueStatus: string;
  messageId?: string;
}> => {
  return currentClaimSession.documents.map((doc) => ({
    docId: doc.docId,
    filename: doc.filename,
    queueStatus: doc.queueStatus || "pending",
    messageId: doc.messageId,
  }));
};

// Verify claim using your existing Lambda
export const verifyClaim = async (
  claimId: string,
  psId: string,
): Promise<any> => {
  try {
    const client = initializeAWSClient();

    const requestData = {
      tasktype: "VERIFY_CLAIM",
      claimid: claimId,
      psid: psId,
    };

    const params = {
      FunctionName: ORCHESTRATION_LAMBDA_NAME,
      InvocationType: "RequestResponse" as const,
      Payload: new TextEncoder().encode(JSON.stringify(requestData)),
    };

    const response = await client.invoke(params);

    if (!response.Payload) {
      throw new Error("No payload received from Lambda");
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode === 200) {
      const responseBody =
        typeof result.body === "string" ? JSON.parse(result.body) : result.body;

      return responseBody.verifyclaimactdata;
    } else {
      throw new Error(`Verification failed: ${result.body}`);
    }
  } catch (error) {
    console.error("Failed to verify claim:", error);
    throw error;
  }
};

// Generate email using your existing Lambda
export const generateEmail = async (
  claimId: string,
  psId: string,
): Promise<any> => {
  try {
    const client = initializeAWSClient();

    const requestData = {
      tasktype: "GENERATE_EMAIL",
      claimid: claimId,
      psid: psId,
    };

    const params = {
      FunctionName: ORCHESTRATION_LAMBDA_NAME,
      InvocationType: "RequestResponse" as const,
      Payload: new TextEncoder().encode(JSON.stringify(requestData)),
    };

    const response = await client.invoke(params);

    if (!response.Payload) {
      throw new Error("No payload received from Lambda");
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode === 200) {
      const responseBody =
        typeof result.body === "string" ? JSON.parse(result.body) : result.body;

      return responseBody.generatedemaildata;
    } else {
      throw new Error(`Email generation failed: ${result.body}`);
    }
  } catch (error) {
    console.error("Failed to generate email:", error);
    throw error;
  }
};

// Dashboard and Entity Extraction functions
export const fetchDashboardStatus = async (docId?: string): Promise<any> => {
  try {
    const payload = docId ? { docid: docId } : {};
    return await invokeLambda("nmm_dashboard_lambda", payload);
  } catch (error) {
    console.error("Failed to fetch dashboard status:", error);
    throw error;
  }
};

export const generatePresignedUrl = async (
  s3Key: string,
): Promise<string | null> => {
  try {
    console.log("🔗 Generating presigned URL for:", s3Key);

    const response = await invokeLambda(LAMBDA_FUNCTION_NAME, {
      tasktype: "GET_PRESIGNED_URL_FOR_VIEW",
      s3Key: s3Key,
    });

    if (response && response.statusCode === 200) {
      const data =
        typeof response.body === "string"
          ? JSON.parse(response.body)
          : response.body;
      const presignedUrl = data.uploadUrl || data.presignedUrl || data.viewUrl;
      console.log("✅ Presigned URL generated:", presignedUrl);
      return presignedUrl;
    } else {
      console.error(
        "❌ Failed to generate presigned URL:",
        response?.statusCode,
      );
      return null;
    }
  } catch (error) {
    console.error("❌ Error generating presigned URL:", error);
    return null;
  }
};

export const fetchExtractedEntities = async (docId: string): Promise<any> => {
  try {
    return await invokeLambda("nmm_fetch_extracted_entities_lambda", {
      docid: docId,
    });
  } catch (error) {
    console.error("Failed to fetch extracted entities:", error);
    throw error;
  }
};

// Generic Lambda invocation function
export const invokeLambda = async (
  functionName: string,
  payload: any,
): Promise<any> => {
  try {
    const lambdaClient = new LambdaClient({
      region: REGION,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: REGION }),
        identityPoolId: IDENTITY_POOL_ID,
      }),
    });

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);

    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      return result;
    }

    return null;
  } catch (error) {
    console.error(`Failed to invoke Lambda ${functionName}:`, error);
    throw error;
  }
};

// DynamoDB access functions
export const getDynamoDBItem = async (
  tableName: string,
  key: any,
): Promise<any> => {
  try {
    const { DynamoDBClient, GetItemCommand } = await import(
      "@aws-sdk/client-dynamodb"
    );
    const { marshall, unmarshall } = await import("@aws-sdk/util-dynamodb");

    const credentials = fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }),
      identityPoolId: IDENTITY_POOL_ID,
    });

    const client = new DynamoDBClient({
      region: REGION,
      credentials: credentials,
    });

    const command = new GetItemCommand({
      TableName: tableName,
      Key: marshall(key),
    });

    const response = await client.send(command);
    return response.Item ? unmarshall(response.Item) : null;
  } catch (error) {
    console.error("Error getting DynamoDB item:", error);
    return null;
  }
};

export const scanDynamoDBTable = async (
  tableName: string,
  params: any = {},
): Promise<any[]> => {
  try {
    const { DynamoDBClient, ScanCommand } = await import(
      "@aws-sdk/client-dynamodb"
    );
    const { marshall, unmarshall } = await import("@aws-sdk/util-dynamodb");

    const credentials = fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }),
      identityPoolId: IDENTITY_POOL_ID,
    });

    const client = new DynamoDBClient({
      region: REGION,
      credentials: credentials,
    });

    const scanParams: any = {
      TableName: tableName,
      ...params,
    };

    if (params.ExpressionAttributeValues) {
      scanParams.ExpressionAttributeValues = marshall(
        params.ExpressionAttributeValues,
      );
    }

    const command = new ScanCommand(scanParams);
    const response = await client.send(command);

    return response.Items ? response.Items.map((item) => unmarshall(item)) : [];
  } catch (error) {
    console.error("Error scanning DynamoDB table:", error);
    return [];
  }
};

export const updateModifiedValues = async (payload: any): Promise<any> => {
  try {
    console.log("🔄 Calling nmm_update_modified_values_lambda");
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));

    const response = await invokeLambda(
      "nmm_update_modified_values_lambda",
      payload,
    );

    console.log("✅ nmm_update_modified_values_lambda response:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to update modified values:", error);
    throw error;
  }
};

export const updateGuidwire = async (payload: any): Promise<any> => {
  try {
    console.log("🔄 Calling nmm_update_guidewire_lambda");
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));

    const response = await invokeLambda("nmm_update_guidewire_lambda", payload);

    console.log("✅ nmm_update_guidewire_lambda response:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to update Guidwire:", error);
    throw error;
  }
};

export const updateGuidwireAndDMS = async (payload: any): Promise<any> => {
  try {
    console.log("🔄 Calling both Guidewire and DMS lambdas");
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));

    // Call Guidewire lambda
    const guidewireResponse = await invokeLambda(
      "nmm_update_guidewire_lambda",
      payload,
    );
    console.log("✅ nmm_update_guidewire_lambda response:", guidewireResponse);

    // Call DMS lambda
    const dmsResponse = await invokeLambda(
      "nmm_update_guidewire_dms_lambda",
      payload,
    );
    console.log("✅ nmm_update_guidewire_dms_lambda response:", dmsResponse);

    return {
      guidewire: guidewireResponse,
      dms: dmsResponse,
    };
  } catch (error) {
    console.error("❌ updateGuidwireAndDMS failed:", error);
    throw error;
  }
};

// Export all functions
export const awsService = {
  uploadFileToS3,
  invokeLambda,
  fetchDashboardStatus,
  fetchExtractedEntities,
  generatePresignedUrl,
  updateModifiedValues,
  updateGuidwire,
  generateEmail,
  getDynamoDBItem,
  scanDynamoDBTable,
};
