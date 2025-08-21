import { z } from "zod";
import { createTool } from "@convex-dev/agent";

// AI-Fi Tools - Simplified implementations for automotive finance workflows
// TODO: Integrate with proper Convex database access patterns

// Simulated deal data
const simulatedDeals: Record<string, any> = {
  "1": {
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

// Tool to retrieve deal info
export const getDealInfoTool = createTool({
  description: "Retrieve deal information from the automotive DMS system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number to retrieve."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    try {
      const deal = simulatedDeals[args.dealNumber];
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      return JSON.stringify(deal);
    } catch (error) {
      console.error("Error retrieving deal:", error);
      return JSON.stringify({ error: "Failed to retrieve deal information" });
    }
  },
});

// Tool to update deal info
export const updateDealInfoTool = createTool({
  description: "Update deal information in the automotive DMS system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number to update."),
    updates: z.record(z.any()).describe("Key-value pairs to update in the deal."),
    modifiedBy: z.string().optional().describe("Who is making the modification."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    try {
      console.log(`Updating deal ${args.dealNumber} with:`, args.updates);
      // TODO: Implement proper database update
      return "Deal updated successfully (simulated)";
    } catch (error) {
      console.error("Error updating deal:", error);
      return "Failed to update deal information";
    }
  },
});

// Tool for financial calculations
export const calculatePaymentTool = createTool({
  description: "Calculate monthly loan payment based on amount, rate, and terms.",
  args: z.object({
    principal: z.number().describe("The loan principal amount."),
    annualRate: z.number().describe("Annual interest rate as percentage."),
    termsInMonths: z.number().describe("Loan terms in months."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    const monthlyRate = args.annualRate / 12 / 100;
    const payment = args.principal * (monthlyRate * Math.pow(1 + monthlyRate, args.termsInMonths)) / (Math.pow(1 + monthlyRate, args.termsInMonths) - 1);
    return payment.toFixed(2);
  },
});

// Tool for calculating total financed amount
export const calculateFinancedAmountTool = createTool({
  description: "Calculate the total financed amount including taxes, fees, and aftermarket add-ons.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    aftermarketCost: z.number().optional().default(0).describe("Additional cost for aftermarket products."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    try {
      const deal = simulatedDeals[args.dealNumber];
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      const taxableAmount = deal.salePrice - (deal.rebate || 0) - (deal.tradeValue || 0) + deal.dealerFees + args.aftermarketCost;
      const tax = taxableAmount * deal.taxRate;
      const totalFinanced = deal.salePrice - (deal.rebate || 0) + deal.dealerFees + tax + (deal.tagTitleCost || 125) + args.aftermarketCost + (deal.tradePayoff || 0) - (deal.tradeValue || 0);
      
      return JSON.stringify({ 
        totalFinanced: Math.round(totalFinanced * 100) / 100, 
        tax: Math.round(tax * 100) / 100,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
      });
    } catch (error) {
      console.error("Error calculating financed amount:", error);
      return JSON.stringify({ error: "Failed to calculate financed amount" });
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
    isFinance: z.boolean().optional().describe("Whether the deal is financed."),
    aftermarketOption: z.string().optional().describe("Selected aftermarket option."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    try {
      const deal = simulatedDeals[args.dealNumber];
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      const isFinance = args.isFinance !== undefined ? args.isFinance : deal.isFinance;
      
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
        customerName: deal.fullName,
        isFinance,
        aftermarketOption: args.aftermarketOption || "none",
      });
    } catch (error) {
      console.error("Error generating documents:", error);
      return JSON.stringify({ error: "Failed to generate documents" });
    }
  },
});

// Simulate electronic signature
export const simulateSignatureTool = createTool({
  description: "Simulate applying an electronic signature to documents.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    customerName: z.string().describe("Customer name for signature."),
    documentType: z.string().describe("Type of document."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    console.log(`Signature applied: ${args.customerName} signed ${args.documentType} for deal ${args.dealNumber}`);
    return `Electronic signature for ${args.customerName} applied to ${args.documentType} for deal ${args.dealNumber}. Document signature recorded in system.`;
  },
});

// SMS Verification Simulation
export const sendVerificationCodeTool = createTool({
  description: "Send a verification code to customer's phone (simulated for demo).",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    phoneNumber: z.string().optional().describe("Phone number (optional)."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    const deal = simulatedDeals[args.dealNumber];
    if (!deal) {
      return "Deal not found - cannot send verification code";
    }
    
    const phoneToUse = args.phoneNumber || "customer's phone";
    return `Verification code sent to ${phoneToUse} ending in XXXX. For demo purposes, the correct code is 1234.`;
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

// Get Aftermarket Options
export const getAftermarketOptionsTool = createTool({
  description: "Get 3-tier aftermarket options based on vehicle and deal information.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    vehicleType: z.string().optional().describe("Type of vehicle (optional)."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    try {
      const deal = simulatedDeals[args.dealNumber];
      if (!deal) {
        return JSON.stringify({ error: "Deal not found" });
      }
      
      // Base aftermarket pricing on vehicle sale price
      const basePrice = deal.salePrice;
      let multiplier = 1.0;
      
      // Adjust pricing based on vehicle type/price tier
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
        salePrice: deal.salePrice,
        options,
      });
    } catch (error) {
      console.error("Error getting aftermarket options:", error);
      return JSON.stringify({ error: "Failed to retrieve aftermarket options" });
    }
  },
});

// Calculate Credit Score Based Interest Rate
export const getCreditBasedRateTool = createTool({
  description: "Get interest rate based on customer credit score tier.",
  args: z.object({
    creditScore: z.number().describe("Customer's credit score."),
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
    option: z.string().describe("Selected aftermarket option."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    console.log(`Setting aftermarket option '${args.option}' for deal ${args.dealNumber}`);
    return `Aftermarket option '${args.option}' recorded for deal ${args.dealNumber} (simulated).`;
  },
});

// Update deal stage tool
export const updateDealStageTool = createTool({
  description: "Update the current stage of a deal in the system.",
  args: z.object({
    dealNumber: z.string().describe("The deal number."),
    stage: z.string().describe("New stage."),
    isComplete: z.boolean().optional().describe("Whether the deal is complete."),
  }),
  handler: async (_ctx, args): Promise<string> => {
    console.log(`Updating deal ${args.dealNumber} stage to '${args.stage}'${args.isComplete ? ' and marking as complete' : ''}`);
    return `Deal ${args.dealNumber} stage updated to '${args.stage}'${args.isComplete ? ' and marked as complete' : ''} (simulated).`;
  },
});