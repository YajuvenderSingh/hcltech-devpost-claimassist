import { Lambda } from "@aws-sdk/client-lambda";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";

// AWS Configuration - Updated with your pool ID
const REGION = "us-east-1";
const IDENTITY_POOL_ID = "us-east-1:896efff8-cd15-4b26-a376-189b81e902f8";
const LAMBDA_FUNCTION_NAME = "claimassistv2-presignedurl-lambda";
const ORCHESTRATION_LAMBDA_NAME =
  process.env.REACT_APP_ORCHESTRATION_LAMBDA || "nmm-orchestration-lambda";

const lambdaClient = new Lambda({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
  }),
});

export const authAPI = {
  login: async (credentials: any) => {
    return {
      user: {
        name: credentials.username,
        role: credentials.username.toLowerCase().includes("adjuster")
          ? "NMM Claim Adjuster"
          : "NMM Uploader",
        token: "", // Remove mock token
      },
    };
  },
};

export const documentAPI = {
  upload: async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      try {
        const params = {
          FunctionName: LAMBDA_FUNCTION_NAME,
          InvocationType: "RequestResponse" as const,
          Payload: new TextEncoder().encode(
            JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              multiDocument: true,
            }),
          ),
        };

        const response = await lambdaClient.invoke(params);
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        const presignedData = JSON.parse(payload.body);

        const uploadResponse = await fetch(presignedData.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) throw new Error("S3 upload failed");

        return {
          documentId:
            presignedData.documentId || Math.random().toString(36).substr(2, 9),
          classification: file.name.toLowerCase().includes("inv")
            ? "Invoice"
            : file.name.toLowerCase().includes("medical")
              ? "Medical"
              : "X-ray",
          status: "uploaded",
          s3Location: presignedData.s3Key,
        };
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  },

  updateDMS: async (documents: string[]) => {
    return { success: true, message: "Documents updated in GW DMS" };
  },
};

export const claimAPI = {
  verify: async (claimData: any) => ({ verified: true, confidence: 0.92 }),
  summarize: async (documents: string[]) => ({
    summary: "Claim processed successfully",
  }),
  getLowConfidenceClaims: async () => [
    {
      claimId: "CL12345",
      claimType: "Cancer",
      summary: "Wdssdsd",
      status: "Approved",
      confidence: 0.65,
    },
    {
      claimId: "CL12346",
      claimType: "Cancer",
      summary: "Wdssdsd",
      status: "Rejected",
      confidence: 0.72,
    },
  ],
  matchGuidewireClaims: async (claimId: string) => [
    {
      gwClaimId: "GW001",
      claimType: "Medical",
      summary: "Matching claim",
      status: "Active",
      matchConfidence: 0.85,
    },
  ],
  mapToGWClaim: async (claimId: string, gwClaimId: string) => ({
    success: true,
    mapped: true,
  }),
  updateGuidewire: async (extractedData: any) => ({
    success: true,
    updated: true,
  }),
  submitDecision: async (decision: any) => ({ success: true, emailSent: true }),
};

export const communicationAPI = {
  sendEmail: async (emailData: any) => ({
    success: true,
    messageId: "msg-123",
  }),
  generateEmailTemplate: async (decision: string, claimData: any) => ({
    subject: `Claim ${decision}`,
    body: `Your claim has been ${decision.toLowerCase()}.`,
  }),
};

export const orchestrationAPI = {
  startWorkflow: async (workflowData: any) => {
    try {
      const params = {
        FunctionName: ORCHESTRATION_LAMBDA_NAME,
        InvocationType: "RequestResponse" as const,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            action: "START_WORKFLOW",
            payload: workflowData,
          }),
        ),
      };

      const response = await lambdaClient.invoke(params);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      return JSON.parse(payload.body);
    } catch (error) {
      console.error("Orchestration workflow start failed:", error);
      throw error;
    }
  },

  processDocument: async (documentData: any) => {
    try {
      const params = {
        FunctionName: ORCHESTRATION_LAMBDA_NAME,
        InvocationType: "RequestResponse" as const,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            action: "PROCESS_DOCUMENT",
            payload: documentData,
          }),
        ),
      };

      const response = await lambdaClient.invoke(params);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      return JSON.parse(payload.body);
    } catch (error) {
      console.error("Document processing failed:", error);
      throw error;
    }
  },

  validateClaim: async (claimData: any) => {
    try {
      const params = {
        FunctionName: ORCHESTRATION_LAMBDA_NAME,
        InvocationType: "RequestResponse" as const,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            action: "VALIDATE_CLAIM",
            payload: claimData,
          }),
        ),
      };

      const response = await lambdaClient.invoke(params);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      return JSON.parse(payload.body);
    } catch (error) {
      console.error("Claim validation failed:", error);
      throw error;
    }
  },

  completeWorkflow: async (workflowData: any) => {
    try {
      const params = {
        FunctionName: ORCHESTRATION_LAMBDA_NAME,
        InvocationType: "RequestResponse" as const,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            action: "COMPLETE_WORKFLOW",
            payload: workflowData,
          }),
        ),
      };

      const response = await lambdaClient.invoke(params);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      return JSON.parse(payload.body);
    } catch (error) {
      console.error("Workflow completion failed:", error);
      throw error;
    }
  },

  getWorkflowStatus: async (executionArn: string) => {
    try {
      const params = {
        FunctionName: ORCHESTRATION_LAMBDA_NAME,
        InvocationType: "RequestResponse" as const,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            action: "GET_STATUS",
            payload: { executionArn },
          }),
        ),
      };

      const response = await lambdaClient.invoke(params);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      return JSON.parse(payload.body);
    } catch (error) {
      console.error("Status check failed:", error);
      throw error;
    }
  },
};
