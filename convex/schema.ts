import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    // Thread management for AI agents
    activeThreadId: v.optional(v.string()),
    currentAgent: v.optional(v.string()),
    lastAgentHandoff: v.optional(v.number()), // timestamp
  }).index("by_active_thread", ["activeThreadId"]),
  
  // Agent thread tracking for conversation continuity
  agentThreads: defineTable({
    conversationId: v.string(),
    threadId: v.string(),
    agentName: v.string(),
    createdAt: v.number(),
    lastUsed: v.number(),
    context: v.optional(v.any()),
  }).index("by_conversation", ["conversationId"])
    .index("by_thread", ["threadId"])
    .index("by_conversation_agent", ["conversationId", "agentName"]),
  
  // Agent workflow state management for tracking multi-step processes
  agentWorkflows: defineTable({
    conversationId: v.string(),
    userId: v.optional(v.id("users")),
    currentAgent: v.string(),
    workflowType: v.string(), // "dealer_verification", "customer_transaction", "paperwork_flow", etc.
    currentStep: v.string(),
    stepData: v.any(), // Data collected in current step
    workflowData: v.any(), // Full workflow context
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("handoff_pending")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedSteps: v.array(v.string()),
    nextAgent: v.optional(v.string()), // For handoffs
    handoffReason: v.optional(v.string()),
    errorState: v.optional(v.object({
      error: v.string(),
      step: v.string(),
      timestamp: v.number(),
      retryCount: v.number(),
    })),
  }).index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_workflow_type", ["workflowType"])
    .index("by_current_agent", ["currentAgent"]),
  
  // AI-Fi Users
  users: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    verificationStatus: v.boolean(),
    currentDealId: v.optional(v.id("deals")),
    conversationState: v.object({
      currentAgent: v.string(),
      stage: v.string(),
      context: v.any(),
    }),
    userType: v.union(v.literal("customer"), v.literal("dealer")),
  }).index("by_name", ["name"])
    .index("by_phone", ["phone"]),
  
  // AI-Fi Deals - Enhanced for database persistence
  deals: defineTable({
    dealNumber: v.string(),
    customerId: v.optional(v.id("users")),
    
    // Personal Information
    fullName: v.string(),
    address: v.string(),
    insurance: v.string(),
    ssn: v.optional(v.string()),
    creditScore: v.optional(v.number()),
    timeAtAddress: v.optional(v.string()),
    employment: v.optional(v.string()),
    monthlyIncome: v.optional(v.number()),
    
    // Vehicle Information
    vehicle: v.string(),
    trade: v.optional(v.string()),
    
    // Financial Information
    salePrice: v.number(),
    rebate: v.optional(v.number()),
    dealerFees: v.number(),
    tradeValue: v.optional(v.number()),
    tradePayoff: v.optional(v.number()),
    taxRate: v.number(),
    tagTitleCost: v.number(),
    
    // Deal Type and Expectations
    isFinance: v.boolean(),
    expectation: v.string(), // payment expectation or OTD amount
    
    // Deal Status and Progress
    currentStage: v.string(),
    isComplete: v.boolean(),
    selectedAftermarketOption: v.optional(v.string()),
    signedDocuments: v.array(v.string()),
    
    // Audit trail
    createdAt: v.number(),
    updatedAt: v.number(),
    lastModifiedBy: v.optional(v.string()),
  }).index("by_deal_number", ["dealNumber"])
    .index("by_customer", ["customerId"])
    .index("by_full_name", ["fullName"])
    .index("by_stage", ["currentStage"]),
});