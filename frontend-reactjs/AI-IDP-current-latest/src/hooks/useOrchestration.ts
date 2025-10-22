import { useState, useCallback } from "react";
import {
  orchestrationService,
  WorkflowData,
  DocumentProcessingData,
  ClaimValidationData,
} from "../services/orchestrationService";
import toast from "react-hot-toast";

export interface OrchestrationState {
  workflowId: string | null;
  status:
    | "idle"
    | "starting"
    | "processing"
    | "validating"
    | "completing"
    | "completed"
    | "error";
  progress: number;
  error: string | null;
  results: any;
}

export const useOrchestration = () => {
  const [state, setState] = useState<OrchestrationState>({
    workflowId: null,
    status: "idle",
    progress: 0,
    error: null,
    results: null,
  });

  const updateState = useCallback((updates: Partial<OrchestrationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const startWorkflow = useCallback(
    async (workflowData: WorkflowData) => {
      try {
        updateState({ status: "starting", progress: 10, error: null });

        const result = await orchestrationService.startWorkflow(workflowData);

        updateState({
          workflowId: result.executionArn,
          status: "processing",
          progress: 25,
          results: result,
        });

        toast.success("Workflow started successfully");
        return result;
      } catch (error: any) {
        updateState({
          status: "error",
          error: error.message,
          progress: 0,
        });
        toast.error(`Failed to start workflow: ${error.message}`);
        throw error;
      }
    },
    [updateState],
  );

  const processDocuments = useCallback(
    async (documents: DocumentProcessingData[]) => {
      try {
        updateState({ status: "processing", progress: 50 });

        const results = await Promise.all(
          documents.map((doc) => orchestrationService.processDocument(doc)),
        );

        updateState({
          status: "processing",
          progress: 75,
          results: { ...state.results, documentResults: results },
        });

        toast.success(`Processed ${documents.length} documents`);
        return results;
      } catch (error: any) {
        updateState({
          status: "error",
          error: error.message,
        });
        toast.error(`Document processing failed: ${error.message}`);
        throw error;
      }
    },
    [updateState, state.results],
  );

  const validateClaim = useCallback(
    async (claimData: ClaimValidationData) => {
      try {
        updateState({ status: "validating", progress: 85 });

        const result = await orchestrationService.validateClaim(claimData);

        updateState({
          status: "validating",
          progress: 95,
          results: { ...state.results, validationResult: result },
        });

        toast.success("Claim validation completed");
        return result;
      } catch (error: any) {
        updateState({
          status: "error",
          error: error.message,
        });
        toast.error(`Claim validation failed: ${error.message}`);
        throw error;
      }
    },
    [updateState, state.results],
  );

  const completeWorkflow = useCallback(
    async (completionData: any) => {
      try {
        updateState({ status: "completing", progress: 98 });

        const result = await orchestrationService.completeWorkflow({
          executionArn: state.workflowId || "",
          finalStatus: "COMPLETED",
          results: completionData,
        });

        updateState({
          status: "completed",
          progress: 100,
          results: { ...state.results, completionResult: result },
        });

        toast.success("Workflow completed successfully");
        return result;
      } catch (error: any) {
        updateState({
          status: "error",
          error: error.message,
        });
        toast.error(`Workflow completion failed: ${error.message}`);
        throw error;
      }
    },
    [updateState, state.workflowId, state.results],
  );

  const orchestrateFullFlow = useCallback(
    async (data: { documents: any[]; claimData?: any; userId: string }) => {
      try {
        updateState({ status: "starting", progress: 5, error: null });

        const result = await orchestrationService.orchestrateFullFlow(data);

        updateState({
          workflowId: result.workflowId,
          status: "processing",
          progress: 100,
          results: result,
        });

        toast.success("Full NMM flow orchestrated successfully");
        return result;
      } catch (error: any) {
        updateState({
          status: "error",
          error: error.message,
          progress: 0,
        });
        toast.error(`Full flow orchestration failed: ${error.message}`);
        throw error;
      }
    },
    [updateState],
  );

  const checkWorkflowStatus = useCallback(async () => {
    if (!state.workflowId) return null;

    try {
      const status = await orchestrationService.getWorkflowStatus(
        state.workflowId,
      );

      updateState({
        results: { ...state.results, statusCheck: status },
      });

      return status;
    } catch (error: any) {
      console.error("Status check failed:", error);
      return null;
    }
  }, [state.workflowId, state.results, updateState]);

  const resetOrchestration = useCallback(() => {
    setState({
      workflowId: null,
      status: "idle",
      progress: 0,
      error: null,
      results: null,
    });
  }, []);

  return {
    state,
    startWorkflow,
    processDocuments,
    validateClaim,
    completeWorkflow,
    orchestrateFullFlow,
    checkWorkflowStatus,
    resetOrchestration,
  };
};
