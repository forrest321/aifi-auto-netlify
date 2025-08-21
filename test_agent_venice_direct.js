// Test creating agent with Venice provider directly
import { Agent } from '@convex-dev/agent';
import { createOpenAI } from '@ai-sdk/openai';

// Create Venice provider exactly like in the agents
const venice = createOpenAI({
  name: 'venice',
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
  compatibility: 'compatible',
});

async function testAgentVeniceDirect() {
  try {
    console.log('Creating agent with Venice provider...');
    
    // Try to create an agent similar to mainEntryAgent
    const testAgent = new Agent({
      chat: venice.chat('venice-uncensored'),
      instructions: 'You are a helpful assistant. Respond briefly.',
      tools: {},
      maxSteps: 1,
      maxRetries: 1,
    });
    
    console.log('Agent created successfully');
    
    // Try to call generateText directly (this might not work outside Convex context)
    console.log('Testing agent generateText...');
    
    // This might fail because we're not in a Convex context
    const result = await testAgent.generateText(
      {}, // mock ctx
      { userId: 'test', threadId: 'test-thread' },
      { prompt: 'Hello, test message' }
    );
    
    console.log('✅ Direct agent test success!');
    console.log('Response:', result.text);
    
  } catch (error) {
    console.log('❌ Direct agent test failed:', error.message);
    
    // Try to understand the error
    if (error.message.includes('context') || error.message.includes('ctx')) {
      console.log('💡 This error is expected - agent needs Convex context to run');
      console.log('The issue is likely in the Convex environment configuration');
    }
  }
}

// Also test the Venice provider directly with the AI SDK
async function testVeniceProvider() {
  try {
    console.log('\nTesting Venice provider with AI SDK...');
    
    const model = venice.chat('venice-uncensored');
    const result = await model.generateText({
      prompt: 'Say "Venice provider is working" in exactly those words.',
      maxTokens: 10,
    });
    
    console.log('✅ Venice provider test success!');
    console.log('Response:', result.text);
    
  } catch (error) {
    console.log('❌ Venice provider test failed:', error);
  }
}

async function runTests() {
  console.log('=== Direct Agent & Venice Provider Tests ===\n');
  
  await testVeniceProvider();
  await testAgentVeniceDirect();
  
  console.log('\n=== Analysis ===');
  console.log('If Venice provider works but agent fails with context errors,');
  console.log('the issue is likely that the VENICE_API_KEY is not available');
  console.log('in the Convex server environment.');
}

runTests();