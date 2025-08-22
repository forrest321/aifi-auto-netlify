// Simple test to check database operations
const { exec } = require('child_process');

async function testDatabaseOperations() {
  console.log("Testing database operations...");
  
  // Test 1: Direct database query
  console.log("1. Testing direct database query...");
  exec('npx convex run deals:getDealByNumber \'{"dealNumber": "1"}\'', (error, stdout, stderr) => {
    if (error) {
      console.error("Direct query failed:", error);
      return;
    }
    console.log("Direct query success:", JSON.parse(stdout).dealNumber);
    
    // Test 2: Tool execution (simplified)
    console.log("2. Testing tool execution...");
    exec('npx convex run agentRouter:executeToolsOnly \'{"toolName": "getDealInfoTool", "args": {"dealNumber": "1"}}\'', (error2, stdout2, stderr2) => {
      if (error2) {
        console.error("Tool execution failed:", error2);
        return;
      }
      console.log("Tool execution success!");
    });
  });
}

testDatabaseOperations();