import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Agent Workflow State Machine
// Manages multi-step agent workflows with state persistence, error recovery,
// and seamless agent handoffs for the AI-Fi system

/**
 * Workflow definitions for different agent processes
 */
export const WORKFLOWS: Record<string, { steps: string[]; agents: string[]; handoffTarget: string | null }> = {
  dealer_verification: {
    steps: [
      "greet_dealer",
      "request_deal_number", 
      "verify_deal_data",
      "check_completeness",
      "update_missing_info",
      "confirm_handoff_ready"
    ],
    agents: ["dealerInteraction"],
    handoffTarget: "customerTransaction"
  },
  customer_transaction: {
    steps: [
      "identity_verification",
      "sms_verification", 
      "deal_review",
      "aftermarket_presentation",
      "document_preparation",
      "signature_collection",
      "transaction_completion"
    ],
    agents: ["customerTransaction", "aftermarketOffer", "customerPaperwork"],
    handoffTarget: null // Terminal workflow
  },
  customer_general_info: {
    steps: [
      "assess_needs",
      "gather_requirements",
      "provide_estimates",
      "educate_process",
      "guide_next_steps"
    ],
    agents: ["customerGeneralInfo"],
    handoffTarget: "dealer_verification" // Can lead to dealer workflow
  },
  paperwork_flow: {
    steps: [
      "identify_document_type",
      "present_documents",
      "explain_terms",
      "facilitate_signing",
      "confirm_completion"
    ],
    agents: ["customerPaperwork"],
    handoffTarget: "customer_transaction" // Usually part of transaction
  },
  aftermarket_flow: {
    steps: [
      "present_options",
      "handle_questions",
      "address_objections", 
      "confirm_selection",
      "update_deal"
    ],
    agents: ["aftermarketOffer"],
    handoffTarget: "paperwork_flow"
  }
} as const;

/**
 * Create or initialize a workflow
 */
export const createWorkflow = mutation({
  args: {
    conversationId: v.string(),
    userId: v.optional(v.id("users")),
    workflowType: v.string(),
    currentAgent: v.string(),
    initialData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if workflow already exists
    const existing = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (existing) {
      // Update existing workflow instead of creating new one
      await ctx.db.patch(existing._id, {
        currentAgent: args.currentAgent,
        workflowType: args.workflowType,
        updatedAt: now,
        workflowData: { ...existing.workflowData, ...args.initialData },
      });
      return existing._id;
    }
    
    // Get workflow definition
    const workflowDef = WORKFLOWS[args.workflowType as keyof typeof WORKFLOWS];
    if (!workflowDef) {
      throw new Error(`Unknown workflow type: ${args.workflowType}`);
    }
    
    // Create new workflow
    const workflowId = await ctx.db.insert("agentWorkflows", {
      conversationId: args.conversationId,
      userId: args.userId,
      currentAgent: args.currentAgent,
      workflowType: args.workflowType,
      currentStep: workflowDef.steps[0],
      stepData: {},
      workflowData: args.initialData || {},
      status: "active",
      createdAt: now,
      updatedAt: now,
      completedSteps: [],
    });
    
    return workflowId;
  },
});

/**
 * Update workflow step progress
 */
export const updateWorkflowStep = mutation({
  args: {
    conversationId: v.string(),
    currentStep: v.string(),
    stepData: v.optional(v.any()),
    workflowData: v.optional(v.any()),
    markStepComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!workflow) {
      throw new Error("No active workflow found for conversation");
    }
    
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    // Update current step
    if (args.currentStep) {
      updates.currentStep = args.currentStep;
    }
    
    // Update step data
    if (args.stepData) {
      updates.stepData = { ...workflow.stepData, ...args.stepData };
    }
    
    // Update workflow data
    if (args.workflowData) {
      updates.workflowData = { ...workflow.workflowData, ...args.workflowData };
    }
    
    // Mark step as complete
    if (args.markStepComplete && workflow.currentStep) {
      const completedSteps = [...workflow.completedSteps];
      if (!completedSteps.includes(workflow.currentStep)) {
        completedSteps.push(workflow.currentStep);
      }
      updates.completedSteps = completedSteps;
    }
    
    await ctx.db.patch(workflow._id, updates);
    return workflow._id;
  },
});

/**
 * Initiate agent handoff
 */
export const initiateHandoff = mutation({
  args: {
    conversationId: v.string(),
    targetAgent: v.string(),
    handoffReason: v.string(),
    handoffData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!workflow) {
      throw new Error("No active workflow found for conversation");
    }
    
    // Update workflow for handoff
    await ctx.db.patch(workflow._id, {
      status: "handoff_pending",
      nextAgent: args.targetAgent,
      handoffReason: args.handoffReason,
      workflowData: { ...workflow.workflowData, ...args.handoffData },
      updatedAt: Date.now(),
    });
    
    return {
      workflowId: workflow._id,
      targetAgent: args.targetAgent,
      handoffData: { ...workflow.workflowData, ...args.handoffData },
    };
  },
});

/**
 * Complete agent handoff
 */
export const completeHandoff = mutation({
  args: {
    conversationId: v.string(),
    newAgent: v.string(),
    newWorkflowType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "handoff_pending"))
      .first();
    
    if (!workflow) {
      throw new Error("No pending handoff found for conversation");
    }
    
    const now = Date.now();
    
    if (args.newWorkflowType && args.newWorkflowType !== workflow.workflowType) {
      // Create new workflow for different workflow type
      const newWorkflowDef = WORKFLOWS[args.newWorkflowType as keyof typeof WORKFLOWS];
      if (!newWorkflowDef) {
        throw new Error(`Unknown workflow type: ${args.newWorkflowType}`);
      }
      
      // Complete old workflow
      await ctx.db.patch(workflow._id, {
        status: "completed",
        updatedAt: now,
      });
      
      // Create new workflow
      const newWorkflowId = await ctx.db.insert("agentWorkflows", {
        conversationId: args.conversationId,
        userId: workflow.userId,
        currentAgent: args.newAgent,
        workflowType: args.newWorkflowType,
        currentStep: newWorkflowDef.steps[0],
        stepData: {},
        workflowData: workflow.workflowData, // Carry over context
        status: "active",
        createdAt: now,
        updatedAt: now,
        completedSteps: [],
      });
      
      return newWorkflowId;
    } else {
      // Continue with same workflow type
      await ctx.db.patch(workflow._id, {
        status: "active",
        currentAgent: args.newAgent,
        nextAgent: undefined,
        handoffReason: undefined,
        updatedAt: now,
      });
      
      return workflow._id;
    }
  },
});

/**
 * Handle workflow errors and recovery
 */
export const handleWorkflowError = mutation({
  args: {
    conversationId: v.string(),
    error: v.string(),
    step: v.string(),
    shouldRetry: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!workflow) {
      throw new Error("No active workflow found for conversation");
    }
    
    const currentRetryCount = workflow.errorState?.retryCount || 0;
    const maxRetries = 3;
    
    if (args.shouldRetry && currentRetryCount < maxRetries) {
      // Update error state for retry
      await ctx.db.patch(workflow._id, {
        errorState: {
          error: args.error,
          step: args.step,
          timestamp: Date.now(),
          retryCount: currentRetryCount + 1,
        },
        updatedAt: Date.now(),
      });
      
      return { action: "retry", retryCount: currentRetryCount + 1 };
    } else {
      // Mark workflow as failed
      await ctx.db.patch(workflow._id, {
        status: "failed",
        errorState: {
          error: args.error,
          step: args.step,
          timestamp: Date.now(),
          retryCount: currentRetryCount,
        },
        updatedAt: Date.now(),
      });
      
      return { action: "failed", retryCount: currentRetryCount };
    }
  },
});

/**
 * Get current workflow state
 */
export const getWorkflowState = query({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .first();
    
    if (!workflow) {
      return null;
    }
    
    // Get workflow definition
    const workflowDef = WORKFLOWS[workflow.workflowType as keyof typeof WORKFLOWS];
    
    return {
      ...workflow,
      workflowDefinition: workflowDef,
      progressPercentage: workflowDef ? Math.round((workflow.completedSteps.length / workflowDef.steps.length) * 100) : 0,
      nextStep: workflowDef && workflowDef.steps.includes(workflow.currentStep) 
        ? workflowDef.steps[workflowDef.steps.indexOf(workflow.currentStep) + 1] 
        : undefined,
      canHandoff: workflow.status === "active" && workflowDef?.handoffTarget,
    };
  },
});

/**
 * Complete workflow
 */
export const completeWorkflow = mutation({
  args: {
    conversationId: v.string(),
    completionData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!workflow) {
      throw new Error("No active workflow found for conversation");
    }
    
    await ctx.db.patch(workflow._id, {
      status: "completed",
      workflowData: { ...workflow.workflowData, ...args.completionData },
      updatedAt: Date.now(),
    });
    
    return workflow._id;
  },
});

/**
 * Resume paused workflow
 */
export const resumeWorkflow = mutation({
  args: {
    conversationId: v.string(),
    resumeAgent: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("status"), "paused"))
      .first();
    
    if (!workflow) {
      throw new Error("No paused workflow found for conversation");
    }
    
    await ctx.db.patch(workflow._id, {
      status: "active",
      currentAgent: args.resumeAgent,
      updatedAt: Date.now(),
      errorState: undefined, // Clear any error state
    });
    
    return workflow._id;
  },
});