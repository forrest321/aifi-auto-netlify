import { definePlaygroundAPI } from "@convex-dev/agent-playground";
import { components } from "./_generated/api";
import { 
  mainEntryAgent,
  dealerInteractionAgent,
  customerGeneralInfoAgent,
  customerTransactionAgent,
  aftermarketOfferAgent
} from "./agents";

/**
 * AI-Fi Agent Playground API
 * 
 * This exposes all AI-Fi agents for testing and interaction through the playground.
 * Each agent handles a specific part of the automotive finance workflow:
 * - mainEntryAgent: Entry point routing
 * - dealerInteractionAgent: Dealer deal verification
 * - customerGeneralInfoAgent: General customer information
 * - customerTransactionAgent: Transaction completion
 * - aftermarketOfferAgent: Aftermarket product sales
 * 
 * Authorization is handled by passing an apiKey that can be generated
 * on the dashboard or via CLI:
 * npx convex run --component agent apiKeys:issue
 */
export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [
    mainEntryAgent,
    dealerInteractionAgent,
    customerGeneralInfoAgent,
    customerTransactionAgent,
    aftermarketOfferAgent
  ],
});