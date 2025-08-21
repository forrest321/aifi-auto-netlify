import { z } from "zod";
import { createTool } from "@convex-dev/agent";
import { api } from "../_generated/api";

// AI-Fi Tools - Database-backed implementations for automotive finance workflows
// These tools integrate with Convex database for persistent deal management

// Tool to retrieve deal info from database
export const getDealInfoTool = createTool({
  description: "Retrieve deal information from the automotive DMS system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number to retrieve."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Use actual database query through internal function
      const deal = await ctx.runQuery(api.deals._internal_getDealByNumber, { dealNumber: args.dealNumber });
      
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      // Convert deal document to clean JSON (remove Convex internal fields)
      const cleanDeal = {
        dealNumber: deal.dealNumber,
        fullName: deal.fullName,
        address: deal.address,
        insurance: deal.insurance,
        vehicle: deal.vehicle,
        trade: deal.trade,
        salePrice: deal.salePrice,
        rebate: deal.rebate,
        dealerFees: deal.dealerFees,
        tradeValue: deal.tradeValue,
        tradePayoff: deal.tradePayoff,
        taxRate: deal.taxRate,
        ssn: deal.ssn,
        creditScore: deal.creditScore,
        timeAtAddress: deal.timeAtAddress,
        employment: deal.employment,
        monthlyIncome: deal.monthlyIncome,
        expectation: deal.expectation,
        tagTitleCost: deal.tagTitleCost,
        isFinance: deal.isFinance,
        currentStage: deal.currentStage,
        isComplete: deal.isComplete,
        selectedAftermarketOption: deal.selectedAftermarketOption,
        signedDocuments: deal.signedDocuments,
      };
      
      return JSON.stringify(cleanDeal);
    } catch (error) {
      console.error("Error retrieving deal:", error);
      // Fallback to simulated data in case of database issues
      const simulatedDeals: Record<string, any> = {
        "1": {
          dealNumber: "1",
          fullName: "Jane Doe",
          address: "123 Oak Street, Rivertown, CA 90210",
          insurance: "Geico G09876543 effective 3/15/24 expiring 3/15/25",
          vehicle: "5XYZWDLB8JG512345 2023 Hyundai Santa Fe Limited Black 1,500 Miles",
          trade: "1GNSKBE0XBR123456 Chevrolet Tahoe LT 30,000 miles White",
          salePrice: 38000,
          rebate: 1500,
          dealerFees: 1100,
          tradeValue: 28000,
          tradePayoff: 25000,
          taxRate: 0.085,
          ssn: "123456789",
          creditScore: 780,
          timeAtAddress: "5 yrs, Rent, $2000 per month",
          employment: "Full-time, 6 years at XYZ Corporation, Senior Accountant",
          monthlyIncome: 6000,
          expectation: "customer expects a payment below $700",
          tagTitleCost: 125,
          isFinance: true,
          currentStage: "initial",
          isComplete: false,
          selectedAftermarketOption: null,
          signedDocuments: [],
        },
        "207": {
          dealNumber: "207",
          fullName: "Test Te Tester",
          address: "555 Maple St Honeycomb FL 37756",
          insurance: "State Farm F10923335 effective 4/09/24 expiring 4/09/25",
          vehicle: "1FTFW1ED7LKE28463 2023 Ford F150 Lariat Blue 193 Miles",
          trade: "1FTEW1EP1KK123456 Ford F150 XLT 18,350 miles Green",
          salePrice: 69500,
          rebate: 2000,
          dealerFees: 1100,
          tradeValue: 42500,
          tradePayoff: 35000,
          taxRate: 0.06,
          ssn: "888553322",
          creditScore: 832,
          timeAtAddress: "10 yrs, Own, $1500 per month",
          employment: "Retired",
          monthlyIncome: 7500,
          expectation: "customer expects a payment below $1000",
          tagTitleCost: 125,
          isFinance: true,
          currentStage: "initial",
          isComplete: false,
          selectedAftermarketOption: null,
          signedDocuments: [],
        }
      };
      
      const fallbackDeal = simulatedDeals[args.dealNumber];
      if (!fallbackDeal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      return JSON.stringify(fallbackDeal);
    }
  },
});

// Tool to update deal info in database
export const updateDealInfoTool = createTool({
  description: "Update deal information in the automotive DMS system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number to update."),
    updates: z.record(z.any()).describe("Key-value pairs to update in the deal."),
    modifiedBy: z.string().optional().describe("Who is making the modification."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Use actual database mutation through internal function
      const result = await ctx.runMutation(api.deals._internal_updateDeal, {
        dealNumber: args.dealNumber,
        updates: args.updates,
        modifiedBy: args.modifiedBy,
      });
      
      return result;
    } catch (error) {
      console.error("Error updating deal:", error);
      
      if (error instanceof Error && error.message === "Deal not found") {
        return "Deal not found - cannot update";
      }
      
      // Fallback response for compatibility
      return "Failed to update deal information";
    }
  },
});

// Helper function to convert Venice's string parameters to numbers
const stringToNumber = z.union([z.number(), z.string()]).transform((val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // Handle Venice's "null" strings
    if (val === "null" || val === "undefined" || val === "") return 0;
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return 0;
    return parsed;
  }
  return 0;
});

// Tool for financial calculations (e.g., monthly payments using standard loan formula)
export const calculatePaymentTool = createTool({
  description: "Calculate monthly loan payment based on amount, rate, and terms.",
  args: z.object({
    principal: stringToNumber.describe("The loan principal amount."),
    annualRate: stringToNumber.describe("Annual interest rate as percentage."),
    termsInMonths: stringToNumber.describe("Loan terms in months."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    // Validate that we have positive values for calculation
    if (args.principal <= 0 || args.annualRate <= 0 || args.termsInMonths <= 0) {
      return JSON.stringify({ 
        error: "Invalid parameters for payment calculation",
        principal: args.principal,
        annualRate: args.annualRate,
        termsInMonths: args.termsInMonths
      });
    }

    const monthlyRate = args.annualRate / 12 / 100;
    const payment = args.principal * (monthlyRate * Math.pow(1 + monthlyRate, args.termsInMonths)) / (Math.pow(1 + monthlyRate, args.termsInMonths) - 1);
    return payment.toFixed(2);
  },
});

// Tool for calculating total financed amount, taxes, etc., based on deal logic
export const calculateFinancedAmountTool = createTool({
  description: "Calculate the total financed amount including taxes, fees, and aftermarket add-ons. Tax is on (sale - rebate - tradeValue + dealerFees + aftermarket).",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    aftermarketCost: stringToNumber.optional().default(0).describe("Additional cost for aftermarket products."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Get actual deal data from database
      const deal = await ctx.runQuery(api.deals._internal_getDealByNumber, { dealNumber: args.dealNumber });
      
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      // Calculate based on actual deal data
      const aftermarket = args.aftermarketCost || 0;
      const rebate = deal.rebate || 0;
      const tradeValue = deal.tradeValue || 0;
      const tradePayoff = deal.tradePayoff || 0;
      
      // Taxable amount calculation: (sale price - rebate - trade value + dealer fees + aftermarket)
      const taxableAmount = deal.salePrice - rebate - tradeValue + deal.dealerFees + aftermarket;
      const tax = taxableAmount * deal.taxRate;
      
      // Total financed = sale price + tax + dealer fees + tag/title + aftermarket - rebate - trade equity
      const tradeEquity = tradeValue - tradePayoff;
      const totalFinanced = deal.salePrice + tax + deal.dealerFees + deal.tagTitleCost + aftermarket - rebate - tradeEquity;
      
      const result = {
        salePrice: deal.salePrice,
        rebate: rebate,
        tradeValue: tradeValue,
        tradePayoff: tradePayoff,
        tradeEquity: tradeEquity,
        dealerFees: deal.dealerFees,
        tagTitleCost: deal.tagTitleCost,
        aftermarketCost: aftermarket,
        taxableAmount: Math.max(0, taxableAmount), // Ensure non-negative
        taxRate: deal.taxRate,
        tax: Math.max(0, tax), // Ensure non-negative
        totalFinanced: Math.max(0, totalFinanced), // Ensure non-negative
      };
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("Error calculating financed amount:", error);
      
      // Fallback calculation with default values
      const aftermarket = args.aftermarketCost || 0;
      const fallbackResult = {
        totalFinanced: 25000 + aftermarket,
        tax: 2000,
        taxableAmount: 22000 + aftermarket,
        error: "Used fallback calculation due to database error"
      };
      
      return JSON.stringify(fallbackResult);
    }
  },
});

// Tool for simulating bank program info
export const getBankProgramsTool = createTool({
  description: "Get current bank financing programs (simulated rates as low as).",
  args: z.object({}),
  handler: async (_ctx, _args): Promise<string> => {
    return JSON.stringify({
      programs: [
        { bank: "Bank A", rate: "as low as 4.99% with approved credit", terms: "up to 72 months" },
        { bank: "Bank B", rate: "as low as 5.49% with approved credit", terms: "up to 84 months" },
        { bank: "Manufacturer Finance", rate: "as low as 3.99% with approved credit", terms: "up to 60 months" },
      ],
    });
  },
});

// Generate documents
export const generateDocumentsTool = createTool({
  description: "Generate required documents for a deal (DMV, cash, or finance).",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    customerName: z.string().optional().describe("Customer name for documents."),
    isFinance: z.boolean().optional().describe("Whether the deal is financed (will be determined from deal if not provided)."),
    aftermarketOption: z.string().optional().describe("Selected aftermarket option (e.g., Option 1, Option 2, Option 3, none)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Get actual deal data from database
      const deal = await ctx.runQuery(api.deals._internal_getDealByNumber, { dealNumber: args.dealNumber });
      
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      // Use deal data to determine document requirements
      const isFinance = args.isFinance !== undefined ? args.isFinance : deal.isFinance;
      const customerName = args.customerName || deal.fullName;
      const aftermarketOption = args.aftermarketOption || deal.selectedAftermarketOption || "none";
      
      const dmvDocs = [
        "Odometer Statement",
        "Secure Power of Attorney", 
        "Title Reassignment",
        "Power of Attorney",
        "Statement of Tag Intent",
        "Pollution Statement",
        "Insurance Declaration",
        "Bill of Sale",
      ];
      
      const cashDocs = ["Buyers Order", "Dealer Privacy Notice"].concat(
        aftermarketOption && aftermarketOption !== "none" ? ["Aftermarket Contract"] : []
      );
      
      const financeDocs = ["Credit Application", "Risk Based Pricing Notice", "OFAC/ID", "Carfax"].concat(
        aftermarketOption && aftermarketOption !== "none" ? ["Aftermarket Contract"] : []
      );
      
      const docs = isFinance ? [...dmvDocs, ...cashDocs, ...financeDocs] : [...dmvDocs, ...cashDocs];
      
      return JSON.stringify({ 
        documents: docs,
        dealNumber: args.dealNumber,
        customerName: customerName,
        isFinance,
        aftermarketOption: aftermarketOption,
        vehicleInfo: deal.vehicle,
        salePrice: deal.salePrice,
      });
    } catch (error) {
      console.error("Error generating documents:", error);
      
      // Fallback to simulated generation
      const isFinance = args.isFinance !== undefined ? args.isFinance : true;
      
      const dmvDocs = [
        "Odometer Statement",
        "Secure Power of Attorney", 
        "Title Reassignment",
        "Power of Attorney",
        "Statement of Tag Intent",
        "Pollution Statement",
        "Insurance Declaration",
        "Bill of Sale",
      ];
      
      const cashDocs = ["Buyers Order", "Dealer Privacy Notice"].concat(
        args.aftermarketOption && args.aftermarketOption !== "none" ? ["Aftermarket Contract"] : []
      );
      
      const financeDocs = ["Credit Application", "Risk Based Pricing Notice", "OFAC/ID", "Carfax"].concat(
        args.aftermarketOption && args.aftermarketOption !== "none" ? ["Aftermarket Contract"] : []
      );
      
      const docs = isFinance ? [...dmvDocs, ...cashDocs, ...financeDocs] : [...dmvDocs, ...cashDocs];
      
      return JSON.stringify({ 
        documents: docs,
        dealNumber: args.dealNumber,
        customerName: args.customerName || "Customer Name",
        isFinance,
        aftermarketOption: args.aftermarketOption || "none",
        error: "Used fallback document generation due to database error"
      });
    }
  },
});

// Simulate electronic signature with database tracking
export const simulateSignatureTool = createTool({
  description: "Simulate applying an electronic signature to documents and record in deal.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    customerName: z.string().describe("Customer name for signature."),
    documentType: z.string().describe("Type of document (e.g., DMV, Buyers Order, Finance, Aftermarket)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Record signature in database using internal function
      const result = await ctx.runMutation(api.deals._internal_addSignedDocument, {
        dealNumber: args.dealNumber,
        documentType: args.documentType,
      });
      
      return `Electronic signature for ${args.customerName} applied to ${args.documentType} for deal ${args.dealNumber}. ${result}`;
    } catch (error) {
      console.error("Error recording signature:", error);
      
      if (error instanceof Error && error.message === "Deal not found") {
        return `Electronic signature for ${args.customerName} applied to ${args.documentType} for deal ${args.dealNumber}. (Note: Deal not found in system)`;
      }
      
      return `Electronic signature for ${args.customerName} applied to ${args.documentType} for deal ${args.dealNumber}. (Note: Could not record in system)`;
    }
  },
});

// SMS Verification Simulation with database validation
export const sendVerificationCodeTool = createTool({
  description: "Send a verification code to customer's phone (simulated for demo).",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    phoneNumber: z.string().optional().describe("Phone number (optional, will use number from deal)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Get deal data to validate customer information
      const deal = await ctx.runQuery(api.deals._internal_getDealByNumber, { dealNumber: args.dealNumber });
      
      if (!deal) {
        return "Deal not found - cannot send verification code";
      }
      
      // Use provided phone number or generate a simulated one from customer name
      const phoneToUse = args.phoneNumber || "customer's phone";
      const customerName = deal.fullName;
      
      return `Verification code sent to ${phoneToUse} for ${customerName} (Deal ${args.dealNumber}). For demo purposes, the correct code is 1234.`;
    } catch (error) {
      console.error("Error sending verification code:", error);
      
      // Fallback to simulated sending
      const phoneToUse = args.phoneNumber || "customer's phone";
      return `Verification code sent to ${phoneToUse} ending in XXXX. For demo purposes, the correct code is 1234.`;
    }
  },
});

// Verify SMS Code
export const verifyCodeTool = createTool({
  description: "Verify the SMS code entered by customer.",
  args: z.object({
    enteredCode: z.string().describe("The 4-digit code entered by customer."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    if (args.enteredCode === "1234") {
      return "Verification successful - customer identity confirmed.";
    } else {
      return "Verification failed - incorrect code entered.";
    }
  },
});

// Get Aftermarket Options based on deal data
export const getAftermarketOptionsTool = createTool({
  description: "Get 3-tier aftermarket options based on vehicle and deal information.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    vehicleType: z.string().optional().describe("Type of vehicle (optional, will determine from deal)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Get actual deal data from database
      const deal = await ctx.runQuery(api.deals._internal_getDealByNumber, { dealNumber: args.dealNumber });
      
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      // Use actual sale price for pricing calculation
      const basePrice = deal.salePrice;
      let multiplier = 1.0;
      
      // Adjust pricing based on vehicle price tier
      if (basePrice > 60000) multiplier = 1.5;
      else if (basePrice > 40000) multiplier = 1.2;
      else if (basePrice < 25000) multiplier = 0.8;
      
      const options = {
        option1: {
          name: "Premium Protection Package",
          cost: Math.round(3000 * multiplier),
          includes: ["Extended Warranty (7yr/100k)", "Maintenance Plan (5yr)", "Tire Protection", "Theft Protection", "Paint Protection"],
          monthlyImpact: "Approximately $50-60/month"
        },
        option2: {
          name: "Standard Protection Package", 
          cost: Math.round(2000 * multiplier),
          includes: ["Extended Warranty (5yr/75k)", "Maintenance Plan (3yr)", "Tire Protection"],
          monthlyImpact: "Approximately $30-40/month"
        },
        option3: {
          name: "Basic Protection Package",
          cost: Math.round(1000 * multiplier),
          includes: ["Extended Warranty (3yr/50k)", "Basic Maintenance Plan (2yr)"],
          monthlyImpact: "Approximately $15-25/month"
        }
      };
      
      return JSON.stringify({
        dealNumber: args.dealNumber,
        vehicleInfo: deal.vehicle,
        salePrice: basePrice,
        customerName: deal.fullName,
        currentSelection: deal.selectedAftermarketOption,
        options,
      });
    } catch (error) {
      console.error("Error getting aftermarket options:", error);
      
      // Fallback to simulated options
      const basePrice = 30000; // Default price for simulation
      let multiplier = 1.0;
      
      const options = {
        option1: {
          name: "Premium Protection Package",
          cost: Math.round(3000 * multiplier),
          includes: ["Extended Warranty (7yr/100k)", "Maintenance Plan (5yr)", "Tire Protection", "Theft Protection", "Paint Protection"],
          monthlyImpact: "Approximately $50-60/month"
        },
        option2: {
          name: "Standard Protection Package", 
          cost: Math.round(2000 * multiplier),
          includes: ["Extended Warranty (5yr/75k)", "Maintenance Plan (3yr)", "Tire Protection"],
          monthlyImpact: "Approximately $30-40/month"
        },
        option3: {
          name: "Basic Protection Package",
          cost: Math.round(1000 * multiplier),
          includes: ["Extended Warranty (3yr/50k)", "Basic Maintenance Plan (2yr)"],
          monthlyImpact: "Approximately $15-25/month"
        }
      };
      
      return JSON.stringify({
        dealNumber: args.dealNumber,
        vehicleInfo: args.vehicleType || "2023 Vehicle Model",
        salePrice: basePrice,
        options,
        error: "Used fallback aftermarket options due to database error"
      });
    }
  },
});

// Calculate Credit Score Based Interest Rate
export const getCreditBasedRateTool = createTool({
  description: "Get interest rate based on customer credit score tier.",
  args: z.object({
    creditScore: stringToNumber.describe("Customer's credit score."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    let rate: number;
    
    if (args.creditScore > 800) {
      rate = 5.0; // Premium tier
    } else if (args.creditScore >= 700) {
      rate = 6.0; // Standard tier  
    } else {
      rate = 7.0; // Subprime tier
    }
    
    return JSON.stringify({ 
      creditScore: args.creditScore,
      interestRate: rate,
      tier: args.creditScore > 800 ? "Premium" : args.creditScore >= 700 ? "Standard" : "Subprime"
    });
  },
});

// Set aftermarket option for deal
export const setAftermarketOptionTool = createTool({
  description: "Record the customer's aftermarket option selection for a deal.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    option: z.string().describe("Selected aftermarket option (e.g., option1, option2, option3, none)."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Record aftermarket option in database using internal function
      const result = await ctx.runMutation(api.deals._internal_setAftermarketOption, {
        dealNumber: args.dealNumber,
        option: args.option,
      });
      
      return `${result} Aftermarket option '${args.option}' recorded for deal ${args.dealNumber}.`;
    } catch (error) {
      console.error("Error setting aftermarket option:", error);
      
      if (error instanceof Error && error.message === "Deal not found") {
        return "Deal not found - cannot set aftermarket option";
      }
      
      return "Failed to record aftermarket option";
    }
  },
});

// Update deal stage tool
export const updateDealStageTool = createTool({
  description: "Update the current stage of a deal in the system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    stage: z.string().describe("New stage (e.g., 'verification', 'paperwork', 'transaction', 'complete')."),
    isComplete: z.boolean().optional().describe("Whether the deal is complete."),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      // Update deal stage in database using internal function
      const result = await ctx.runMutation(api.deals._internal_updateDealStage, {
        dealNumber: args.dealNumber,
        stage: args.stage,
        isComplete: args.isComplete,
      });
      
      return `${result} Deal ${args.dealNumber} stage updated to '${args.stage}'${args.isComplete ? ' and marked as complete' : ''}.`;
    } catch (error) {
      console.error("Error updating deal stage:", error);
      
      if (error instanceof Error && error.message === "Deal not found") {
        return "Deal not found - cannot update stage";
      }
      
      return "Failed to update deal stage";
    }
  },
});