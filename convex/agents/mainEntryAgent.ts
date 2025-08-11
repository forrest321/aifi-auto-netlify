import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { venice, veniceModels, veniceEmbedding } from "../venice_provider";

// Main Entry Agent (Handles Initial User Selection)
export const mainEntryAgent = new Agent(components.agent, {
  chat: venice.chat(veniceModels.uncensored),
  instructions: `You are the entry point for Ai-FI. Display logo and name, offer two buttons: "Dealer" or "Customer". Follow logic strictly:

1. If "Dealer": Transfer to dealerInteractionAgent.
2. If "Customer": Transfer to customerGeneralInfoAgent (if no deal) or customerTransactionAgent (if deal number provided and verified).

Ensure no other interaction paths exist. Be professional and clear.`,
  tools: {},
  textEmbedding: venice.embedding(veniceEmbedding.small),
  maxSteps: 2,
  maxRetries: 3,
});