import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Simplified Tool Orchestration System
// Separates tool execution from conversational agents to avoid API compatibility issues

/**
 * Execute tools and return results without mixing them into chat context
 */
export const executeTools = action({
  args: {
    toolTypes: v.array(v.string()),
    message: v.string(),
    dealNumber: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const results: any = {
      success: false,
      toolResults: {} as Record<string, any>,
      summary: "",
      errors: [],
    };

    try {
      // Execute tools based on detected types
      for (const toolType of args.toolTypes) {
        switch (toolType) {
          case "deal_retrieval":
            if (args.dealNumber) {
              const dealData = await ctx.runAction(api.agentRouter.executeAgent, {
                agentName: "toolHandler",
                message: `Get deal information for deal number ${args.dealNumber}`,
                conversationId: args.conversationId + "_tool",
                action: "start",
                userId: args.userId,
              });
              
              if (dealData.success) {
                results.toolResults.dealInfo = dealData.response;
              } else {
                results.errors.push(`Deal retrieval failed: ${dealData.error}`);
              }
            }
            break;

          case "financial_calculations":
            if (args.dealNumber) {
              const calcData = await ctx.runAction(api.agentRouter.executeAgent, {
                agentName: "toolHandler",
                message: `Calculate monthly payment for deal number ${args.dealNumber}`,
                conversationId: args.conversationId + "_calc",
                action: "start",
                userId: args.userId,
              });
              
              if (calcData.success) {
                results.toolResults.calculations = calcData.response;
              } else {
                results.errors.push(`Payment calculation failed: ${calcData.error}`);
              }
            }
            break;

          case "aftermarket":
            const aftermarketData = await ctx.runAction(api.agentRouter.executeAgent, {
              agentName: "toolHandler",
              message: "Get aftermarket protection options with pricing",
              conversationId: args.conversationId + "_aftermarket",
              action: "start",
              userId: args.userId,
            });
            
            if (aftermarketData.success) {
              results.toolResults.aftermarket = aftermarketData.response;
            } else {
              results.errors.push(`Aftermarket data failed: ${aftermarketData.error}`);
            }
            break;

          case "document_generation":
            if (args.dealNumber) {
              const docData = await ctx.runAction(api.agentRouter.executeAgent, {
                agentName: "toolHandler",
                message: `Generate documents for deal number ${args.dealNumber}`,
                conversationId: args.conversationId + "_docs",
                action: "start",
                userId: args.userId,
              });
              
              if (docData.success) {
                results.toolResults.documents = docData.response;
              } else {
                results.errors.push(`Document generation failed: ${docData.error}`);
              }
            }
            break;

          case "verification":
            // For verification, we just acknowledge the request
            results.toolResults.verification = "Verification system ready. Please provide deal number for verification.";
            break;

          case "bank_programs":
            const bankData = await ctx.runAction(api.agentRouter.executeAgent, {
              agentName: "toolHandler",
              message: "Get available bank financing programs and rates",
              conversationId: args.conversationId + "_banks",
              action: "start",
              userId: args.userId,
            });
            
            if (bankData.success) {
              results.toolResults.bankPrograms = bankData.response;
            } else {
              results.errors.push(`Bank programs failed: ${bankData.error}`);
            }
            break;

          case "data_update":
            // For updates, we acknowledge the intent
            results.toolResults.updateCapability = "Data update system ready. Please specify what information needs to be updated.";
            break;
        }
      }

      // Create summary
      const successfulTools = Object.keys(results.toolResults).length;
      const totalTools = args.toolTypes.length;
      
      if (successfulTools > 0) {
        results.success = true;
        results.summary = `Successfully executed ${successfulTools}/${totalTools} tools: ${Object.keys(results.toolResults).join(", ")}`;
      } else {
        results.summary = `Tool execution failed. Errors: ${results.errors.join(", ")}`;
      }

      return results;

    } catch (error) {
      console.error("Tool orchestration failed:", error);
      return {
        success: false,
        toolResults: {},
        summary: "Tool orchestration system encountered an error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },
});

/**
 * Enhanced agent execution with separated tool orchestration
 */
export const executeAgentWithTools = action({
  args: {
    agentName: v.string(),
    message: v.string(),
    conversationId: v.string(),
    userId: v.optional(v.id("users")),
    toolRequirements: v.optional(v.object({
      needed: v.boolean(),
      types: v.array(v.string()),
      priority: v.string(),
    })),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      // Step 1: Execute tools if needed
      let toolData = null;
      if (args.toolRequirements?.needed) {
        // Extract deal number from message if present
        const dealNumberMatch = args.message.match(/deal\s*(?:number\s*)?(\d+)/i);
        const dealNumber = dealNumberMatch ? dealNumberMatch[1] : undefined;

        toolData = await ctx.runAction(api.toolOrchestrator.executeTools, {
          toolTypes: args.toolRequirements.types,
          message: args.message,
          dealNumber,
          userId: args.userId,
          conversationId: args.conversationId,
        });
      }

      // Step 2: Execute conversational agent with tool data as context
      let enhancedMessage = args.message;
      if (toolData?.success && Object.keys(toolData.toolResults).length > 0) {
        // Add tool results as context without trying to inject into chat history
        enhancedMessage = `${args.message}

AVAILABLE DATA CONTEXT:
${Object.entries(toolData.toolResults).map(([key, value]) => `${key.toUpperCase()}: ${value}`).join('\n\n')}

Please provide a helpful response using this data context.`;
      }

      // Execute the agent with enhanced message  
      const agentResult: any = await ctx.runAction(api.agentRouter.executeAgent, {
        agentName: args.agentName,
        message: enhancedMessage,
        conversationId: args.conversationId,
        action: "start",
        userId: args.userId,
      });

      return {
        success: agentResult.success,
        response: agentResult.response,
        error: agentResult.error,
        agentUsed: agentResult.agentUsed,
        toolsExecuted: toolData?.success ? Object.keys(toolData.toolResults) : [],
        toolData: toolData?.toolResults || {},
        threadId: agentResult.threadId,
        isNewThread: agentResult.isNewThread,
      };

    } catch (error) {
      console.error("Enhanced agent execution failed:", error);
      return {
        success: false,
        error: "Agent execution with tools failed",
        agentUsed: args.agentName,
        toolsExecuted: [],
        toolData: {},
      };
    }
  },
});

/**
 * Get available tools for debugging/monitoring
 */
export const getAvailableTools = query({
  args: {},
  handler: async (_ctx, _args) => {
    return {
      toolTypes: [
        "deal_retrieval",
        "financial_calculations",
        "aftermarket", 
        "document_generation",
        "verification",
        "bank_programs",
        "data_update",
      ],
      toolHandlerStatus: "available",
      orchestrationMethod: "separated_execution",
    };
  },
});