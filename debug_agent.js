// Debug what the agent is actually doing
import { ConvexHttpClient } from 'convex/browser';

async function debugAgentExecution() {
  try {
    console.log('=== Debugging Agent Execution ===\n');
    
    const convexUrl = process.env.CONVEX_DEPLOYMENT || 'https://efficient-mosquito-531.convex.cloud';
    const client = new ConvexHttpClient(convexUrl);
    
    // Test multiple messages to see response patterns
    const testMessages = [
      "Hello",
      "I'm a dealer", 
      "I need help with financing",
      "What can you do for me?",
      "Tell me about AI-Fi"
    ];
    
    for (const message of testMessages) {
      console.log(`\n--- Testing: "${message}" ---`);
      
      const conversationId = await client.mutation('conversations:create', {
        title: `Debug Test: ${message}`,
      });
      
      const routing = await client.query('agentRouter:routeMessage', {
        message: message,
        conversationId: conversationId,
      });
      
      console.log('Routed to agent:', routing.agent);
      console.log('Action:', routing.action);
      console.log('Routing reason:', routing.routingReason);
      
      const execution = await client.action('agentRouter:executeAgent', {
        agentName: routing.agent,
        message: message,
        conversationId: conversationId,
        action: routing.action,
      });
      
      console.log('Success:', execution.success);
      if (execution.success) {
        console.log('Response length:', execution.response?.length);
        console.log('Response start:', execution.response?.substring(0, 100));
        
        // Check for patterns that indicate placeholder vs real AI
        const isPlaceholder = execution.response?.includes('[mainEntry]') || 
                             execution.response?.includes('Agent integration pending') ||
                             execution.response?.includes('Response to:');
        
        console.log('Is placeholder response:', isPlaceholder);
      } else {
        console.log('Error:', execution.error);
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugAgentExecution();