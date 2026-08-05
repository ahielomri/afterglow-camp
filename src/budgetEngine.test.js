import { describe, it, expect } from "vitest";
import { runBudgetEngine } from "./budgetEngine.js";

// Minimal-but-complete budgetParams shape (same shape as the default state
// in App.jsx) - each test only overrides the sections it cares about, so a
// change to an unrelated section can't accidentally make an unrelated test
// start failing.
function baseParams(overrides = {}) {
  return {
    global: { eventDays: 4, contingencyPct: 10 },
    campInfra: { items: [], loungeItems: [], oneTimeIncome: [], icePricePerKg: "", iceKgPerDay: "", iceDays: "", elecPricePerKw: "", elecKw: "" },
    water: { literPerPersonPerDay: "", tankFaucetCost: "", fillCost: "", fillCount: "", drainCost: "", drainCount: "", showerUnitCost: "", showerUnitsCount: "" },
    sanitation: { pumpFreqPerPersonPerDay: "", pumpCost: "", sawdustFreq: "", sawdustCost: "", drainCellCost: "", chemicalToiletsCost: "" },
    food: { setupPeopleCount: "", setupDays: "", setupCostPerDay: "", actualDiners: "", mealsPerDay: "", eventDays: "", costPerMeal: "", contingencyAmount: "" },
    alcohol: { categories: [] },
    general: { fixedAnnualCost: "", splitRatioPct: "" },
    contingencyOverrides: {},
    income: { vatRefund: "", externalNet: "" },
    cashflow: { channels: [], pendingPayments: "", knownCommitments: "" },
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

describe("runBudgetEngine - per-person division", () => {
  it("returns 0 (not Infinity/NaN) for every *PerPerson figure when N is 0", () => {
    const p = baseParams({ campInfra: { ...baseParams().campInfra, items: [{ qty: 1, price: 1000 }] } });
    const r = runBudgetEngine(p, 0, noExpenses, zeroPayments);
    expect(r.campPerPerson).toBe(0);
    expect(r.waterPerPerson).toBe(0);
    expect(r.sanitationPerPerson).toBe(0);
    expect(r.alcoholPerPerson).toBe(0);
    expect(r.generalPerPerson).toBe(0);
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
