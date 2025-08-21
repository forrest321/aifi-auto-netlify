// Test Venice.ai API integration directly
import { createOpenAI } from '@ai-sdk/openai';
import { ConvexHttpClient } from 'convex/browser';

// Test Venice API directly
const venice = createOpenAI({
  name: 'venice',
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
  compatibility: 'compatible',
});

async function testVeniceDirectly() {
  try {
    console.log('Testing Venice.ai API directly...');
    
    const result = await venice.chat.generateText({
      model: 'venice-uncensored',
      prompt: 'Hello, this is a test of the Venice AI API integration. Please respond briefly.',
    });
    
    console.log('✅ Venice API Direct Test SUCCESS!');
    console.log('Response:', result.text);
    return true;
  } catch (error) {
    console.error('❌ Venice API Direct Test FAILED:', error);
    return false;
  }
}

// Test agent with Venice through Convex
async function testAgentWithVenice() {
  try {
    console.log('\nTesting AI-Fi agent with Venice integration...');
    
    const convexUrl = process.env.CONVEX_DEPLOYMENT || 'https://efficient-mosquito-531.convex.cloud';
    const client = new ConvexHttpClient(convexUrl);
    
    // Create a test conversation
    const conversationId = await client.mutation('conversations:create', {
      title: 'Test Venice Integration',
    });
    
    // Test with dealer message
    const execution = await client.action('agentRouter:executeAgent', {
      agentName: 'mainEntry',
      message: "Hello, I'm a dealer and I need to verify deal number 1",
      conversationId: conversationId,
      action: 'start',
    });
    
    console.log('Agent execution result:', {
      success: execution.success,
      agentUsed: execution.agentUsed,
      responsePreview: execution.response?.substring(0, 200) + '...',
      error: execution.error
    });
    
    // Check if response contains AI-generated content vs placeholder
    const isRealAI = execution.response && 
      !execution.response.includes('Agent integration pending') &&
      !execution.response.includes('[mainEntry]') &&
      execution.response.length > 50;
    
    if (isRealAI) {
      console.log('✅ Agent Venice Integration SUCCESS!');
      console.log('Response appears to be AI-generated');
      return true;
    } else {
      console.log('⚠️  Agent Venice Integration PARTIAL - Still using placeholder responses');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Agent Venice Integration FAILED:', error);
    return false;
  }
}

async function runTests() {
  console.log('=== Venice.ai Integration Tests ===\n');
  
  const directTest = await testVeniceDirectly();
  const agentTest = await testAgentWithVenice();
  
  console.log('\n=== Test Summary ===');
  console.log('Venice API Direct:', directTest ? '✅ PASS' : '❌ FAIL');
  console.log('Agent Integration:', agentTest ? '✅ PASS' : '⚠️  PARTIAL');
  
  if (directTest && agentTest) {
    console.log('\n🎉 ALL TESTS PASSED - Venice integration fully working!');
  } else if (directTest && !agentTest) {
    console.log('\n⚠️  Venice API works but agent integration needs attention');
  } else {
    console.log('\n❌ Venice integration has issues');
  }
}

runTests();