// Test Venice API with simple fetch
async function testVeniceAPI() {
  const apiKey = process.env.VENICE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No Venice API key found');
    return;
  }
  
  console.log('Testing Venice API with simple HTTP request...');
  console.log('API Key prefix:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'venice-uncensored',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test. Please respond with "Venice API is working!"'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Venice API Error:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Venice API Success!');
    console.log('Response:', data.choices[0].message.content);
    return true;
    
  } catch (error) {
    console.log('❌ Venice API Request Failed:', error);
    return false;
  }
}

testVeniceAPI();