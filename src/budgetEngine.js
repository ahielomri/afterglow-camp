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
export function runBudgetEngine(p, N, budgetExpenses, paymentTotals) {
  const num = (v) => Number(v) || 0;
  const eventDays = num(p.global.eventDays);
  const defaultPct = num(p.global.contingencyPct);
  const pctFor = (sectionKey) => {
    const ov = p.contingencyOverrides[sectionKey];
    return ov !== undefined && ov !== "" ? num(ov) : defaultPct;
  };
  const perPerson = (total) => (N > 0 ? total / N : 0);

  // 02 - מחנה (כולל הסלון)
  const campItemsTotal = p.campInfra.items.reduce((s, r) => s + num(r.qty) * num(r.price), 0);
  const loungeItemsTotal = p.campInfra.loungeItems.reduce((s, r) => s + num(r.qty) * num(r.price), 0);
  const iceCost = num(p.campInfra.icePricePerKg) * num(p.campInfra.iceKgPerDay) * num(p.campInfra.iceDays);
  const elecCost = num(p.campInfra.elecPricePerKw) * num(p.campInfra.elecKw);
  const oneTimeIncomeTotal = p.campInfra.oneTimeIncome.reduce((s, r) => s + num(r.amount), 0);
  const campBase = campItemsTotal + loungeItemsTotal + iceCost + elecCost;
  const campContingency = campBase * (pctFor("camp") / 100);
  const campTotal = campBase + campContingency;

  // 03 - מים ומקלחות
  const w = p.water;
  const totalLiters = N * num(w.literPerPersonPerDay) * eventDays;
  const waterBase = num(w.tankFaucetCost) + num(w.fillCost) * num(w.fillCount) + num(w.drainCost) * num(w.drainCount) + num(w.showerUnitCost) * num(w.showerUnitsCount);
  const waterContingency = waterBase * (pctFor("water") / 100);
  const waterTotal = waterBase + waterContingency;

  // 04 - שירותים (תברואה)
  const s = p.sanitation;
  const pumpOutCost = N * num(s.pumpFreqPerPersonPerDay) * eventDays * num(s.pumpCost);
  const sanitationBase = pumpOutCost + num(s.sawdustFreq) * num(s.sawdustCost) + num(s.drainCellCost) + num(s.chemicalToiletsCost);
  const sanitationContingency = sanitationBase * (pctFor("sanitation") / 100);
  const sanitationTotal = sanitationBase + sanitationContingency;

  // 05 - אוכל
  const f = p.food;
  const setupFoodCost = num(f.setupPeopleCount) * num(f.setupDays) * num(f.setupCostPerDay);
  const eventFoodCost = num(f.actualDiners) * num(f.mealsPerDay) * num(f.eventDays) * num(f.costPerMeal);
  const foodTotal = setupFoodCost + eventFoodCost + num(f.contingencyAmount);

  // 06 - אלכוהול
  const alcoholBase = p.alcohol.categories.reduce((sum, c) => sum + num(c.units) * num(c.price), 0);
  const alcoholTotal = alcoholBase;

  // 07 - כללי
  const g = p.general;
  const splitRatio = g.splitRatioPct === "" ? 100 : num(g.splitRatioPct);
  const generalShare = num(g.fixedAnnualCost) * (splitRatio / 100);

  // 10 - רישום הוצאות בפועל, מקובץ לפי שיוך תקציבי
  const actualByAllocation = {};
  budgetExpenses.forEach((e) => {
    const key = e.allocation || "שונות";
    const amt = (e.isRefund ? -1 : 1) * num(e.amount);
    actualByAllocation[key] = (actualByAllocation[key] || 0) + amt;
  });
  const totalActual = Object.values(actualByAllocation).reduce((s, v) => s + v, 0);

  // 12 - נוסחת האיחוד הסופית
  const totalCampCost = campTotal + waterTotal + sanitationTotal + foodTotal + alcoholTotal + generalShare;
  const duesCollected = paymentTotals.paid;
  const vatRefund = num(p.income.vatRefund);
  const externalNet = num(p.income.externalNet);
  const totalIncome = duesCollected + vatRefund + externalNet + oneTimeIncomeTotal;
  const gapToRaise = totalCampCost - totalIncome;

  // 11 - תזרים מזומנים
  const channelsTotal = p.cashflow.channels.reduce((s, c) => s + num(c.amount), 0);
  const pendingPayments = num(p.cashflow.pendingPayments);
  const knownCommitments = num(p.cashflow.knownCommitments);
  const cashflowGap = totalCampCost - channelsTotal;
  const projectedBalance = cashflowGap + vatRefund - knownCommitments + pendingPayments;

  return {
    N, eventDays,
    campItemsTotal, loungeItemsTotal, iceCost, elecCost, oneTimeIncomeTotal, campBase, campContingency, campTotal, campPerPerson: perPerson(campTotal),
    totalLiters, waterBase, waterContingency, waterTotal, waterPerPerson: perPerson(waterTotal),
    pumpOutCost, sanitationBase, sanitationContingency, sanitationTotal, sanitationPerPerson: perPerson(sanitationTotal),
    setupFoodCost, eventFoodCost, foodTotal,
    alcoholBase, alcoholTotal, alcoholPerPerson: perPerson(alcoholTotal),
    generalShare, generalPerPerson: perPerson(generalShare),
    actualByAllocation, totalActual,
    totalCampCost, duesCollected, vatRefund, externalNet, totalIncome, gapToRaise,
    channelsTotal, pendingPayments, knownCommitments, cashflowGap, projectedBalance,
  };
}
