import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed the database with the original simulated deals
 */
export const seedDeals = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    
    // Check if deals already exist
    const existingDeals = await ctx.db.query("deals").collect();
    if (existingDeals.length > 0) {
      return "Deals already seeded";
    }
    
    // Seed with original simulated deals
    const dealsToSeed = [
      {
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
        signedDocuments: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        dealNumber: "2",
        fullName: "John Smith",
        address: "789 Pine Street, Sunnyside, TX 75001",
        insurance: "Allstate A11223344 effective 2/20/24 expiring 2/20/25",
        vehicle: "2G1FC3D36D9165432 2023 Chevrolet Camaro SS Red 800 Miles",
        trade: "1GNSCBKC7JR123456 Chevrolet Suburban Premier 25,000 miles Silver",
        salePrice: 42000,
        rebate: 2500,
        dealerFees: 1100,
        tradeValue: 32000,
        tradePayoff: 28000,
        taxRate: 0.07,
        ssn: "987654321",
        creditScore: 805,
        timeAtAddress: "3 yrs, Rent, $1800 per month",
        employment: "Full-time, 8 years at ABC Industries, Marketing Manager",
        monthlyIncome: 8000,
        expectation: "customer expects a payment below $800",
        tagTitleCost: 125,
        isFinance: true,
        currentStage: "initial",
        isComplete: false,
        signedDocuments: [],
        createdAt: now,
        updatedAt: now,
      },
      {
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
        signedDocuments: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        dealNumber: "107",
        fullName: "Jane Louise Smith",
        address: "456 Oak Street, Smalltown, FL 33876 USA",
        insurance: "XYZ Insurance Policy 987654321 Effective Date: 2022-07-01 Expiration Date: 2023-07-01",
        vehicle: "5XYPGDA50MG123456 White SX trim with 34,500 miles",
        trade: "2FMPK3G97GB123456 Ford Edge SEL Magnetic Metallic 103,487 miles",
        salePrice: 17500,
        rebate: 0,
        dealerFees: 1100,
        tradeValue: 5000,
        tradePayoff: 6327.34,
        taxRate: 0.06,
        tagTitleCost: 125,
        expectation: "agreed upon OTD amount: $20,975.84",
        isFinance: false, // Cash deal
        currentStage: "initial",
        isComplete: false,
        signedDocuments: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
    
    // Insert all deals
    const insertedIds = [];
    for (const deal of dealsToSeed) {
      const id = await ctx.db.insert("deals", deal);
      insertedIds.push(id);
    }
    
    return `Seeded ${insertedIds.length} deals successfully`;
  },
});

/**
 * Get deal by deal number - Internal function for tools
 */
export const getDealByNumber = query({
  args: { dealNumber: v.string() },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    return deal;
  },
});

/**
 * Get deal by deal number - Internal function for tools
 */
export const _internal_getDealByNumber = query({
  args: { dealNumber: v.string() },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    return deal;
  },
});

/**
 * Update deal information
 */
export const updateDeal = mutation({
  args: {
    dealNumber: v.string(),
    updates: v.any(),
    modifiedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    const updateData = {
      ...args.updates,
      updatedAt: Date.now(),
      ...(args.modifiedBy && { lastModifiedBy: args.modifiedBy }),
    };
    
    await ctx.db.patch(deal._id, updateData);
    return "Deal updated successfully";
  },
});

/**
 * Update deal information - Internal function for tools
 */
export const _internal_updateDeal = mutation({
  args: {
    dealNumber: v.string(),
    updates: v.any(),
    modifiedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    const updateData = {
      ...args.updates,
      updatedAt: Date.now(),
      ...(args.modifiedBy && { lastModifiedBy: args.modifiedBy }),
    };
    
    await ctx.db.patch(deal._id, updateData);
    return "Deal updated successfully";
  },
});

/**
 * Get all deals for a customer
 */
export const getDealsByCustomer = query({
  args: { customerId: v.id("users") },
  handler: async (ctx, args) => {
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();
    
    return deals;
  },
});

/**
 * Update deal stage
 */
export const updateDealStage = mutation({
  args: {
    dealNumber: v.string(),
    stage: v.string(),
    isComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    await ctx.db.patch(deal._id, {
      currentStage: args.stage,
      ...(args.isComplete !== undefined && { isComplete: args.isComplete }),
      updatedAt: Date.now(),
    });
    
    return "Deal stage updated successfully";
  },
});

/**
 * Add signed document to deal
 */
export const addSignedDocument = mutation({
  args: {
    dealNumber: v.string(),
    documentType: v.string(),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    const updatedDocuments = [...deal.signedDocuments, args.documentType];
    
    await ctx.db.patch(deal._id, {
      signedDocuments: updatedDocuments,
      updatedAt: Date.now(),
    });
    
    return "Document signature recorded successfully";
  },
});

/**
 * Set aftermarket option for deal
 */
export const setAftermarketOption = mutation({
  args: {
    dealNumber: v.string(),
    option: v.string(),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    await ctx.db.patch(deal._id, {
      selectedAftermarketOption: args.option,
      updatedAt: Date.now(),
    });
    
    return "Aftermarket option set successfully";
  },
});

// Internal functions for tools
export const _internal_addSignedDocument = mutation({
  args: {
    dealNumber: v.string(),
    documentType: v.string(),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    const updatedDocuments = [...deal.signedDocuments, args.documentType];
    
    await ctx.db.patch(deal._id, {
      signedDocuments: updatedDocuments,
      updatedAt: Date.now(),
    });
    
    return "Document signature recorded successfully";
  },
});

export const _internal_setAftermarketOption = mutation({
  args: {
    dealNumber: v.string(),
    option: v.string(),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    await ctx.db.patch(deal._id, {
      selectedAftermarketOption: args.option,
      updatedAt: Date.now(),
    });
    
    return "Aftermarket option set successfully";
  },
});

export const _internal_updateDealStage = mutation({
  args: {
    dealNumber: v.string(),
    stage: v.string(),
    isComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const deal = await ctx.db
      .query("deals")
      .withIndex("by_deal_number", (q) => q.eq("dealNumber", args.dealNumber))
      .first();
    
    if (!deal) {
      throw new Error("Deal not found");
    }
    
    await ctx.db.patch(deal._id, {
      currentStage: args.stage,
      ...(args.isComplete !== undefined && { isComplete: args.isComplete }),
      updatedAt: Date.now(),
    });
    
    return "Deal stage updated successfully";
  },
});