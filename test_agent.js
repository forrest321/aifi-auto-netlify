// Test script to verify agent execution is working
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.CONVEX_DEPLOYMENT || 'https://efficient-mosquito-531.convex.cloud';
const client = new ConvexHttpClient(convexUrl);

async function testAgentExecution() {
  try {
    console.log('Testing AI-Fi agent execution...');
    console.log('Convex URL:', convexUrl);
    
    // Create a test conversation first
    console.log('\n1. Creating test conversation...');
    const conversationId = await client.mutation('conversations:create', {
      title: 'Test AI-Fi Agent Execution',
    });
    console.log('Created conversation ID:', conversationId);
    
    // Test routing
    console.log('\n2. Testing message routing...');
    const routing = await client.query('agentRouter:routeMessage', {
      message: "Hello, I need help with car financing",
      conversationId: conversationId,
    });
    
    console.log('Routing result:', JSON.stringify(routing, null, 2));
    
    // Test agent execution
    console.log('\n3. Testing agent execution...');
    const execution = await client.action('agentRouter:executeAgent', {
      agentName: routing.agent,
      message: "Hello, I need help with car financing",
      conversationId: conversationId,
      action: routing.action,
    });
    
    console.log('Execution result:', JSON.stringify(execution, null, 2));
    
    if (execution.success) {
      console.log('\n✅ SUCCESS: Agent execution is working!');
      console.log('Agent used:', execution.agentUsed);
      console.log('Response preview:', execution.response?.substring(0, 100) + '...');
    } else {
      console.log('\n❌ FAILURE: Agent execution failed');
      console.log('Error:', execution.error);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR during testing:', error);
  }
}

testAgentExecution();