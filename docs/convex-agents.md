# Convex Agents Documentation

## Overview

Convex Agents (`@convex-dev/agent`) provide a powerful framework for building AI-powered applications with integrated tool execution, multi-step workflows, and seamless database integration.

## Core Concepts

### Agent Definition
```typescript
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { venice, veniceModels } from "./venice_provider";

const myAgent = new Agent(components.agent, {
  chat: venice.chat(veniceModels.uncensored),
  instructions: `Your agent's system prompt and behavior instructions`,
  tools: {
    toolName: toolImplementation,
  },
  textEmbedding: venice.embedding(veniceEmbedding.small),
  maxSteps: 10,
  maxRetries: 3,
});
```

### Tool Creation
```typescript
import { createTool } from "@convex-dev/agent";
import { z } from "zod";

const myTool = createTool({
  description: "Description of what this tool does",
  args: z.object({
    param1: z.string().describe("Description of parameter"),
    param2: z.number().optional().describe("Optional parameter"),
  }),
  handler: async (ctx, args): Promise<string> => {
    // Tool implementation logic
    return "Tool execution result";
  },
});
```

## Agent Configuration Options

### Chat Integration
- **Venice.ai Integration**: Supports venice-uncensored, Llama, Qwen, and other models
- **Model Selection**: Choose from venice-uncensored (default), llama-3.3-70b, qwen3-235b, etc.
- **OpenAI-Compatible**: Venice uses OpenAI-compatible API structure

### Tool Integration
- **Shared Tools**: Tools can be shared across multiple agents
- **Context Access**: Tools receive Convex context for database operations
- **Type Safety**: Full TypeScript support with Zod schemas

### Execution Parameters
- **maxSteps**: Maximum number of reasoning steps per conversation
- **maxRetries**: Number of retry attempts for failed operations
- **textEmbedding**: Embedding model for semantic operations

## Multi-Agent Workflows

### Agent Handoffs
```typescript
// Agent A completes its workflow and transfers to Agent B
const workflowResult = await agentA.execute(userInput);
if (workflowResult.shouldTransfer) {
  return await agentB.execute(workflowResult.context);
}
```

### Specialized Agent Roles
- **Entry Agents**: Handle user routing and initial classification
- **Domain Agents**: Specialized for specific business domains
- **Process Agents**: Handle complex multi-step workflows
- **Review Agents**: Validate and review agent outputs

## Tool Patterns

### Data Retrieval Tools
```typescript
const getDataTool = createTool({
  description: "Retrieve data from database or external API",
  args: z.object({
    id: z.string(),
  }),
  handler: async (ctx, args) => {
    const data = await ctx.db.get(args.id);
    return JSON.stringify(data);
  },
});
```

### Calculation Tools
```typescript
const calculateTool = createTool({
  description: "Perform complex calculations",
  args: z.object({
    amount: z.number(),
    rate: z.number(),
    terms: z.number(),
  }),
  handler: async (ctx, args) => {
    const result = performCalculation(args);
    return result.toString();
  },
});
```

### External Integration Tools
```typescript
const apiCallTool = createTool({
  description: "Make external API calls",
  args: z.object({
    endpoint: z.string(),
    data: z.any(),
  }),
  handler: async (ctx, args) => {
    const response = await fetch(args.endpoint, {
      method: 'POST',
      body: JSON.stringify(args.data),
    });
    return await response.text();
  },
});
```

## Best Practices

### Agent Design
1. **Single Responsibility**: Each agent should handle one specific domain
2. **Clear Instructions**: Write detailed, unambiguous system prompts
3. **Tool Selection**: Only include tools relevant to the agent's purpose
4. **Error Handling**: Implement robust error handling in tools

### Tool Implementation
1. **Input Validation**: Use Zod schemas for type-safe input validation
2. **Return Consistency**: Always return string values from tools
3. **Error Messages**: Provide clear error messages for troubleshooting
4. **Performance**: Optimize tool execution for minimal latency

### Workflow Management
1. **State Tracking**: Use agent context to track conversation state
2. **Handoff Logic**: Implement clear conditions for agent transfers
3. **Completion Criteria**: Define clear success/failure conditions
4. **Monitoring**: Log agent activities for debugging and analytics

## Integration with TanStack Start

### Frontend Communication
```typescript
// Frontend calls to Convex agents
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Query agent state
const agentState = useQuery(api.agents.getState, { conversationId });

// Execute agent action
const executeAgent = useMutation(api.agents.execute);
```

### Real-time Updates
- Agents can emit real-time updates via Convex reactive queries
- Frontend automatically receives agent response updates
- Optimistic UI updates while waiting for agent responses

### State Persistence
- Agent conversation history stored in Convex database
- Multi-step workflows maintain state across interactions
- Tool execution results cached for performance

## Monitoring and Debugging

### Convex Dashboard
- View agent execution logs
- Monitor tool performance
- Track conversation flows
- Analyze error patterns

### Development Tools
```typescript
// Add logging to agents
const debugTool = createTool({
  description: "Debug logging tool",
  args: z.object({
    message: z.string(),
    data: z.any().optional(),
  }),
  handler: async (ctx, args) => {
    console.log(`Agent Debug: ${args.message}`, args.data);
    return "Logged successfully";
  },
});
```

### Testing Strategies
1. **Unit Tests**: Test individual tools in isolation
2. **Integration Tests**: Test agent workflows end-to-end
3. **Simulation**: Use mock data for testing complex scenarios
4. **A/B Testing**: Compare different agent configurations

## Performance Optimization

### Tool Optimization
- Cache frequently accessed data
- Minimize external API calls
- Use efficient database queries
- Implement proper error handling

### Agent Configuration
- Set appropriate maxSteps limits
- Use suitable embedding models
- Choose cost-effective LLM models
- Implement conversation pruning

### Scaling Considerations
- Monitor agent execution time
- Implement rate limiting where needed
- Use agent pools for high-traffic scenarios
- Cache agent responses when appropriate

## AI-Fi Implementation Example

The AI-Fi system demonstrates advanced Convex agent patterns:

1. **Multi-Agent Architecture**: 5 specialized agents handling different workflows
2. **Shared Tool System**: Common tools for calculations, data access, and document generation
3. **Complex Business Logic**: Financial calculations, security verification, document workflows
4. **Real-time Integration**: Seamless integration with TanStack Start frontend
5. **State Management**: Persistent conversation state with reactive updates

This implementation showcases how Convex agents can replace complex human workflows with intelligent, automated systems while maintaining flexibility and reliability.