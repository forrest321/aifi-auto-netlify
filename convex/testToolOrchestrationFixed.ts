import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Fixed Tool Orchestration Test Suite
// Uses separated tool execution to avoid Venice.ai API compatibility issues

export const testToolOrchestrationFixed = action({
  args: {
    testScenario: v.string(),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const testConversationId = args.conversationId || `test_fixed_${Date.now()}`;
    
    console.log(`\n=== FIXED TOOL ORCHESTRATION TEST: ${args.testScenario} ===`);
    
    try {
      switch (args.testScenario) {
        case "dealer_workflow_fixed":
          return await testDealerWorkflowFixed(ctx, testConversationId);
        case "tool_separation":
          return await testToolSeparation(ctx, testConversationId);
        case "end_to_end":
          return await testEndToEnd(ctx, testConversationId);
        default:
          return { error: "Unknown test scenario" };
      }
    } catch (error) {
      console.error("Test failed with error:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

// Test 1: Fixed Dealer Workflow with Separated Tool Execution
async function testDealerWorkflowFixed(ctx: any, conversationId: string) {
  console.log("🔧 Testing Fixed Dealer Workflow with Separated Tools");
  
  const results: any = {
    test: "dealer_workflow_fixed",
    steps: [],
    success: false,
    toolsExecuted: [],
    errors: [],
  };

  try {
    // Step 1: Test tool detection
    console.log("Step 1: Testing tool detection");
    const routingResult = await ctx.runQuery(api.agentRouter.routeMessage, {
      message: "I need to verify deal 207 for Test Te Tester",
      conversationId,
    });

    results.steps.push({
      step: 1,
      description: "Tool detection",
      toolRequirements: routingResult.toolRequirements,
      detected: routingResult.toolRequirements?.needed || false,
    });

    // Step 2: Test separated tool execution
    console.log("Step 2: Testing separated tool execution");
    if (routingResult.toolRequirements?.needed) {
      const toolResult = await ctx.runAction(api.toolOrchestrator.executeTools, {
        toolTypes: routingResult.toolRequirements.types,
        message: "I need to verify deal 207",
        dealNumber: "207",
        conversationId,
      });

      results.steps.push({
        step: 2,
        description: "Separated tool execution",
        success: toolResult.success,
        toolResults: toolResult.toolResults,
        summary: toolResult.summary,
        errors: toolResult.errors,
      });

      if (toolResult.success) {
        results.toolsExecuted = Object.keys(toolResult.toolResults);
      }
    }

    // Step 3: Test enhanced agent execution
    console.log("Step 3: Testing enhanced agent execution");
    const enhancedAgentResult = await ctx.runAction(api.toolOrchestrator.executeAgentWithTools, {
      agentName: "dealerInteraction",
      message: "I need to verify deal 207 for Test Te Tester",
      conversationId,
      toolRequirements: routingResult.toolRequirements?.needed ? routingResult.toolRequirements : undefined,
    });

    results.steps.push({
      step: 3,
      description: "Enhanced agent execution",
      success: enhancedAgentResult.success,
      response: enhancedAgentResult.response,
      toolsExecuted: enhancedAgentResult.toolsExecuted,
      toolData: enhancedAgentResult.toolData,
      error: enhancedAgentResult.error,
    });

    // Verify results
    const hasToolData = enhancedAgentResult.toolData && Object.keys(enhancedAgentResult.toolData).length > 0;
    const hasResponse = enhancedAgentResult.success && enhancedAgentResult.response;
    
    if (hasToolData && hasResponse) {
      // Check if response contains deal-specific information
      const response = enhancedAgentResult.response || "";
      const containsDealInfo = response.includes("207") || response.includes("Test Te Tester") || response.includes("F150");
      
      if (containsDealInfo) {
        results.success = true;
      } else {
        results.errors.push("Response doesn't contain expected deal information");
      }
    } else {
      results.errors.push("Missing tool data or response");
    }

    return results;

  } catch (error) {
    console.error("Fixed dealer workflow test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Test 2: Tool Separation Verification
async function testToolSeparation(ctx: any, conversationId: string) {
  console.log("⚙️ Testing Tool Separation System");

  const results: any = {
    test: "tool_separation",
    steps: [],
    success: false,
    errors: [],
  };

  try {
    // Step 1: Test direct tool execution
    console.log("Step 1: Direct tool execution test");
    const directToolResult = await ctx.runAction(api.toolOrchestrator.executeTools, {
      toolTypes: ["deal_retrieval", "financial_calculations"],
      message: "Get deal 207 information and calculate payments",
      dealNumber: "207", 
      conversationId,
    });

    results.steps.push({
      step: 1,
      description: "Direct tool execution",
      success: directToolResult.success,
      toolResults: Object.keys(directToolResult.toolResults),
      summary: directToolResult.summary,
    });

    // Step 2: Test tool availability
    console.log("Step 2: Tool availability check");
    const availableTools = await ctx.runQuery(api.toolOrchestrator.getAvailableTools, {});
    
    results.steps.push({
      step: 2,
      description: "Tool availability",
      availableTools: availableTools.toolTypes,
      status: availableTools.toolHandlerStatus,
      method: availableTools.orchestrationMethod,
    });

    // Step 3: Test agent without tools
    console.log("Step 3: Agent execution without tools");
    const agentWithoutTools = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: "dealerInteraction",
      message: "Hello, I am a dealer",
      conversationId: conversationId + "_no_tools",
      action: "start",
    });

    results.steps.push({
      step: 3,
      description: "Agent without tools",
      success: agentWithoutTools.success,
      hasResponse: !!agentWithoutTools.response,
      responseLength: agentWithoutTools.response?.length || 0,
    });

    // Verify separation is working
    const toolExecutionWorks = directToolResult.success;
    const toolsAvailable = availableTools.toolTypes.length > 0;
    const agentWorksIndependently = agentWithoutTools.success;

    if (toolExecutionWorks && toolsAvailable && agentWorksIndependently) {
      results.success = true;
    } else {
      results.errors.push("Tool separation system not fully functional");
    }

    return results;

  } catch (error) {
    console.error("Tool separation test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Test 3: End-to-End Workflow
async function testEndToEnd(ctx: any, conversationId: string) {
  console.log("🚀 Testing End-to-End Workflow");

  const results: any = {
    test: "end_to_end",
    steps: [],
    success: false,
    workflowResults: {},
    errors: [],
  };

  try {
    // Test multiple agent types with tool integration
    const testCases = [
      {
        name: "dealer_with_tools",
        agentName: "dealerInteraction",
        message: "I need to verify deal 207",
        expectTools: true,
      },
      {
        name: "customer_transaction",
        agentName: "customerTransaction", 
        message: "What would my monthly payment be for deal 207?",
        expectTools: true,
      },
      {
        name: "aftermarket_inquiry",
        agentName: "aftermarketOffer",
        message: "What warranty options are available?",
        expectTools: false, // This might not trigger specific tools
      },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`Step ${i + 1}: Testing ${testCase.name}`);

      // Route the message
      const routing = await ctx.runQuery(api.agentRouter.routeMessage, {
        message: testCase.message,
        conversationId: conversationId + `_${testCase.name}`,
      });

      // Execute with tool orchestration
      const result = await ctx.runAction(api.toolOrchestrator.executeAgentWithTools, {
        agentName: testCase.agentName,
        message: testCase.message,
        conversationId: conversationId + `_${testCase.name}`,
        toolRequirements: routing.toolRequirements?.needed ? routing.toolRequirements : undefined,
      });

      results.steps.push({
        step: i + 1,
        testCase: testCase.name,
        routing: {
          agent: routing.agent,
          toolsDetected: routing.toolRequirements?.needed || false,
        },
        execution: {
          success: result.success,
          toolsExecuted: result.toolsExecuted,
          hasResponse: !!result.response,
          responseLength: result.response?.length || 0,
        },
      });

      results.workflowResults[testCase.name] = {
        success: result.success,
        toolsExecuted: result.toolsExecuted.length,
        error: result.error,
      };
    }

    // Verify overall success
    const successfulTests = results.steps.filter((step: any) => step.execution.success).length;
    const totalTests = testCases.length;

    if (successfulTests === totalTests) {
      results.success = true;
    } else {
      results.errors.push(`Only ${successfulTests}/${totalTests} workflows succeeded`);
    }

    results.summary = {
      totalTests,
      successfulTests,
      successRate: ((successfulTests / totalTests) * 100).toFixed(1) + "%",
    };

    return results;

  } catch (error) {
    console.error("End-to-end test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Quick Test All
export const runAllFixedTests = action({
  args: {},
  handler: async (ctx, _args) => {
    console.log("🚀 Running All Fixed Tool Orchestration Tests");
    
    const allResults: any = {
      testSuite: "fixed_tool_orchestration",
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total: 3,
        passed: 0,
        failed: 0,
      },
    };

    const tests = [
      "dealer_workflow_fixed",
      "tool_separation", 
      "end_to_end",
    ];

    for (const test of tests) {
      try {
        console.log(`\n--- Running ${test} ---`);
        const result = await ctx.runAction(api.testToolOrchestrationFixed.testToolOrchestrationFixed, {
          testScenario: test,
        });
        
        allResults.tests[test] = result;
        
        if (result.success) {
          allResults.summary.passed++;
          console.log(`✅ ${test} PASSED`);
        } else {
          allResults.summary.failed++;
          console.log(`❌ ${test} FAILED:`, result.errors);
        }
      } catch (error) {
        allResults.summary.failed++;
        console.log(`💥 ${test} CRASHED:`, error);
      }
    }

    console.log(`\n=== FIXED TOOL ORCHESTRATION RESULTS ===`);
    console.log(`Total Tests: ${allResults.summary.total}`);
    console.log(`Passed: ${allResults.summary.passed}`);
    console.log(`Failed: ${allResults.summary.failed}`);
    console.log(`Success Rate: ${((allResults.summary.passed / allResults.summary.total) * 100).toFixed(1)}%`);

    return allResults;
  },
});