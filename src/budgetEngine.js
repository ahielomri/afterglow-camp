// ---------------------------------------------------------------------------
// Camp budget engine - implements the handover-doc formulas exactly.
// Every number here is an input re-entered each planning cycle; nothing
// is hardcoded. Section numbers in comments match the source document.
// Pulled out to a plain function (instead of living inline in a useMemo)
// so it can be run twice: once with the real camp-member count, and once
// with a hypothetical "what if we had N members" count for planning.
//
// Lives in its own file (rather than inline in App.jsx, where it used to
// be) so it can be unit-tested in isolation - this is the single most
// money-critical calculation in the app, and had zero test coverage.
// ---------------------------------------------------------------------------

const VAT_RATE = 0.18;

export function runBudgetEngine(p, N, budgetExpenses, paymentTotals) {
  const num = (v) => Number(v) || 0;
  const eventDays = num(p.global.eventDays);
  const defaultPct = num(p.global.contingencyPct);
  const pctFor = (sectionKey) => {
    const ov = p.contingencyOverrides[sectionKey];
    return ov !== undefined && ov !== "" ? num(ov) : defaultPct;
  };
  const perPerson = (total) => (N > 0 ? total / N : 0);
  // "הסכומים כוללים מע"מ" - every price entered throughout the parameters
  // is assumed to be a real supplier quote, which is pre-VAT unless this
  // box is checked. Applied uniformly to every cost driver below (not
  // just item rows) so the toggle means the same thing everywhere.
  const vat = p.global.vatIncluded ? 1 : 1 + VAT_RATE;

  // 02 - מחנה (כולל הסלון)
  const campItemsTotal = p.campInfra.items.reduce((s, r) => s + num(r.qty) * num(r.price), 0) * vat;
  const loungeItemsTotal = p.campInfra.loungeItems.reduce((s, r) => s + num(r.qty) * num(r.price), 0) * vat;
  const iceCost = num(p.campInfra.icePricePerKg) * num(p.campInfra.iceKgPerDay) * num(p.campInfra.iceDays) * vat;
  const elecCost = num(p.campInfra.elecPricePerKw) * num(p.campInfra.elecKw) * vat;
  const oneTimeIncomeTotal = p.campInfra.oneTimeIncome.reduce((s, r) => s + num(r.amount), 0);
  const campBase = campItemsTotal + loungeItemsTotal + iceCost + elecCost;
  const campContingency = campBase * (pctFor("camp") / 100);
  const campTotal = campBase + campContingency;

  // 03 - מים ומקלחות
  const w = p.water;
  const totalLiters = N * num(w.literPerPersonPerDay) * eventDays;
  const waterBase = (num(w.tankFaucetCost) + num(w.fillCost) * num(w.fillCount) + num(w.drainCost) * num(w.drainCount) + num(w.showerUnitCost) * num(w.showerUnitsCount)) * vat;
  const waterContingency = waterBase * (pctFor("water") / 100);
  const waterTotal = waterBase + waterContingency;

  // 04 - שירותים (תברואה)
  const s = p.sanitation;
  // pumpFreqPerPersonPerDay is how often the WHOLE camp's tank needs
  // emptying per day (a servicing schedule, not something that scales up
  // per additional camper) - multiplying by N inflated this ~40x too high.
  const pumpOutCost = num(s.pumpFreqPerPersonPerDay) * eventDays * num(s.pumpCost) * vat;
  const sanitationBase = (pumpOutCost + (num(s.sawdustFreq) * num(s.sawdustCost) + num(s.drainCellCost) + num(s.chemicalToiletsCost)) * vat);
  const sanitationContingency = sanitationBase * (pctFor("sanitation") / 100);
  const sanitationTotal = sanitationBase + sanitationContingency;

  // 05 - אוכל
  const f = p.food;
  const setupFoodCost = num(f.setupPeopleCount) * num(f.setupDays) * num(f.setupCostPerDay) * vat;
  const eventFoodCost = num(f.actualDiners) * num(f.mealsPerDay) * num(f.eventDays) * num(f.costPerMeal) * vat;
  const foodTotal = setupFoodCost + eventFoodCost + num(f.contingencyAmount);

  // 07 - כללי
  const g = p.general;
  const splitRatio = g.splitRatioPct === "" ? 100 : num(g.splitRatioPct);
  const generalShare = num(g.fixedAnnualCost) * vat * (splitRatio / 100);

  // 10 - רישום הוצאות בפועל, מקובץ לפי שיוך תקציבי
  const actualByAllocation = {};
  budgetExpenses.forEach((e) => {
    const key = e.allocation || "שונות";
    const amt = (e.isRefund ? -1 : 1) * num(e.amount);
    actualByAllocation[key] = (actualByAllocation[key] || 0) + amt;
  });
  const totalActual = Object.values(actualByAllocation).reduce((s, v) => s + v, 0);

  // "תקציב מתוכנן" per category, computed straight from the parameters
  // above instead of a disconnected manually-typed number - filling in
  // real numbers here now actually shows up as a planned budget. Item
  // rows carry their own category tag (defaulting to "ציוד", since
  // they live under camp equipment); the scalar cost-driver sections
  // each map to the one existing category that already matches their
  // name 1:1. Contingency reserves are deliberately left out of this -
  // they're a buffer, not a cost tied to any one category.
  const categoryPlanned = {};
  const addPlanned = (category, amount) => {
    if (!category || amount === 0) return;
    categoryPlanned[category] = (categoryPlanned[category] || 0) + amount;
  };
  p.campInfra.items.forEach((r) => addPlanned(r.category || "ציוד", num(r.qty) * num(r.price) * vat));
  p.campInfra.loungeItems.forEach((r) => addPlanned(r.category || "ציוד", num(r.qty) * num(r.price) * vat));
  addPlanned("קרח", iceCost);
  addPlanned("חשמל", elecCost);
  addPlanned("מים", waterBase);
  addPlanned("שירותים ומקלחות", sanitationBase);
  addPlanned("מטבח ומזון", foodTotal);
  addPlanned("שונות", generalShare);

  // 12 - נוסחת האיחוד הסופית
  const totalCampCost = campTotal + waterTotal + sanitationTotal + foodTotal + generalShare;
  const duesCollected = paymentTotals.paid;
  const vatRefund = num(p.income.vatRefund);
  const externalNet = num(p.income.externalNet);
  const totalIncome = duesCollected + vatRefund + externalNet + oneTimeIncomeTotal;
  const gapToRaise = totalCampCost - totalIncome;

  return {
    N, eventDays,
    campItemsTotal, loungeItemsTotal, iceCost, elecCost, oneTimeIncomeTotal, campBase, campContingency, campTotal, campPerPerson: perPerson(campTotal),
    totalLiters, waterBase, waterContingency, waterTotal, waterPerPerson: perPerson(waterTotal),
    pumpOutCost, sanitationBase, sanitationContingency, sanitationTotal, sanitationPerPerson: perPerson(sanitationTotal),
    setupFoodCost, eventFoodCost, foodTotal,
    generalShare, generalPerPerson: perPerson(generalShare),
    actualByAllocation, totalActual,
    categoryPlanned,
    totalCampCost, duesCollected, vatRefund, externalNet, totalIncome, gapToRaise,
  };
}
