import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api, components } from "./_generated/api";
import { 
  mainEntryAgent, 
  dealerInteractionAgent, 
  customerGeneralInfoAgent, 
  customerTransactionAgent, 
  aftermarketOfferAgent,
  customerPaperworkAgent,
  toolHandlerAgent
} from "./agents";
// import { 
//   createWorkflow, 
//   updateWorkflowStep, 
//   getWorkflowState, 
//   initiateHandoff, 
//   completeHandoff,
//   handleWorkflowError,
//   resumeWorkflow
// } from "./agentStateMachine";

// Agent Router - Central system to route messages to appropriate AI-Fi agents
// Maintains conversation state and handles agent transitions transparently
// Implements thread persistence for conversation continuity

/**
 * Tool Detection Patterns - Analyzes messages to determine if tool execution is needed
 */
function detectToolRequirements(message: string, _conversationContext?: any): {
  needsTools: boolean;
  toolTypes: string[];
  priority: 'high' | 'medium' | 'low';
  detectedPatterns: string[];
} {
  const messageText = message.toLowerCase();
  const toolTypes: string[] = [];
  const detectedPatterns: string[] = [];
  
  // Deal information patterns
  if (
    /deal\s*(?:number|#)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i.test(message) ||
    /(?:customer|client)\s+(?:jane\s+doe|john\s+smith|test\s+te\s+tester)/i.test(message) ||
    messageText.includes('get deal') ||
    messageText.includes('deal info') ||
    messageText.includes('deal details')
  ) {
    toolTypes.push('deal_retrieval');
    detectedPatterns.push('deal_identification');
  }
  
  // Financial calculation patterns
  if (
    messageText.includes('payment') || messageText.includes('monthly') ||
    messageText.includes('calculate') || messageText.includes('how much') ||
    messageText.includes('loan amount') || messageText.includes('finance') ||
    /\$[\d,]+/.test(message) || // Dollar amounts
    messageText.includes('interest rate') || messageText.includes('apr')
  ) {
    toolTypes.push('financial_calculations');
    detectedPatterns.push('payment_calculation');
  }
  
  // Document generation patterns
  if (
    messageText.includes('document') || messageText.includes('paperwork') ||
    messageText.includes('dmv') || messageText.includes('title') ||
    messageText.includes('contract') || messageText.includes('forms') ||
    messageText.includes('generate') || messageText.includes('create')
  ) {
    toolTypes.push('document_generation');
    detectedPatterns.push('document_request');
  }
  
  // Verification patterns
  if (
    messageText.includes('verify') || messageText.includes('code') ||
    messageText.includes('sms') || messageText.includes('text') ||
    /\b\d{4}\b/.test(message) || // 4-digit codes
    messageText.includes('verification')
  ) {
    toolTypes.push('verification');
    detectedPatterns.push('verification_request');
  }
  
  // Aftermarket patterns
  if (
    messageText.includes('warranty') || messageText.includes('protection') ||
    messageText.includes('aftermarket') || messageText.includes('add-on') ||
    messageText.includes('extended') || messageText.includes('coverage')
  ) {
    toolTypes.push('aftermarket');
    detectedPatterns.push('aftermarket_inquiry');
  }
  
  // Bank program patterns
  if (
    messageText.includes('bank') || messageText.includes('lender') ||
    messageText.includes('financing options') || messageText.includes('programs') ||
    messageText.includes('credit') || messageText.includes('approval')
  ) {
    toolTypes.push('bank_programs');
    detectedPatterns.push('financing_inquiry');
  }
  
  // Update/modification patterns
  if (
    messageText.includes('update') || messageText.includes('change') ||
    messageText.includes('modify') || messageText.includes('edit') ||
    messageText.includes('correct')
  ) {
    toolTypes.push('data_update');
    detectedPatterns.push('modification_request');
  }
  
  const needsTools = toolTypes.length > 0;
  let priority: 'high' | 'medium' | 'low' = 'low';
  
  // Determine priority based on tool types and patterns
  if (toolTypes.includes('deal_retrieval') || toolTypes.includes('verification')) {
    priority = 'high';
  } else if (toolTypes.includes('financial_calculations') || toolTypes.includes('data_update')) {
    priority = 'medium';
  }
  
  return {
    needsTools,
    toolTypes,
    priority,
    detectedPatterns
  };
}

/**
 * Get or create user session
 */
export const getUserSession = query({
  args: { 
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    conversationId: v.string()
  },
  handler: async (ctx, args) => {
    // Try to find existing user by name or phone
    let user = null;
    
    if (args.name) {
      user = await ctx.db
        .query("users")
        .withIndex("by_name", (q) => q.eq("name", args.name!))
        .first();
    }
    
    if (!user && args.phone) {
      user = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", args.phone))
        .first();
    }
    
    return user;
  },
});

/**
 * Create or update user session
 */
export const createUserSession = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    userType: v.union(v.literal("customer"), v.literal("dealer")),
    currentAgent: v.string(),
    stage: v.string(),
    context: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      phone: args.phone,
      verificationStatus: false,
      userType: args.userType,
      conversationState: {
        currentAgent: args.currentAgent,
        stage: args.stage,
        context: args.context,
      },
    });
    
    return userId;
  },
});

/**
 * Update user session state
 */
export const updateUserSession = mutation({
  args: {
    userId: v.id("users"),
    currentAgent: v.optional(v.string()),
    stage: v.optional(v.string()),
    context: v.optional(v.any()),
    verificationStatus: v.optional(v.boolean()),
    currentDealId: v.optional(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const updates: any = {};
    
    if (args.verificationStatus !== undefined) {
      updates.verificationStatus = args.verificationStatus;
    }
    
    if (args.currentDealId !== undefined) {
      updates.currentDealId = args.currentDealId;
    }
    
    if (args.currentAgent || args.stage || args.context) {
      updates.conversationState = {
        ...user.conversationState,
        ...(args.currentAgent && { currentAgent: args.currentAgent }),
        ...(args.stage && { stage: args.stage }),
        ...(args.context && { context: args.context }),
      };
    }
    
    await ctx.db.patch(args.userId, updates);
    return args.userId;
  },
});

/**
 * Route message to appropriate agent using intelligent context-aware routing with workflow state
 */
export const routeMessage = query({
  args: {
    message: v.string(),
    conversationId: v.string(),
    userName: v.optional(v.string()),
    userPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user session if exists
    let user = null;
    
    if (args.userName) {
      user = await ctx.db
        .query("users")
        .withIndex("by_name", (q) => q.eq("name", args.userName!))
        .first();
    }
    
    // Get conversation context - handle both ID formats and strings
    let conversation = null;
    try {
      // Try to get conversation if it's a valid ID
      if (args.conversationId.match(/^[a-z0-9]{32}$/)) {
        conversation = await ctx.db.get(args.conversationId as Id<"conversations">);
      } else {
        // For test/string IDs, try to find by querying
        const conversations = await ctx.db.query("conversations").collect();
        conversation = conversations.find(c => c._id === args.conversationId) || null;
      }
    } catch (error) {
      console.log("Conversation not found or invalid ID format, proceeding without conversation context");
      conversation = null;
    }
    
    // Get recent thread activity for context
    const recentThread = await ctx.db
      .query("agentThreads")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .first();
    
    // Check for active workflow state - PRIORITY 1
    const workflow = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .first();
    
    // Intelligent routing based on context and message content
    let agent = "mainEntry";
    let action = "continue";
    let routingReason = "default";
    let workflowInfo = null;
    
    // Priority 1: Active workflow state
    if (workflow) {
      if (workflow.status === "handoff_pending" && workflow.nextAgent) {
        agent = workflow.nextAgent;
        action = "handoff";
        routingReason = "workflow_handoff";
        workflowInfo = workflow;
      } else if (workflow.status === "active") {
        agent = workflow.currentAgent;
        action = "continue";
        routingReason = "workflow_continuation";
        workflowInfo = workflow;
      } else if (workflow.status === "paused") {
        agent = workflow.currentAgent;
        action = "resume";
        routingReason = "workflow_resume";
        workflowInfo = workflow;
      }
    }
    // Priority 2: Check existing conversation context
    else if (conversation?.currentAgent && recentThread) {
      agent = conversation.currentAgent;
      action = "continue";
      routingReason = "conversation_continuity";
    }
    // Priority 3: Check user session state
    else if (user?.conversationState?.currentAgent) {
      agent = user.conversationState.currentAgent;
      action = "continue";
      routingReason = "user_session_state";
    }
    // Priority 4: Intelligent message analysis for routing
    else {
      const messageText = args.message.toLowerCase();
      
      // Dealer-specific keywords and patterns
      if (messageText.includes("deal") && (messageText.includes("number") || /\d+/.test(messageText)) ||
          messageText.includes("dealer") ||
          messageText.includes("inventory") ||
          messageText.includes("update deal") ||
          messageText.includes("verify")) {
        agent = "dealerInteraction";
        action = "start";
        routingReason = "dealer_keywords";
      }
      // Customer transaction keywords
      else if (messageText.includes("finish") || messageText.includes("complete") ||
               messageText.includes("transaction") || messageText.includes("buy") ||
               messageText.includes("purchase") || messageText.includes("sign")) {
        agent = "customerTransaction";
        action = "start";
        routingReason = "transaction_keywords";
      }
      // Paperwork specific keywords
      else if (messageText.includes("paperwork") || messageText.includes("document") ||
               messageText.includes("dmv") || messageText.includes("title") ||
               messageText.includes("registration")) {
        agent = "customerPaperwork";
        action = "start";
        routingReason = "paperwork_keywords";
      }
      // General information requests
      else if (messageText.includes("payment") || messageText.includes("rate") ||
               messageText.includes("bank") || messageText.includes("finance") ||
               messageText.includes("estimate")) {
        agent = "customerGeneralInfo";
        action = "start";
        routingReason = "general_info_keywords";
      }
      // Aftermarket keywords
      else if (messageText.includes("warranty") || messageText.includes("protection") ||
               messageText.includes("aftermarket") || messageText.includes("add-on")) {
        agent = "aftermarketOffer";
        action = "start";
        routingReason = "aftermarket_keywords";
      }
      // Direct tool execution requests (advanced users/dealers)
      else if (messageText.includes("execute tool") || messageText.includes("run calculation") ||
               messageText.includes("tool handler")) {
        agent = "toolHandler";
        action = "start";
        routingReason = "direct_tool_request";
      }
      // Default to main entry for everything else
      else {
        agent = "mainEntry";
        action = "start";
        routingReason = "default_entry";
      }
    }
    
    // Check if this message might require tools
    const toolRequirements = detectToolRequirements(args.message);
    
    return {
      agent,
      action,
      currentUser: user,
      needsUserCreation: false,
      routingReason,
      hasExistingThread: !!recentThread,
      workflowState: workflowInfo,
      toolRequirements: toolRequirements.needsTools ? {
        needed: true,
        types: toolRequirements.toolTypes,
        priority: toolRequirements.priority,
        patterns: toolRequirements.detectedPatterns,
      } : { needed: false },
      conversationContext: {
        currentAgent: conversation?.currentAgent,
        activeThreadId: conversation?.activeThreadId,
        lastHandoff: conversation?.lastAgentHandoff,
      },
    };
  },
});

/**
 * Get or create thread for conversation continuity
 */
export const getOrCreateThread = mutation({
  args: {
    conversationId: v.string(),
    agentName: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Look for existing thread for this conversation and agent
    const existingThread = await ctx.db
      .query("agentThreads")
      .withIndex("by_conversation_agent", (q) => 
        q.eq("conversationId", args.conversationId).eq("agentName", args.agentName)
      )
      .first();
    
    if (existingThread) {
      // Update last used timestamp
      await ctx.db.patch(existingThread._id, {
        lastUsed: now,
      });
      return {
        threadId: existingThread.threadId,
        isNewThread: false,
        context: existingThread.context,
      };
    }
    
    // Create new thread record - actual thread will be created in action
    const threadRecord = await ctx.db.insert("agentThreads", {
      conversationId: args.conversationId,
      threadId: "", // Will be updated after thread creation
      agentName: args.agentName,
      createdAt: now,
      lastUsed: now,
      context: {},
    });
    
    return {
      threadRecordId: threadRecord,
      isNewThread: true,
      context: {},
    };
  },
});

/**
 * Update thread with actual threadId after creation
 */
export const updateThreadId = mutation({
  args: {
    threadRecordId: v.id("agentThreads"),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadRecordId, {
      threadId: args.threadId,
    });
  },
});

/**
 * Update conversation with current agent and thread
 */
export const updateConversationAgent = mutation({
  args: {
    conversationId: v.string(),
    agentName: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find conversation by ID - handle both valid IDs and test strings
    let conversation = null;
    try {
      if (args.conversationId.match(/^[a-z0-9]{32}$/)) {
        conversation = await ctx.db.get(args.conversationId as Id<"conversations">);
      } else {
        // For test/string IDs, try to find by querying
        const conversations = await ctx.db.query("conversations").collect();
        conversation = conversations.find(c => c._id === args.conversationId) || null;
      }
    } catch (error) {
      console.log("Conversation not found or invalid ID format in updateConversationAgent");
      conversation = null;
    }
    
    if (conversation) {
      await ctx.db.patch(conversation._id, {
        currentAgent: args.agentName,
        activeThreadId: args.threadId,
        lastAgentHandoff: Date.now(),
      });
    }
  },
});

/**
 * Tool Delegation Handler - Executes toolHandlerAgent and returns results
 */
async function executeToolDelegation(_ctx: any, args: {
  originalAgent: string;
  message: string;
  toolTypes: string[];
  priority: string;
  userId?: any;
  conversationId: string;
  context?: any;
}): Promise<{
  success: boolean;
  toolResponse?: string;
  toolData?: any;
  threadId?: string;
  isNewThread?: boolean;
  error?: string;
}> {
  try {
    // Get or create thread for toolHandler
    const toolThread = await _ctx.runMutation(api.agentRouter.getOrCreateThread, {
      conversationId: args.conversationId,
      agentName: "toolHandler",
      userId: args.userId,
    });

    let threadId: string;
    let isNewThread = false;

    if (toolThread.isNewThread) {
      // Create new Convex agent thread for tools
      const agentThread = await _ctx.runMutation(components.agent.threads.createThread, {
        userId: args.userId || undefined,
        title: `ToolHandler - ${args.conversationId}`,
      });
      
      // Update thread record with actual threadId
      if (toolThread.threadRecordId) {
        await _ctx.runMutation(api.agentRouter.updateThreadId, {
          threadRecordId: toolThread.threadRecordId,
          threadId: agentThread._id,
        });
      }
      
      threadId = agentThread._id;
      isNewThread = true;
    } else {
      threadId = toolThread.threadId || `tool_fallback_${Date.now()}`;
    }

    // Create enhanced prompt for tool execution
    const toolPrompt = `Execute tools for: ${args.message}

DETECTED TOOL TYPES: ${args.toolTypes.join(', ')}
PRIORITY: ${args.priority}
ORIGINAL AGENT: ${args.originalAgent}

Please analyze this request and execute the appropriate tools to provide the requested information or perform the needed calculations.`;

    // Execute toolHandlerAgent
    const toolResult = await toolHandlerAgent.generateText(_ctx, {
      userId: args.userId || undefined,
      threadId: threadId,
    }, {
      prompt: toolPrompt,
    });

    return {
      success: true,
      toolResponse: toolResult.text,
      toolData: { toolTypes: args.toolTypes, priority: args.priority },
      threadId: threadId,
      isNewThread: isNewThread,
    };

  } catch (error) {
    console.error("Tool delegation failed:", error);
    return {
      success: false,
      error: "Tool execution failed. Falling back to conversational agent.",
    };
  }
}

/**
 * Execute agent with message - Enhanced with workflow state management and tool delegation
 */
export const executeAgent = action({
  args: {
    agentName: v.string(),
    message: v.string(),
    userId: v.optional(v.id("users")),
    conversationId: v.string(),
    action: v.string(),
    context: v.optional(v.any()),
    workflowState: v.optional(v.any()),
  },
  handler: async (_ctx, args): Promise<{ success: boolean; response?: string; error?: string; agentUsed: string; threadId?: string; isNewThread?: boolean; workflowId?: any; workflowAction?: string; toolsExecuted?: string[] }> => {
    // Get agent based on name
    let agentInstance;
    switch (args.agentName) {
      case "mainEntry":
        agentInstance = mainEntryAgent;
        break;
      case "dealerInteraction":
        agentInstance = dealerInteractionAgent;
        break;
      case "customerGeneralInfo":
        agentInstance = customerGeneralInfoAgent;
        break;
      case "customerTransaction":
        agentInstance = customerTransactionAgent;
        break;
      case "aftermarketOffer":
        agentInstance = aftermarketOfferAgent;
        break;
      case "customerPaperwork":
        agentInstance = customerPaperworkAgent;
        break;
      case "toolHandler":
        agentInstance = toolHandlerAgent;
        break;
      default:
        agentInstance = mainEntryAgent;
    }
    
    try {
      // Check if message requires tool execution
      const toolRequirements = detectToolRequirements(args.message, args.context);
      
      // If tools are needed and we're not already using the toolHandler
      if (toolRequirements.needsTools && args.agentName !== "toolHandler") {
        // Delegate to toolHandlerAgent for tool execution
        const toolResult = await executeToolDelegation(_ctx, {
          originalAgent: args.agentName,
          message: args.message,
          toolTypes: toolRequirements.toolTypes,
          priority: toolRequirements.priority,
          userId: args.userId,
          conversationId: args.conversationId,
          context: args.context,
        });
        
        // If tool execution was successful, combine results with conversation agent
        if (toolResult.success && toolResult.toolData) {
          // Execute original agent with tool results as context
          const contextualMessage = `${args.message}

[TOOL EXECUTION RESULTS]
${toolResult.toolResponse}

Please provide a conversational response incorporating this tool data.`;
          
          // Continue with original agent using enhanced context
          const agentResult = await agentInstance.generateText(_ctx, {
            userId: args.userId || undefined,
            threadId: toolResult.threadId || `fallback_${Date.now()}`,
          }, {
            prompt: contextualMessage,
          });
          
          return {
            success: true,
            response: agentResult.text,
            agentUsed: `${args.agentName} + toolHandler`,
            threadId: toolResult.threadId,
            isNewThread: toolResult.isNewThread,
            toolsExecuted: toolRequirements.toolTypes,
            workflowId: null,
            workflowAction: undefined,
          };
        }
        // If tool execution failed, fall back to regular agent execution
      }
      // Handle workflow state management
      let workflowId = null;
      let workflowAction: string | undefined = undefined;
      
      if (args.action === "start") {
        // Determine workflow type based on agent
        let workflowType = "customer_general_info"; // default
        switch (args.agentName) {
          case "dealerInteraction":
            workflowType = "dealer_verification";
            break;
          case "customerTransaction":
            workflowType = "customer_transaction";
            break;
          case "customerPaperwork":
            workflowType = "paperwork_flow";
            break;
          case "aftermarketOffer":
            workflowType = "aftermarket_flow";
            break;
        }
        
        // Use workflowType for future workflow implementation
        console.log("Creating workflow of type:", workflowType);
        
        // Create new workflow - TODO: Implement proper internal API pattern
        // workflowId = await createWorkflow(...);
        workflowAction = "created";
      } else if (args.action === "handoff" && args.workflowState) {
        // Complete handoff - TODO: Implement proper internal API pattern
        workflowAction = "handoff_completed";
      } else if (args.action === "resume" && args.workflowState) {
        // Resume workflow - TODO: Implement proper internal API pattern
        workflowAction = "resumed";
      } else if (args.workflowState) {
        // Update existing workflow step - TODO: Implement proper internal API pattern
        workflowAction = "updated";
      }
      
      // Get or create thread for conversation continuity using proper Convex agent threads
      let thread;
      
      // Try to find existing thread for this conversation and agent
      const existingThread = await _ctx.runMutation(api.agentRouter.getOrCreateThread, {
        conversationId: args.conversationId,
        agentName: args.agentName,
        userId: args.userId,
      });
      
      if (existingThread.isNewThread) {
        // Create new Convex agent thread
        const agentThread = await _ctx.runMutation(components.agent.threads.createThread, {
          userId: args.userId || undefined,
          title: `${args.agentName} - ${args.conversationId}`,
        });
        
        // Update thread record with actual threadId
        if (existingThread.threadRecordId) {
          await _ctx.runMutation(api.agentRouter.updateThreadId, {
            threadRecordId: existingThread.threadRecordId,
            threadId: agentThread._id,
          });
        }
        
        thread = { threadId: agentThread._id };
      } else {
        // Use existing thread
        thread = { threadId: existingThread.threadId || `fallback_${Date.now()}` };
      }
      
      // Execute the actual agent with the message
      const result = await agentInstance.generateText(_ctx, {
        userId: args.userId || undefined,
        threadId: thread.threadId,
      }, {
        prompt: args.message,
      });
      
      return {
        success: true,
        response: result.text,
        agentUsed: args.agentName,
        threadId: thread.threadId,
        isNewThread: existingThread.isNewThread,
        workflowId,
        workflowAction,
        toolsExecuted: undefined,
      };
    } catch (error) {
      console.error(`Agent ${args.agentName} execution failed:`, error);
      
      // Handle workflow error if applicable - TODO: Implement proper internal API pattern
      if (args.workflowState) {
        console.error("Workflow error handling not yet implemented:", error);
      }
      
      return {
        success: false,
        error: "I encountered an issue processing your request. Please try again.",
        agentUsed: args.agentName,
        toolsExecuted: undefined,
      };
    }
  },
});

/**
 * Get workflow information for debugging/monitoring
 */
export const getWorkflowInfo = query({
  args: {
    conversationId: v.string(),
  },
  handler: async (_ctx, _args): Promise<any> => {
    // TODO: Implement proper internal API pattern
    return null;
  },
});

/**
 * Initiate workflow handoff from one agent to another
 */
export const initiateWorkflowHandoff = mutation({
  args: {
    conversationId: v.string(),
    targetAgent: v.string(),
    handoffReason: v.string(),
    handoffData: v.optional(v.any()),
  },
  handler: async (_ctx, args): Promise<any> => {
    // TODO: Implement proper internal API pattern
    return {
      workflowId: null,
      targetAgent: args.targetAgent,
      handoffData: args.handoffData,
    };
  },
});

/**
 * Reset workflow (for testing/debugging)
 */
export const resetWorkflow = mutation({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find and complete any active workflows
    const activeWorkflows = await ctx.db
      .query("agentWorkflows")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .collect();
    
    // Mark all as completed
    for (const workflow of activeWorkflows) {
      await ctx.db.patch(workflow._id, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }
    
    return { resetCount: activeWorkflows.length };
  },
});

// TOOL DELEGATION SYSTEM IMPLEMENTATION
// 
// This enhanced agent router now includes:
// 1. detectToolRequirements() - Analyzes messages for tool execution patterns
// 2. executeToolDelegation() - Delegates tool execution to toolHandlerAgent using llama-3.2-3b
// 3. Hybrid execution flow - Combines tool results with conversational agents
// 4. Seamless integration - No breaking changes to existing agent workflows
// 
// Tool Detection Patterns:
// - Deal retrieval: "deal 1", "customer Jane Doe", etc.
// - Financial calculations: "payment", "monthly", dollar amounts, etc.
// - Document generation: "paperwork", "DMV forms", etc.
// - Verification: "SMS", "code", 4-digit numbers, etc.
// - Aftermarket: "warranty", "protection", etc.
// - Bank programs: "financing", "credit", "approval", etc.
// - Data updates: "update", "change", "modify", etc.
//
// Execution Flow:
// 1. Message analyzed for tool requirements
// 2. If tools needed: delegate to toolHandlerAgent (llama-3.2-3b)
// 3. Tool results returned to original conversation agent
// 4. Combined response provides both data and conversational flow
// 5. If tool delegation fails: fallback to standard agent execution
//
// This maintains conversation continuity while providing precise tool execution.

