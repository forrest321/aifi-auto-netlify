// Test Venice integration through Convex
import { ConvexHttpClient } from 'convex/browser';

async function testConvexVeniceIntegration() {
  try {
    console.log('=== Testing Venice Integration through Convex ===\n');
    
    const convexUrl = process.env.CONVEX_DEPLOYMENT || 'https://efficient-mosquito-531.convex.cloud';
    const client = new ConvexHttpClient(convexUrl);
    
    console.log('Calling testVeniceIntegration action...');
    
    const result = await client.action('testAgent:testVeniceIntegration', {
      message: "Hello, please respond with 'Venice integration is working!' to confirm the connection."
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS: Venice integration test passed!');
      console.log('Response:', result.response);
      
      // Check if the response looks like real AI vs placeholder
      const isRealAI = result.response && 
        !result.response.includes('Agent integration pending') &&
        !result.response.includes('[testAgent]') &&
        result.response.length > 10;
      
      if (isRealAI) {
        console.log('🎉 Venice is generating real AI responses!');
      } else {
        console.log('⚠️  Still getting placeholder responses - configuration issue');
      }
    } else {
      console.log('\n❌ FAILURE: Venice integration test failed');
      console.log('Error:', result.error);
    }
    
    console.log('\nMetadata:');
    console.log('- API Key available:', result.metadata?.hasApiKey);
    console.log('- Agent configured:', result.metadata?.agentConfigured);
    
  } catch (error) {
    console.error('\n❌ Test failed with exception:', error);
  }
}

testConvexVeniceIntegration();