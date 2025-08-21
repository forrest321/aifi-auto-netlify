import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Comprehensive Tool Orchestration Test Suite
// Tests agent-to-agent communication, tool delegation, and result integration

export const testToolOrchestration = action({
  args: {
    testScenario: v.string(),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const testConversationId = args.conversationId || `test_conv_${Date.now()}`;
    const results: any = {};

    console.log(`\n=== TOOL ORCHESTRATION TEST: ${args.testScenario} ===`);
    
    try {
      switch (args.testScenario) {
        case "dealer_workflow":
          return await testDealerWorkflow(ctx, testConversationId);
        case "customer_transaction":
          return await testCustomerTransaction(ctx, testConversationId);
        case "aftermarket_workflow":
          return await testAftermarketWorkflow(ctx, testConversationId);
        case "document_workflow":
          return await testDocumentWorkflow(ctx, testConversationId);
        case "error_handling":
          return await testErrorHandling(ctx, testConversationId);
        case "all":
          return await runAllTests(ctx, testConversationId);
        default:
          return { error: "Unknown test scenario" };
      }
    } catch (error) {
      console.error("Test failed with error:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

// Test 1: Dealer Workflow with Real Data
async function testDealerWorkflow(ctx: any, conversationId: string) {
  console.log("🔧 Testing Dealer Workflow with Tool Orchestration");
  
  const results: any = {
    test: "dealer_workflow",
    steps: [],
    success: false,
    toolsExecuted: [],
    agentTransitions: [],
    errors: [],
  };

  try {
    // Step 1: Route dealer message mentioning deal
    console.log("Step 1: Routing dealer message with deal mention");
    const routingResult = await ctx.runQuery(api.agentRouter.routeMessage, {
      message: "I need to verify deal 207 for Test Te Tester",
      conversationId,
      userName: "Dealer Smith",
    });

    results.steps.push({
      step: 1,
      description: "Route dealer message",
      result: routingResult,
      toolRequirements: routingResult.toolRequirements,
    });

    console.log("Routing result:", JSON.stringify(routingResult, null, 2));

    // Verify tool detection
    if (!routingResult.toolRequirements?.needed) {
      results.errors.push("Tool requirements not detected for deal mention");
      return results;
    }

    if (!routingResult.toolRequirements.types.includes('deal_retrieval')) {
      results.errors.push("Deal retrieval tool not detected");
      return results;
    }

    // Step 2: Execute dealer agent with tool orchestration
    console.log("Step 2: Execute dealer agent with tool orchestration");
    const agentResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: routingResult.agent,
      message: "I need to verify deal 207 for Test Te Tester",
      conversationId,
      action: routingResult.action,
    });

    results.steps.push({
      step: 2,
      description: "Execute dealer agent",
      result: agentResult,
      agentUsed: agentResult.agentUsed,
      toolsExecuted: agentResult.toolsExecuted,
    });

    console.log("Agent result:", JSON.stringify(agentResult, null, 2));

    // Verify tool execution occurred
    if (!agentResult.toolsExecuted || agentResult.toolsExecuted.length === 0) {
      results.errors.push("Tools were not executed during agent processing");
      return results;
    }

    results.toolsExecuted = agentResult.toolsExecuted;
    results.agentTransitions.push({
      from: "router",
      to: agentResult.agentUsed,
      reason: "dealer_workflow",
    });

    // Step 3: Verify response contains deal information
    console.log("Step 3: Verify response contains deal information");
    const response = agentResult.response || "";
    
    const dealDataChecks = [
      { field: "Test Te Tester", present: response.includes("Test Te Tester") },
      { field: "Ford F150", present: response.includes("Ford F150") || response.includes("F150") },
      { field: "Deal 207", present: response.includes("207") },
      { field: "Financial data", present: response.includes("$") || response.includes("69500") },
    ];

    results.steps.push({
      step: 3,
      description: "Verify deal data in response",
      dealDataChecks,
      responseLength: response.length,
    });

    const missingData = dealDataChecks.filter(check => !check.present);
    if (missingData.length > 0) {
      results.errors.push(`Missing deal data in response: ${missingData.map(d => d.field).join(", ")}`);
    }

    // Step 4: Test deal update workflow
    console.log("Step 4: Test deal update workflow");
    const updateResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: "dealerInteraction",
      message: "Update the customer's monthly income to $8500",
      conversationId,
      action: "continue",
    });

    results.steps.push({
      step: 4,
      description: "Test deal update",
      result: updateResult,
      toolsExecuted: updateResult.toolsExecuted,
    });

    // Verify update tools were executed
    if (updateResult.toolsExecuted && updateResult.toolsExecuted.includes('data_update')) {
      results.toolsExecuted.push('data_update');
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error) {
    console.error("Dealer workflow test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Test 2: Customer Transaction with Calculations
async function testCustomerTransaction(ctx: any, conversationId: string) {
  console.log("💰 Testing Customer Transaction with Financial Calculations");

  const results: any = {
    test: "customer_transaction",
    steps: [],
    success: false,
    toolsExecuted: [],
    calculationResults: {},
    errors: [],
  };

  try {
    // Step 1: Customer requests payment calculation
    console.log("Step 1: Customer payment calculation request");
    const routingResult = await ctx.runQuery(api.agentRouter.routeMessage, {
      message: "What would my monthly payment be for deal 207?",
      conversationId,
      userName: "Test Te Tester",
    });

    results.steps.push({
      step: 1,
      description: "Route payment calculation request",
      result: routingResult,
      toolRequirements: routingResult.toolRequirements,
    });

    // Verify financial calculation tools detected
    if (!routingResult.toolRequirements?.needed) {
      results.errors.push("Financial calculation tools not detected");
      return results;
    }

    // Step 2: Execute customer transaction agent
    console.log("Step 2: Execute customer transaction agent");
    const agentResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: routingResult.agent,
      message: "What would my monthly payment be for deal 207?",
      conversationId,
      action: routingResult.action,
    });

    results.steps.push({
      step: 2,
      description: "Execute customer transaction agent",
      result: agentResult,
      toolsExecuted: agentResult.toolsExecuted,
    });

    // Verify tools were executed
    if (!agentResult.toolsExecuted || agentResult.toolsExecuted.length === 0) {
      results.errors.push("No tools executed for payment calculation");
    } else {
      results.toolsExecuted = agentResult.toolsExecuted;
    }

    // Step 3: Verify calculation results
    console.log("Step 3: Verify calculation results in response");
    const response = agentResult.response || "";
    
    const calculationChecks = [
      { type: "Payment amount", present: /\$[\d,]+(\.\d{2})?/.test(response) },
      { type: "Deal reference", present: response.includes("207") },
      { type: "Financial terms", present: response.includes("month") || response.includes("payment") },
    ];

    results.steps.push({
      step: 3,
      description: "Verify calculation results",
      calculationChecks,
      responseLength: response.length,
    });

    // Extract calculation results if present
    const paymentMatch = response.match(/\$[\d,]+(\.\d{2})?/);
    if (paymentMatch) {
      results.calculationResults.payment = paymentMatch[0];
    }

    const missingCalculations = calculationChecks.filter(check => !check.present);
    if (missingCalculations.length > 0) {
      results.errors.push(`Missing calculation data: ${missingCalculations.map(c => c.type).join(", ")}`);
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error) {
    console.error("Customer transaction test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Test 3: Aftermarket Workflow with Real Pricing
async function testAftermarketWorkflow(ctx: any, conversationId: string) {
  console.log("🛡️ Testing Aftermarket Workflow with Pricing Tools");

  const results: any = {
    test: "aftermarket_workflow",
    steps: [],
    success: false,
    toolsExecuted: [],
    pricingData: {},
    errors: [],
  };

  try {
    // Step 1: Customer inquires about aftermarket options
    console.log("Step 1: Customer aftermarket inquiry");
    const routingResult = await ctx.runQuery(api.agentRouter.routeMessage, {
      message: "What extended warranty options are available for my Ford F150?",
      conversationId,
      userName: "Test Te Tester",
    });

    results.steps.push({
      step: 1,
      description: "Route aftermarket inquiry",
      result: routingResult,
      toolRequirements: routingResult.toolRequirements,
    });

    // Step 2: Execute aftermarket agent
    console.log("Step 2: Execute aftermarket agent");
    const agentResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: "aftermarketOffer",
      message: "What extended warranty options are available for my Ford F150?",
      conversationId,
      action: "start",
    });

    results.steps.push({
      step: 2,
      description: "Execute aftermarket agent",
      result: agentResult,
      toolsExecuted: agentResult.toolsExecuted,
    });

    results.toolsExecuted = agentResult.toolsExecuted || [];

    // Step 3: Verify pricing information
    console.log("Step 3: Verify aftermarket pricing");
    const response = agentResult.response || "";
    
    const pricingChecks = [
      { tier: "Premium", present: response.includes("Premium") || response.includes("$3000") },
      { tier: "Standard", present: response.includes("Standard") || response.includes("$2000") },
      { tier: "Basic", present: response.includes("Basic") || response.includes("$1000") },
      { tier: "Pricing format", present: /\$[\d,]+/.test(response) },
    ];

    results.steps.push({
      step: 3,
      description: "Verify aftermarket pricing",
      pricingChecks,
    });

    // Extract pricing data
    const priceMatches = response.match(/\$[\d,]+/g) || [];
    results.pricingData.extractedPrices = priceMatches;

    const missingPricing = pricingChecks.filter(check => !check.present);
    if (missingPricing.length > 0) {
      results.errors.push(`Missing pricing data: ${missingPricing.map(p => p.tier).join(", ")}`);
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error) {
    console.error("Aftermarket workflow test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Test 4: Document Generation Workflow
async function testDocumentWorkflow(ctx: any, conversationId: string) {
  console.log("📄 Testing Document Generation Workflow");

  const results: any = {
    test: "document_workflow",
    steps: [],
    success: false,
    toolsExecuted: [],
    documentsGenerated: [],
    errors: [],
  };

  try {
    // Step 1: Customer requests paperwork
    console.log("Step 1: Customer document request");
    const agentResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: "customerPaperwork",
      message: "I need to complete the DMV paperwork for deal 207",
      conversationId,
      action: "start",
    });

    results.steps.push({
      step: 1,
      description: "Execute paperwork agent",
      result: agentResult,
      toolsExecuted: agentResult.toolsExecuted,
    });

    results.toolsExecuted = agentResult.toolsExecuted || [];

    // Step 2: Verify document references
    console.log("Step 2: Verify document generation");
    const response = agentResult.response || "";
    
    const documentChecks = [
      { type: "DMV", present: response.includes("DMV") || response.includes("title") },
      { type: "Forms", present: response.includes("form") || response.includes("document") },
      { type: "Deal reference", present: response.includes("207") },
    ];

    results.steps.push({
      step: 2,
      description: "Verify document references",
      documentChecks,
    });

    const missingDocuments = documentChecks.filter(check => !check.present);
    if (missingDocuments.length > 0) {
      results.errors.push(`Missing document references: ${missingDocuments.map(d => d.type).join(", ")}`);
    }

    results.success = results.errors.length === 0;
    return results;

  } catch (error) {
    console.error("Document workflow test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Test 5: Error Handling and Graceful Fallbacks
async function testErrorHandling(ctx: any, conversationId: string) {
  console.log("⚠️ Testing Error Handling and Fallbacks");

  const results: any = {
    test: "error_handling",
    steps: [],
    success: false,
    errorScenarios: [],
    fallbackBehaviors: [],
    errors: [],
  };

  try {
    // Test 1: Invalid deal number
    console.log("Testing invalid deal number handling");
    const invalidDealResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: "dealerInteraction",
      message: "I need to verify deal 999999",
      conversationId,
      action: "start",
    });

    results.errorScenarios.push({
      scenario: "Invalid deal number",
      result: invalidDealResult,
      handledGracefully: !!invalidDealResult.response && !invalidDealResult.response.includes("Error"),
    });

    // Test 2: Malformed calculation request
    console.log("Testing malformed calculation request");
    const malformedCalcResult = await ctx.runAction(api.agentRouter.executeAgent, {
      agentName: "customerTransaction", 
      message: "Calculate payment for unknown deal with no data",
      conversationId,
      action: "start",
    });

    results.errorScenarios.push({
      scenario: "Malformed calculation",
      result: malformedCalcResult,
      handledGracefully: !!malformedCalcResult.response,
    });

    // Verify error handling quality
    const gracefulHandling = results.errorScenarios.filter((s: any) => s.handledGracefully);
    results.fallbackBehaviors = gracefulHandling;

    if (gracefulHandling.length === results.errorScenarios.length) {
      results.success = true;
    } else {
      results.errors.push("Some error scenarios not handled gracefully");
    }

    return results;

  } catch (error) {
    console.error("Error handling test failed:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    return results;
  }
}

// Run All Tests
async function runAllTests(ctx: any, conversationId: string) {
  console.log("🚀 Running All Tool Orchestration Tests");
  
  const allResults: any = {
    testSuite: "complete_tool_orchestration",
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      total: 5,
      passed: 0,
      failed: 0,
      errors: [],
    },
  };

  const tests = [
    { name: "dealer_workflow", func: testDealerWorkflow },
    { name: "customer_transaction", func: testCustomerTransaction },
    { name: "aftermarket_workflow", func: testAftermarketWorkflow },
    { name: "document_workflow", func: testDocumentWorkflow },
    { name: "error_handling", func: testErrorHandling },
  ];

  for (const test of tests) {
    try {
      console.log(`\n--- Running ${test.name} ---`);
      const result = await test.func(ctx, `${conversationId}_${test.name}`);
      allResults.tests[test.name] = result;
      
      if (result.success) {
        allResults.summary.passed++;
        console.log(`✅ ${test.name} PASSED`);
      } else {
        allResults.summary.failed++;
        console.log(`❌ ${test.name} FAILED:`, result.errors);
        allResults.summary.errors.push(...result.errors);
      }
    } catch (error) {
      allResults.summary.failed++;
      console.log(`💥 ${test.name} CRASHED:`, error);
      allResults.summary.errors.push(`${test.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Overall assessment
  console.log(`\n=== TOOL ORCHESTRATION TEST RESULTS ===`);
  console.log(`Total Tests: ${allResults.summary.total}`);
  console.log(`Passed: ${allResults.summary.passed}`);
  console.log(`Failed: ${allResults.summary.failed}`);
  console.log(`Success Rate: ${((allResults.summary.passed / allResults.summary.total) * 100).toFixed(1)}%`);
  
  if (allResults.summary.errors.length > 0) {
    console.log(`\nErrors Found:`);
    allResults.summary.errors.forEach((error: any) => console.log(`- ${error}`));
  }

  return allResults;
}

// Performance Test
export const testToolOrchestrationPerformance = action({
  args: {
    iterations: v.optional(v.number()),
    concurrentUsers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const iterations = args.iterations || 5;
    const concurrentUsers = args.concurrentUsers || 3;
    console.log(`\n🏃 Performance Test: ${iterations} iterations with ${concurrentUsers} users`);

    const results: any = {
      test: "performance",
      config: { iterations, concurrentUsers },
      metrics: {
        averageResponseTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        toolExecutions: 0,
      },
      errors: [],
    };

    const startTime = Date.now();
    const promises: Promise<any>[] = [];

    // Create concurrent user sessions
    for (let user = 0; user < concurrentUsers; user++) {
      for (let i = 0; i < iterations; i++) {
        const testPromise = ctx.runAction(api.testToolOrchestration.testToolOrchestration, {
          testScenario: "dealer_workflow",
          conversationId: `perf_test_${user}_${i}_${Date.now()}`,
        });
        promises.push(testPromise);
      }
    }

    try {
      const testResults = await Promise.allSettled(promises);
      const endTime = Date.now();

      results.metrics.totalRequests = testResults.length;
      results.metrics.averageResponseTime = (endTime - startTime) / testResults.length;

      testResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.metrics.successfulRequests++;
          if (result.value.toolsExecuted?.length > 0) {
            results.metrics.toolExecutions++;
          }
        } else {
          results.metrics.failedRequests++;
          results.errors.push(`Request ${index}: ${result.reason}`);
        }
      });

      console.log(`Performance Results:`);
      console.log(`- Average Response Time: ${results.metrics.averageResponseTime.toFixed(2)}ms`);
      console.log(`- Success Rate: ${((results.metrics.successfulRequests / results.metrics.totalRequests) * 100).toFixed(1)}%`);
      console.log(`- Tool Execution Rate: ${((results.metrics.toolExecutions / results.metrics.successfulRequests) * 100).toFixed(1)}%`);

      return results;
    } catch (error) {
      console.error("Performance test failed:", error);
      return { error: error instanceof Error ? error.message : "Performance test failed" };
    }
  },
});