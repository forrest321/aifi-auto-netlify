// Test agent to verify Venice integration in Convex environment
import { action } from "./_generated/server";
import { v } from "convex/values";
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { venice, veniceModels } from "./venice_provider";

// Simple test agent
const testAgent = new Agent(components.agent, {
  chat: venice.chat(veniceModels.uncensored),
  instructions: `You are a test agent. Respond with "Venice integration is working!" if you can generate text.`,
  tools: {},
  maxSteps: 1,
  maxRetries: 1,
});

// Test action to verify Venice integration
export const testVeniceIntegration = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("Testing Venice integration...");
      console.log("Environment check - VENICE_API_KEY exists:", !!process.env.VENICE_API_KEY);
      console.log("Venice provider config:", {
        apiKey: process.env.VENICE_API_KEY ? "SET" : "NOT SET",
        baseURL: "https://api.venice.ai/api/v1",
      });
      
      // Create a proper thread using the agent component
      console.log("Creating thread...");
      const thread = await ctx.runMutation(components.agent.threads.createThread, {
        userId: "test-user",
        title: "Venice Integration Test",
      });
      
      console.log("Thread created:", thread);
      
      const result = await testAgent.generateText(ctx, {
        userId: "test-user",
        threadId: thread._id,
      }, {
        prompt: args.message,
      });
      
      console.log("Agent generateText result:", result);
      
      return {
        success: true,
        response: result.text,
        threadId: thread._id,
        metadata: {
          hasApiKey: !!process.env.VENICE_API_KEY,
          agentConfigured: true,
        }
      };
    } catch (error) {
      console.error("Venice integration test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          hasApiKey: !!process.env.VENICE_API_KEY,
          agentConfigured: true,
        }
      };
    }
  },
});