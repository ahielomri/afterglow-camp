import { describe, it, expect } from "vitest";
import { runBudgetEngine } from "./budgetEngine.js";

// Minimal-but-complete budgetParams shape (same shape as the default state
// in App.jsx) - each test only overrides the sections it cares about, so a
// change to an unrelated section can't accidentally make an unrelated test
// start failing. vatIncluded defaults to true here so existing prices in
// tests aren't marked up by 18% unless a test is specifically checking VAT.
function baseParams(overrides = {}) {
  return {
    global: { eventDays: 4, contingencyPct: 10, vatIncluded: true },
    campInfra: { items: [], loungeItems: [], oneTimeIncome: [], icePricePerKg: "", iceKgPerDay: "", iceDays: "", elecPricePerKw: "", elecKw: "" },
    water: { literPerPersonPerDay: "", tankFaucetCost: "", fillCost: "", fillCount: "", drainCost: "", drainCount: "", showerUnitCost: "", showerUnitsCount: "" },
    sanitation: { pumpFreqPerPersonPerDay: "", pumpCost: "", sawdustFreq: "", sawdustCost: "", drainCellCost: "", chemicalToiletsCost: "" },
    food: { setupPeopleCount: "", setupDays: "", setupCostPerDay: "", actualDiners: "", mealsPerDay: "", eventDays: "", costPerMeal: "", contingencyAmount: "" },
    general: { fixedAnnualCost: "", splitRatioPct: "" },
    contingencyOverrides: {},
    income: { vatRefund: "", externalNet: "" },
    ...overrides,
  };
}

const noExpenses = [];
const zeroPayments = { paid: 0 };

describe("runBudgetEngine - camp section (02)", () => {
  it("sums item rows, ice, and electricity, then applies the default contingency pct", () => {
    const p = baseParams({
      campInfra: {
        items: [{ qty: 2, price: 100 }, { qty: 3, price: 50 }], // 200 + 150 = 350
        loungeItems: [{ qty: 1, price: 500 }], // 500
        oneTimeIncome: [],
        icePricePerKg: 5, iceKgPerDay: 10, iceDays: 4, // 200
        elecPricePerKw: 2, elecKw: 100, // 200
      },
    });
    const r = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    // base = 350 + 500 + 200 + 200 = 1250, +10% contingency = 1375
    expect(r.campBase).toBe(1250);
    expect(r.campContingency).toBe(125);
    expect(r.campTotal).toBe(1375);
    expect(r.campPerPerson).toBe(137.5);
  });

  it("falls back to the global contingency pct when no per-section override is set", () => {
    const p = baseParams({ campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] } });
    const r = runBudgetEngine(p, 5, noExpenses, zeroPayments);
    expect(r.campContingency).toBe(100); // 10% of 1000
  });

  it("uses a per-section contingency override instead of the global default, including an explicit 0", () => {
    const p = baseParams({
      campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] },
      contingencyOverrides: { camp: 0 },
    });
    const r = runBudgetEngine(p, 5, noExpenses, zeroPayments);
    expect(r.campContingency).toBe(0);
    expect(r.campTotal).toBe(1000);
  });
});

describe("runBudgetEngine - VAT", () => {
  it("leaves prices untouched when vatIncluded is true (supplier quote already includes VAT)", () => {
    const p = baseParams({
      global: { eventDays: 4, contingencyPct: 0, vatIncluded: true },
      campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] },
    });
    const r = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    expect(r.campItemsTotal).toBe(1000);
  });

  it("adds 18% when vatIncluded is false (the real-world default - supplier quotes are pre-VAT)", () => {
    const p = baseParams({
      global: { eventDays: 4, contingencyPct: 0, vatIncluded: false },
      campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] },
    });
    const r = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    expect(r.campItemsTotal).toBe(1180);
  });
});

describe("runBudgetEngine - per-person division", () => {
  it("returns 0 (not Infinity/NaN) for every *PerPerson figure when N is 0", () => {
    const p = baseParams({ campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] } });
    const r = runBudgetEngine(p, 0, noExpenses, zeroPayments);
    expect(r.campPerPerson).toBe(0);
    expect(r.waterPerPerson).toBe(0);
    expect(r.sanitationPerPerson).toBe(0);
    expect(r.generalPerPerson).toBe(0);
  });
});

describe("runBudgetEngine - sanitation pump-out cost (04)", () => {
  it("does NOT scale with headcount (N) - it's a fixed servicing schedule for the whole camp, not per person", () => {
    const p = baseParams({
      global: { eventDays: 4, contingencyPct: 0, vatIncluded: true },
      sanitation: { ...baseParams().sanitation, pumpFreqPerPersonPerDay: 1.5, pumpCost: 125 },
    });
    const r10 = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    const r40 = runBudgetEngine(p, 40, noExpenses, zeroPayments);
    // 1.5 * 4 days * 125 = 750, regardless of N
    expect(r10.pumpOutCost).toBe(750);
    expect(r40.pumpOutCost).toBe(750);
  });
});

describe("runBudgetEngine - actual expenses by allocation (10)", () => {
  it("groups expenses by allocation and defaults an empty allocation to שונות", () => {
    const p = baseParams();
    const expenses = [
      { allocation: "עיצוב ותפאורה", amount: 600 },
      { allocation: "עיצוב ותפאורה", amount: 400 },
      { allocation: "", amount: 100 },
    ];
    const r = runBudgetEngine(p, 10, expenses, zeroPayments);
    expect(r.actualByAllocation["עיצוב ותפאורה"]).toBe(1000);
    expect(r.actualByAllocation["שונות"]).toBe(100);
    expect(r.totalActual).toBe(1100);
  });

  it("subtracts refunds instead of adding them", () => {
    const p = baseParams();
    const expenses = [
      { allocation: "ציוד", amount: 500 },
      { allocation: "ציוד", amount: 200, isRefund: true },
    ];
    const r = runBudgetEngine(p, 10, expenses, zeroPayments);
    expect(r.actualByAllocation["ציוד"]).toBe(300);
    expect(r.totalActual).toBe(300);
  });
});

describe("runBudgetEngine - categoryPlanned (planned budget per category, derived from params)", () => {
  it("attributes item rows to their tagged category, defaulting untagged rows to ציוד", () => {
    const p = baseParams({
      campInfra: {
        ...baseParams().campInfra,
        items: [{ qty: 1, price: 100, category: "הובלות" }, { qty: 1, price: 50 }],
      },
    });
    const r = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    expect(r.categoryPlanned["הובלות"]).toBe(100);
    expect(r.categoryPlanned["ציוד"]).toBe(50);
  });

  it("attributes ice, electricity, water, sanitation, food, and general to their matching static category", () => {
    const p = baseParams({
      campInfra: { ...baseParams().campInfra, icePricePerKg: 5, iceKgPerDay: 10, iceDays: 2, elecPricePerKw: 2, elecKw: 50 },
      water: { ...baseParams().water, tankFaucetCost: 300 },
      sanitation: { ...baseParams().sanitation, drainCellCost: 200 },
      food: { ...baseParams().food, setupPeopleCount: 5, setupDays: 2, setupCostPerDay: 10 },
      general: { fixedAnnualCost: 1000, splitRatioPct: 50 },
    });
    const r = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    expect(r.categoryPlanned["קרח"]).toBe(100);
    expect(r.categoryPlanned["חשמל"]).toBe(100);
    expect(r.categoryPlanned["מים"]).toBe(300);
    expect(r.categoryPlanned["שירותים ומקלחות"]).toBe(200);
    expect(r.categoryPlanned["מטבח ומזון"]).toBe(100);
    expect(r.categoryPlanned["שונות"]).toBe(500);
  });

  it("does not include contingency reserves in categoryPlanned - only the tagged/matched cost drivers", () => {
    const p = baseParams({
      campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] },
      contingencyOverrides: { camp: 50 },
    });
    const r = runBudgetEngine(p, 10, noExpenses, zeroPayments);
    expect(r.categoryPlanned["ציוד"]).toBe(1000);
    expect(r.campContingency).toBe(500);
  });
});

describe("runBudgetEngine - income and the final gap formula (12)", () => {
  it("combines dues collected, VAT refund, external net income, and one-time income", () => {
    const p = baseParams({
      campInfra: { ...baseParams().campInfra, oneTimeIncome: [{ amount: 300 }] },
      income: { vatRefund: 400, externalNet: 100 },
    });
    const r = runBudgetEngine(p, 10, noExpenses, { paid: 5000 });
    expect(r.duesCollected).toBe(5000);
    expect(r.totalIncome).toBe(5000 + 400 + 100 + 300);
  });

  it("computes gapToRaise as total camp cost minus total income (positive = still need to raise money)", () => {
    const p = baseParams({ campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 10000 }] }, contingencyOverrides: { camp: 0 } });
    const r = runBudgetEngine(p, 10, noExpenses, { paid: 3000 });
    expect(r.totalCampCost).toBe(10000);
    expect(r.gapToRaise).toBe(10000 - 3000);
  });
});
