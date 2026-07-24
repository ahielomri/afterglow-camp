import { useState, useEffect, useMemo, useRef } from "react";
import { Users, CalendarDays, Clock, Flame, Tent, ChevronDown, Check, X, LogOut, Wallet, Plus, Trash2, CreditCard, Phone, Car, UserPlus, Megaphone, HeartPulse, History, Bell, BellOff, Package, MapPin, Ticket, MessageCircle, Pencil, ShieldCheck, ShieldOff, LockKeyhole, LayoutDashboard, Home, ShoppingCart } from "lucide-react";
import { pushSupported, pushPermission, enablePush, disablePush, isPushSubscribed, resetPush } from "./push.js";
import {
  uploadFile,
  signInMember,
  setMemberPasswordAndSignIn,
  signOutMember,
  getSignedInMemberName,
  getAllMemberRoles,
  addMemberRow,
  listMyPrivateMessages,
  sendPrivateMessageRow,
  deletePrivateMessageRow,
  listEmergencyInfo,
  setMyEmergencyInfo,
  listAllocationInfo,
  setMyAllocationInfo,
  addTeamMemberRow,
  removeTeamMemberRow,
  adminSetMemberId,
  adminResetMemberAccess,
  adminSetMemberRole,
  listMembersWithIdOnFile,
  adminRenameMember,
  listMembersWithPushEnabled,
  sendEventReminderPush,
  touchLastSeen,
  listLastSeen,
  notifyOwner,
  getDietaryPreferenceCounts,
} from "./storage.js";

// ---------------------------------------------------------------------------
// Design tokens - "Organic" palette (matches the shared design-system folder)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#fdf1f0",
  surface: "#f7dce0",
  surface2: "#f0c9d2",
  input: "#fff7f5",
  text: "#3a222a",
  textMuted: "rgba(58,34,42,0.65)",
  divider: "rgba(58,34,42,0.16)",
  accent: "#e0607a",
  accentDark: "#b8415c",
  accentLight: "#fbd8e0",
  accent2: "#f2935a",
  accent2Dark: "#c96b34",
  accent2Light: "#fce1c7",
  danger: "#c43d3d",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@500;700;900&family=Assistant:wght@400;500;600;700&display=swap');
* { font-weight: 600; }
.text-xs, .text-sm, .text-base, .text-lg { font-weight: 700 !important; }
input, select, textarea, button, label { font-weight: 700 !important; }
p, span, div { font-weight: 600; }
`;
const FONT_HEADING = `"Caprasimo", "Frank Ruhl Libre", serif`;
const FONT_BODY = `"Figtree", "Assistant", sans-serif`;
const FONT_NUM = `"Figtree", "Assistant", sans-serif`;

// ---------------------------------------------------------------------------
// Static reference data (mirrors the Wix CMS collections already built)
// idNumber is used only to verify identity at login - never displayed.
// Admins can add more members at runtime (stored separately, merged in-app).
// ---------------------------------------------------------------------------
const MEMBERS = [
  { name: "אורנה חזוט צורים", idOnFile: true, role: "admin" },
  { name: "עומרי אחיאל", idOnFile: true, role: "owner" },
  { name: "שרון אור", idOnFile: true, role: "member" },
  { name: "ליאת ציטרון", idOnFile: true, role: "member" },
  { name: "איתי כהן", idOnFile: true, role: "member" },
  { name: "מירי אביהו", idOnFile: true, role: "member" },
  { name: "גיא יצחקי", idOnFile: true, role: "member" },
  { name: "מתיאס זיפיליבן", idOnFile: true, role: "member" },
  { name: "גלעד אהרוני", idOnFile: true, role: "member" },
  { name: "רוני דאיה", idOnFile: true, role: "member" },
  { name: "נטע קישיניאבסקי שני", idOnFile: true, role: "admin" },
  { name: "נעם אלמוג", idOnFile: true, role: "member" },
  { name: "נירי כהן", idOnFile: true, role: "member" },
  { name: "אסי כהן", idOnFile: true, role: "member" },
  { name: "אן קליוט", idOnFile: false, role: "member" },
  { name: "טליה הבר", idOnFile: true, role: "member" },
  { name: "תמיר צמח", idOnFile: true, role: "member" },
  { name: "דן דורות", idOnFile: true, role: "member" },
  { name: "אלירם לגזיאל", idOnFile: true, role: "member" },
  { name: "ליאת בן סעדון", idOnFile: true, role: "member" },
  { name: "אבישי גרינגרד", idOnFile: true, role: "member" },
  { name: "טלי שגב", idOnFile: true, role: "member" },
  { name: "רווה מדר", idOnFile: true, role: "member" },
  { name: "עידן טחן", idOnFile: true, role: "member" },
  { name: "אנה קנטרוביץ", idOnFile: true, role: "member" },
  { name: "בתאל בר גיורא", idOnFile: true, role: "member" },
  { name: "רותם פלש", idOnFile: true, role: "member" },
  { name: "גילי דגן", idOnFile: false, role: "member" },
  { name: "יעל נאש", idOnFile: false, role: "member" },
  { name: "שלומי קוך", idOnFile: false, role: "member" },
];

// Each team now allows up to 2 leads, so every entry is an array of names
// (never a bare string) - normalizeTeamLeads() below upgrades any older
// single-name data (from before this change) the same way.
const DEFAULT_TEAM_LEADS = {
  "הקמות": ["גלעד אהרוני"],
  "צוות תקציב": ["רותם פלש"],
  "רכש ולוגיסטיקה": ["אורנה חזוט צורים"],
  "פירוקים": ["תמיר צמח"],
  "מים": ["מתיאס זיפיליבן"],
  "שירותים ומקלחות": ["בתאל בר גיורא"],
  "צוות חשל\"ש": ["יעל נאש"],
  "עיצוב המחנה ותפאורה": ["רוני דאיה"],
  "צוות תוכן גיפט": ["מירי אביהו"],
  "אחראי קרח": ["איתי כהן"],
};

// Upgrades old data shaped as { team: "name" } (single lead) to the new
// { team: ["name"] } shape, and drops empty/blank entries either way.
function normalizeTeamLeads(raw) {
  const next = {};
  Object.entries(raw || {}).forEach(([team, val]) => {
    const arr = Array.isArray(val) ? val : val ? [val] : [];
    next[team] = arr.filter(Boolean).slice(0, 2);
  });
  return next;
}

const TEAMS = [
  { name: "תכנון המחנה", desc: "תכנון פיזי והעמדה של הקמפ: מיקומי המטבח, השירותים, המקלחות, אזור הלינה ומרחב הגיפט/הסלון" },
  { name: "הקמות", desc: "הגעה לפלאיה יומיים-שלושה לפני פתיחת האירוע. בנייה פיזית של כל תשתיות ומבני המחנה מאפס" },
  { name: "פירוקים", desc: "ניהול אופרציית הפירוק ביום האחרון - כולם משתתפים ללא יוצא מן הכלל" },
  { name: "צוות המטבח", desc: "תפריט, כמויות, קנייה מרוכזת וניהול משמרות בישול קבועות ברוטציה של חברי מחנה" },
  { name: "מים", desc: "התקשרות מול ספק מים, מעקב מלאי ותיאום פינוי מים אפורים" },
  { name: "שירותים ומקלחות", desc: "תיאום ספקים וניהול תורנויות ניקיון" },
  { name: "צוות חשל\"ש", desc: "Leave No Trace, מיחזור, פינוי פחים ובדיקת MOOP" },
  { name: "אחראי קרח", desc: "רכישת קרח יומי מהנקודה הרשמית בפלאיה, בסבב מתנדבים" },
  { name: "עיצוב המחנה ותפאורה", desc: "שפה חזותית, שילוט והקמת הסלון המרכזי" },
  { name: "ארטקאר", desc: "עיצוב, בנייה, רישוי ובטיחות התנועה של רכב האמנות (ארט-קאר) של המחנה" },
  { name: "צוות תוכן גיפט", desc: "הפעילויות והתוכן במרחב הגיפט, כולל הטקס היומי אחרי השקיעה" },
  { name: "צוות תקציב", desc: "דמי מחנה, גבייה מרוכזת ומעקב תקציבי" },
  { name: "רכש ולוגיסטיקה", desc: "רכש ציוד קמפינג משותף ותיאום הובלות" },
  { name: "נציג.ת מיט\"ה", desc: "הכתובת המוסמכת של המחנה למרחב בטוח ומניעת הטרדות" },
  { name: "חשמל", desc: "לוח חשמל, חישוב עומסים, כבלים תקניים ותאורה - בטיחות חשמלית בסיסית של מחנה מתפקד" },
  { name: "גז", desc: "מערכת גז תקינה, מטפי כיבוי ובטיחות אש במטבח ובמחנה" },
];

const TEAM_CHECKLISTS = {
  "מים": [
    "מים לשתייה", "מים לבישול", "מים לשטיפת כלים", "מים למקלחות", "רזרבה",
    "מיכל מים מתאים", "משאבה", "צינורות וחיבורים", "ברזים חלופיים", "בדיקת נזילות",
    "סימון ברור בין מי שתייה למים אחרים", "מיכל מים אפורים", "ניקוז סגור",
    "מעקב אחר מפלס המיכל", "תוכנית לפינוי המים",
  ],
  "שירותים ומקלחות": [
    "משטח מקלחת יציב", "פרטיות", "משטח נגד החלקה", "תאורה במקלחות", "ניקוי יומי",
  ],
  "צוות המטבח": [
    "תפריט לכל יום", "כמויות לפי מספר החברים", "רשימת אלרגיות", "משמרות בישול", "משמרות ניקיון",
    "מקררים או צידניות", "משטחי עבודה", "אחסון מזון סגור", "ציוד בישול", "כלי אוכל רב פעמיים",
    "עמדת שטיפת ידיים", "עמדת שטיפת כלים", "סבון ונייר", "יריעה מתחת למטבח",
    "פחים נגישים ומסומנים", "פתרון לשאריות מזון", "פתיחה וסגירה יומית של המטבח",
  ],
  "חשמל": [
    "רשימת כל צרכני החשמל", "חישוב עומס", "לוח חשמל", "כבלים תקניים", "שקעים ומפצלים",
    "הגנה על חיבורים", "תאורה למרחב הציבורי", "תאורה לשבילים", "תאורת חירום",
    "מפסק ראשי מסומן", "אדם שיודע לנתק את המערכת", "בדיקה יומית של כבלים וחיבורים",
  ],
  "גז": [
    "מערכת גז תקינה", "בדיקה ואישור בהתאם לנהלי האירוע", "בלונים במקום מוגן ומסומן",
    "צנרת מוגנת", "אחראי גז", "מטפים בתוקף", "שמיכת כיבוי במטבח", "אין אש ללא השגחה",
    "כל חברי הקמפ יודעים איפה המטפים", "כל חברי הקמפ יודעים איך סוגרים את הגז",
  ],
  "צוות חשל\"ש": [
    "אחראי לנ\"ת", "תחנת פסולת מסודרת מהיום הראשון", "פחים מסומנים לפי סוג", "שקיות חזקות",
    "מקום סגור לאחסון פסולת", "מאפרות כיס", "דליים לאיסוף MOOP", "כפפות", "מטאטאים ויעה",
    "מגנט לאיסוף ברגים ומתכת", "יריעות מתחת למטבח ולאזורי עבודה", "סריקה קצרה בכל בוקר",
    "סריקה אחרי כל פעילות", "סריקה בסוף כל יום", "סריקה אחרי פירוק כל אזור",
  ],
  "הקמות": [
    "לו\"ז הקמות לפי ימים", "רשימת נוכחות לכל יום", "סדר כניסת רכבים", "רשימת משימות",
    "אחראי לכל משימה", "ארגז הקמות נגיש", "מים ואוכל לצוות", "אזור צל לצוות",
    "תדריך בטיחות בתחילת כל יום", "הקמת תשתיות לפני עיצוב", "בדיקת גז", "בדיקת חשמל",
    "בדיקת יציאות ומעברים", "סריקת MOOP בסוף כל יום", "צילום הקמפ לאחר סיום ההקמה",
  ],
  "תכנון המחנה": [
    "לוח משמרות ברור", "אחראי תורן", "פתיחה וסגירה יומית של אזור הפעילות",
    "בדיקת גז לפני שימוש", "בדיקת חשמל", "בדיקת מים ונזילות", "בדיקת צל ועיגונים",
    "פינוי פסולת", "ניקיון מקלחות", "סריקת MOOP", "בדיקת מלאי",
    "זמן מנוחה גם לאנשים שמובילים את הקמפ", "קשר טוב עם הקמפים השכנים", "תיעוד תקלות וציוד שנשבר",
  ],
  "פירוקים": [
    "צוות פירוק מחויב מראש", "לו\"ז פירוק", "חלוקת משימות", "ניתוק גז", "ניתוק חשמל",
    "ריקון ופינוי מים אפורים", "פינוי מזון", "פינוי כל הפסולת", "ניקוי ציוד לפני העמסה",
    "ספירת ציוד", "החזרת ציוד לבעלים", "הוצאת כל היתדות הברגים והעוגנים", "מעבר עם מגנט",
    "סריקת MOOP בקווים", "בדיקה נוספת באור יום", "צילום השטח הנקי", "אף אחד לא עוזב לפני שהשטח נקי",
  ],
};

function buildShifts() {
  const shifts = [];
  const setupDays = ["2026-10-30", "2026-10-31", "2026-11-01"];
  setupDays.forEach((d) =>
    shifts.push({ id: `setup-${d}`, phase: "הקמות", title: "הרשמה להקמות", team: "הקמות", date: d, start: "08:00", end: "18:00", spots: 8, noLimit: true, desc: "בנייה פיזית של תשתיות ומבני המחנה - ללא הגבלת מספר נרשמים" })
  );

  const eventDays = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"];
  const lastDay = "2026-11-07";
  const firstDay = eventDays[0];
  eventDays.forEach((d) => {
    // Morning and noon kitchen shifts were dropped - one evening shift per
    // day now covers all meal prep, with more people on it to compensate.
    if (d !== lastDay) {
      shifts.push({ id: `kitchen-eve-${d}`, phase: "ימי האירוע", title: "משמרת בישול - ערב", team: "צוות המטבח", date: d, start: "17:30", end: "20:00", spots: 5, desc: "הכנה והגשה של ארוחות היום" });
    }
    if (d === lastDay) return;
    // First ice run (arrival day) is later and needs one more person than
    // the rest of the week's runs.
    shifts.push(
      d === firstDay
        ? { id: `ice-${d}`, phase: "ימי האירוע", title: "הבאת קרח", team: "אחראי קרח", date: d, start: "13:00", end: "14:00", spots: 3, desc: "רכישת קרח יומי מנקודת המכירה הרשמית" }
        : { id: `ice-${d}`, phase: "ימי האירוע", title: "הבאת קרח", team: "אחראי קרח", date: d, start: "10:00", end: "11:00", spots: 2, desc: "רכישת קרח יומי מנקודת המכירה הרשמית" }
    );
    // Arrival day (first event day): people are still arriving through the
    // morning, so there's no one there yet for morning cleaning or LNT/trash duty.
    if (d !== firstDay) {
      shifts.push({ id: `clean-${d}`, phase: "ימי האירוע", title: "ניקיון שירותים ומקלחות", team: "שירותים ומקלחות", date: d, start: "14:00", end: "16:00", spots: 2, desc: "ניקיון ותחזוקה יומית" });
      shifts.push({ id: `moop-${d}`, phase: "ימי האירוע", title: "חשל\"ש ופינוי פסולת", team: "צוות חשל\"ש", date: d, start: "16:00", end: "17:00", spots: 2, desc: "מיחזור, פינוי פחים ובדיקת MOOP" });
      // No fixed clock time - can be done whenever during the day, so it
      // doesn't block/get blocked by other shifts that day.
      // start/end are nominal (just placing it mid-list among that day's
      // shifts) - noTime means no clock time is ever shown or enforced.
      shifts.push({ id: `salon-${d}`, phase: "ימי האירוע", title: "סידור סלון הקמפ וסלון הגיפט", team: "עיצוב המחנה ותפאורה", date: d, start: "12:00", end: "12:00", spots: 2, noTime: true, desc: "סידור והצגה של סלון הקמפ וסלון הגיפט" });
    }
  });

  shifts.push({ id: "teardown-2026-11-07", phase: "פירוקים", title: "יום פירוק", team: "פירוקים", date: "2026-11-07", start: "08:00", end: "22:00", spots: MEMBERS.length, desc: "פירוק תשתיות, בדיקת MOOP סופית וניקיון השטח - כולם משתתפים" });

  // One-time exception: a lunch shift on the arrival day only (Monday,
  // 11-02) - people are already arriving through the day and need to eat,
  // even though noon kitchen shifts were dropped everywhere else.
  shifts.push({ id: "kitchen-noon-2026-11-02", phase: "ימי האירוע", title: "ארוחת סיום הקמות", team: "צוות המטבח", date: "2026-11-02", start: "11:30", end: "14:00", spots: 4, desc: "הכנה והגשה של ארוחת צהריים ליום ההגעה" });

  return shifts;
}
const TEARDOWN_TASKS = [
  "פירוק מטבח", "פירוק מקלחות", "פירוק הצללה", "פירוק תפאורה", "פירוק וקיפול PVC",
  "ריקון מים אפורים", "פינוי פסולת", "החזרת ציוד לספקים", "החזרה וסידור ציוד במכולה",
  "סריקת חשל\"ש", "אישור מחלקת חשל\"ש מידברן שהשטח נקי",
];
const TEARDOWN_ID = "teardown-2026-11-07";
const SHIFTS = buildShifts();
const BUDGET_CATEGORIES = [
  "מטבח ומזון", "מים", "שירותים ומקלחות", "הובלות", "ציוד", "בנייה והקמות",
  "עיצוב ותפאורה", "תוכן וגיפט", "חשמל", "דלק", "קרח", "חשל\"ש", "ביטוח", "שונות",
];

const EQUIPMENT_CATEGORIES = TEAMS.map((t) => t.name);
const EQUIPMENT_CONDITIONS = ["תקין", "דורש תיקון", "חסר / אבד"];

// Quick-pick suggestions for the kitchen shopping list - common camp
// staples the kitchen team can tap to add instead of typing from scratch.
// Tapping one only adds the name; quantity/price still need to be filled
// in before the item counts as part of the real shopping list.
const BASIC_SHOPPING_ITEMS = [
  "שמן בישול", "מלח", "סוכר", "קפה נמס", "תה", "אורז", "פסטה", "קטשופ", "חרדל", "מיונז",
  "ביצים", "שימורי טונה", "שימורי תירס", "רסק עגבניות", "קמח", "חומוס וטחינה",
  "נייר אלומיניום", "ניילון נצמד", "שקיות זבל גדולות", "צלחות חד פעמיות", "כוסות חד פעמיות",
  "סכו\"ם חד פעמי", "מגבות נייר", "סבון כלים", "ספוגי ניקוי", "כפפות ניקוי חד פעמיות",
  "שום קלוף", "בצל", "לימונים", "תבלינים בסיסיים",
];

const TEAM_FILTERS = [...new Set(SHIFTS.map((s) => s.team))];
const TRAVEL_DAYS = ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"];

const WEEKDAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `יום ${WEEKDAYS_HE[dt.getDay()]}, ${d}.${m}`;
}
function formatDateShort(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}.${m}`;
}

const EVENT_START = new Date(2026, 10, 2);
function daysUntil() {
  return Math.ceil((EVENT_START - new Date()) / (1000 * 60 * 60 * 24));
}

// "committed" = the full cost regardless of payment status, "paid" = what's
// actually been paid so far (the full amount unless marked partial).
// Refunds count negative in both. Used to fold budgetExpenses entries into
// the same category totals that used to come only from the older, simpler
// budgetItems form.
function expenseAmounts(e) {
  const amount = Number(e.amount) || 0;
  const paidAmount = e.paymentStatus === "partial" ? (Number(e.paidAmount) || 0) : amount;
  const sign = e.isRefund ? -1 : 1;
  return { committed: sign * amount, paid: sign * paidAmount };
}

// ---------------------------------------------------------------------------
// Budget expenses <-> CSV (Excel opens CSV natively, so this avoids pulling
// in a whole spreadsheet-parsing library just for import/export).
// ---------------------------------------------------------------------------
const EXPENSE_CSV_HEADERS = ["allocation", "vendor", "description", "amount", "purchaseDate", "paymentStatus", "paidAmount", "dueDate", "paymentMethod", "vatIncluded", "isRefund", "refundToMember", "refundMemberName", "refundPaid", "enteredBy"];

const PAYMENT_METHODS = [
  { value: "cash", label: "מזומן" },
  { value: "credit_card", label: "כרטיס אשראי" },
  { value: "bank_transfer", label: "העברה בנקאית" },
  { value: "bit", label: "ביט" },
  { value: "other", label: "אחר" },
];
function paymentMethodLabel(value) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label || value || "";
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function expensesToCsv(list) {
  const rows = [EXPENSE_CSV_HEADERS.join(",")];
  list.forEach((e) => rows.push(EXPENSE_CSV_HEADERS.map((h) => csvEscape(e[h])).join(",")));
  return "\uFEFF" + rows.join("\r\n"); // BOM so Excel renders Hebrew correctly
}

// Minimal CSV parser - handles quoted fields with embedded commas/newlines,
// which a naive text.split(",") would break on.
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ---------------------------------------------------------------------------
// "היומן שלי" phone-calendar sync - exports shifts + calendar events as a
// standard .ics file. No server involved: every phone/desktop calendar app
// (Google Calendar, Apple Calendar, Outlook) can import this directly.
// ---------------------------------------------------------------------------
function icsEscape(text) {
  return String(text || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Escapes text dropped into a raw HTML string built for a print/PDF window
// (document.write, not JSX - React's normal auto-escaping doesn't apply
// there, so this is the only thing standing between free-text fields like
// emergency notes and injected markup).
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function icsDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-");
  const [hh, mm] = (timeStr || "00:00").split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}
function buildMyCalendarIcs(shifts, events) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Afterglow Camp//he", "CALSCALE:GREGORIAN"];
  shifts.forEach((s) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:shift-${s.id}@afterglow-camp`,
      `DTSTART:${icsDateTime(s.date, s.start)}`,
      `DTEND:${icsDateTime(s.date, s.end)}`,
      `SUMMARY:${icsEscape(s.title)}`,
      `DESCRIPTION:${icsEscape(s.desc || "")}`,
      "END:VEVENT"
    );
  });
  events.forEach((a) => {
    lines.push("BEGIN:VEVENT", `UID:event-${a.id}@afterglow-camp`);
    if (a.eventTime) {
      const [hh, mm] = a.eventTime.split(":").map(Number);
      const endTime = `${String((hh + 1) % 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      lines.push(`DTSTART:${icsDateTime(a.eventDate, a.eventTime)}`, `DTEND:${icsDateTime(a.eventDate, endTime)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${a.eventDate.replace(/-/g, "")}`);
    }
    lines.push(`SUMMARY:${icsEscape(a.text.slice(0, 80))}`, "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadMyCalendarIcs(shifts, events) {
  const blob = new Blob([buildMyCalendarIcs(shifts, events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "afterglow-camp-calendar.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// iOS only supports Web Push once the site is installed to the home screen
// (Add to Home Screen) - a plain Safari tab can never receive them, no
// matter what permission is granted, so this needs its own instructions.
function isIOSDevice() {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isStandaloneDisplay() {
  return typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator?.standalone === true);
}

function buildWhatsAppLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const intl = digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

function duesReminderMessage(name, remaining) {
  return `היי ${name} 🌅\nמה שלומך?\nרק תזכורת קטנה - נשארו לך ₪${remaining.toLocaleString()} לתשלום עבור דמי הקמפ ל-Sunset Afterglow.\nאפשר להסדיר מתי שנוח לך 🙏\nתודה!`;
}

function eventReminderMessage(name) {
  const days = daysUntil();
  return `היי ${name} 🌅\nתזכורת ידידותית - נשארו ${days} ימים עד לפתיחת השערים של Sunset Afterglow!\nמוזמן/ת להיכנס לאפליקציה ולוודא שהפרטים שלך מעודכנים (משמרת, הגעה, תשלום).\nמתרגשים לראות אותך שם 🌇`;
}

// ---------------------------------------------------------------------------
// Signature visual - echoes the camp logo, retuned to the Organic palette
// ---------------------------------------------------------------------------
function SunsetMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <clipPath id="sm-clip"><circle cx="50" cy="50" r="46" /></clipPath>
        <linearGradient id="sm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent2Dark} />
          <stop offset="50%" stopColor={COLORS.accent} />
          <stop offset="100%" stopColor={COLORS.accentLight} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={COLORS.accent} />
      <g clipPath="url(#sm-clip)">
        <rect x="0" y="0" width="100" height="100" fill="url(#sm-sky)" />
        {[36, 27, 18].map((r, i) => (
          <circle key={i} cx="50" cy="62" r={r} fill="none" stroke={COLORS.text} strokeOpacity="0.25" strokeWidth="2" />
        ))}
        <circle cx="50" cy="62" r="16" fill={COLORS.accentLight} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="4" y={65 + i * 6.5} width="92" height="2" fill={COLORS.text} opacity="0.35" />
        ))}
      </g>
    </svg>
  );
}

function FillRing({ filled, total, size = 34 }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(filled / total, 1) : 0;
  const full = filled >= total;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke={COLORS.divider} strokeWidth="4" />
      <circle
        cx="18" cy="18" r={r} fill="none"
        stroke={full ? COLORS.accent2 : COLORS.accent}
        strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="21" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily={FONT_NUM} fill={COLORS.text}>
        {filled}/{total}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Login gate - verifies name + ID against the roster
// ---------------------------------------------------------------------------
function LoginScreen({ members, onLogin, onSetup }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "setup"
  const [idVal, setIdVal] = useState("");
  const [password, setPasswordVal] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = members.find((m) => m.name === name);
  const needsId = selected && selected.idOnFile;

  const filtered = query.trim()
    ? members.filter((m) => m.name.includes(query.trim()))
    : members;

  function pickName(n) {
    setName(n);
    setQuery(n);
    setShowSuggestions(false);
    setError("");
    setPasswordVal("");
    setNewPassword("");
    setConfirmPassword("");
    setIdVal("");
    setMode("login");
  }

  async function submitLogin() {
    if (!selected) return setError("בחר/י שם מהרשימה");
    if (!password) return setError("הזן/י סיסמה");
    setLoading(true);
    setError("");
    try {
      await onLogin(selected.name, password);
    } catch {
      setError('סיסמה שגויה - או שזו הכניסה הראשונה שלך. לחץ/י על "כניסה ראשונה / שכחת סיסמה" למטה');
    } finally {
      setLoading(false);
    }
  }

  async function submitSetup() {
    if (!selected) return setError("בחר/י שם מהרשימה");
    if (needsId && !idVal.trim()) return setError("הזן/י ת.ז");
    if (!newPassword || newPassword.length < 6) return setError("בחר/י סיסמה של לפחות 6 תווים");
    if (newPassword !== confirmPassword) return setError("הסיסמאות לא תואמות");
    setLoading(true);
    setError("");
    try {
      await onSetup(selected.name, idVal, newPassword);
    } catch (err) {
      if (err.message === "id_mismatch") setError("תעודת הזהות לא תואמת לשם שנבחר");
      else if (err.message === "id_required") setError('אין תעודת זהות מאומתת רשומה עבורך במערכת - יש לפנות למנהל/ת הקמפ כדי שיוסיפו אותה לפני הכניסה הראשונה');
      else if (err.message.startsWith("too_many_attempts")) setError("יותר מדי ניסיונות שגויים - נחסם זמנית. נסה/י שוב בעוד כרבע שעה, או פנה/י למנהל/ת הקמפ");
      else setError(`משהו השתבש: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[500px] px-6">
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
        <SunsetMark size={48} />
        <h2 style={{ fontFamily: FONT_HEADING }} className="text-xl mt-4 mb-1">כניסה למחנה</h2>
        <p className="text-xs mb-5" style={{ color: COLORS.textMuted }}>
          {mode === "setup" ? "כניסה ראשונה או איפוס סיסמה - נזהה אותך ותבחר/י סיסמה" : "מזהים אותך לפי שם וסיסמה"}
        </p>

        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>שם</label>
        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              if (name) { setName(""); setError(""); setPasswordVal(""); setNewPassword(""); setConfirmPassword(""); setIdVal(""); setMode("login"); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="הקלד/י או בחר/י שם..."
            autoComplete="off"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          {showSuggestions && filtered.length > 0 && (
            <div
              className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden max-h-48 overflow-y-auto"
              style={{ background: COLORS.input, border: `1px solid ${COLORS.divider}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            >
              {filtered.map((m) => (
                <button
                  key={m.name}
                  onMouseDown={() => pickName(m.name)}
                  className="w-full text-right px-3 py-2 text-sm"
                  style={{ color: COLORS.text, background: name === m.name ? COLORS.accentLight : "transparent" }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && mode === "login" && (
          <>
            <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPasswordVal(e.target.value); setError(""); }}
              placeholder="הזן/י סיסמה"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-1.5"
              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
            />
            <button onClick={() => { setMode("setup"); setError(""); }} className="text-xs mb-3" style={{ color: COLORS.accentDark }}>
              כניסה ראשונה / שכחת סיסמה?
            </button>
          </>
        )}

        {selected && mode === "setup" && (
          <>
            {needsId ? (
              <>
                <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>תעודת זהות (לאימות זהות)</label>
                <input
                  value={idVal}
                  onChange={(e) => { setIdVal(e.target.value); setError(""); }}
                  placeholder="הזן/י ת.ז"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                />
              </>
            ) : (
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                אין ת.ז מאומתת רשומה עבורך במערכת. אם זו הכניסה הראשונה שלך, יש לפנות למנהל/ת הקמפ כדי שיוסיפו תעודת זהות מאומתת - זה נדרש לפני שאפשר לבחור סיסמה. אם כבר יש לך חשבון ואת/ה רק מאפס/ת סיסמה, אפשר להמשיך.
              </p>
            )}
            <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="לפחות 6 תווים"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
            />
            <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>אימות סיסמה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="הקלד/י שוב"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
            />
            <button onClick={() => { setMode("login"); setError(""); }} className="text-xs mb-3" style={{ color: COLORS.accentDark }}>
              יש לי כבר סיסמה - חזרה לכניסה רגילה
            </button>
          </>
        )}

        {error && <p className="text-xs mb-3" style={{ color: COLORS.danger }}>{error}</p>}

        <button
          onClick={mode === "setup" ? submitSetup : submitLogin}
          disabled={!selected || loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold"
          style={{ background: COLORS.accent, color: COLORS.bg, fontFamily: FONT_HEADING, opacity: (!selected || loading) ? 0.5 : 1 }}
        >
          {loading ? "רגע..." : "כניסה"}
        </button>
      </div>
    </div>
  );
}

function NewCategoryForm({ onAdd }) {
  const [name, setName] = useState("");
  return (
    <div className="flex items-center gap-2 mb-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='קטגוריית הוצאה חדשה (למשל: "אבטחה")'
        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={() => { onAdd(name); setName(""); }}
        className="px-4 py-2 rounded-full text-sm font-semibold shrink-0"
        style={{ background: COLORS.accent2, color: COLORS.bg }}
      >
        פתיחת קטגוריה
      </button>
    </div>
  );
}

function EditableCategoryList({ categories, onRename, onRemove }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  if (categories.length === 0) return null;
  return (
    <div className="space-y-1.5 mb-4">
      {categories.map((cat) => (
        <div key={cat} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
          {editing === cat ? (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                className="flex-1 px-2 py-1 rounded-lg text-sm outline-none"
                style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
              />
              <button
                onClick={() => { onRename(cat, draft); setEditing(null); }}
                className="text-xs px-3 py-1 rounded-full font-semibold shrink-0"
                style={{ background: COLORS.accent2, color: COLORS.bg }}
              >
                שמירה
              </button>
              <button onClick={() => setEditing(null)} className="text-xs px-2 py-1 shrink-0" style={{ color: COLORS.textMuted }}>
                ביטול
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm">{cat}</span>
              <button
                onClick={() => { setEditing(cat); setDraft(cat); }}
                className="shrink-0"
                style={{ color: COLORS.textMuted }}
              >
                <Pencil size={14} />
              </button>
              <button onClick={() => onRemove(cat)} className="shrink-0" style={{ color: COLORS.textMuted }}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function CategoryBudgetForm({ onSet, categories }) {
  const [cat, setCat] = useState(categories[0]);
  const [amount, setAmount] = useState("");

  return (
    <div className="rounded-2xl p-4 mb-4 flex items-end gap-2 flex-wrap" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>מחלקה</label>
        <div className="relative">
          <select
            value={cat} onChange={(e) => setCat(e.target.value)}
            className="w-full appearance-none pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.text }} />
        </div>
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>תקציב מתוכנן (₪)</label>
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <button
        onClick={() => { onSet(cat, amount); setAmount(""); }}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        עדכון תקציב
      </button>
    </div>
  );
}

function EquipmentForm({ onAdd, lockedCategory, initial, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || lockedCategory || EQUIPMENT_CATEGORIES[0]);
  const [qty, setQty] = useState(initial?.qty ?? "");
  const [condition, setCondition] = useState(initial?.condition || EQUIPMENT_CONDITIONS[0]);
  const [location, setLocation] = useState(initial?.location || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  function submit() {
    if (!name.trim() || !qty) return;
    onAdd({ name: name.trim(), category, qty, condition, location, notes });
    if (!initial) {
      setName(""); setQty(""); setLocation(""); setNotes(""); setCondition(EQUIPMENT_CONDITIONS[0]);
    }
  }

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="שם הציוד"
          className="px-3 py-2 rounded-xl text-sm outline-none sm:col-span-2"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          disabled={!!lockedCategory}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: lockedCategory ? 0.7 : 1 }}
        >
          {(lockedCategory ? [lockedCategory] : EQUIPMENT_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number" value={qty} onChange={(e) => setQty(e.target.value)}
          placeholder="כמות"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <select
          value={condition} onChange={(e) => setCondition(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        >
          {EQUIPMENT_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="מיקום אחסון (אופציונלי)"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות (אופציונלי)"
          className="px-3 py-2 rounded-xl text-sm outline-none sm:col-span-2"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          {initial ? "שמירת שינויים" : "הוספת ציוד"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: COLORS.surface2, color: COLORS.textMuted }}
          >
            ביטול
          </button>
        )}
      </div>
    </div>
  );
}

function ShoppingItemForm({ onAdd, initial, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [qty, setQty] = useState(initial?.qty ?? "");
  const [unit, setUnit] = useState(initial?.unit || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [notes, setNotes] = useState(initial?.notes || "");

  function submit() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), qty, unit: unit.trim(), price, notes: notes.trim() });
    if (!initial) {
      setName(""); setQty(""); setUnit(""); setPrice(""); setNotes("");
    }
  }

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      {initial && !(Number(qty) > 0 && Number(price) > 0) && (
        <p className="text-xs" style={{ color: COLORS.accentDark }}>יש להשלים כמות ומחיר משוער כדי שהפריט יעבור לרשימת הקניות המאושרת</p>
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="שם המוצר"
          className="px-3 py-2 rounded-xl text-sm outline-none sm:col-span-2"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          type="number" value={qty} onChange={(e) => setQty(e.target.value)}
          placeholder="כמות משוערת"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={unit} onChange={(e) => setUnit(e.target.value)}
          placeholder='יחידה (אופציונלי, למשל "ק"ג")'
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          placeholder="מחיר משוער (₪)"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות (אופציונלי)"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          {initial ? "שמירת שינויים" : "הוספת מוצר"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: COLORS.surface2, color: COLORS.textMuted }}
          >
            ביטול
          </button>
        )}
      </div>
    </div>
  );
}

function ShoppingRequestForm({ onAdd }) {
  const [text, setText] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='למשל: "אני צמחוני/ת, אפשר טופו?"'
        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={() => { onAdd(text); setText(""); }}
        className="px-4 py-2 rounded-full text-sm font-semibold shrink-0"
        style={{ background: COLORS.accent2, color: COLORS.bg }}
      >
        שליחת בקשה
      </button>
    </div>
  );
}

function BudgetExpenseForm({ onAdd, lockedAllocation, categories, initial, onCancel, onError, allMembers }) {
  const [allocation, setAllocation] = useState(initial?.allocation || lockedAllocation || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [vendor, setVendor] = useState(initial?.vendor || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate || "");
  const [paymentStatus, setPaymentStatus] = useState(initial?.paymentStatus || "paid"); // "paid" | "partial"
  const [paidAmount, setPaidAmount] = useState(initial?.paidAmount ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || "");
  const [vatIncluded, setVatIncluded] = useState(initial ? !!initial.vatIncluded : true);
  const [isRefund, setIsRefund] = useState(initial?.isRefund || false);
  const [refundToMember, setRefundToMember] = useState(initial?.refundToMember || false);
  const [refundMemberName, setRefundMemberName] = useState(initial?.refundMemberName || "");
  const [refundPaid, setRefundPaid] = useState(initial?.refundPaid || false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const remaining = Math.max((Number(amount) || 0) - (Number(paidAmount) || 0), 0);

  function pickReceipt(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  async function submit() {
    let receiptUrl = initial?.receiptUrl || "";
    if (receiptFile) {
      setUploading(true);
      try {
        receiptUrl = await uploadFile(receiptFile, allocation || "כללי");
      } catch (err) {
        setUploading(false);
        onError?.(
          err?.message === "upload_timeout"
            ? "העלאת הקבלה נתקעה - אפשר לנסות שוב, או לשמור בלי קבלה ולהוסיף אותה אחר כך"
            : "העלאת הקבלה נכשלה - אפשר לנסות שוב, או לשמור בלי קבלה"
        );
        return;
      }
      setUploading(false);
    }
    onAdd({
      allocation, description, vendor, amount, purchaseDate,
      paymentStatus,
      paidAmount: paymentStatus === "partial" ? paidAmount : amount,
      remainingAmount: paymentStatus === "partial" ? remaining : 0,
      dueDate: paymentStatus === "partial" ? dueDate : "",
      paymentMethod,
      vatIncluded, isRefund, receiptUrl,
      refundToMember,
      refundMemberName: refundToMember ? refundMemberName : "",
      refundPaid: refundToMember ? refundPaid : false,
    });
    if (!initial) {
      setDescription(""); setVendor(""); setAmount(""); setPurchaseDate("");
      setPaymentStatus("paid"); setPaidAmount(""); setDueDate(""); setIsRefund(false);
      setPaymentMethod(""); setReceiptFile(null); setReceiptPreview("");
      setRefundToMember(false); setRefundMemberName(""); setRefundPaid(false);
    }
  }

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-2 gap-2">
        <select
          value={allocation} onChange={(e) => setAllocation(e.target.value)}
          disabled={!!lockedAllocation}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: lockedAllocation ? 0.7 : 1 }}
        >
          {!lockedAllocation && <option value="">שיוך תקציבי - בחר/י</option>}
          {(lockedAllocation ? [lockedAllocation] : categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="מהות ההוצאה"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={vendor} onChange={(e) => setVendor(e.target.value)}
          placeholder="שם העסק"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="סכום"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <div>
          <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>תאריך קניה</label>
          <input
            type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>סטטוס תשלום</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentStatus("paid")}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: paymentStatus === "paid" ? COLORS.accent : COLORS.input, color: paymentStatus === "paid" ? COLORS.bg : COLORS.textMuted }}
          >
            שולם במלואו
          </button>
          <button
            type="button"
            onClick={() => setPaymentStatus("partial")}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: paymentStatus === "partial" ? COLORS.accent : COLORS.input, color: paymentStatus === "partial" ? COLORS.bg : COLORS.textMuted }}
          >
            שולם חלק
          </button>
        </div>
        {paymentStatus === "partial" && (
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            <input
              type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="כמה שולם עד כה"
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
            />
            <div className="px-3 py-2 rounded-xl text-sm flex items-center" style={{ background: COLORS.input, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}>
              נשאר לשלם: ₪{remaining.toLocaleString()}
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>תאריך תשלום (ליתרה)</label>
              <input
                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>איך שולם</label>
        <select
          value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        >
          <option value="">אמצעי תשלום - בחר/י</option>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.textMuted }}>
          <input type="checkbox" checked={vatIncluded} onChange={(e) => setVatIncluded(e.target.checked)} />
          כולל מע"מ
        </label>
        <label className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.textMuted }}>
          <input type="checkbox" checked={isRefund} onChange={(e) => setIsRefund(e.target.checked)} />
          זו תנועת זיכוי/החזר
        </label>
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>האם מגיע החזר לחבר קמפ</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setRefundToMember(false); setRefundMemberName(""); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: !refundToMember ? COLORS.accent : COLORS.input, color: !refundToMember ? COLORS.bg : COLORS.textMuted }}
          >
            לא
          </button>
          <button
            type="button"
            onClick={() => setRefundToMember(true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: refundToMember ? COLORS.accent : COLORS.input, color: refundToMember ? COLORS.bg : COLORS.textMuted }}
          >
            כן
          </button>
        </div>
        {refundToMember && (
          <div className="mt-2 space-y-2">
            <MemberSearchPicker
              members={allMembers || []}
              value={refundMemberName}
              onSelect={setRefundMemberName}
              placeholder="הקלד/י או בחר/י חבר/ת קמפ..."
            />
            <div>
              <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>האם הוחזר הכסף לחבר הקמפ</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRefundPaid(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: !refundPaid ? COLORS.accent : COLORS.input, color: !refundPaid ? COLORS.bg : COLORS.textMuted }}
                >
                  לא
                </button>
                <button
                  type="button"
                  onClick={() => setRefundPaid(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: refundPaid ? COLORS.accent : COLORS.input, color: refundPaid ? COLORS.bg : COLORS.textMuted }}
                >
                  כן
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>צילום קבלה (אופציונלי)</label>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" onChange={pickReceipt} className="text-xs" style={{ color: COLORS.textMuted }} />
          {(receiptPreview || initial?.receiptUrl) && (
            <img src={receiptPreview || initial.receiptUrl} alt="" className="h-12 w-12 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.divider}` }} />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={uploading}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg, opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? "מעלה קבלה..." : initial ? "שמירת שינויים" : "רישום הוצאה"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: COLORS.surface2, color: COLORS.textMuted }}
          >
            ביטול
          </button>
        )}
      </div>
    </div>
  );
}

function TeardownTaskPicker({ selected, onToggle, compact }) {
  const enough = selected.length >= 2;
  return (
    <div>
      <div className={compact ? "flex flex-wrap gap-1 mt-1" : "flex flex-wrap gap-1.5 mt-2"}>
        {TEARDOWN_TASKS.map((task) => {
          const active = selected.includes(task);
          return (
            <button
              key={task}
              onClick={() => onToggle(task)}
              className={compact ? "px-1.5 py-0.5 rounded-md text-[10px] font-medium" : "px-2.5 py-1 rounded-full text-xs font-medium"}
              style={{
                background: active ? COLORS.accent2 : COLORS.surface2,
                color: active ? COLORS.bg : COLORS.text,
              }}
            >
              {task}
            </button>
          );
        })}
      </div>
      <div className={compact ? "text-[10px] mt-1" : "text-xs mt-1.5"} style={{ color: enough ? COLORS.accent2Dark : COLORS.danger }}>
        {enough ? `✓ ${selected.length} משימות נבחרו` : `נבחרו ${selected.length}/2 - צריך לבחור לפחות 2 משימות`}
      </div>
    </div>
  );
}

function AddPaymentForm({ onAdd }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  return (
    <div className="flex gap-2 items-center flex-wrap">
      <input
        type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
        placeholder="סכום (₪)"
        className="w-28 px-2 py-1.5 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <input
        type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="px-2 py-1.5 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={() => { onAdd(amount, date); setAmount(""); setDate(""); }}
        className="px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        <Plus size={13} className="inline -mt-0.5" /> הוספת תשלום
      </button>
    </div>
  );
}

// Primary lead (slot 0) can only be set/changed by an admin - the second
// slot can also be managed by whoever is already leading this team, so a
// lead can bring on a co-lead without needing an admin every time.
function TeamChecklist({ items, state, canCheck, canManage, onToggle, onAdd, onEdit, onRemove }) {
  const [newText, setNewText] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const doneCount = items.filter((_, i) => state[i]).length;
  return (
    <div>
      <div className="text-xs font-bold mb-1.5 flex items-center justify-between" style={{ color: COLORS.textMuted }}>
        <span>צ'קליסט בטיחות ותפעול{!canCheck && " (רק מוביל/ת הצוות או מנהל יכולים לסמן)"}</span>
        <span>{doneCount}/{items.length}</span>
      </div>
      {items.length === 0 && <p className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>אין עדיין פריטים בצ'קליסט.</p>}
      <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
        {items.map((item, i) =>
          editingIndex === i ? (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                className="flex-1 px-2 py-1 rounded-lg text-xs outline-none"
                style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
              />
              <button
                onClick={() => { onEdit(i, editText); setEditingIndex(null); }}
                className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0"
                style={{ background: COLORS.accent2, color: COLORS.bg }}
              >
                שמירה
              </button>
              <button onClick={() => setEditingIndex(null)} className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>ביטול</button>
            </div>
          ) : (
            <div key={i} className="flex items-center gap-2 text-xs">
              <label className={`flex items-center gap-2 flex-1 ${canCheck ? "cursor-pointer" : "cursor-not-allowed"}`}>
                <input type="checkbox" checked={!!state[i]} disabled={!canCheck} onChange={() => canCheck && onToggle(i)} />
                <span style={{ textDecoration: state[i] ? "line-through" : "none", opacity: state[i] ? 0.6 : 1 }}>{item}</span>
              </label>
              {canManage && (
                <>
                  <button onClick={() => { setEditingIndex(i); setEditText(item); }} className="shrink-0" style={{ color: COLORS.textMuted }}><Pencil size={12} /></button>
                  <button onClick={() => onRemove(i)} className="shrink-0" style={{ color: COLORS.textMuted }}><Trash2 size={12} /></button>
                </>
              )}
            </div>
          )
        )}
      </div>
      {canManage && (
        <div className="flex items-center gap-1.5 mt-2">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="הוספת משימה לצ'קליסט"
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <button
            onClick={() => { onAdd(newText); setNewText(""); }}
            className="text-xs px-3 py-1.5 rounded-full font-semibold shrink-0"
            style={{ background: COLORS.accent2, color: COLORS.bg }}
          >
            הוספה
          </button>
        </div>
      )}
    </div>
  );
}

function NewTeamForm({ onAdd }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>הוספת צוות חדש</div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם הצוות"
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="תיאור קצר (אופציונלי)"
          className="flex-[2] min-w-[180px] px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <button
          onClick={() => { onAdd(name, desc); setName(""); setDesc(""); }}
          className="px-4 py-2 rounded-full text-sm font-semibold shrink-0"
          style={{ background: COLORS.accent2, color: COLORS.bg }}
        >
          הוספת צוות
        </button>
      </div>
    </div>
  );
}

function TeamLeadPicker({ team, current, members, onSet, canEditPrimary }) {
  const leads = current || [];
  const slot0 = leads[0] || "";
  const slot1 = leads[1] || "";
  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {canEditPrimary ? (
        <select
          value={slot0}
          onChange={(e) => onSet(team, e.target.value, 0)}
          className="text-xs px-2 py-1 rounded-lg outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        >
          <option value="">ללא מוביל/ה</option>
          {members.filter((m) => m.name === slot0 || m.name !== slot1).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      ) : (
        slot0 && (
          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: COLORS.input, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}>
            מוביל/ה ראשי/ת: {slot0}
          </span>
        )
      )}
      <select
        value={slot1}
        onChange={(e) => onSet(team, e.target.value, 1)}
        className="text-xs px-2 py-1 rounded-lg outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      >
        <option value="">מוביל/ה נוסף/ת (אופציונלי)</option>
        {members.filter((m) => m.name === slot1 || m.name !== slot0).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
      </select>
    </div>
  );
}

function AddMemberForm({ onAdd }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  return (
    <div className="rounded-2xl p-4 flex items-end gap-2 flex-wrap" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="flex-1 min-w-[140px]">
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>שם מלא</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="שם החבר החדש"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>ת.ז (חובה, לאימות זהות בכניסה ראשונה)</label>
        <input
          value={id} onChange={(e) => setId(e.target.value)}
          placeholder="תעודת זהות"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <button
        onClick={() => { if (name.trim() && id.trim()) { onAdd(name.trim(), id.trim()); setName(""); setId(""); } }}
        disabled={!name.trim() || !id.trim()}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg, opacity: (!name.trim() || !id.trim()) ? 0.5 : 1 }}
      >
        <UserPlus size={15} /> הוספת חבר
      </button>
    </div>
  );
}

function YesNoButtons({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[{ v: "yes", label: "כן" }, { v: "no", label: "לא" }].map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className="px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: value === o.v ? COLORS.accent : COLORS.input,
            color: value === o.v ? COLORS.bg : COLORS.text,
            border: `1px solid ${COLORS.divider}`,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MemberSearchPicker({ members, value, onSelect, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = query.trim()
    ? members.filter((m) => m.name.includes(query.trim()))
    : members;

  function pick(name) {
    setQuery(name);
    setShowSuggestions(false);
    onSelect(name);
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
          onSelect("");
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder || "הקלד/י או בחר/י שם..."}
        autoComplete="off"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      {showSuggestions && filtered.length > 0 && (
        <div
          className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden max-h-48 overflow-y-auto"
          style={{ background: COLORS.input, border: `1px solid ${COLORS.divider}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {filtered.map((m) => (
            <button
              key={m.name}
              onMouseDown={() => pick(m.name)}
              className="w-full text-right px-3 py-2 text-sm"
              style={{ color: COLORS.text, background: value === m.name ? COLORS.accentLight : "transparent" }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PrivateMessageForm({ members, onSend }) {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");

  function submit() {
    if (!to || !text.trim()) return;
    onSend(to, text);
    setTo("");
    setText("");
  }

  return (
    <div className="rounded-2xl p-4 mb-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>אל</label>
      <MemberSearchPicker members={members} value={to} onSelect={setTo} placeholder="הקלד/י או בחר/י שם..." />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ההודעה שלך..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={submit}
        disabled={!to || !text.trim()}
        className="px-4 py-2 rounded-full text-sm font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg, opacity: (!to || !text.trim()) ? 0.5 : 1 }}
      >
        שליחה
      </button>
    </div>
  );
}

function AllocationWizard({ data, onChange }) {
  const d = data || {};
  const [local, setLocal] = useState({
    hasAllocation: d.hasAllocation,
    used: d.used,
    hasExtra: d.hasExtra,
  });
  const [saved, setSaved] = useState(false);
  const set = (patch) => { setLocal({ ...local, ...patch }); setSaved(false); };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div>
        <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>יש לך הקצאה למידברן?</label>
        <YesNoButtons value={local.hasAllocation} onChange={(v) => set({ hasAllocation: v })} />
      </div>

      {local.hasAllocation === "yes" && (
        <div>
          <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>נוצלה ההקצאה (לאחר שעברה המכירה)?</label>
          <YesNoButtons value={local.used} onChange={(v) => set({ used: v })} />
        </div>
      )}

      <div>
        <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>יש לך הקצאה נוספת?</label>
        <YesNoButtons value={local.hasExtra} onChange={(v) => set({ hasExtra: v })} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => { onChange(local); setSaved(true); }}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          שמירה
        </button>
        {saved && <span className="text-xs" style={{ color: COLORS.accent2Dark }}>✓ נשמר</span>}
      </div>
    </div>
  );
}

function RideWizard({ data, onChange }) {
  const d = data || {};
  const [local, setLocal] = useState({
    city: d.city || "",
    arrivalDay: d.arrivalDay || "",
    hasCar: d.hasCar,
    vehicleType: d.vehicleType || "",
    hasTowHitch: d.hasTowHitch,
    hasTrailer: d.hasTrailer,
    offerRide: d.offerRide,
    seats: d.seats || "",
    hasCargoSpace: d.hasCargoSpace,
    cargoNote: d.cargoNote || "",
    hasWay: d.hasWay,
  });
  const [saved, setSaved] = useState(false);
  const set = (patch) => { setLocal({ ...local, ...patch }); setSaved(false); };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>עיר</label>
        <input
          value={local.city}
          onChange={(e) => set({ city: e.target.value })}
          placeholder="עיר מגורים"
          autoComplete="off"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>

      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>באיזה יום את/ה מגיע/ה לפלאיה?</label>
        <select
          value={local.arrivalDay}
          onChange={(e) => set({ arrivalDay: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        >
          <option value="">בחר/י יום</option>
          {TRAVEL_DAYS.map((day) => <option key={day} value={day}>{formatDate(day)}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>מגיע/ה עם רכב?</label>
        <YesNoButtons value={local.hasCar} onChange={(v) => set({ hasCar: v, offerRide: undefined, hasWay: undefined, hasCargoSpace: undefined })} />
      </div>

      {local.hasCar === "yes" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>סוג רכב</label>
              <select
                value={local.vehicleType}
                onChange={(e) => set({ vehicleType: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
              >
                <option value="">בחר/י סוג</option>
                <option value="רכב פרטי">רכב פרטי</option>
                <option value="ג'יפ / רכב שטח">ג'יפ / רכב שטח</option>
                <option value="טנדר">טנדר</option>
                <option value="ואן / מסחרי">ואן / מסחרי</option>
                <option value="אחר">אחר</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>יש וו גרירה?</label>
              <YesNoButtons value={local.hasTowHitch} onChange={(v) => set({ hasTowHitch: v })} />
            </div>
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>יש לך עגלה נגררת שתוכל/י להביא?</label>
            <YesNoButtons value={local.hasTrailer} onChange={(v) => set({ hasTrailer: v })} />
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>מעוניין/ת לאסוף מישהו איתך בדרך?</label>
            <YesNoButtons value={local.offerRide} onChange={(v) => set({ offerRide: v })} />
            {local.offerRide === "yes" && (
              <div className="mt-3">
                <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>כמה מקומות פנויים לנוסעים?</label>
                <input
                  type="number"
                  value={local.seats}
                  onChange={(e) => set({ seats: e.target.value })}
                  placeholder="0"
                  className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>
              יש לך מקום ברכב לציוד קטן/קניות של הקמפ? (דברים שנצטרך שחברי קמפ יביאו איתם)
            </label>
            <YesNoButtons value={local.hasCargoSpace} onChange={(v) => set({ hasCargoSpace: v })} />
            {local.hasCargoSpace === "yes" && (
              <input
                value={local.cargoNote}
                onChange={(e) => set({ cargoNote: e.target.value })}
                placeholder='כמה מקום בערך (למשל: "2 ארגזים", "תא מטען חלקי")'
                className="w-full mt-2 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
              />
            )}
          </div>
        </>
      )}

      {local.hasCar === "no" && (
        <div>
          <label className="text-xs block mb-1.5" style={{ color: COLORS.textMuted }}>כבר יש לך איך להגיע?</label>
          <YesNoButtons value={local.hasWay} onChange={(v) => set({ hasWay: v })} />
          {local.hasWay === "yes" && (
            <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>מעולה - הפרטים שלך לא יפורסמו כמחפש/ת טרמפ.</p>
          )}
          {local.hasWay === "no" && (
            <p className="text-xs mt-1.5" style={{ color: COLORS.textMuted }}>תפורסם/י ברשימת "מחפשים טרמפ".</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => { onChange({ ...local, seats: Number(local.seats) || 0 }); setSaved(true); }}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          שמירה
        </button>
        {saved && <span className="text-xs" style={{ color: COLORS.accent2Dark }}>✓ נשמר</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------
function AnnouncementForm({ onPost, teams }) {
  const [text, setText] = useState("");
  const [isEvent, setIsEvent] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [audience, setAudience] = useState("all");

  function submit() {
    if (!text.trim()) return;
    onPost(text, isEvent ? { eventDate, eventTime } : null, audience);
    setText(""); setEventDate(""); setEventTime(""); setIsEvent(false); setAudience("all");
  }

  return (
    <div className="mb-5 space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setIsEvent(false)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: !isEvent ? COLORS.accent : COLORS.surface, color: !isEvent ? COLORS.bg : COLORS.textMuted }}
        >
          פתק
        </button>
        <button
          onClick={() => setIsEvent(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: isEvent ? COLORS.accent : COLORS.surface, color: isEvent ? COLORS.bg : COLORS.textMuted }}
        >
          <CalendarDays size={12} /> אירוע
        </button>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold outline-none"
          style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
        >
          <option value="all">לכולם</option>
          {teams.map((t) => <option key={t} value={t}>לצוות {t}</option>)}
        </select>
      </div>
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isEvent ? "מה שם/פרטי האירוע?" : "מה תרצה לפרסם ללוח המודעות?"}
          rows={2}
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none resize-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <button
          onClick={submit}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          פרסום
        </button>
      </div>
      {isEvent && (
        <div className="flex gap-2">
          <input
            type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <input
            type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        </div>
      )}
    </div>
  );
}

function ReplyBox({ onReply }) {
  const [text, setText] = useState("");
  return (
    <div className="flex gap-1.5 mt-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="הגב/י..."
        className="flex-1 px-2 py-1 rounded-lg text-xs outline-none"
        style={{ background: "rgba(255,255,255,0.5)", color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={() => { onReply(text); setText(""); }}
        className="text-xs px-2.5 py-1 rounded-lg font-semibold"
        style={{ background: COLORS.text, color: COLORS.bg }}
      >
        שלח
      </button>
    </div>
  );
}

const REACTION_EMOJIS = ["❤️", "😂", "👍", "🎉", "😮", "😢"];
const LONG_PRESS_MS = 450;

// Wraps a message body with WhatsApp-style long-press-to-react, plus
// reaction pills and a tap trigger below it. One emoji per person
// (picking another swaps it). Owns its own long-press ref/timer so it
// works correctly when rendered many times in a list (each instance is
// a separate component, so this stays rules-of-hooks safe unlike trying
// to create one ref per loop iteration in the parent).
function ReactionBar({ reactions, identity, onToggle, children }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pressTimer = useRef(null);
  const longPressTargetRef = useRef(null);
  const entries = Object.entries(reactions || {}).filter(([, names]) => names && names.length > 0);

  useEffect(() => {
    const el = longPressTargetRef.current;
    if (!el) return;
    function start() {
      pressTimer.current = setTimeout(() => setPickerOpen(true), LONG_PRESS_MS);
    }
    function cancel() {
      clearTimeout(pressTimer.current);
    }
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("pointercancel", cancel);
    return () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointerup", cancel);
      el.removeEventListener("pointerleave", cancel);
      el.removeEventListener("pointercancel", cancel);
      clearTimeout(pressTimer.current);
    };
  }, []);

  return (
    <div className="relative mt-2">
      <div ref={longPressTargetRef}>{children}</div>
      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
          <div
            className="absolute bottom-full mb-1 right-0 z-20 flex gap-1 rounded-full px-2 py-1.5 shadow-lg"
            style={{ background: COLORS.bg, border: `1px solid ${COLORS.divider}` }}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => { onToggle(emoji); setPickerOpen(false); }} className="text-lg px-1 leading-none">
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="flex items-center gap-1 flex-wrap">
        {entries.map(([emoji, names]) => (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold"
            style={{
              background: names.includes(identity) ? COLORS.accentLight : "rgba(255,255,255,0.55)",
              border: `1px solid ${names.includes(identity) ? COLORS.accent : "transparent"}`,
              color: COLORS.text,
            }}
            title={names.join(", ")}
          >
            <span>{emoji}</span><span>{names.length}</span>
          </button>
        ))}
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ color: COLORS.textMuted, background: "rgba(255,255,255,0.4)" }}
        >
          😊+
        </button>
      </div>
    </div>
  );
}

const EMERGENCY_DIETARY_PRESETS = ["צמחוני", "טבעוני"];

function EmergencyCardForm({ data, onChange }) {
  const d = data || {};
  const [contactName, setContactName] = useState(d.contactName || "");
  const [contactPhone, setContactPhone] = useState(d.contactPhone || "");
  const [allergiesChoice, setAllergiesChoice] = useState(d.allergies ? "yes" : "none");
  const [allergiesDetail, setAllergiesDetail] = useState(d.allergies || "");
  const [medicalChoice, setMedicalChoice] = useState(d.medical ? "yes" : "none");
  const [medicalDetail, setMedicalDetail] = useState(d.medical || "");
  const [dietaryChoice, setDietaryChoice] = useState(
    !d.dietary ? "none" : EMERGENCY_DIETARY_PRESETS.includes(d.dietary) ? d.dietary : "other"
  );
  const [dietaryOther, setDietaryOther] = useState(
    d.dietary && !EMERGENCY_DIETARY_PRESETS.includes(d.dietary) ? d.dietary : ""
  );
  const [saved, setSaved] = useState(false);

  const selectStyle = { background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` };

  function handleAllergiesChoice(v) {
    setAllergiesChoice(v); setSaved(false);
    if (v === "none") setAllergiesDetail("");
  }
  function handleMedicalChoice(v) {
    setMedicalChoice(v); setSaved(false);
    if (v === "none") setMedicalDetail("");
  }
  function handleDietaryChoice(v) {
    setDietaryChoice(v); setSaved(false);
    if (v !== "other") setDietaryOther("");
  }

  function handleSave() {
    onChange({
      contactName,
      contactPhone,
      allergies: allergiesChoice === "yes" ? allergiesDetail : "",
      medical: medicalChoice === "yes" ? medicalDetail : "",
      dietary: dietaryChoice === "none" ? "" : dietaryChoice === "other" ? dietaryOther : dietaryChoice,
    });
    setSaved(true);
  }

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>איש קשר לחירום - שם</label>
          <input
            value={contactName}
            onChange={(e) => { setContactName(e.target.value); setSaved(false); }}
            placeholder="שם מלא"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>איש קשר לחירום - טלפון</label>
          <input
            value={contactPhone}
            onChange={(e) => { setContactPhone(e.target.value); setSaved(false); }}
            placeholder="טלפון"
            dir="ltr"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none text-right"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        </div>
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>אלרגיות</label>
        <select value={allergiesChoice} onChange={(e) => handleAllergiesChoice(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={selectStyle}>
          <option value="none">אין</option>
          <option value="yes">כן</option>
        </select>
        {allergiesChoice === "yes" && (
          <input
            value={allergiesDetail}
            onChange={(e) => { setAllergiesDetail(e.target.value); setSaved(false); }}
            placeholder="למשל: בוטנים, פניצילין..."
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none mt-2"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        )}
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>מגבלות רפואיות / תרופות קבועות</label>
        <select value={medicalChoice} onChange={(e) => handleMedicalChoice(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={selectStyle}>
          <option value="none">אין</option>
          <option value="yes">כן</option>
        </select>
        {medicalChoice === "yes" && (
          <input
            value={medicalDetail}
            onChange={(e) => { setMedicalDetail(e.target.value); setSaved(false); }}
            placeholder="אופציונלי - רק אם רלוונטי לחירום"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none mt-2"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        )}
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>העדפות תזונה</label>
        <select value={dietaryChoice} onChange={(e) => handleDietaryChoice(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={selectStyle}>
          <option value="none">אין</option>
          <option value="צמחוני">צמחוני</option>
          <option value="טבעוני">טבעוני</option>
          <option value="other">אחר</option>
        </select>
        {dietaryChoice === "other" && (
          <input
            value={dietaryOther}
            onChange={(e) => { setDietaryOther(e.target.value); setSaved(false); }}
            placeholder="פירוט (למשל: ללא גלוטן)"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none mt-2"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          שמירה
        </button>
        {saved && <span className="text-xs" style={{ color: COLORS.accent2Dark }}>✓ נשמר</span>}
      </div>
      <p className="text-xs" style={{ color: COLORS.textMuted }}>
        המידע הזה פרטי - רק אתה/את ומנהלי הקמפ יכולים לראות אותו, לשעת חירום בלבד.
      </p>
    </div>
  );
}

function PollForm({ onCreate, onCancel }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  return (
    <div className="rounded-2xl p-4 mb-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <input
        value={question} onChange={(e) => setQuestion(e.target.value)}
        placeholder="השאלה שלך"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      {options.map((opt, i) => (
        <input
          key={i}
          value={opt}
          onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
          placeholder={`אפשרות ${i + 1}`}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      ))}
      <button onClick={() => setOptions([...options, ""])} className="text-xs font-semibold" style={{ color: COLORS.accentDark }}>
        + עוד אפשרות
      </button>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onCreate(question, options)}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          פרסום סקר
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-full text-sm" style={{ color: COLORS.textMuted }}>
          ביטול
        </button>
      </div>
    </div>
  );
}

function AdminAssignPicker({ members, onAssign }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2">
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      >
        <option value="">בחר/י חבר קמפ...</option>
        {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
      </select>
      <button
        onClick={() => { if (val) { onAssign(val); setVal(""); } }}
        className="text-xs px-3 py-1.5 rounded-full font-semibold shrink-0"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        שיבוץ
      </button>
    </div>
  );
}

function NumField({ label, value, onChange, placeholder, suffix }) {
  return (
    <div>
      {label && <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>{label}</label>}
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        {suffix && <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>{suffix}</span>}
      </div>
    </div>
  );
}

// Repeating rows of {name, qty, price} - used for equipment/lounge items etc.
function ItemRowsEditor({ rows, onChange, qtyLabel = "כמות", priceLabel = "מחיר ליחידה" }) {
  function updateRow(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  const subtotal = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.price) || 0), 0);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={r.name}
            onChange={(e) => updateRow(i, { name: e.target.value })}
            placeholder="שם הפריט"
            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <input
            type="number" value={r.qty} onChange={(e) => updateRow(i, { qty: e.target.value })}
            placeholder={qtyLabel}
            className="w-20 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <input
            type="number" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })}
            placeholder={priceLabel}
            className="w-24 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} style={{ color: COLORS.textMuted }}><X size={14} /></button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={() => onChange([...rows, { name: "", qty: "", price: "" }])} className="text-xs font-semibold" style={{ color: COLORS.accentDark }}>
          + הוספת שורה
        </button>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>סכום ביניים: ₪{subtotal.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Repeating rows of {name, amount} - used for one-time income, cashflow channels, alcohol categories (extended below)
function AmountRowsEditor({ rows, onChange, placeholder = "שם" }) {
  function updateRow(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  const subtotal = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={r.name}
            onChange={(e) => updateRow(i, { name: e.target.value })}
            placeholder={placeholder}
            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <input
            type="number" value={r.amount} onChange={(e) => updateRow(i, { amount: e.target.value })}
            placeholder="סכום"
            className="w-28 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} style={{ color: COLORS.textMuted }}><X size={14} /></button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={() => onChange([...rows, { name: "", amount: "" }])} className="text-xs font-semibold" style={{ color: COLORS.accentDark }}>
          + הוספת שורה
        </button>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>סכום ביניים: ₪{subtotal.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Alcohol categories: {name, units, price}
function AlcoholRowsEditor({ rows, onChange }) {
  function updateRow(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  const subtotal = rows.reduce((s, r) => s + (Number(r.units) || 0) * (Number(r.price) || 0), 0);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })}
            placeholder="סוג משקה (בירה/יין/ספיריטים...)"
            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <input
            type="number" value={r.units} onChange={(e) => updateRow(i, { units: e.target.value })}
            placeholder="כמות יחידות"
            className="w-24 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <input
            type="number" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })}
            placeholder="מחיר ליחידה"
            className="w-24 px-2 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
          <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} style={{ color: COLORS.textMuted }}><X size={14} /></button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={() => onChange([...rows, { name: "", units: "", price: "" }])} className="text-xs font-semibold" style={{ color: COLORS.accentDark }}>
          + הוספת סוג משקה
        </button>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>סכום ביניים: ₪{subtotal.toLocaleString()}</span>
      </div>
    </div>
  );
}

function QuickMessageBox({ onSend, onCancel }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="כתוב/י הודעה..."
        autoFocus
        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={() => { if (text.trim()) onSend(text); }}
        className="text-xs px-2.5 py-1.5 rounded-lg font-semibold shrink-0"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        שליחה
      </button>
      <button onClick={onCancel} className="shrink-0 p-1" style={{ color: COLORS.textMuted }}><X size={14} /></button>
    </div>
  );
}

// A single stop on the "route" - a person, their relevant detail, and a way to reach out.
function RouteRow({ name, detail, dotColor, isLast, canContact, contacting, onToggleContact, onSend }) {
  return (
    <div className="flex gap-3">
      <div className="w-3 flex flex-col items-center pt-1">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor }} />
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: COLORS.divider }} />}
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            {detail && <div className="text-xs mt-0.5" style={{ color: dotColor }}>{detail}</div>}
          </div>
          {canContact && (
            <button onClick={onToggleContact} className="shrink-0 p-1.5 rounded-full" style={{ background: COLORS.input, color: dotColor }}>
              <MessageCircle size={13} />
            </button>
          )}
        </div>
        {contacting && <QuickMessageBox onSend={onSend} onCancel={onToggleContact} />}
      </div>
    </div>
  );
}

// A category "stop" on the rides board - colored header badge + a route of member rows.
function RideCategoryCard({ icon: Icon, title, count, headerColor, emptyText, children }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: headerColor }}>
        <Icon size={16} color="white" />
        <span className="text-sm font-bold" style={{ color: "white" }}>{title}</span>
        <span className="mr-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.28)", color: "white" }}>
          {count}
        </span>
      </div>
      <div className="p-4">
        {count === 0 ? <p className="text-xs" style={{ color: COLORS.textMuted }}>{emptyText}</p> : children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Camp budget engine - implements the handover-doc formulas exactly.
// Every number here is an input re-entered each planning cycle; nothing
// is hardcoded. Section numbers in comments match the source document.
// Pulled out to a plain function (instead of living inline in a useMemo)
// so it can be run twice: once with the real camp-member count, and once
// with a hypothetical "what if we had N members" count for planning.
// ---------------------------------------------------------------------------
function runBudgetEngine(p, N, budgetExpenses, paymentTotals) {
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

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [budgetItems, setBudgetItems] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [teardownTasks, setTeardownTasks] = useState({});
  const [memberPayments, setMemberPayments] = useState({});
  const [campFee, setCampFee] = useState(0);
  const [teamLeads, setTeamLeadsState] = useState({});
  const [memberPhones, setMemberPhones] = useState({});
  const [rideInfo, setRideInfo] = useState({});
  const [rideMatches, setRideMatches] = useState({});
  const [allocationInfo, setAllocationInfo] = useState({});
  const [feeOverrides, setFeeOverrides] = useState({});
  const [memberEmails, setMemberEmails] = useState({});
  const [whatsappConsent, setWhatsappConsentState] = useState({});
  const [personalCalendarAdds, setPersonalCalendarAddsState] = useState({});
  const [checklistState, setChecklistState] = useState({});
  const [manualTeamMembers, setManualTeamMembers] = useState({});
  const [extraTeams, setExtraTeams] = useState([]);
  const [customChecklists, setCustomChecklists] = useState({});
  const [budgetParams, setBudgetParams] = useState({
    global: { N: "", setupDays: "", eventDays: "", contingencyPct: "", vatIncluded: false, whatIfEnabled: false, whatIfN: "" },
    campInfra: { items: [], loungeItems: [], oneTimeIncome: [], icePricePerKg: "", iceKgPerDay: "", iceDays: "", elecPricePerKw: "", elecKw: "" },
    water: { literPerPersonPerDay: "", tankFaucetCost: "", fillCost: "", fillCount: "", drainCost: "", drainCount: "", showerUnitCost: "", showerUnitsCount: "" },
    sanitation: { pumpFreqPerPersonPerDay: "", pumpCost: "", sawdustFreq: "", sawdustCost: "", drainCellCost: "", chemicalToiletsCost: "" },
    food: { setupPeopleCount: "", setupDays: "", setupCostPerDay: "", actualDiners: "", mealsPerDay: "", eventDays: "", costPerMeal: "", contingencyAmount: "" },
    alcohol: { categories: [], deferredReserve: "" },
    general: { fixedAnnualCost: "", splitRatioPct: "" },
    contingencyOverrides: {},
    income: { vatRefund: "", externalGross: "", externalNet: "" },
    cashflow: { channels: [], pendingPayments: "", knownCommitments: "" },
  });
  const [budgetExpenses, setBudgetExpenses] = useState([]);
  const [campEquipment, setCampEquipment] = useState([]);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [shoppingList, setShoppingList] = useState([]);
  const [editingShoppingItemId, setEditingShoppingItemId] = useState(null);
  const [shoppingRequests, setShoppingRequests] = useState([]);
  const [dietaryCounts, setDietaryCounts] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [extraBudgetCategories, setExtraBudgetCategories] = useState([]);
  const [showBudgetSection, setShowBudgetSection] = useState(null);
  const [showQuickAddExpense, setShowQuickAddExpense] = useState(false);
  const [financesView, setFinancesView] = useState("dues");
  const [activityLog, setActivityLog] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showMemberActivity, setShowMemberActivity] = useState(false);
  const [lastSeenMap, setLastSeenMap] = useState(null);
  const [logsRefreshing, setLogsRefreshing] = useState(false);
  const [extraMembers, setExtraMembers] = useState([]);
  const [removedMembers, setRemovedMembers] = useState([]);
  const [dbRoles, setDbRoles] = useState({});
  const [idOnFileNames, setIdOnFileNames] = useState(null);
  const [pushEnabledNames, setPushEnabledNames] = useState(null);
  const [showPushStatusList, setShowPushStatusList] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editIdValue, setEditIdValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [emergencyInfo, setEmergencyInfo] = useState({});
  const [polls, setPolls] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [showPrivateMsgForm, setShowPrivateMsgForm] = useState(false);
  const [expandedEmergency, setExpandedEmergency] = useState(null);
  const [showEmergencyList, setShowEmergencyList] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [openPersonalSection, setOpenPersonalSection] = useState(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard-personal");
  const [adminSubTab, setAdminSubTab] = useState("overview");
  const [expandedNavCategory, setExpandedNavCategory] = useState(null);
  const [teamFilter, setTeamFilter] = useState("הכל");
  const [shiftsView, setShiftsView] = useState("calendar");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [contactingRideMember, setContactingRideMember] = useState(null);
  const [toast, setToast] = useState(null);
  const [pushStatus, setPushStatus] = useState("unsupported");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  // Per-device, not per-account, on purpose: notification permission itself
  // is per-browser, so a new device legitimately needs to be asked again -
  // this only tracks "did this device's user make an active choice" so the
  // profile-completeness gate below doesn't nag forever after a real "no".
  const [pushDecisionMade, setPushDecisionMade] = useState(() => localStorage.getItem("push-decision-made") === "1");
  const [sendingTestPush, setSendingTestPush] = useState(false);
  const loadSharedDataRef = useRef(null);

  useEffect(() => {
    async function safeGet(key, shared) {
      try {
        const r = await window.storage.get(key, shared);
        return r && r.value ? r.value : null;
      } catch {
        return null;
      }
    }

    async function loadSharedData() {
      const [
        rawAssignments, rawBudget, rawCatBudget, rawTeardown, rawPayments, rawFee,
        rawLeads, rawPhones, rawRides, rawFeeOv, rawEmails, rawWhatsappConsent, rawPersonalCalendarAdds, rawChecklists,
        rawManualTeam, rawLog, rawLogins, rawExtra, rawRemoved,
        rawAnn, rawPolls, rawBudgetParams, rawBudgetExpenses, rawEquipment, rawExtraCategories, rawRideMatches,
        rawShoppingList, rawShoppingRequests, rawExtraTeams, rawCustomChecklists,
      ] = await Promise.all([
        safeGet("shift-assignments", true),
        safeGet("budget-items", true),
        safeGet("category-budgets", true),
        safeGet("teardown-tasks", true),
        safeGet("member-payments", true),
        safeGet("camp-fee", true),
        safeGet("team-leads", true),
        safeGet("member-phones", true),
        safeGet("ride-info", true),
        safeGet("fee-overrides", true),
        safeGet("member-emails", true),
        safeGet("whatsapp-consent", true),
        safeGet("personal-calendar-adds", true),
        safeGet("team-checklists", true),
        safeGet("manual-team-members", true),
        safeGet("activity-log", true),
        safeGet("login-history", true),
        safeGet("extra-members", true),
        safeGet("removed-members", true),
        safeGet("announcements", true),
        safeGet("polls", true),
        safeGet("budget-params", true),
        safeGet("budget-expenses", true),
        safeGet("camp-equipment", true),
        safeGet("extra-budget-categories", true),
        safeGet("ride-matches", true),
        safeGet("kitchen-shopping-list", true),
        safeGet("kitchen-shopping-requests", true),
        safeGet("extra-teams", true),
        safeGet("team-checklist-items", true),
      ]);

      async function safeCall(fn, fallback) {
        try {
          return await fn();
        } catch {
          return fallback;
        }
      }
      const [emergencyMap, allocationMap, myMessages] = await Promise.all([
        safeCall(() => listEmergencyInfo(), {}),
        safeCall(() => listAllocationInfo(), {}),
        safeCall(() => listMyPrivateMessages(), []),
      ]);

      setAssignments(rawAssignments ? JSON.parse(rawAssignments) : {});
      setBudgetItems(rawBudget ? JSON.parse(rawBudget) : []);
      setCategoryBudgets(rawCatBudget ? JSON.parse(rawCatBudget) : {});
      setTeardownTasks(rawTeardown ? JSON.parse(rawTeardown) : {});

      const parsedPayments = rawPayments ? JSON.parse(rawPayments) : {};
      const normalizedPayments = {};
      Object.keys(parsedPayments).forEach((name) => {
        normalizedPayments[name] = Array.isArray(parsedPayments[name]) ? parsedPayments[name] : [];
      });
      setMemberPayments(normalizedPayments);

      setCampFee(rawFee ? JSON.parse(rawFee) : 0);

      if (rawLeads) {
        setTeamLeadsState(normalizeTeamLeads(JSON.parse(rawLeads)));
      } else {
        setTeamLeadsState(DEFAULT_TEAM_LEADS);
        window.storage.set("team-leads", JSON.stringify(DEFAULT_TEAM_LEADS), true).catch(() => {});
      }

      setMemberPhones(rawPhones ? JSON.parse(rawPhones) : {});
      setRideInfo(rawRides ? JSON.parse(rawRides) : {});
      setRideMatches(rawRideMatches ? JSON.parse(rawRideMatches) : {});
      setFeeOverrides(rawFeeOv ? JSON.parse(rawFeeOv) : {});
      setMemberEmails(rawEmails ? JSON.parse(rawEmails) : {});
      setWhatsappConsentState(rawWhatsappConsent ? JSON.parse(rawWhatsappConsent) : {});
      setPersonalCalendarAddsState(rawPersonalCalendarAdds ? JSON.parse(rawPersonalCalendarAdds) : {});
      setChecklistState(rawChecklists ? JSON.parse(rawChecklists) : {});
      setManualTeamMembers(rawManualTeam ? JSON.parse(rawManualTeam) : {});
      setActivityLog(rawLog ? JSON.parse(rawLog) : []);
      setLoginHistory(rawLogins ? JSON.parse(rawLogins) : []);
      {
        const parsedExtra = rawExtra ? JSON.parse(rawExtra) : [];
        // Older buggy add-member attempts could append the same name to
        // this list several times (e.g. retrying after a failed save) -
        // collapse those duplicates here and write the cleaned list back
        // so everyone's roster/login screen stops showing the name repeated.
        const dedupedExtra = [];
        const indexByName = new Map();
        parsedExtra.forEach((m) => {
          const idx = indexByName.get(m.name);
          if (idx === undefined) {
            indexByName.set(m.name, dedupedExtra.length);
            dedupedExtra.push(m);
          } else if (!dedupedExtra[idx].idOnFile && m.idOnFile) {
            dedupedExtra[idx] = m;
          }
        });
        setExtraMembers(dedupedExtra);
        if (dedupedExtra.length !== parsedExtra.length) {
          window.storage.set("extra-members", JSON.stringify(dedupedExtra), true).catch(() => {});
        }
      }
      setRemovedMembers(rawRemoved ? JSON.parse(rawRemoved) : []);
      setAnnouncements(rawAnn ? JSON.parse(rawAnn) : []);
      setEmergencyInfo(emergencyMap);
      setPolls(rawPolls ? JSON.parse(rawPolls) : []);
      setPrivateMessages(myMessages);
      setAllocationInfo(allocationMap);
      if (rawBudgetParams) {
        try {
          setBudgetParams((prev) => ({ ...prev, ...JSON.parse(rawBudgetParams) }));
        } catch {}
      }
      setBudgetExpenses(rawBudgetExpenses ? JSON.parse(rawBudgetExpenses) : []);
      setCampEquipment(rawEquipment ? JSON.parse(rawEquipment) : []);
      setExtraBudgetCategories(rawExtraCategories ? JSON.parse(rawExtraCategories) : []);
      setShoppingList(rawShoppingList ? JSON.parse(rawShoppingList) : []);
      setShoppingRequests(rawShoppingRequests ? JSON.parse(rawShoppingRequests) : []);
      setExtraTeams(rawExtraTeams ? JSON.parse(rawExtraTeams) : []);
      setCustomChecklists(rawCustomChecklists ? JSON.parse(rawCustomChecklists) : {});
    }
    loadSharedDataRef.current = loadSharedData;

    (async () => {
      // kv_store now requires a logged-in session (see the security
      // migration) - loadSharedData() only returns real data once
      // there's an active Supabase Auth session. If someone already has
      // one (returning visit), pick it back up here; otherwise this
      // just loads harmless empty defaults and the login screen shows.
      // Wrapped in try/finally so a single corrupted kv_store blob (a
      // JSON.parse throw anywhere inside loadSharedData) can't leave the
      // whole app stuck on the loading screen forever - worst case it now
      // loads in a degraded state instead of never loading at all.
      try {
        const restoredName = await getSignedInMemberName().catch(() => null);
        await Promise.all([
          loadSharedData(),
          // Needed before any login attempt, not just after one: the login
          // screen's "first-time signup needs ID" check reads idOnFileNames,
          // so a first-time visitor who was never logged in on this device
          // must still see fresh DB truth here - otherwise it falls back to
          // the stale static idOnFile flag baked into extra-members and can
          // wrongly tell a member with a freshly-added ID that they have none.
          listMembersWithIdOnFile().then(setIdOnFileNames).catch(() => {}),
        ]);
        if (restoredName) {
          await applyIdentity(restoredName, false);
        }
      } catch (err) {
        showToast("חלק מהנתונים לא נטענו כמו שצריך - נסה/י לרענן את הדף", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && identity) {
      const unanswered = polls.filter((pl) => pl.responses[identity] === undefined);
      if (unanswered.length > 0) {
        const plural = unanswered.length > 1;
        showToast(`📊 יש ${unanswered.length} סקר${plural ? "ים" : ""} חדש${plural ? "ים" : ""} שמחכה לך - עדכוני קמפ`, "ok");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, loading]);

  async function persistAssignments(next) {
    setAssignments(next);
    try {
      await window.storage.set("shift-assignments", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה, נסה שוב", "error");
    }
  }

  async function persistBudget(next) {
    setBudgetItems(next);
    try {
      await window.storage.set("budget-items", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה, נסה שוב", "error");
    }
  }

  async function removeBudgetItem(id) {
    const item = budgetItems.find((b) => b.id === id);
    const latest = await getFreshShared("budget-items", budgetItems);
    persistBudget(latest.filter((b) => b.id !== id));
    if (item) logActivity("מחיקת הוצאה", `${item.name} (${item.category})`);
  }

  async function persistCategoryBudgets(next) {
    setCategoryBudgets(next);
    try {
      await window.storage.set("category-budgets", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה, נסה שוב", "error");
    }
  }

  function setCategoryBudget(cat, amount) {
    persistCategoryBudgets({ ...categoryBudgets, [cat]: Number(amount) || 0 });
    showToast(`תקציב ${cat} עודכן`, "ok");
    logActivity("עדכון תקציב מחלקה", `${cat}: ₪${Number(amount) || 0}`);
  }

  function copyEngineToDepartmentBudget() {
    const mapping = {
      "מים": engine.waterTotal,
      "שירותים ומקלחות": engine.sanitationTotal,
      "מטבח ומזון": engine.foodTotal,
      "קרח": engine.iceCost,
      "חשמל": engine.elecCost,
      "עיצוב ותפאורה": engine.loungeItemsTotal,
      "ציוד": engine.campItemsTotal + engine.campContingency,
    };
    const next = { ...categoryBudgets };
    Object.entries(mapping).forEach(([cat, val]) => { next[cat] = Math.round(val) || 0; });
    persistCategoryBudgets(next);
    showToast("התקציב לפי מחלקות עודכן מהפרמטרים", "ok");
    logActivity("העתקת תקציב ממנוע לפי מחלקות", Object.keys(mapping).join(", "));
  }

  async function patchBudgetParams(section, patch) {
    const next = { ...budgetParams, [section]: { ...budgetParams[section], ...patch } };
    setBudgetParams(next);
    try {
      await window.storage.set("budget-params", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setContingencyOverride(section, pct) {
    const next = { ...budgetParams, contingencyOverrides: { ...budgetParams.contingencyOverrides, [section]: pct } };
    setBudgetParams(next);
    try {
      await window.storage.set("budget-params", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addBudgetExpense(exp) {
    if (!exp.amount) return showToast("צריך סכום", "error");
    const latest = await getFreshShared("budget-expenses", budgetExpenses);
    const next = [{ ...exp, id: Date.now().toString(), enteredBy: identity }, ...latest];
    setBudgetExpenses(next);
    try {
      await window.storage.set("budget-expenses", JSON.stringify(next), true);
      showToast("ההוצאה נרשמה", "ok");
      logActivity("רישום הוצאה בפועל", `${exp.vendor || exp.subcategory || ""} ₪${exp.amount}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  function downloadBudgetExpensesCsv() {
    const csv = expensesToCsv(budgetExpenses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `הוצאות-קמפ-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Admin-only: bulk-imports expense rows from a CSV (e.g. exported from
  // Excel) instead of entering each one by hand. Restricted to admins
  // rather than any budget-team member since a CSV lets the importer set
  // `allocation` freely per row, which would otherwise let a team lead
  // bulk-add expenses under a different team than the one they're scoped to.
  async function importBudgetExpensesCsv(file) {
    const text = await file.text();
    const rows = parseCsv(text.replace(/^\uFEFF/, ""));
    if (rows.length < 2) return showToast("הקובץ ריק", "error");
    const headers = rows[0].map((h) => h.trim());
    const col = (name) => headers.indexOf(name);
    const iAlloc = col("allocation"), iVendor = col("vendor"), iDesc = col("description"),
      iAmount = col("amount"), iDate = col("purchaseDate"), iStatus = col("paymentStatus"),
      iPaid = col("paidAmount"), iDue = col("dueDate"), iMethod = col("paymentMethod"),
      iVat = col("vatIncluded"), iRefund = col("isRefund"),
      iRefundToMember = col("refundToMember"), iRefundMemberName = col("refundMemberName"),
      iRefundPaid = col("refundPaid");
    if (iAmount === -1) return showToast('לא נמצאה עמודת "amount" בקובץ - יש להוריד קובץ לדוגמה מכפתור הייצוא כדי לראות את הפורמט הנכון', "error");
    const truthy = (v) => v === "true" || v === "1" || v === "כן";
    const newRows = rows.slice(1)
      .filter((r) => r.some((c) => c.trim() !== ""))
      .map((r) => {
        const amount = Number(r[iAmount]) || 0;
        const paymentStatus = iStatus !== -1 && r[iStatus] === "partial" ? "partial" : "paid";
        const paidAmount = paymentStatus === "partial" ? (Number(r[iPaid]) || 0) : amount;
        return {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          allocation: iAlloc !== -1 ? r[iAlloc] : "",
          vendor: iVendor !== -1 ? r[iVendor] : "",
          description: iDesc !== -1 ? r[iDesc] : "",
          amount,
          purchaseDate: iDate !== -1 ? r[iDate] : "",
          paymentStatus,
          paidAmount,
          remainingAmount: paymentStatus === "partial" ? Math.max(amount - paidAmount, 0) : 0,
          dueDate: iDue !== -1 ? r[iDue] : "",
          paymentMethod: iMethod !== -1 ? r[iMethod] : "",
          vatIncluded: iVat !== -1 ? truthy(r[iVat]) : true,
          isRefund: iRefund !== -1 ? truthy(r[iRefund]) : false,
          refundToMember: iRefundToMember !== -1 ? truthy(r[iRefundToMember]) : false,
          refundMemberName: iRefundMemberName !== -1 ? r[iRefundMemberName] : "",
          refundPaid: iRefundPaid !== -1 ? truthy(r[iRefundPaid]) : false,
          enteredBy: identity,
        };
      });
    if (newRows.length === 0) return showToast("לא נמצאו שורות תקינות בקובץ", "error");
    const latest = await getFreshShared("budget-expenses", budgetExpenses);
    const next = [...newRows, ...latest];
    setBudgetExpenses(next);
    try {
      await window.storage.set("budget-expenses", JSON.stringify(next), true);
      showToast(`יובאו ${newRows.length} הוצאות`, "ok");
      logActivity("ייבוא הוצאות מקובץ", `${newRows.length} שורות`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeBudgetExpense(id) {
    const latest = await getFreshShared("budget-expenses", budgetExpenses);
    const next = latest.filter((e) => e.id !== id);
    setBudgetExpenses(next);
    try {
      await window.storage.set("budget-expenses", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Lets admins/budget team fix an already-recorded expense (e.g. one that
  // was saved without a budget category) instead of only being able to
  // delete and re-enter it from scratch.
  async function updateBudgetExpense(id, patch) {
    const latest = await getFreshShared("budget-expenses", budgetExpenses);
    const next = latest.map((e) => (e.id === id ? { ...e, ...patch } : e));
    setBudgetExpenses(next);
    try {
      await window.storage.set("budget-expenses", JSON.stringify(next), true);
      showToast("ההוצאה עודכנה", "ok");
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addEquipment(item) {
    const latest = await getFreshShared("camp-equipment", campEquipment);
    const next = [...latest, { ...item, id: Date.now().toString(), addedBy: identity, addedAt: Date.now() }];
    setCampEquipment(next);
    try {
      await window.storage.set("camp-equipment", JSON.stringify(next), true);
      showToast("הציוד נוסף לרשימה", "ok");
      logActivity("הוספת ציוד קמפ", `${item.name} × ${item.qty}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeEquipment(id) {
    const latest = await getFreshShared("camp-equipment", campEquipment);
    const next = latest.filter((e) => e.id !== id);
    setCampEquipment(next);
    try {
      await window.storage.set("camp-equipment", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function updateEquipmentField(id, patch) {
    const latest = await getFreshShared("camp-equipment", campEquipment);
    const next = latest.map((e) => (e.id === id ? { ...e, ...patch, updatedBy: identity, updatedAt: Date.now() } : e));
    setCampEquipment(next);
    try {
      await window.storage.set("camp-equipment", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Kitchen shopping list - editable by kitchen-team members/admins only
  // (enforced client-side, same trust model as camp-equipment above), but
  // visible to everyone so the whole camp can see what's already planned.
  async function addShoppingItem(item) {
    if (shoppingList.some((it) => it.name === item.name)) {
      return showToast(`"${item.name}" כבר ברשימה`, "error");
    }
    const isPending = !(Number(item.qty) > 0 && Number(item.price) > 0);
    const latest = await getFreshShared("kitchen-shopping-list", shoppingList);
    const next = [...latest, { ...item, id: Date.now().toString(), bought: false, addedBy: identity, addedAt: Date.now() }];
    setShoppingList(next);
    try {
      await window.storage.set("kitchen-shopping-list", JSON.stringify(next), true);
      showToast(isPending ? `"${item.name}" נוסף - יש להשלים כמות ומחיר` : "הפריט נוסף לרשימת הקניות", "ok");
      logActivity("הוספת פריט לרשימת קניות", `${item.name}${item.qty ? ` × ${item.qty}` : ""}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function updateShoppingItem(id, patch) {
    const latest = await getFreshShared("kitchen-shopping-list", shoppingList);
    const next = latest.map((it) => (it.id === id ? { ...it, ...patch, updatedBy: identity, updatedAt: Date.now() } : it));
    setShoppingList(next);
    try {
      await window.storage.set("kitchen-shopping-list", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function toggleShoppingItemBought(id) {
    const latest = await getFreshShared("kitchen-shopping-list", shoppingList);
    const next = latest.map((it) => (it.id === id ? { ...it, bought: !it.bought } : it));
    setShoppingList(next);
    try {
      await window.storage.set("kitchen-shopping-list", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeShoppingItem(id) {
    const latest = await getFreshShared("kitchen-shopping-list", shoppingList);
    const next = latest.filter((it) => it.id !== id);
    setShoppingList(next);
    try {
      await window.storage.set("kitchen-shopping-list", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Anyone (not just kitchen team) can leave a special request - e.g. an
  // allergy or a specific product they'd like added to the shopping trip.
  async function addShoppingRequest(text) {
    if (!text.trim()) return;
    const latest = await getFreshShared("kitchen-shopping-requests", shoppingRequests);
    const next = [{ id: Date.now().toString(), text: text.trim(), author: identity, ts: Date.now() }, ...latest];
    setShoppingRequests(next);
    try {
      await window.storage.set("kitchen-shopping-requests", JSON.stringify(next), true);
      showToast("הבקשה נשלחה לצוות המטבח", "ok");
      logActivity("בקשה מיוחדת לקניות מטבח", text.trim().slice(0, 80));
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeShoppingRequest(id) {
    const latest = await getFreshShared("kitchen-shopping-requests", shoppingRequests);
    const next = latest.filter((r) => r.id !== id);
    setShoppingRequests(next);
    try {
      await window.storage.set("kitchen-shopping-requests", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addBudgetCategory(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (BUDGET_CATEGORIES.includes(trimmed) || extraBudgetCategories.includes(trimmed)) {
      return showToast("הקטגוריה כבר קיימת", "error");
    }
    const next = [...extraBudgetCategories, trimmed];
    setExtraBudgetCategories(next);
    try {
      await window.storage.set("extra-budget-categories", JSON.stringify(next), true);
      showToast(`הקטגוריה "${trimmed}" נוספה`, "ok");
      logActivity("הוספת קטגוריית הוצאה חדשה", trimmed);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Only custom (extra) categories can be renamed/removed - the built-in
  // BUDGET_CATEGORIES are wired into the budget engine and other parts of
  // the app, so they aren't user-editable.
  async function renameBudgetCategory(oldName, newName) {
    const trimmed = (newName || "").trim();
    if (!trimmed || trimmed === oldName) return;
    if (!extraBudgetCategories.includes(oldName)) return;
    if (BUDGET_CATEGORIES.includes(trimmed) || extraBudgetCategories.includes(trimmed)) {
      return showToast("הקטגוריה כבר קיימת", "error");
    }
    const nextCats = extraBudgetCategories.map((c) => (c === oldName ? trimmed : c));
    setExtraBudgetCategories(nextCats);

    const nextBudgets = { ...categoryBudgets };
    if (oldName in nextBudgets) {
      nextBudgets[trimmed] = nextBudgets[oldName];
      delete nextBudgets[oldName];
    }
    setCategoryBudgets(nextBudgets);

    const latestItems = await getFreshShared("budget-items", budgetItems);
    const nextItems = latestItems.map((b) => (b.category === oldName ? { ...b, category: trimmed } : b));
    setBudgetItems(nextItems);

    const latestExpenses = await getFreshShared("budget-expenses", budgetExpenses);
    const nextExpenses = latestExpenses.map((e) => (e.allocation === oldName ? { ...e, allocation: trimmed } : e));
    setBudgetExpenses(nextExpenses);

    try {
      await Promise.all([
        window.storage.set("extra-budget-categories", JSON.stringify(nextCats), true),
        window.storage.set("category-budgets", JSON.stringify(nextBudgets), true),
        window.storage.set("budget-items", JSON.stringify(nextItems), true),
        window.storage.set("budget-expenses", JSON.stringify(nextExpenses), true),
      ]);
      showToast(`הקטגוריה שונתה ל"${trimmed}"`, "ok");
      logActivity("שינוי שם קטגוריית הוצאה", `${oldName} → ${trimmed}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeBudgetCategory(name) {
    if (!extraBudgetCategories.includes(name)) return;
    const hasItems = budgetItems.some((b) => b.category === name) || budgetExpenses.some((e) => e.allocation === name);
    if (hasItems) {
      return showToast("יש הוצאות משויכות לקטגוריה זו - יש להעביר או למחוק אותן קודם", "error");
    }
    const nextCats = extraBudgetCategories.filter((c) => c !== name);
    setExtraBudgetCategories(nextCats);
    const nextBudgets = { ...categoryBudgets };
    delete nextBudgets[name];
    setCategoryBudgets(nextBudgets);
    try {
      await Promise.all([
        window.storage.set("extra-budget-categories", JSON.stringify(nextCats), true),
        window.storage.set("category-budgets", JSON.stringify(nextBudgets), true),
      ]);
      showToast(`הקטגוריה "${name}" נמחקה`, "ok");
      logActivity("מחיקת קטגוריית הוצאה", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function applyIdentity(name, logHistory = true) {
    setIdentity(name);
    try {
      const roles = await getAllMemberRoles();
      setDbRoles(roles);
    } catch {}
    try {
      const idSet = await listMembersWithIdOnFile();
      setIdOnFileNames(idSet);
    } catch {}
    try {
      const pushSet = await listMembersWithPushEnabled();
      setPushEnabledNames(pushSet);
    } catch {}
    if (logHistory) {
      try {
        const fresh = await window.storage.get("login-history", true);
        const current = fresh && fresh.value ? JSON.parse(fresh.value) : [];
        const entry = { name, ts: Date.now() };
        const next = [entry, ...current].slice(0, 300);
        setLoginHistory(next);
        await window.storage.set("login-history", JSON.stringify(next), true);
      } catch {}
    }
    // applyIdentity() only runs once per page load/app open (either a fresh
    // password login or the PWA silently restoring an already-authenticated
    // session via its refresh token) - not repeatedly during an open
    // session - so this fires once per "X opened the app", which is what
    // was actually asked for. Almost every real-world open of an installed
    // PWA is the silent-restore path, not a password re-entry, so gating
    // this on logHistory (like login-history is) meant it almost never fired.
    notifyOwner("login");
    // Throttled to once an hour per device - runs on every app open (fresh
    // login or a restored session), not just first-time logins, so it
    // actually reflects recent activity rather than just first-ever login.
    // Also logged to the activity feed itself (with the same throttle) so
    // logins show up in "היסטוריית שינויים" too, not only in the separate
    // "כניסות לאפליקציה" last-seen table - actorOverride is required here
    // since identity's closure value can still be stale at this point.
    try {
      const touchKey = `last-seen-touched-${name}`;
      const lastTouch = Number(localStorage.getItem(touchKey)) || 0;
      if (Date.now() - lastTouch > 60 * 60 * 1000) {
        await touchLastSeen(name);
        localStorage.setItem(touchKey, String(Date.now()));
        logActivity("כניסה לאפליקציה", "", name);
      }
    } catch {}
  }

  async function handleLogin(name, password) {
    await signInMember(name, password);
    if (loadSharedDataRef.current) await loadSharedDataRef.current();
    await applyIdentity(name, true);
  }

  async function handleSetup(name, id, password) {
    await setMemberPasswordAndSignIn(name, id, password);
    if (loadSharedDataRef.current) await loadSharedDataRef.current();
    await applyIdentity(name, true);
  }

  async function logout() {
    setIdentity(null);
    try {
      await signOutMember();
    } catch {}
  }

  function showToast(text, kind = "ok") {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    setPushStatus(pushPermission());
    isPushSubscribed().then(setPushSubscribed);
  }, [identity]);

  async function handleEnablePush() {
    try {
      await enablePush(identity);
      setPushStatus("granted");
      setPushSubscribed(true);
      localStorage.setItem("push-decision-made", "1");
      setPushDecisionMade(true);
      showToast("התראות פעילות! תקבל/י הודעה על מודעות וסקרים חדשים", "ok");
    } catch (err) {
      if (err.message === "permission-denied") {
        showToast("ההרשאה נדחתה - אפשר לשנות בהגדרות הדפדפן", "error");
        setPushStatus("denied");
        localStorage.setItem("push-decision-made", "1");
        setPushDecisionMade(true);
      } else {
        showToast("לא ניתן להפעיל התראות במכשיר/דפדפן הזה", "error");
      }
    }
  }

  function handleDeclinePush() {
    localStorage.setItem("push-decision-made", "1");
    setPushDecisionMade(true);
  }

  async function handleDisablePush() {
    try {
      await disablePush(identity);
      setPushSubscribed(false);
      showToast("התראות בוטלו", "ok");
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function handleResetPush() {
    setSendingTestPush(true);
    try {
      await resetPush(identity);
      setPushStatus(pushPermission());
      setPushSubscribed(true);
      showToast("ההתראות אופסו והופעלו מחדש - נסה/י עכשיו לשלוח בדיקה", "ok");
    } catch (err) {
      showToast(`האיפוס נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setSendingTestPush(false);
    }
  }

  async function sendTestPush() {
    setSendingTestPush(true);
    try {
      const result = await sendEventReminderPush("בדיקה 🔔", "זו התראת בדיקה - אם קיבלת את זה, ההתראות עובדות אצלך!", identity);
      if (result?.sent > 0) {
        showToast("נשלחה התראת בדיקה - אמור/ה לקבל אותה תוך כמה שניות", "ok");
      } else {
        const reason = result?.errors?.[0]?.message || result?.detail || "לא נמצאה מנוי פעיל במכשיר הזה";
        showToast(`ההתראה לא הגיעה בפועל: ${reason} - נסה/י לבטל ולהפעיל התראות מחדש`, "error");
      }
    } catch (err) {
      showToast(`שליחת הבדיקה נכשלה: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setSendingTestPush(false);
    }
  }

  async function logActivity(action, details, actorOverride) {
    const entry = { ts: Date.now(), actor: actorOverride || identity || "לא ידוע", action, details: details || "" };
    const latest = await getFreshShared("activity-log", activityLog);
    const next = [entry, ...latest].slice(0, 200);
    setActivityLog(next);
    try {
      await window.storage.set("activity-log", JSON.stringify(next), true);
    } catch {}
  }

  function overlaps(a, b) {
    if (a.noTime || b.noTime) return false;
    return a.start < b.end && b.start < a.end;
  }

  function isJoined(shiftId) {
    if (shiftId === TEARDOWN_ID) return true;
    return (assignments[shiftId] || []).includes(identity);
  }

  async function getLatestAssignments() {
    return getFreshShared("shift-assignments", assignments);
  }

  // kv_store holds each key as one whole JSON blob, so two people editing
  // the same shared list around the same moment can silently overwrite
  // each other's change if both write from their own (possibly stale)
  // local copy - whoever writes last wins, and the other person's add
  // just vanishes. Re-fetching the current value right before merging in
  // a change (instead of trusting local React state) closes that window
  // to "however long the fetch+merge+write takes", same fix already used
  // for shift-assignments (the highest-collision-risk list) - applied here
  // to the other lists people are most likely to edit concurrently
  // (adding a member, an expense, or equipment).
  async function getFreshShared(key, fallback) {
    try {
      const fresh = await window.storage.get(key, true);
      return fresh && fresh.value ? JSON.parse(fresh.value) : fallback;
    } catch {
      return fallback;
    }
  }

  // The owner-only "יומנים" tab used to load these three lists once at page
  // load and never again, so anything another member did (log in, take an
  // admin action) while the owner sat on that screen just never appeared
  // until a full page refresh. Re-fetch all of them fresh instead.
  async function refreshLogs() {
    setLogsRefreshing(true);
    try {
      const [freshActivity, freshLogins, freshLastSeen] = await Promise.all([
        getFreshShared("activity-log", activityLog),
        getFreshShared("login-history", loginHistory),
        listLastSeen().catch(() => lastSeenMap || {}),
      ]);
      setActivityLog(freshActivity);
      setLoginHistory(freshLogins);
      setLastSeenMap(freshLastSeen);
    } finally {
      setLogsRefreshing(false);
    }
  }

  async function join(shift, targetMember) {
    const who = targetMember || identity;
    // Self-scheduling needs a phone on file (people running the shift need
    // to be able to reach whoever's assigned) - admins manually assigning
    // someone aren't blocked by this, since they may already have another
    // way to reach that person.
    if (!targetMember && !memberPhones[identity]?.trim()) {
      showToast("צריך למלא מספר טלפון לפני שיבוץ למשמרת - אפשר להשלים בלוח הבקרה האישי", "error");
      return;
    }
    const latest = await getLatestAssignments();
    const names = latest[shift.id] || [];
    if (names.includes(who)) return;
    if (!shift.noLimit && names.length >= shift.spots) return showToast("אין מקומות פנויים במשמרת הזו", "error");

    const conflict = SHIFTS.find(
      (s) => s.id !== shift.id && s.date === shift.date && (latest[s.id] || []).includes(who) && overlaps(s, shift)
    );
    if (conflict) return showToast(`יש חפיפה עם "${conflict.title}" באותו יום`, "error");

    const nextAssignments = { ...latest, [shift.id]: [...names, who] };
    persistAssignments(nextAssignments);
    showToast(targetMember ? `${who} שובץ/ה ל-${shift.title}` : `שובצת ל-${shift.title}`, "ok");
    if (targetMember) {
      logActivity("שיבוץ ידני", `${who} → ${shift.title} (${formatDate(shift.date)})`);
    } else {
      logActivity("שיבוץ עצמי למשמרת", `${who} → ${shift.title} (${formatDate(shift.date)})`);
      // Total unfilled shifts left across the whole schedule (same formula
      // as unfilledShiftsCount in the admin overview) - not just spots left
      // in this one shift, which is what was there before.
      const shiftsRemaining = SHIFTS.reduce(
        (sum, s) => (s.id === TEARDOWN_ID || s.noLimit ? sum : sum + Math.max(s.spots - (nextAssignments[s.id] || []).length, 0)),
        0
      );
      notifyOwner("shift_join", { shiftTitle: shift.title, shiftsRemaining });
    }
  }

  async function leave(shift, targetMember) {
    const who = targetMember || identity;
    const latest = await getLatestAssignments();
    const names = latest[shift.id] || [];
    persistAssignments({ ...latest, [shift.id]: names.filter((n) => n !== who) });
    logActivity(
      targetMember ? "ביטול שיבוץ ידני" : "ביטול שיבוץ עצמי",
      `${who} ← ${shift.title} (${formatDate(shift.date)})`
    );
  }

  async function toggleTeardownTask(task) {
    const latest = await getFreshShared("teardown-tasks", teardownTasks);
    const mine = latest[identity] || [];
    const wasChecked = mine.includes(task);
    const nextMine = wasChecked ? mine.filter((t) => t !== task) : [...mine, task];
    const next = { ...latest, [identity]: nextMine };
    setTeardownTasks(next);
    try {
      await window.storage.set("teardown-tasks", JSON.stringify(next), true);
      logActivity(wasChecked ? "ביטול משימת פירוק" : "סימון משימת פירוק", task);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setCampFeeValue(amount) {
    const val = Number(amount) || 0;
    setCampFee(val);
    try {
      await window.storage.set("camp-fee", JSON.stringify(val), true);
      showToast("דמי הקמפ עודכנו לכולם", "ok");
      logActivity("עדכון דמי קמפ אחידים", `₪${val}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addPayment(name, amount, date) {
    if (!amount) return;
    const latest = await getFreshShared("member-payments", memberPayments);
    const list = Array.isArray(latest[name]) ? latest[name] : [];
    const next = { ...latest, [name]: [...list, { id: Date.now().toString(), amount: Number(amount), date }] };
    setMemberPayments(next);
    try {
      await window.storage.set("member-payments", JSON.stringify(next), true);
      logActivity("רישום תשלום", `${name}: ₪${amount}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removePayment(name, id) {
    const latest = await getFreshShared("member-payments", memberPayments);
    const list = Array.isArray(latest[name]) ? latest[name] : [];
    const next = { ...latest, [name]: list.filter((p) => p.id !== id) };
    setMemberPayments(next);
    try {
      await window.storage.set("member-payments", JSON.stringify(next), true);
      logActivity("מחיקת תשלום", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // slot is 0 or 1 - each team has up to 2 lead slots, set independently so
  // picking the second lead doesn't disturb the first.
  async function setTeamLead(team, name, slot = 0) {
    const latest = await getFreshShared("team-leads", teamLeads);
    const current = latest[team] || [];
    const nextSlots = [current[0] || "", current[1] || ""];
    nextSlots[slot] = name || "";
    const cleaned = nextSlots.filter(Boolean);
    const next = { ...latest };
    if (cleaned.length) next[team] = cleaned; else delete next[team];
    setTeamLeadsState(next);
    try {
      await window.storage.set("team-leads", JSON.stringify(next), true);
      showToast(`מובילי ${team} עודכנו`, "ok");
      logActivity("שינוי מוביל צוות", `${team}: ${cleaned.join(", ") || "ללא מוביל"}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setPhone(name, phone) {
    const latest = await getFreshShared("member-phones", memberPhones);
    const changed = (latest[name] || "") !== (phone || "");
    const next = { ...latest, [name]: phone };
    setMemberPhones(next);
    try {
      await window.storage.set("member-phones", JSON.stringify(next), true);
      if (changed) logActivity("עדכון מספר טלפון", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setRideData(name, data) {
    const latest = await getFreshShared("ride-info", rideInfo);
    const next = { ...latest, [name]: data };
    setRideInfo(next);
    try {
      await window.storage.set("ride-info", JSON.stringify(next), true);
      logActivity("עדכון פרטי טרמפ", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Manual driver<->rider pairing, admin-only - keyed by driver name, each
  // holding the list of riders matched to them. Contact itself already
  // happens via the existing private-message button on each ride row; this
  // just keeps a persistent record so a match doesn't get lost/forgotten
  // once the conversation moves off-app (e.g. to a WhatsApp thread).
  async function matchRide(driverName, riderName) {
    if (!riderName) return;
    const latest = await getFreshShared("ride-matches", rideMatches);
    const current = latest[driverName] || [];
    if (current.includes(riderName)) return;
    const next = { ...latest, [driverName]: [...current, riderName] };
    setRideMatches(next);
    try {
      await window.storage.set("ride-matches", JSON.stringify(next), true);
      logActivity("שיוך טרמפ", `${riderName} → ${driverName}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function unmatchRide(driverName, riderName) {
    const latest = await getFreshShared("ride-matches", rideMatches);
    const current = latest[driverName] || [];
    const next = { ...latest, [driverName]: current.filter((n) => n !== riderName) };
    setRideMatches(next);
    try {
      await window.storage.set("ride-matches", JSON.stringify(next), true);
      logActivity("ביטול שיוך טרמפ", `${riderName} ← ${driverName}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setAllocationData(name, data) {
    const next = { ...allocationInfo, [name]: data };
    setAllocationInfo(next);
    try {
      await setMyAllocationInfo(name, data);
      logActivity("עדכון הקצאה", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setFeeOverride(name, amount) {
    const latest = await getFreshShared("fee-overrides", feeOverrides);
    const next = { ...latest };
    if (amount === "" || amount === null) delete next[name];
    else next[name] = Number(amount);
    setFeeOverrides(next);
    try {
      await window.storage.set("fee-overrides", JSON.stringify(next), true);
      showToast(`דמי הקמפ של ${name} עודכנו`, "ok");
      logActivity("דמי קמפ אישיים", `${name}: ${amount === "" || amount === null ? "בוטל, חוזר לברירת מחדל" : `₪${amount}`}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setEmail(name, email) {
    const latest = await getFreshShared("member-emails", memberEmails);
    const changed = (latest[name] || "") !== (email || "");
    const next = { ...latest, [name]: email };
    setMemberEmails(next);
    try {
      await window.storage.set("member-emails", JSON.stringify(next), true);
      if (changed) logActivity("עדכון אימייל", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Each member opts themselves in/out of receiving WhatsApp reminders -
  // separate from having a phone number on file, and separate from push
  // notifications. Admins can still see who's opted in on the dashboard,
  // and the WhatsApp reminder buttons only appear for members who have.
  async function setWhatsappConsent(name, consent) {
    const latest = await getFreshShared("whatsapp-consent", whatsappConsent);
    const next = { ...latest, [name]: consent };
    setWhatsappConsentState(next);
    try {
      await window.storage.set("whatsapp-consent", JSON.stringify(next), true);
      logActivity(consent ? "הצטרפות לתזכורות וואטסאפ" : "הסרה מתזכורות וואטסאפ", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Event announcements posted by an admin/owner go into everyone's "היומן
  // שלי" automatically. An event posted by a regular member doesn't - each
  // person opts in individually via this toggle, so the calendar doesn't
  // fill up with events nobody but the poster cares about.
  async function toggleMyCalendarAdd(announcementId) {
    const latest = await getFreshShared("personal-calendar-adds", personalCalendarAdds);
    const mine = latest[identity] || [];
    const wasAdded = mine.includes(announcementId);
    const nextMine = wasAdded ? mine.filter((id) => id !== announcementId) : [...mine, announcementId];
    const next = { ...latest, [identity]: nextMine };
    setPersonalCalendarAddsState(next);
    try {
      await window.storage.set("personal-calendar-adds", JSON.stringify(next), true);
      logActivity(wasAdded ? "הסרת אירוע מהיומן האישי" : "הוספת אירוע ליומן האישי", identity);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // RSVP on event announcements - "yes"/"no", click again to clear. Separate
  // from toggleMyCalendarAdd, which just controls whether it shows up in
  // "היומן שלי" - this is about who's actually planning to show up.
  async function rsvpEvent(annId, status) {
    const latest = await getFreshShared("announcements", announcements);
    let resultStatus = null;
    const next = latest.map((a) => {
      if (a.id !== annId) return a;
      const rsvps = { ...(a.rsvps || {}) };
      if (rsvps[identity] === status) delete rsvps[identity];
      else rsvps[identity] = status;
      resultStatus = rsvps[identity] || "בוטל";
      return { ...a, rsvps };
    });
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
      const ann = next.find((a) => a.id === annId);
      logActivity("אישור הגעה לאירוע", `${ann?.title || annId}: ${resultStatus}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function toggleChecklistItem(team, index) {
    const latest = await getFreshShared("team-checklists", checklistState);
    const current = latest[team] || {};
    const nowChecked = !current[index];
    const next = { ...latest, [team]: { ...current, [index]: nowChecked } };
    setChecklistState(next);
    try {
      await window.storage.set("team-checklists", JSON.stringify(next), true);
      const itemLabel = checklistItemsFor(team)[index] || `פריט ${index + 1}`;
      logActivity(nowChecked ? "סימון פריט צ׳ק-ליסט" : "ביטול סימון פריט צ׳ק-ליסט", `${team}: ${itemLabel}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function persistCustomChecklist(team, items) {
    const latest = await getFreshShared("team-checklist-items", customChecklists);
    const next = { ...latest, [team]: items };
    setCustomChecklists(next);
    try {
      await window.storage.set("team-checklist-items", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addChecklistItem(team, text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    await persistCustomChecklist(team, [...checklistItemsFor(team), trimmed]);
    logActivity("הוספת פריט לצ׳ק-ליסט", `${team}: ${trimmed}`);
  }

  async function editChecklistItem(team, index, text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    const items = checklistItemsFor(team);
    await persistCustomChecklist(team, items.map((it, i) => (i === index ? trimmed : it)));
    logActivity("עריכת פריט צ׳ק-ליסט", `${team}: ${trimmed}`);
  }

  // Removing an item shifts every later item's index down by one, so the
  // checked/unchecked state (keyed by index) has to shift with it, or
  // completed items would suddenly look unchecked (and vice versa).
  async function removeChecklistItem(team, index) {
    const items = checklistItemsFor(team);
    const removed = items[index];
    await persistCustomChecklist(team, items.filter((_, i) => i !== index));

    const latestState = await getFreshShared("team-checklists", checklistState);
    const current = latestState[team] || {};
    const nextTeamState = {};
    Object.entries(current).forEach(([i, checked]) => {
      const idx = Number(i);
      if (idx < index) nextTeamState[idx] = checked;
      else if (idx > index) nextTeamState[idx - 1] = checked;
    });
    const nextState = { ...latestState, [team]: nextTeamState };
    setChecklistState(nextState);
    try {
      await window.storage.set("team-checklists", JSON.stringify(nextState), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
    logActivity("מחיקת פריט מצ׳ק-ליסט", `${team}: ${removed || ""}`);
  }

  async function addTeam(name, desc) {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (TEAMS.some((t) => t.name === trimmed) || extraTeams.some((t) => t.name === trimmed)) {
      return showToast("הצוות כבר קיים", "error");
    }
    const next = [...extraTeams, { name: trimmed, desc: (desc || "").trim() }];
    setExtraTeams(next);
    try {
      await window.storage.set("extra-teams", JSON.stringify(next), true);
      showToast(`הצוות "${trimmed}" נוסף`, "ok");
      logActivity("הוספת צוות חדש", trimmed);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addMember(name, id) {
    if (allMembers.some((m) => m.name === name)) {
      showToast(`${name} כבר קיים/ת ברשימת חברי הקמפ`, "error");
      return;
    }
    // Write to the real `members` table first - it's the source of truth
    // the login screen and every other member-related screen relies on.
    // Only reflect the addition in the local/shared roster list once the
    // server actually has the row, so a failed insert (bad permissions,
    // network error, duplicate name, etc.) can never leave a "ghost"
    // member that shows up in pickers but doesn't really exist - that's
    // what was producing repeated/duplicate names and members the app
    // couldn't recognize later on.
    try {
      await addMemberRow(name, "member");
    } catch (err) {
      showToast(`הוספת ${name} נכשלה: ${err?.message || "שגיאה לא ידועה"}`, "error");
      return;
    }
    let idSaved = false;
    if (id) {
      try {
        await adminSetMemberId(name, id);
        idSaved = true;
      } catch (err) {
        showToast(`${name} נוסף/ה, אך שמירת ת.ז נכשלה: ${err?.message || "שגיאה לא ידועה"} - אפשר לנסות שוב מהרשימה`, "error");
      }
    }
    const latestExtra = await getFreshShared("extra-members", extraMembers);
    const next = [...latestExtra, { name, idOnFile: idSaved, role: "member" }];
    setExtraMembers(next);
    try {
      await window.storage.set("extra-members", JSON.stringify(next), true);
    } catch {
      showToast(`${name} נוסף/ה בשרת, אך רשימת חברי הקמפ במכשיר הזה לא התעדכנה - רענן/י את הדף`, "error");
      return;
    }
    if (!id || idSaved) {
      showToast(`${name} נוסף/ה לקמפ${idSaved ? " עם ת.ז" : ""}`, "ok");
    }
    logActivity("הוספת חבר קמפ", name);
  }

  async function removeMember(name) {
    const latest = await getFreshShared("removed-members", removedMembers);
    const next = [...latest, name];
    setRemovedMembers(next);
    try {
      await window.storage.set("removed-members", JSON.stringify(next), true);
      showToast(`${name} הוסר/ה מהקמפ`, "ok");
      logActivity("הסרת חבר קמפ", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function restoreMember(name) {
    const latest = await getFreshShared("removed-members", removedMembers);
    const next = latest.filter((n) => n !== name);
    setRemovedMembers(next);
    try {
      await window.storage.set("removed-members", JSON.stringify(next), true);
      showToast(`${name} שוחזר/ה`, "ok");
      logActivity("שחזור חבר קמפ", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Owner-only: set/replace the verified ID for a member who's already on
  // the roster (e.g. was added without one). Re-fetches the real DB state
  // afterward instead of guessing locally.
  async function editMemberId(name, idNumber) {
    try {
      await adminSetMemberId(name, idNumber);
      const idSet = await listMembersWithIdOnFile().catch(() => idOnFileNames);
      setIdOnFileNames(idSet);
      showToast(`ת.ז עודכנה עבור ${name}`, "ok");
      logActivity("עדכון ת.ז לחבר קמפ", name);
    } catch (err) {
      showToast(`עדכון ת.ז נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    }
  }

  // Owner-only: clears a member's login so they have to go through "כניסה
  // ראשונה" again (re-verified against their ID) - the secure stand-in for
  // an admin resetting/knowing someone's password directly.
  async function resetMemberAccess(name) {
    try {
      await adminResetMemberAccess(name);
      showToast(`הגישה של ${name} אופסה - הם יצטרכו לעבור "כניסה ראשונה" מחדש`, "ok");
      logActivity("איפוס גישה לחבר קמפ", name);
    } catch (err) {
      showToast(`האיפוס נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    }
  }

  // Owner-only: promote a member to admin or demote an admin back to
  // member. Server-side checked against the caller's real role, so this
  // is a UI convenience, not the actual security boundary.
  async function setMemberRole(name, role) {
    try {
      await adminSetMemberRole(name, role);
      setDbRoles((prev) => ({ ...prev, [name]: role }));
      showToast(role === "admin" ? `${name} הפך/ה למנהל/ת` : `${name} הוסר/ה מהנהלה`, "ok");
      logActivity(role === "admin" ? "מינוי מנהל/ת" : "הסרת מנהל/ת", name);
    } catch (err) {
      showToast(`השינוי נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    }
  }

  // Owner-only: renames a member everywhere (members table + every FK-linked
  // table + every kv_store blob that stores their name, and their login
  // email if they already have an account - all handled server-side).
  // Reloads shared data afterward instead of patching local state piecemeal,
  // since a rename touches too many independent pieces of state to track by hand.
  async function renameMember(oldName, newName) {
    try {
      await adminRenameMember(oldName, newName);
      if (loadSharedDataRef.current) await loadSharedDataRef.current();
      const [idSet, pushSet] = await Promise.all([
        listMembersWithIdOnFile().catch(() => idOnFileNames),
        listMembersWithPushEnabled().catch(() => pushEnabledNames),
      ]);
      setIdOnFileNames(idSet);
      setPushEnabledNames(pushSet);
      showToast(`${oldName} שונה ל-${newName}`, "ok");
      logActivity("שינוי שם חבר קמפ", `${oldName} → ${newName}`);
    } catch (err) {
      const msg = err?.message === "name_taken" ? "השם החדש כבר תפוס" : (err?.message || "שגיאה לא ידועה");
      showToast(`שינוי השם נכשל: ${msg}`, "error");
    }
  }

  // Admin/owner-only: fires an ad-hoc push notification right now (e.g. an
  // event reminder), independent of the automatic push that goes out when
  // a new announcement/poll is posted.
  async function sendReminder() {
    if (!reminderTitle.trim() || !reminderMessage.trim()) return;
    setSendingReminder(true);
    try {
      const result = await sendEventReminderPush(reminderTitle.trim(), reminderMessage.trim());
      const sent = result?.sent ?? 0;
      if (sent > 0) {
        showToast(`התראה נשלחה ל-${sent} מכשירים`, "ok");
      } else {
        showToast("לא נשלחה אף התראה בפועל - כנראה שאף אחד עדיין לא אישר התראות דחיפה", "error");
      }
      logActivity("שליחת תזכורת התראה", `${reminderTitle.trim()} (נשלח ל-${sent})`);
      setReminderTitle("");
      setReminderMessage("");
      setShowReminderForm(false);
    } catch (err) {
      showToast(`שליחת ההתראה נכשלה: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setSendingReminder(false);
    }
  }

  async function addAnnouncement(text, eventInfo, audience) {
    if (!text.trim()) return;
    const latest = await getFreshShared("announcements", announcements);
    const next = [{
      id: Date.now().toString(), author: identity, text: text.trim(), ts: Date.now(), replies: [],
      isEvent: !!eventInfo, eventDate: eventInfo?.eventDate || "", eventTime: eventInfo?.eventTime || "",
      audience: audience || "all",
    }, ...latest];
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
      logActivity("פרסום מודעה", text.trim().slice(0, 80));
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeAnnouncement(id) {
    const latest = await getFreshShared("announcements", announcements);
    const removed = latest.find((a) => a.id === id);
    const next = latest.filter((a) => a.id !== id);
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
      logActivity("מחיקת מודעה", (removed?.text || "").slice(0, 80));
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addReply(annId, text) {
    if (!text.trim()) return;
    const latest = await getFreshShared("announcements", announcements);
    const next = latest.map((a) =>
      a.id === annId
        ? { ...a, replies: [...(a.replies || []), { id: Date.now().toString(), author: identity, text: text.trim(), ts: Date.now() }] }
        : a
    );
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
      logActivity("תגובה למודעה", text.trim().slice(0, 80));
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Toggles the current member's reaction of this emoji on/off - like
  // WhatsApp's message reactions, one emoji-per-person per announcement
  // (picking a different emoji swaps it rather than stacking multiple).
  async function toggleReaction(annId, emoji) {
    const latest = await getFreshShared("announcements", announcements);
    const next = latest.map((a) => {
      if (a.id !== annId) return a;
      const reactions = { ...(a.reactions || {}) };
      const alreadyHasThis = (reactions[emoji] || []).includes(identity);
      Object.keys(reactions).forEach((key) => {
        reactions[key] = reactions[key].filter((n) => n !== identity);
        if (reactions[key].length === 0) delete reactions[key];
      });
      if (!alreadyHasThis) {
        reactions[emoji] = [...(reactions[emoji] || []), identity];
      }
      return { ...a, reactions };
    });
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
    // Deliberately not logged to activity history - emoji reactions are
    // too frequent/low-signal to be useful in an audit log.
  }

  async function setEmergencyData(name, data) {
    const next = { ...emergencyInfo, [name]: data };
    setEmergencyInfo(next);
    try {
      await setMyEmergencyInfo(name, data);
      logActivity("עדכון פרטי חירום", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Prints (or "saves as PDF" via the browser's print dialog) every
  // member's emergency card in one document - for the medical team to
  // print out before the event, since the desert site itself has no signal
  // to load the app live in an emergency.
  function exportEmergencyCardsPdf() {
    const win = window.open("", "_blank");
    if (!win) return showToast("נחסמה פתיחת חלון - יש לאפשר חלונות קופצים לאתר", "error");
    const cards = allMembers.map((m) => {
      const d = emergencyInfo[m.name] || {};
      return `<div class="card">
        <h3>${escapeHtml(m.name)}</h3>
        <div><b>איש קשר לחירום:</b> ${escapeHtml(d.contactName || "—")}${d.contactPhone ? ` · ${escapeHtml(d.contactPhone)}` : ""}</div>
        <div><b>אלרגיות:</b> ${escapeHtml(d.allergies || "—")}</div>
        <div><b>מגבלות רפואיות:</b> ${escapeHtml(d.medical || "—")}</div>
        <div><b>תזונה:</b> ${escapeHtml(d.dietary || "—")}</div>
      </div>`;
    }).join("");
    win.document.write(`<!doctype html>
<html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>כרטיסי חירום - Afterglow</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  .card { border: 1px solid #ccc; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
  .card h3 { margin: 0 0 6px; font-size: 15px; }
  .card div { font-size: 13px; margin-bottom: 2px; line-height: 1.5; }
</style>
</head><body>
<h1>כרטיסי חירום - Afterglow (${escapeHtml(new Date().toLocaleDateString("he-IL"))})</h1>
${cards}
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  // Admin-only: a printable (save-as-PDF) roster of every shift and who's
  // in it, with a summary up top. "Shifts" and "volunteers" are deliberately
  // different counts - a shift with 5 spots and 3 people signed up is still
  // 1 shift, but 3 volunteers; "open"/"filled" are the same two numbers
  // restated as spots rather than people.
  function exportShiftsPdf() {
    const win = window.open("", "_blank");
    if (!win) return showToast("נחסמה פתיחת חלון - יש לאפשר חלונות קופצים לאתר", "error");

    // Teardown is excluded from the summary counts, same as
    // unfilledShiftsCount/openShiftsCount elsewhere - it isn't a normal
    // slot-limited shift people opt into (spots = every member, "everyone
    // participates"), so counting its ~30 nominally-"open" spots would
    // swamp the real numbers from the actual self-scheduled shifts.
    const countedShifts = SHIFTS.filter((s) => s.id !== TEARDOWN_ID);
    const totalShifts = countedShifts.length;
    const totalVolunteers = countedShifts.reduce((s, sh) => s + (assignments[sh.id] || []).length, 0);
    // Uncapped shifts (noLimit) don't have a meaningful "people needed"
    // number, so they're left out of the spots/open-spots math the same
    // way teardown is - but they still count toward totalShifts/totalVolunteers above.
    const cappedShifts = countedShifts.filter((s) => !s.noLimit);
    const totalSpots = cappedShifts.reduce((s, sh) => s + sh.spots, 0);
    const cappedVolunteers = cappedShifts.reduce((s, sh) => s + (assignments[sh.id] || []).length, 0);
    const openSpots = Math.max(totalSpots - cappedVolunteers, 0);

    const phases = [...new Set(SHIFTS.map((s) => s.phase))];
    const sections = phases.map((phase) => {
      const phaseShifts = SHIFTS.filter((s) => s.phase === phase);
      const dates = [...new Set(phaseShifts.map((s) => s.date))];
      const dateBlocks = dates.map((date) => {
        const dayShifts = phaseShifts.filter((s) => s.date === date);
        const rows = dayShifts.map((s) => {
          if (s.id === TEARDOWN_ID) {
            return `<tr>
              <td>${escapeHtml(s.title)}</td>
              <td>כולם</td>
              <td>${s.start}–${s.end}</td>
              <td>כולם</td>
              <td></td>
            </tr>`;
          }
          const names = assignments[s.id] || [];
          const namesHtml = names.length > 0 ? names.map((n) => escapeHtml(n)).join(", ") : "";
          return `<tr>
            <td>${escapeHtml(s.title)}</td>
            <td>${escapeHtml(s.team)}</td>
            <td>${s.noTime ? "" : `${s.start}–${s.end}`}</td>
            <td>${s.noLimit ? `${names.length} (ללא הגבלה)` : `${names.length}/${s.spots}`}</td>
            <td>${namesHtml}</td>
          </tr>`;
        }).join("");

        // End-of-day roundup: which of that day's shifts are fully staffed
        // vs. still need people. Teardown ("everyone participates") and
        // noLimit shifts don't have a meaningful "missing" state, so they're
        // always counted as covered.
        const covered = [];
        const missing = [];
        dayShifts.forEach((s) => {
          if (s.id === TEARDOWN_ID || s.noLimit) {
            covered.push(escapeHtml(s.title));
            return;
          }
          const count = (assignments[s.id] || []).length;
          if (count >= s.spots) covered.push(escapeHtml(s.title));
          else missing.push(`${escapeHtml(s.title)} (חסרים ${s.spots - count})`);
        });
        const daySummary = `<div class="day-summary">
          <div class="ok">✓ מאויש: ${covered.length > 0 ? covered.join(", ") : "-"}</div>
          <div class="missing">✗ חסר איוש: ${missing.length > 0 ? missing.join(", ") : "אין - הכל מאויש"}</div>
        </div>`;

        return `<h3>${escapeHtml(formatDate(date))}</h3>
          <table>
            <thead><tr><th>משמרת</th><th>צוות</th><th>שעות</th><th>איוש</th><th>מי רשום</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          ${daySummary}`;
      }).join("");
      return `<h2>${escapeHtml(phase)}</h2>${dateBlocks}`;
    }).join("");

    win.document.write(`<!doctype html>
<html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>לוח משמרות - Afterglow</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 14px 0 6px; color: #555; }
  .summary { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .summary div { border: 1px solid #ccc; border-radius: 8px; padding: 8px 14px; font-size: 12px; }
  .summary b { display: block; font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; break-inside: avoid; page-break-inside: avoid; }
  th, td { border: 1px solid #ddd; padding: 4px 8px; font-size: 11px; text-align: right; vertical-align: top; }
  th { background: #f4f4f4; }
  .day-summary { font-size: 10.5px; margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
  .day-summary .ok { color: #1a7a3c; }
  .day-summary .missing { color: #b8321f; margin-top: 2px; }
</style>
</head><body>
<h1>לוח משמרות - Afterglow (${escapeHtml(new Date().toLocaleDateString("he-IL"))})</h1>
<div class="summary">
  <div><b>${totalShifts}</b>כמות משמרות</div>
  <div><b>${totalSpots}</b>כמה אנשים סה״כ צריך</div>
  <div><b>${totalVolunteers}</b>כמות מתנדבים בכל המשמרות</div>
  <div><b>${openSpots}</b>מקומות פנויים</div>
  <div><b>${cappedVolunteers}</b>מקומות תפוסים</div>
</div>
${sections}
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  async function createPoll(question, options) {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) {
      return showToast("צריך שאלה ולפחות 2 אפשרויות", "error");
    }
    const latest = await getFreshShared("polls", polls);
    const next = [{ id: Date.now().toString(), question: question.trim(), options: options.filter((o) => o.trim()), responses: {}, ts: Date.now() }, ...latest];
    setPolls(next);
    try {
      await window.storage.set("polls", JSON.stringify(next), true);
      showToast("הסקר פורסם", "ok");
      logActivity("פרסום סקר", question.trim());
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removePoll(id) {
    const latest = await getFreshShared("polls", polls);
    const removed = latest.find((p) => p.id === id);
    const next = latest.filter((p) => p.id !== id);
    setPolls(next);
    try {
      await window.storage.set("polls", JSON.stringify(next), true);
      logActivity("מחיקת סקר", removed?.question || "");
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function respondToPoll(pollId, optionIndex) {
    const latest = await getFreshShared("polls", polls);
    const next = latest.map((p) =>
      p.id === pollId ? { ...p, responses: { ...p.responses, [identity]: optionIndex } } : p
    );
    setPolls(next);
    try {
      await window.storage.set("polls", JSON.stringify(next), true);
      const poll = next.find((p) => p.id === pollId);
      logActivity("מענה לסקר", `${poll?.question || pollId}: ${poll?.options?.[optionIndex] ?? optionIndex}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function sendPrivateMessage(to, text) {
    if (!to || !text.trim()) return;
    try {
      await sendPrivateMessageRow(identity, to, text.trim());
      const fresh = await listMyPrivateMessages();
      setPrivateMessages(fresh);
      showToast(`ההודעה נשלחה ל-${to}`, "ok");
      // Logs that a message was sent, never the content - private_messages
      // RLS restricts the text itself to sender/recipient only, and the
      // activity log shouldn't be a backdoor around that.
      logActivity("שליחת הודעה פרטית", `${identity} → ${to}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removePrivateMessage(id) {
    try {
      await deletePrivateMessageRow(id);
      const fresh = await listMyPrivateMessages();
      setPrivateMessages(fresh);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  function teamMembers(teamName) {
    const teamShiftIds = SHIFTS.filter((s) => s.team === teamName).map((s) => s.id);
    const names = new Set();
    teamShiftIds.forEach((id) => {
      (id === TEARDOWN_ID ? allMembers.map((m) => m.name) : (assignments[id] || [])).forEach((n) => names.add(n));
    });
    (manualTeamMembers[teamName] || []).forEach((n) => names.add(n));
    return [...names].filter((n) => !removedMembers.includes(n));
  }
  function isManualTeamMember(teamName, name) {
    return (manualTeamMembers[teamName] || []).includes(name);
  }
  // The `team_members` table row is what actually gates budget-write
  // permission - the kv "manual-team-members" list is just what's shown in
  // the UI. Writing the table row first (and only updating the UI list once
  // it succeeds) means the UI never shows someone as a team member with a
  // permission they don't really have, in either direction.
  async function addManualTeamMember(teamName, name) {
    if (!name) return;
    const latest = await getFreshShared("manual-team-members", manualTeamMembers);
    const current = latest[teamName] || [];
    if (current.includes(name)) return;
    try {
      await addTeamMemberRow(teamName, name);
      const next = { ...latest, [teamName]: [...current, name] };
      setManualTeamMembers(next);
      await window.storage.set("manual-team-members", JSON.stringify(next), true);
      logActivity("שיוך ידני לצוות", `${name} → ${teamName}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }
  async function removeManualTeamMember(teamName, name) {
    const latest = await getFreshShared("manual-team-members", manualTeamMembers);
    const current = latest[teamName] || [];
    try {
      await removeTeamMemberRow(teamName, name);
      const next = { ...latest, [teamName]: current.filter((n) => n !== name) };
      setManualTeamMembers(next);
      await window.storage.set("manual-team-members", JSON.stringify(next), true);
      logActivity("הסרת שיוך ידני לצוות", `${name} ← ${teamName}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }
  function teamLeadsOf(teamName) {
    return (teamLeads[teamName] || [])
      .map((name) => allMembers.find((m) => m.name === name))
      .filter(Boolean);
  }

  function isInTeam(teamName) {
    return (teamLeads[teamName] || []).includes(identity) || teamMembers(teamName).includes(identity);
  }

  function teamStats(team) {
    const teamShifts = SHIFTS.filter((s) => s.team === team && s.id !== TEARDOWN_ID);
    const unfilled = teamShifts.reduce((sum, s) => (s.noLimit ? sum : sum + Math.max(s.spots - (assignments[s.id] || []).length, 0)), 0);
    const planned = Number(categoryBudgets[team]) || 0;
    // Actual spend lives in two places: the legacy budgetItems list (older
    // planned-line-items, matched by `category`) and budgetExpenses (the
    // list the team dashboard's own quick-add form writes to, matched by
    // `allocation`) - both need to be counted or a team lead's own expense
    // entries silently wouldn't show up in their own "paid so far" stat.
    const legacyPaid = budgetItems.filter((b) => b.category === team).reduce((s, b) => s + (Number(b.paid) || 0), 0);
    const expensesPaid = budgetExpenses.filter((e) => e.allocation === team).reduce((s, e) => s + expenseAmounts(e).paid, 0);
    const paid = legacyPaid + expensesPaid;
    return { totalShifts: teamShifts.length, unfilled, planned, paid };
  }

  const allMembers = useMemo(() => {
    const byName = new Map();
    [...MEMBERS, ...extraMembers]
      .filter((m) => !removedMembers.includes(m.name))
      .forEach((m) => {
        // Defensive de-dup: collapse repeated entries for the same name
        // (e.g. left over from a previous failed add-member attempt)
        // so the roster/login screen never lists someone more than once.
        const existing = byName.get(m.name);
        if (!existing || (!existing.idOnFile && m.idOnFile)) byName.set(m.name, m);
      });
    return [...byName.values()]
      .map((m) => ({
        ...m,
        role: dbRoles[m.name] || m.role,
        // Once we've fetched real DB state, it wins over the static/optimistic
        // flag - that flag is what went stale and caused the ID-mismatch bug.
        idOnFile: idOnFileNames ? idOnFileNames.has(m.name) : m.idOnFile,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [extraMembers, removedMembers, dbRoles, idOnFileNames]);

  const allBudgetCategories = useMemo(
    () => [...BUDGET_CATEGORIES, ...extraBudgetCategories],
    [extraBudgetCategories]
  );
  const allTeams = useMemo(() => [...TEAMS, ...extraTeams], [extraTeams]);
  function checklistItemsFor(team) {
    return customChecklists[team] || TEAM_CHECKLISTS[team] || [];
  }

  // login-history only ever gets a new entry from an explicit credential
  // login (first-time setup or a password re-entry) - once a member's PWA
  // session is just silently restored from then on (the normal case for
  // almost everyone, since nothing ever forces a fresh password entry),
  // they never get a second entry there even though they're actively using
  // the app. last_seen (in lastSeenMap) updates on every single app open,
  // restore included, so anyone with a last-seen timestamp has definitely
  // logged in before regardless of what login-history shows - without this,
  // an active member could still show as "never entered the app".
  const membersEverLoggedIn = useMemo(() => {
    const names = new Set(loginHistory.map((l) => l.name));
    if (lastSeenMap) {
      Object.keys(lastSeenMap).forEach((name) => {
        if (lastSeenMap[name]) names.add(name);
      });
    }
    return names;
  }, [loginHistory, lastSeenMap]);
  const membersNotYetLoggedIn = useMemo(
    () => allMembers.filter((m) => !membersEverLoggedIn.has(m.name)),
    [allMembers, membersEverLoggedIn]
  );

  const currentMember = allMembers.find((m) => m.name === identity);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;
  const myLeadTeam = !isAdmin ? Object.keys(teamLeads).find((t) => (teamLeads[t] || []).includes(identity)) : null;
  const canEditBudget = isAdmin || !!myLeadTeam;
  const canManageFinances = isAdmin || isInTeam("צוות תקציב");

  // Everyone must fill these in before using the rest of the app - see the
  // gating effect further down. "Filled" means "answered", not "answered
  // yes" - e.g. hasCar === "no" counts, an unanswered hasCar doesn't.
  const missingProfileFields = useMemo(() => {
    if (!identity) return [];
    const missing = [];
    if (!memberPhones[identity]?.trim()) missing.push("טלפון");
    if (!memberEmails[identity]?.trim()) missing.push("אימייל");
    const emg = emergencyInfo[identity] || {};
    if (!emg.contactName?.trim() || !emg.contactPhone?.trim()) missing.push("פרטי חירום");
    const ride = rideInfo[identity] || {};
    if (ride.hasCar !== "yes" && ride.hasCar !== "no") missing.push("התניידות");
    const alloc = allocationInfo[identity] || {};
    if (alloc.hasAllocation !== "yes" && alloc.hasAllocation !== "no") missing.push("הקצאה");
    if (pushStatus === "default" && !pushDecisionMade) missing.push("החלטה לגבי התראות");
    return missing;
  }, [identity, memberPhones, memberEmails, emergencyInfo, rideInfo, allocationInfo, pushStatus, pushDecisionMade]);
  const profileComplete = missingProfileFields.length === 0;

  // One-time "welcome" intro for first-time visitors - dismissed state
  // lives per-device in localStorage (not shared), so it never reappears
  // on this device once closed, but a fresh device/browser shows it again.
  const [welcomeDismissed, setWelcomeDismissed] = useState(true);
  useEffect(() => {
    if (identity) {
      try { setWelcomeDismissed(!!localStorage.getItem(`welcome-seen-${identity}`)); } catch { setWelcomeDismissed(true); }
    }
  }, [identity]);
  function dismissWelcome() {
    setWelcomeDismissed(true);
    setOpenPersonalSection("details");
    try { localStorage.setItem(`welcome-seen-${identity}`, "1"); } catch {}
    // Force the section open (not just relying on it already being
    // auto-open) and scroll to it - double rAF so this runs after React
    // has actually committed and painted the DOM change, which a fixed
    // setTimeout delay isn't guaranteed to wait long enough for.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById("personal-details-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // Tabs that are safe to browse even with a missing profile field - they're
  // read-only/informational, or (for shifts) the one action inside them that
  // actually needs a field (self-joining a shift needs a phone number) is
  // gated on its own in join(), not by blocking the whole tab. Everything
  // else stays gated since it either shows/collects personal data
  // (contacts, teams, rides) or needs the profile to be meaningful (finances,
  // budget, equipment).
  const PROFILE_GATE_EXEMPT_TABS = ["dashboard-personal", "shifts", "board"];

  // Keep anyone with missing profile fields on their personal dashboard
  // until they've filled everything in - except the exempt tabs above,
  // which they can browse right away.
  useEffect(() => {
    if (!loading && identity && !profileComplete && tab !== "dashboard-personal" && !PROFILE_GATE_EXEMPT_TABS.includes(tab)) {
      setTab("dashboard-personal");
      showToast("כדי להמשיך להשתמש באפליקציה צריך קודם למלא את הפרטים החסרים כאן", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, identity, profileComplete, tab]);

  // Pull fresh activity/login/last-seen data every time the owner opens the
  // "יומנים" tab, so it reflects what's happened since the page was loaded
  // instead of a stale snapshot from then.
  useEffect(() => {
    if (adminSubTab === "logs" && isOwner) {
      refreshLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSubTab, isOwner]);

  // Fetch the vegetarian/vegan aggregate counts whenever the shopping list
  // tab is opened - fresh every visit rather than caching it forever, since
  // dietary preferences can change as members fill in emergency info.
  useEffect(() => {
    if (tab === "shopping" && identity) {
      getDietaryPreferenceCounts().then(setDietaryCounts).catch(() => setDietaryCounts(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, identity]);

  // "New on the board" indicator - per-device (not shared), so it doesn't
  // need a new table: just remembers when this browser last had the board
  // tab open and compares that against the newest announcement/poll.
  const [lastViewedBoard, setLastViewedBoard] = useState(() => {
    try { return Number(localStorage.getItem("board-last-viewed")) || 0; } catch { return 0; }
  });
  useEffect(() => {
    if (tab === "board") {
      const now = Date.now();
      setLastViewedBoard(now);
      try { localStorage.setItem("board-last-viewed", String(now)); } catch {}
    }
  }, [tab]);
  const hasNewBoardItems = useMemo(() => {
    if (!identity) return false;
    const unansweredPoll = polls.some((pl) => pl.responses[identity] === undefined);
    const latestTs = Math.max(0, ...announcements.map((a) => a.ts || 0), ...polls.map((p) => p.ts || 0));
    return unansweredPoll || latestTs > lastViewedBoard;
  }, [polls, announcements, identity, lastViewedBoard]);

  const myShifts = useMemo(
    () => SHIFTS.filter((s) => isJoined(s.id)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [assignments, identity]
  );
  // Event announcements for "היומן שלי": admin/owner-posted events are
  // automatic for everyone, member-posted events only show up for people
  // who explicitly opted in via "הוסף ליומן שלי" on the announcement.
  const myCalendarEvents = useMemo(() => {
    const mine = personalCalendarAdds[identity] || [];
    return announcements
      .filter((a) => a.isEvent && (a.eventDate || a.eventTime))
      .filter((a) => {
        const authorRole = allMembers.find((m) => m.name === a.author)?.role;
        return authorRole === "admin" || authorRole === "owner" || mine.includes(a.id);
      })
      .sort((a, b) => (a.eventDate || "").localeCompare(b.eventDate || ""));
  }, [announcements, personalCalendarAdds, identity, allMembers]);
  // Counts open seats, not under-staffed shifts - a shift that needs 2
  // people and has 0 counts as 2, with 1 it counts as 1, matching how
  // many more people are actually still needed.
  const openShiftsCount = useMemo(
    () => SHIFTS.reduce((sum, s) => (s.id === TEARDOWN_ID || s.noLimit ? sum : sum + Math.max(s.spots - (assignments[s.id] || []).length, 0)), 0),
    [assignments]
  );
  const unfilledShiftsCount = useMemo(
    () => SHIFTS.reduce((sum, s) => (s.id === TEARDOWN_ID || s.noLimit ? sum : sum + Math.max(s.spots - (assignments[s.id] || []).length, 0)), 0),
    [assignments]
  );
  const membersWithoutShift = useMemo(
    () => allMembers.filter((m) => !SHIFTS.some((s) => s.id !== TEARDOWN_ID && (assignments[s.id] || []).includes(m.name))).length,
    [assignments, allMembers]
  );
  // Same "count both budgetItems and budgetExpenses" fix as teamStats -
  // this used to only look at the legacy list, so a category whose actual
  // spend was entered entirely through the current expense form would
  // never trip the overrun alert no matter how far over it went.
  const categorySpend = useMemo(() => {
    const map = {};
    allBudgetCategories.forEach((cat) => {
      const legacyPaid = budgetItems.filter((b) => b.category === cat).reduce((s, b) => s + (Number(b.paid) || 0), 0);
      const expensesPaid = budgetExpenses.filter((e) => e.allocation === cat).reduce((s, e) => s + expenseAmounts(e).paid, 0);
      map[cat] = legacyPaid + expensesPaid;
    });
    return map;
  }, [budgetItems, budgetExpenses, allBudgetCategories]);
  const overBudgetCategories = useMemo(() => {
    return allBudgetCategories.filter((cat) => {
      const planned = Number(categoryBudgets[cat]) || 0;
      return planned > 0 && categorySpend[cat] > planned;
    });
  }, [categoryBudgets, categorySpend, allBudgetCategories]);
  // "Approaching" the budget (85%+) but not over it yet - a separate,
  // softer warning so admins/team leads get a heads-up before it's too late.
  const nearBudgetCategories = useMemo(() => {
    return allBudgetCategories.filter((cat) => {
      const planned = Number(categoryBudgets[cat]) || 0;
      if (!planned) return false;
      const ratio = categorySpend[cat] / planned;
      return ratio >= 0.85 && ratio <= 1;
    });
  }, [categoryBudgets, categorySpend, allBudgetCategories]);

  const budgetTotals = useMemo(() => {
    const planned = Object.values(categoryBudgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
    let committed = budgetItems.reduce((sum, b) => sum + (Number(b.committed) || 0), 0);
    let paid = budgetItems.reduce((sum, b) => sum + (Number(b.paid) || 0), 0);
    budgetExpenses.forEach((e) => {
      const amounts = expenseAmounts(e);
      committed += amounts.committed;
      paid += amounts.paid;
    });
    return { planned, committed, paid, remaining: planned - committed };
  }, [budgetItems, budgetExpenses, categoryBudgets]);

  const paymentTotals = useMemo(() => {
    let due = 0;
    let paid = 0;
    allMembers.forEach((m) => {
      due += feeOverrides[m.name] !== undefined ? Number(feeOverrides[m.name]) : campFee;
      const list = memberPayments[m.name];
      paid += (Array.isArray(list) ? list : []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    });
    return { due, paid, remaining: due - paid };
  }, [memberPayments, campFee, allMembers, feeOverrides]);

  // N (חברי מחנה) is derived from the real roster, not typed in by hand -
  // see runBudgetEngine above. The optional "what if" toggle below runs the
  // exact same engine a second time with a hypothetical headcount, so admins
  // can compare "cost now" vs. "cost at X members" without losing the real number.
  const engine = useMemo(
    () => runBudgetEngine(budgetParams, allMembers.length, budgetExpenses, paymentTotals),
    [budgetParams, budgetExpenses, paymentTotals, allMembers.length]
  );
  const whatIfN = Number(budgetParams.global.whatIfN) || 0;
  const whatIfEngine = useMemo(() => {
    if (!budgetParams.global.whatIfEnabled || whatIfN <= 0) return null;
    return runBudgetEngine(budgetParams, whatIfN, budgetExpenses, paymentTotals);
  }, [budgetParams, budgetExpenses, paymentTotals, whatIfN]);

  const offeringRides = allMembers.filter((m) => {
    const d = rideInfo[m.name];
    return d && d.hasCar === "yes" && d.offerRide === "yes";
  });
  const offeringCargoSpace = allMembers.filter((m) => {
    const d = rideInfo[m.name];
    return d && d.hasCar === "yes" && d.hasCargoSpace === "yes";
  });
  const towingCapable = allMembers.filter((m) => {
    const d = rideInfo[m.name];
    return d && d.hasCar === "yes" && (d.hasTowHitch === "yes" || d.hasTrailer === "yes");
  });
  const lookingForRide = allMembers.filter((m) => {
    const d = rideInfo[m.name];
    return d && d.hasCar === "no" && d.hasWay === "no";
  });
  const membersWithoutRideInfo = useMemo(
    () => allMembers.filter((m) => !rideInfo[m.name]).length,
    [allMembers, rideInfo]
  );

  const membersWithAllocation = allMembers.filter((m) => allocationInfo[m.name]?.hasAllocation === "yes");
  const membersUsedAllocation = membersWithAllocation.filter((m) => allocationInfo[m.name]?.used === "yes");
  const membersPendingAllocation = membersWithAllocation.filter((m) => allocationInfo[m.name]?.used !== "yes");
  const membersWithExtraAllocation = allMembers.filter((m) => allocationInfo[m.name]?.hasExtra === "yes");
  const membersWithoutAllocationInfo = allMembers.filter((m) => !allocationInfo[m.name]);

  const myPrivateMessages = privateMessages
    .filter((m) => m.to === identity || m.from === identity)
    .sort((a, b) => b.ts - a.ts);

  const dashboardTabs = useMemo(() => {
    if (isAdmin) {
      return [
        { id: "dashboard-admin", label: "לוח בקרה מנהל" },
        { id: "dashboard-personal", label: "לוח בקרה אישי" },
      ];
    }
    if (myLeadTeam) {
      return [
        { id: "dashboard-team", label: "לוח בקרה צוות" },
        { id: "dashboard-personal", label: "לוח בקרה אישי" },
      ];
    }
    return [{ id: "dashboard-personal", label: "לוח בקרה" }];
  }, [isAdmin, myLeadTeam]);

  // Primary nav - "מקובץ למעלה" layout: a pin button for the role
  // dashboard (admin/team lead only - a plain member has none, their
  // personal dashboard is just the first item in "אישי"), then 2 category
  // pills ("אישי"/"קמפ") that expand an inline panel below when tapped.
  const personalDashboardTab = dashboardTabs.find((t) => t.id === "dashboard-personal");
  const roleDashboardTab = dashboardTabs.find((t) => t.id !== "dashboard-personal");
  const navPersonalTabs = [
    { id: "dashboard-personal", label: personalDashboardTab?.label || "לוח בקרה אישי", icon: Home },
    { id: "shifts", label: "שיבוץ עצמי", icon: CalendarDays },
    { id: "board", label: "לוח מודעות", icon: Megaphone },
  ];
  const navCampTabs = [
    { id: "budget", label: "הוצאות", icon: Wallet },
    ...(canManageFinances ? [{ id: "finances", label: "כספים", icon: CreditCard }] : []),
    ...(isAdmin ? [{ id: "allocations", label: "לוח הקצאות", icon: Ticket }] : []),
    { id: "teams", label: "צוותים", icon: Tent },
    { id: "rides", label: "התניידות", icon: Car },
    { id: "contacts", label: "חברי קמפ", icon: Phone },
    { id: "equipment", label: "ציוד קמפ", icon: Package },
    { id: "shopping", label: "קניות מטבח", icon: ShoppingCart },
  ];
  function renderNavItem(t, fullWidth) {
    const locked = !profileComplete && !PROFILE_GATE_EXEMPT_TABS.includes(t.id);
    const active = tab === t.id;
    return (
      <button
        key={t.id}
        onClick={() => {
          if (locked) { showToast("כדי להמשיך להשתמש באפליקציה צריך קודם למלא את הפרטים החסרים בלוח הבקרה האישי", "error"); return; }
          setTab(t.id);
          setExpandedNavCategory(null);
        }}
        title={locked ? "יש להשלים קודם את הפרטים האישיים" : undefined}
        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors relative text-center"
        style={{
          flex: fullWidth ? "1 1 100%" : "1 1 calc(50% - 4px)",
          background: active ? COLORS.accent : COLORS.bg,
          color: active ? COLORS.bg : COLORS.text,
          border: `1px solid ${active ? COLORS.accent : COLORS.divider}`,
          opacity: locked ? 0.45 : 1,
          cursor: locked ? "not-allowed" : "pointer",
        }}
      >
        {locked ? <LockKeyhole size={14} /> : <t.icon size={14} />}
        {t.label}
        {t.id === "board" && !locked && hasNewBoardItems && (
          <span className="rounded-full" style={{ position: "absolute", top: 4, insetInlineEnd: 4, width: 6, height: 6, background: COLORS.danger }} />
        )}
      </button>
    );
  }

  const visibleShifts = teamFilter === "הכל" ? SHIFTS : SHIFTS.filter((s) => s.team === teamFilter);

  if (loading) {
    return (
      <div dir="rtl" style={{ fontFamily: FONT_BODY, background: COLORS.bg, color: COLORS.text, minHeight: 500, fontWeight: 700 }} className="flex items-center justify-center p-10">
        <style>{FONT_IMPORT}</style>
        טוען...
      </div>
    );
  }

  if (!identity) {
    return (
      <div dir="rtl" style={{ fontFamily: FONT_BODY, background: COLORS.bg, color: COLORS.text, minHeight: 700, fontWeight: 700 }}>
        <style>{FONT_IMPORT}</style>
        <LoginScreen members={allMembers} onLogin={handleLogin} onSetup={handleSetup} />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: FONT_BODY, background: COLORS.bg, color: COLORS.text, minHeight: 700, fontWeight: 700 }}>
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <div className="px-6 pt-8 pb-6" style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.divider}` }}>
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <SunsetMark size={64} />
          <div className="flex-1">
            <h1 style={{ fontFamily: FONT_HEADING }} className="text-3xl tracking-tight">
              Afterglow
            </h1>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>מערכת ניהול קמפ · מידברן 2026</p>
          </div>
          <div className="text-center px-4 py-2 rounded-2xl" style={{ background: COLORS.accentLight }}>
            <div className="text-2xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{daysUntil()}</div>
            <div className="text-xs" style={{ color: COLORS.accentDark }}>ימים לפתיחת השערים</div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-5 flex items-center justify-between">
          <span className="text-sm">
            שלום, <b style={{ color: COLORS.accentDark }}>{identity}</b>
          </span>
          <button onClick={logout} className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
            <LogOut size={13} /> לא אני, החלף/י משתמש
          </button>
        </div>
      </div>

      {/* Primary nav - "מקובץ למעלה" layout - sticky so the current-page
          label below it stays visible even after scrolling into content,
          not just for a moment right after picking a tab. */}
      <div className="sticky top-0 z-30 pb-2" style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.divider}` }}>
      <div className="max-w-4xl mx-auto px-6 pt-4">
        {roleDashboardTab && (
          <button
            onClick={() => setTab(roleDashboardTab.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-colors mb-2"
            style={{
              background: tab === roleDashboardTab.id ? (isAdmin ? COLORS.accent : COLORS.accent2) : COLORS.surface,
              color: tab === roleDashboardTab.id ? "white" : COLORS.accentDark,
              border: `1px solid ${tab === roleDashboardTab.id ? (isAdmin ? COLORS.accent : COLORS.accent2) : COLORS.divider}`,
            }}
          >
            <LayoutDashboard size={16} /> {roleDashboardTab.label}
          </button>
        )}

        <div className="flex gap-2">
          {[
            { key: "personal", label: "אישי", tabs: navPersonalTabs },
            { key: "camp", label: "קמפ", tabs: navCampTabs },
          ].map((cat) => {
            const open = expandedNavCategory === cat.key;
            const activeTabInCat = cat.tabs.find((t) => t.id === tab);
            const showBadge = cat.key === "personal" && hasNewBoardItems;
            return (
              <button
                key={cat.key}
                onClick={() => setExpandedNavCategory(open ? null : cat.key)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-bold transition-colors"
                style={{
                  position: "relative",
                  background: open || activeTabInCat ? COLORS.accentLight : COLORS.surface,
                  color: open || activeTabInCat ? COLORS.accentDark : COLORS.textMuted,
                  border: `1px solid ${open ? COLORS.accent : COLORS.divider}`,
                }}
              >
                <span className="truncate">{activeTabInCat ? `${cat.label} | ${activeTabInCat.label}` : cat.label}</span>
                <ChevronDown size={13} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                {showBadge && (
                  <span className="rounded-full" style={{ position: "absolute", top: 6, insetInlineEnd: 10, width: 7, height: 7, background: COLORS.danger }} />
                )}
              </button>
            );
          })}
        </div>

        {expandedNavCategory && (
          <div className="mt-2 rounded-2xl p-3 flex flex-wrap gap-2" style={{ background: COLORS.input, border: `1px solid ${COLORS.divider}` }}>
            {expandedNavCategory === "personal"
              ? navPersonalTabs.map((t) => renderNavItem(t, t.id === "dashboard-personal"))
              : navCampTabs.map((t) => renderNavItem(t))}
          </div>
        )}
      </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {tab === "dashboard-admin" && isAdmin && (
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>לוח בקרה למנהל</h2>

            <div className="flex gap-1.5 flex-wrap mb-4">
              {[
                { id: "overview", label: "סקירה", icon: LayoutDashboard },
                { id: "members", label: "חברי קמפ", icon: Users },
                { id: "comms", label: "תקשורת", icon: MessageCircle },
                ...(isOwner ? [{ id: "logs", label: "יומנים", icon: History }] : []),
                { id: "emergency", label: "חירום", icon: HeartPulse },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAdminSubTab(s.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors"
                  style={{
                    background: adminSubTab === s.id ? COLORS.accent2 : COLORS.surface,
                    color: adminSubTab === s.id ? COLORS.bg : COLORS.textMuted,
                    border: `1px solid ${adminSubTab === s.id ? COLORS.accent2 : COLORS.divider}`,
                  }}
                >
                  <s.icon size={13} /> {s.label}
                </button>
              ))}
            </div>

            {adminSubTab === "overview" && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "חברי קמפ", value: allMembers.length },
                    { label: "נגבה", value: `₪${paymentTotals.paid.toLocaleString()}` },
                    { label: "יתרה לגבייה", value: `₪${paymentTotals.remaining.toLocaleString()}` },
                    { label: "תקציב מתוכנן", value: `₪${budgetTotals.planned.toLocaleString()}` },
                    { label: "הוצאות בפועל", value: `₪${budgetTotals.paid.toLocaleString()}` },
                    { label: "מקומות פנויים במשמרות", value: unfilledShiftsCount },
                    { label: "חברים ללא משמרת", value: membersWithoutShift },
                    { label: "ימים לפתיחת השערים", value: daysUntil() },
                  ].map((c) => (
                    <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                      <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-bold mt-5 mb-2" style={{ color: COLORS.textMuted }}>מוכנות התניידות</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "טרם מילאו פרטי הגעה", value: membersWithoutRideInfo },
                    { label: "מציעים טרמפ", value: offeringRides.length },
                    { label: "מחפשים טרמפ", value: lookingForRide.length },
                  ].map((c) => (
                    <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                      <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "יש להם מקום לציוד", value: offeringCargoSpace.length },
                    { label: "יכולת גרירה (וו/עגלה)", value: towingCapable.length },
                  ].map((c) => (
                    <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accent2Dark }}>{c.value}</div>
                      <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                {(paymentTotals.remaining > 0 || unfilledShiftsCount > 0 || membersWithoutShift > 0 || overBudgetCategories.length > 0 || nearBudgetCategories.length > 0 || lookingForRide.length > 0) && (
                  <div className="mt-4 rounded-2xl p-4 space-y-2" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                    <div className="text-xs font-bold mb-1" style={{ color: COLORS.accentDark }}>התרעות חשובות</div>
                    {paymentTotals.remaining > 0 && <div className="text-xs">💰 עוד ₪{paymentTotals.remaining.toLocaleString()} לגבייה מחברי הקמפ</div>}
                    {unfilledShiftsCount > 0 && <div className="text-xs">📋 עוד {unfilledShiftsCount} מקומות פנויים במשמרות</div>}
                    {membersWithoutShift > 0 && <div className="text-xs">🙋 {membersWithoutShift} חברים עדיין לא שיבצו אף משמרת</div>}
                    {lookingForRide.length > 0 && <div className="text-xs">🚗 {lookingForRide.length} חברים מחפשים טרמפ ועדיין לא שובצו</div>}
                    {overBudgetCategories.map((cat) => (
                      <div key={cat} className="text-xs">⚠️ הקטגוריה "{cat}" חרגה מהתקציב המתוכנן</div>
                    ))}
                    {nearBudgetCategories.map((cat) => (
                      <div key={cat} className="text-xs">🟡 הקטגוריה "{cat}" מתקרבת לתקציב המתוכנן (מעל 85%)</div>
                    ))}
                  </div>
                )}
              </>
            )}

            {adminSubTab === "members" && (
              <>
                <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.textMuted }}>הוספת חבר קמפ</h3>
                <AddMemberForm onAdd={addMember} />

            <button
              onClick={() => setShowMemberList(!showMemberList)}
              className="w-full flex items-center justify-between mt-4 mb-2 text-sm font-bold"
              style={{ color: COLORS.textMuted }}
            >
              <span className="flex items-center gap-1.5"><Users size={14} /> ניהול חברי קמפ ({allMembers.length})</span>
              <ChevronDown size={15} style={{ transform: showMemberList ? "rotate(180deg)" : "none" }} />
            </button>
            {showMemberList && (
              <div>
                <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                  מנהל לא בוחר סיסמה במקום מישהו (מטעמי אבטחה) - אבל אפשר "לאפס גישה" כדי שהם יעברו שוב "כניסה ראשונה" עם תעודת הזהות שלהם ויבחרו סיסמה חדשה.
                </p>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {allMembers.map((m) => (
                    <div key={m.name} className="rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {m.name}
                          {m.role === "owner" && (
                            isOwner
                              ? <span className="text-xs" style={{ color: COLORS.accentDark }}> (אדריכל)</span>
                              : <span className="text-xs" style={{ color: COLORS.accentDark }}> (מנהל)</span>
                          )}
                          {m.role === "admin" && <span className="text-xs" style={{ color: COLORS.accentDark }}> (מנהל)</span>}
                          {m.role === "member" && Object.values(teamLeads).some((leads) => leads.includes(m.name)) && <span className="text-xs" style={{ color: COLORS.accent2Dark }}> (מנהל צוות)</span>}
                          {m.idOnFile && <span className="text-xs" style={{ color: COLORS.textMuted }}> · ת.ז מאומתת</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          {isOwner && (
                            <button
                              onClick={() => {
                                setEditingMemberId(editingMemberId === m.name ? null : m.name);
                                setEditIdValue("");
                                setEditNameValue("");
                              }}
                              className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ color: COLORS.textMuted }}
                              title="עריכה"
                            >
                              <Pencil size={12} /> עריכה
                            </button>
                          )}
                          {isOwner && m.role !== "owner" && (
                            <button
                              onClick={() => setMemberRole(m.name, m.role === "admin" ? "member" : "admin")}
                              className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ color: COLORS.accentDark }}
                              title={m.role === "admin" ? "הסר ממנהלים" : "הפוך למנהל"}
                            >
                              {m.role === "admin" ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                              {m.role === "admin" ? "הסרת ניהול" : "הפוך למנהל"}
                            </button>
                          )}
                          {isOwner && m.role !== "owner" && (
                            <button
                              onClick={() => { if (window.confirm(`לאפס את הגישה של ${m.name}? הם יצטרכו לעבור "כניסה ראשונה" מחדש עם תעודת הזהות שלהם.`)) resetMemberAccess(m.name); }}
                              className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ color: COLORS.textMuted }}
                              title="איפוס גישה"
                            >
                              <LockKeyhole size={12} /> איפוס גישה
                            </button>
                          )}
                          <button
                            onClick={() => { if (window.confirm(`להסיר את ${m.name} מהקמפ?`)) removeMember(m.name); }}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ color: COLORS.danger }}
                          >
                            הסרה
                          </button>
                        </div>
                      </div>
                      {editingMemberId === m.name && (
                        <div className="mt-1.5 pt-1.5 border-t space-y-1.5" style={{ borderColor: COLORS.divider }} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <input
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              placeholder={`שינוי שם (כרגע: ${m.name})`}
                              className="flex-1 px-2 py-1 rounded-lg text-xs outline-none"
                              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                            />
                            <button
                              onClick={async () => {
                                if (!editNameValue.trim() || editNameValue.trim() === m.name) return;
                                await renameMember(m.name, editNameValue.trim());
                                setEditingMemberId(null);
                                setEditNameValue("");
                              }}
                              className="text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: COLORS.accent, color: COLORS.bg }}
                            >
                              שינוי שם
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              value={editIdValue}
                              onChange={(e) => setEditIdValue(e.target.value)}
                              placeholder="תעודת זהות חדשה/מעודכנת"
                              className="flex-1 px-2 py-1 rounded-lg text-xs outline-none"
                              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                            />
                            <button
                              onClick={async () => {
                                if (!editIdValue.trim()) return;
                                await editMemberId(m.name, editIdValue.trim());
                                setEditingMemberId(null);
                                setEditIdValue("");
                              }}
                              className="text-xs px-2 py-1 rounded-lg font-semibold"
                              style={{ background: COLORS.accent, color: COLORS.bg }}
                            >
                              שמירה
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {removedMembers.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>הוסרו מהקמפ:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {removedMembers.map((name) => (
                        <button
                          key={name}
                          onClick={() => restoreMember(name)}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: COLORS.input, color: COLORS.textMuted }}
                        >
                          {name} · שחזור
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            )}

            {adminSubTab === "comms" && (
              <>
            <button
              onClick={() => setShowPushStatusList(!showPushStatusList)}
              className="w-full flex items-center justify-between mt-5 mb-2 text-sm font-bold"
              style={{ color: COLORS.textMuted }}
            >
              <span className="flex items-center gap-1.5">
                <Bell size={14} /> אישור התראות - דחיפה ({pushEnabledNames ? allMembers.filter((m) => pushEnabledNames.has(m.name)).length : 0}/{allMembers.length}) · וואטסאפ ({allMembers.filter((m) => whatsappConsent[m.name]).length}/{allMembers.length})
              </span>
              <ChevronDown size={15} style={{ transform: showPushStatusList ? "rotate(180deg)" : "none" }} />
            </button>
            {showPushStatusList && (
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1 mb-2">
                {allMembers.map((m) => {
                  const pushEnabled = !!pushEnabledNames?.has(m.name);
                  const waEnabled = !!whatsappConsent[m.name];
                  return (
                    <div key={m.name} className="flex items-center justify-between text-sm rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                      <span>{m.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: pushEnabled ? COLORS.accent2Dark : COLORS.textMuted }}>
                          {pushEnabled ? <Bell size={12} /> : <BellOff size={12} />} דחיפה
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: waEnabled ? "#25D366" : COLORS.textMuted }}>
                          <MessageCircle size={12} /> וואטסאפ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="w-full flex items-center justify-between mb-2 text-sm font-bold"
              style={{ color: COLORS.textMuted }}
            >
              <span className="flex items-center gap-1.5"><Bell size={14} /> שליחת תזכורת/התראה עכשיו</span>
              <ChevronDown size={15} style={{ transform: showReminderForm ? "rotate(180deg)" : "none" }} />
            </button>
            {showReminderForm && (
              <div className="rounded-2xl p-4 space-y-2 mb-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  שולח התראת דחיפה מיידית לכל מי שאישר התראות ({pushEnabledNames ? pushEnabledNames.size : 0} מכשירים) - למשל תזכורת על אירוע קרוב. זה נפרד מההתראה האוטומטית שנשלחת כשמפרסמים מודעה/סקר.
                </p>
                <input
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="כותרת (למשל: תזכורת - מפגש הכנה ביום ג')"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                />
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder="תוכן ההודעה"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                />
                <button
                  onClick={sendReminder}
                  disabled={sendingReminder || !reminderTitle.trim() || !reminderMessage.trim()}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: COLORS.accent, color: COLORS.bg, opacity: (sendingReminder || !reminderTitle.trim() || !reminderMessage.trim()) ? 0.5 : 1 }}
                >
                  {sendingReminder ? "שולח..." : "שליחה עכשיו"}
                </button>
              </div>
            )}
              </>
            )}

            {adminSubTab === "logs" && isOwner && (
              <>
                <div className="flex items-center justify-between mt-6 mb-2">
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>הכל כאן מתעדכן עם הכניסה לטאב, ורק אתה רואה את זה.</p>
                  <button
                    onClick={refreshLogs}
                    disabled={logsRefreshing}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold shrink-0"
                    style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}`, opacity: logsRefreshing ? 0.6 : 1 }}
                  >
                    <History size={13} /> {logsRefreshing ? "מרענן..." : "רענון"}
                  </button>
                </div>

                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="w-full flex items-center justify-between mt-2 mb-2 text-sm font-bold"
                  style={{ color: COLORS.textMuted }}
                >
                  <span className="flex items-center gap-1.5"><History size={14} /> היסטוריית שינויים</span>
                  <ChevronDown size={15} style={{ transform: showActivityLog ? "rotate(180deg)" : "none" }} />
                </button>
                {showActivityLog && (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1 mb-2">
                    {activityLog.length === 0 ? (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין פעולות רשומות.</p>
                    ) : (
                      activityLog.map((a, i) => (
                        <div key={i} className="text-xs rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                          <b style={{ color: COLORS.accentDark }}>{a.actor}</b> · {a.action}
                          {a.details ? ` · ${a.details}` : ""}
                          <span style={{ color: COLORS.textMuted }}> · {new Date(a.ts).toLocaleString("he-IL")}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <button
                  onClick={() => setShowMemberActivity(!showMemberActivity)}
                  className="w-full flex items-center justify-between mt-4 mb-2 text-sm font-bold"
                  style={{ color: COLORS.textMuted }}
                >
                  <span className="flex items-center gap-1.5">
                    <UserPlus size={14} /> כניסות לאפליקציה - {membersNotYetLoggedIn.length} עדיין לא נכנסו
                  </span>
                  <ChevronDown size={15} style={{ transform: showMemberActivity ? "rotate(180deg)" : "none" }} />
                </button>
                {showMemberActivity && (
                  <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                    {lastSeenMap === null ? (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>טוען...</p>
                    ) : (
                      [...allMembers]
                        .sort((a, b) => new Date(lastSeenMap[a.name] || 0) - new Date(lastSeenMap[b.name] || 0))
                        .map((m) => {
                          const everLoggedIn = membersEverLoggedIn.has(m.name);
                          const seen = lastSeenMap[m.name];
                          return (
                            <div key={m.name} className="text-xs rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                              <div className="flex items-center justify-between">
                                <b>{m.name}</b>
                                <span style={{ color: seen ? COLORS.textMuted : COLORS.danger }}>
                                  {seen ? new Date(seen).toLocaleString("he-IL") : "מעולם לא נראה/תה פעיל/ה"}
                                </span>
                              </div>
                              {!everLoggedIn && (
                                <div className="mt-0.5" style={{ color: m.idOnFile ? COLORS.textMuted : COLORS.danger }}>
                                  עדיין לא נכנס/ה לאפליקציה · {m.idOnFile ? "יש ת.ז - יכול/ה להיכנס" : "אין ת.ז רשומה"}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </>
            )}

            {adminSubTab === "emergency" && (
              <>
            <button
              onClick={exportEmergencyCardsPdf}
              className="text-xs px-3 py-1.5 rounded-full font-semibold mb-3"
              style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
            >
              ייצוא הכל ל-PDF/הדפסה (לצוות הרפואי, למקרה שאין קליטה בשטח)
            </button>
            <button
              onClick={() => setShowEmergencyList(!showEmergencyList)}
              className="w-full flex items-center justify-between mt-2 mb-2 text-sm font-bold"
              style={{ color: COLORS.textMuted }}
            >
              <span className="flex items-center gap-1.5"><HeartPulse size={14} /> כרטיסי חירום של חברי הקמפ</span>
              <ChevronDown size={15} style={{ transform: showEmergencyList ? "rotate(180deg)" : "none" }} />
            </button>
            {showEmergencyList && (
              <div className="space-y-1.5">
                {allMembers.map((m) => {
                  const d = emergencyInfo[m.name];
                  const filled = d && (d.contactName || d.allergies || d.medical || d.dietary);
                  const open = expandedEmergency === m.name;
                  return (
                    <div key={m.name} className="rounded-xl overflow-hidden" style={{ background: COLORS.surface, borderRight: `3px solid ${filled ? COLORS.accent2 : "transparent"}` }}>
                      <button onClick={() => setExpandedEmergency(open ? null : m.name)} className="w-full flex items-center justify-between px-3 py-2 text-sm">
                        <span>{m.name}</span>
                        <div className="flex items-center gap-2">
                          {!filled && <span className="text-xs" style={{ color: COLORS.textMuted }}>לא מולא</span>}
                          <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                        </div>
                      </button>
                      {open && (
                        <div className="px-3 pb-3 text-xs space-y-1" style={{ color: COLORS.textMuted }}>
                          <div>איש קשר: {d?.contactName || "—"} {d?.contactPhone ? `· ${d.contactPhone}` : ""}</div>
                          <div>אלרגיות: {d?.allergies || "—"}</div>
                          <div>מגבלות רפואיות: {d?.medical || "—"}</div>
                          <div>תזונה: {d?.dietary || "—"}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {tab === "dashboard-team" && myLeadTeam && (
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>לוח בקרה - צוות {myLeadTeam}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const t = teamStats(myLeadTeam);
                return [
                  { label: "משמרות הצוות", value: t.totalShifts },
                  { label: "מקומות פנויים", value: t.unfilled },
                  { label: "תקציב הצוות", value: `₪${t.planned.toLocaleString()}` },
                  { label: "שולם בפועל", value: `₪${t.paid.toLocaleString()}` },
                ].map((c) => (
                  <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                    <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                  </div>
                ));
              })()}
            </div>

            {(overBudgetCategories.includes(myLeadTeam) || nearBudgetCategories.includes(myLeadTeam)) && (
              <div className="mt-3 rounded-2xl p-3" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                {overBudgetCategories.includes(myLeadTeam) && <div className="text-xs">⚠️ תקציב הצוות חרג מהתכנון</div>}
                {nearBudgetCategories.includes(myLeadTeam) && <div className="text-xs">🟡 תקציב הצוות מתקרב לתכנון (מעל 85%)</div>}
              </div>
            )}

            <h3 className="text-xs font-bold mt-5 mb-2" style={{ color: COLORS.textMuted }}>המשמרות של הצוות</h3>
            <div className="space-y-1.5">
              {SHIFTS.filter((s) => s.team === myLeadTeam).map((s) => {
                const isTeardownRow = s.id === TEARDOWN_ID;
                const names = isTeardownRow ? allMembers.map((m) => m.name) : (assignments[s.id] || []);
                const spots = isTeardownRow ? allMembers.length : s.spots;
                return (
                  <div key={s.id} className="rounded-xl px-3 py-2 flex items-center justify-between text-xs" style={{ background: COLORS.surface }}>
                    <span>{s.title} · {formatDate(s.date)}{isTeardownRow || s.noTime ? "" : ` · ${s.start}–${s.end}`}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>{s.noLimit ? `${names.length} (ללא הגבלה)` : `${names.length}/${spots}`}</span>
                  </div>
                );
              })}
            </div>

            <h3 className="text-xs font-bold mt-5 mb-2" style={{ color: COLORS.textMuted }}>חברי הצוות ({teamMembers(myLeadTeam).length})</h3>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {teamMembers(myLeadTeam).length === 0 ? (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>עדיין אף אחד לא שיבץ משמרת בצוות הזה.</p>
              ) : (
                teamMembers(myLeadTeam).map((n) => (
                  <span key={n} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: COLORS.surface }} dir="ltr">
                    <span dir="rtl">{n}</span>{memberPhones[n] ? ` · ${memberPhones[n]}` : ""}
                    {isManualTeamMember(myLeadTeam, n) && (
                      <button onClick={() => removeManualTeamMember(myLeadTeam, n)} style={{ color: COLORS.textMuted }}><X size={10} /></button>
                    )}
                  </span>
                ))
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>הוספת חבר/ה לצוות ללא משמרת</div>
              <AdminAssignPicker members={allMembers} onAssign={(name) => addManualTeamMember(myLeadTeam, name)} />
            </div>

            <div className="mt-5 pt-4 border-t" style={{ borderColor: COLORS.divider }}>
              <TeamChecklist
                items={checklistItemsFor(myLeadTeam)}
                state={checklistState[myLeadTeam] || {}}
                canCheck
                canManage
                onToggle={(i) => toggleChecklistItem(myLeadTeam, i)}
                onAdd={(text) => addChecklistItem(myLeadTeam, text)}
                onEdit={(i, text) => editChecklistItem(myLeadTeam, i, text)}
                onRemove={(i) => removeChecklistItem(myLeadTeam, i)}
              />
            </div>

            <div className="mt-5 pt-4 border-t" style={{ borderColor: COLORS.divider }}>
              <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>הוספת הוצאה לצוות</h3>
              <BudgetExpenseForm onAdd={addBudgetExpense} onError={(msg) => showToast(msg, "error")} lockedAllocation={myLeadTeam} categories={allBudgetCategories} allMembers={allMembers} />
            </div>
          </div>
        )}

        {tab === "dashboard-personal" && (
          <div>
            {!welcomeDismissed && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                <div className="text-sm font-bold mb-1" style={{ color: COLORS.accentDark }}>ברוך/ה הבא/ה ל-Afterglow! 👋</div>
                <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                  כאן מנהלים את כל מה שקשור לקמפ: שיבוץ למשמרות, לוח מודעות, תקציב, צוותים, התניידות ופרטי חירום. קודם צריך למלא כמה פרטים אישיים למטה - זה ייקח דקה, ואז שאר האפליקציה נפתחת.
                </p>
                <button
                  onClick={dismissWelcome}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  קח/י אותי לשם
                </button>
              </div>
            )}
            {!profileComplete && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.accent2Light, border: `1px solid ${COLORS.accent2}55` }}>
                <div className="text-sm font-bold mb-1" style={{ color: COLORS.accent2Dark }}>יש להשלים פרטים לפני שממשיכים באפליקציה</div>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  חסר: {missingProfileFields.join(", ")}. פתח/י את "פרטים אישיים" למטה כדי למלא - שאר טאבי האפליקציה ייפתחו אוטומטית ברגע שהכל מלא.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: "המשמרות שלי", value: myShifts.length },
                { label: "מקומות פנויים במשמרות", value: openShiftsCount },
                { label: "ימים לפתיחת השערים", value: daysUntil() },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-2.5 sm:p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xl sm:text-3xl font-black mt-1" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                  <div className="text-[10px] sm:text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                </div>
              ))}
              {(campFee > 0 || feeOverrides[identity] !== undefined) && (
                <div className="col-span-3 rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>דמי הקמפ שלי</div>
                  {(() => {
                    const myList = Array.isArray(memberPayments[identity]) ? memberPayments[identity] : [];
                    const myPaid = myList.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                    const myFee = feeOverrides[identity] !== undefined ? Number(feeOverrides[identity]) : campFee;
                    const myRemaining = myFee - myPaid;
                    return (
                      <div className="text-sm">
                        שילמת <b style={{ color: COLORS.accent2Dark }}>₪{myPaid.toLocaleString()}</b> מתוך ₪{myFee.toLocaleString()}
                        {myRemaining > 0 && <span> · נותר <b style={{ color: COLORS.danger }}>₪{myRemaining.toLocaleString()}</b></span>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="pt-5 mt-5 border-t" style={{ borderColor: COLORS.divider }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: COLORS.accentDark }}>
                <CalendarDays size={15} /> היומן שלי
              </h3>
              {myShifts.length === 0 && myCalendarEvents.length === 0 ? (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>עדיין לא שיבצת אף משמרת, ואין אירועים ביומן. עבור/י לטאב "שיבוץ עצמי" כדי להצטרף למשמרת.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {myCalendarEvents.map((a) => (
                    <div key={`event-${a.id}`} className="shrink-0 rounded-2xl px-4 py-3 min-w-[150px]" style={{ background: COLORS.accentLight, borderTop: `3px solid ${COLORS.accent2}` }}>
                      <div className="text-xs font-bold" style={{ color: COLORS.accent2Dark }}>{a.eventDate ? formatDateShort(a.eventDate) : ""}{a.eventTime ? ` · ${a.eventTime}` : ""}</div>
                      <div className="text-sm font-semibold mt-1">{a.text}</div>
                      <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>אירוע · {a.author}</div>
                      <button
                        onClick={() => downloadMyCalendarIcs([], [a])}
                        className="mt-2 text-[10px] px-2 py-1 rounded-full font-semibold"
                        style={{ background: "rgba(255,255,255,0.6)", color: COLORS.accent2Dark }}
                      >
                        הוספה ליומן בטלפון
                      </button>
                    </div>
                  ))}
                  {myShifts.map((s) => (
                    <div key={s.id} className="shrink-0 rounded-2xl px-4 py-3 min-w-[130px]" style={{ background: COLORS.surface, borderTop: `3px solid ${COLORS.accent}` }}>
                      <div className="text-xs font-bold" style={{ color: COLORS.accentDark }}>{formatDateShort(s.date)}</div>
                      <div className="text-sm font-semibold mt-1">{s.title}</div>
                      {s.id !== TEARDOWN_ID && !s.noTime && (
                        <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{s.start}–{s.end}</div>
                      )}
                      <button
                        onClick={() => downloadMyCalendarIcs([s], [])}
                        className="mt-2 text-[10px] px-2 py-1 rounded-full font-semibold"
                        style={{ background: COLORS.input, color: COLORS.textMuted }}
                      >
                        הוספה ליומן בטלפון
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-5 mt-5 border-t" style={{ borderColor: COLORS.divider }}>
              <button
                onClick={() => setOpenPersonalSection(openPersonalSection === "updates" ? null : "updates")}
                className="w-full flex items-center justify-between text-sm font-bold"
                style={{ color: COLORS.accentDark }}
              >
                <span className="flex items-center gap-2"><Megaphone size={15} /> עדכוני קמפ</span>
                <ChevronDown size={15} style={{ transform: openPersonalSection === "updates" ? "rotate(180deg)" : "none" }} />
              </button>
              {openPersonalSection === "updates" && (
              <div className="mt-3">
              {polls.filter((p) => p.responses[identity] === undefined).map((p) => (
                <div key={p.id} className="rounded-2xl p-3 mb-2" style={{ background: COLORS.accentLight }}>
                  <div className="text-sm font-semibold mb-2">{p.question}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.options.map((o, i) => (
                      <button
                        key={i}
                        onClick={() => respondToPoll(p.id, i)}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: COLORS.accent, color: COLORS.bg }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {polls.filter((p) => p.responses[identity] !== undefined).map((p) => (
                <div key={p.id} className="rounded-2xl p-3 mb-2 text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  {p.question} - ענית: <b style={{ color: COLORS.accentDark }}>{p.options[p.responses[identity]]}</b>
                </div>
              ))}

              {(() => {
                const relevantAnnouncements = announcements.filter(
                  (a) => !a.isEvent && (!a.audience || a.audience === "all" || isAdmin || isInTeam(a.audience))
                );
                return relevantAnnouncements.length === 0 ? (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדכונים חדשים.</p>
                ) : (
                  <div className="space-y-1.5">
                    {relevantAnnouncements.slice(0, 3).map((a) => (
                      <div key={a.id} className="rounded-xl px-3 py-2 text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                        <div className="flex items-center justify-between">
                          <span><b style={{ color: COLORS.accentDark }}>{a.author}:</b> {a.text}</span>
                          {a.audience && a.audience !== "all" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: COLORS.accent2Light, color: COLORS.accent2Dark }}>{a.audience}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              </div>
              )}
            </div>


            {(() => {
              // Open by default only while something inside is still
              // missing (until the user explicitly touches the toggle) -
              // once everything's filled it collapses down like any other
              // section instead of staying pinned open.
              const detailsOpen = openPersonalSection === "details" || (openPersonalSection === null && !profileComplete);
              return (
                <div id="personal-details-section" className="pt-5 mt-5 border-t" style={{ borderColor: COLORS.divider }}>
                  <button
                    onClick={() => setOpenPersonalSection(detailsOpen ? "closed" : "details")}
                    className="w-full flex items-center justify-between text-sm font-bold"
                    style={{ color: COLORS.accentDark }}
                  >
                    <span className="flex items-center gap-2">
                      <Users size={15} /> פרטים אישיים
                      {!profileComplete && <span className="text-xs font-normal" style={{ color: COLORS.danger }}>· יש למלא</span>}
                    </span>
                    <ChevronDown size={15} style={{ transform: detailsOpen ? "rotate(180deg)" : "none" }} />
                  </button>
                  {detailsOpen && (
                    <div className="mt-3 space-y-4">
                      <div>
                        <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                          <Bell size={13} /> התראות
                          {missingProfileFields.includes("החלטה לגבי התראות") && <span className="font-normal" style={{ color: COLORS.danger }}>· חובה</span>}
                        </div>
                        {pushStatus === "default" && (
                          <div className="rounded-2xl p-3" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                            {isIOSDevice() && !isStandaloneDisplay() ? (
                              <>
                                <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                                  באייפון צריך קודם להוסיף את האתר למסך הבית: כפתור השיתוף בספארי ← "הוסף למסך הבית". אחר כך פותחים מהאייקון שנוסף למסך הבית, ומשם אפשר להפעיל התראות.
                                </p>
                                <button onClick={handleDeclinePush} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}>
                                  לא כרגע
                                </button>
                              </>
                            ) : pushSupported() ? (
                              <>
                                <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                                  נשלח התראה כשיש מודעה או סקר חדש בקמפ - גם כשהאפליקציה סגורה בנייד.
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button onClick={handleEnablePush} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: COLORS.accent, color: COLORS.bg }}>
                                    הפעלת התראות
                                  </button>
                                  <button onClick={handleDeclinePush} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}>
                                    לא כרגע
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>המכשיר/דפדפן הזה לא תומך בהתראות דחיפה. <button onClick={handleDeclinePush} className="underline">המשך/י</button></p>
                            )}
                          </div>
                        )}
                        {pushStatus === "denied" && (
                          <div className="rounded-2xl p-3 text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted }}>
                            חסמת התראות בעבר - כדי לקבל עדכונים על מודעות וסקרים חדשים, אפשר להפעיל אותן מחדש דרך הגדרות הדפדפן (הרשאות אתר → התראות).
                          </div>
                        )}
                        {pushStatus === "granted" && !pushSubscribed && (
                          <div className="rounded-2xl p-3" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                            <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                              ההרשאה להתראות פעילה, אבל אין מנוי פעיל במכשיר הזה כרגע - כנראה בעקבות תקלה קודמת. אפשר להפעיל מחדש:
                            </p>
                            <button onClick={handleEnablePush} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: COLORS.accent, color: COLORS.bg }}>
                              הפעלה מחדש של התראות
                            </button>
                          </div>
                        )}
                        {pushSubscribed && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={sendTestPush}
                              disabled={sendingTestPush}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                              style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted, opacity: sendingTestPush ? 0.6 : 1 }}
                            >
                              <Bell size={12} /> {sendingTestPush ? "שולח..." : "שליחת התראת בדיקה לעצמי"}
                            </button>
                            <button
                              onClick={handleResetPush}
                              disabled={sendingTestPush}
                              className="text-xs px-3 py-1 rounded-full"
                              style={{ color: COLORS.textMuted, opacity: sendingTestPush ? 0.6 : 1 }}
                            >
                              לא מקבל/ת התראות בפועל? אתחול מלא של ההתראות
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                          <Phone size={13} /> פרטי קשר
                          {(missingProfileFields.includes("טלפון") || missingProfileFields.includes("אימייל")) && <span className="font-normal" style={{ color: COLORS.danger }}>· חובה</span>}
                        </div>
                        <div className="rounded-2xl p-3 grid sm:grid-cols-2 gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                          <div>
                            <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>טלפון</label>
                            <input
                              defaultValue={memberPhones[identity] || ""}
                              onBlur={(e) => setPhone(identity, e.target.value)}
                              placeholder="050-1234567"
                              dir="ltr"
                              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-left"
                              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>אימייל</label>
                            <input
                              defaultValue={memberEmails[identity] || ""}
                              onBlur={(e) => setEmail(identity, e.target.value)}
                              placeholder="name@example.com"
                              dir="ltr"
                              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-left"
                              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                          <HeartPulse size={13} /> כרטיס אישי - לשעת חירום
                          {missingProfileFields.includes("פרטי חירום") && <span className="font-normal" style={{ color: COLORS.danger }}>· חובה</span>}
                        </div>
                        <EmergencyCardForm data={emergencyInfo[identity]} onChange={(d) => setEmergencyData(identity, d)} />
                      </div>

                      <div>
                        <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                          <Car size={13} /> התניידות - הפרטים שלי
                          {missingProfileFields.includes("התניידות") && <span className="font-normal" style={{ color: COLORS.danger }}>· חובה</span>}
                        </div>
                        <RideWizard data={rideInfo[identity]} onChange={(d) => setRideData(identity, d)} />
                      </div>

                      <div>
                        <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                          <Ticket size={13} /> הקצאה למידברן
                          {missingProfileFields.includes("הקצאה") && <span className="font-normal" style={{ color: COLORS.danger }}>· חובה</span>}
                        </div>
                        <AllocationWizard data={allocationInfo[identity]} onChange={(d) => setAllocationData(identity, d)} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {tab === "shifts" && (
          <div>
            {isAdmin && (
              <div className="mb-3">
                <button
                  onClick={exportShiftsPdf}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted }}
                >
                  <CalendarDays size={13} /> ייצוא לוח משמרות ל-PDF
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {["הכל", ...TEAM_FILTERS].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(t)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: teamFilter === t ? COLORS.accent : COLORS.surface,
                      color: teamFilter === t ? COLORS.bg : COLORS.text,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex rounded-full p-1" style={{ background: COLORS.surface }}>
                {[{ id: "list", label: "רשימה" }, { id: "calendar", label: "יומן" }].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setShiftsView(v.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: shiftsView === v.id ? COLORS.accent2 : "transparent", color: shiftsView === v.id ? COLORS.bg : COLORS.text }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {shiftsView === "calendar" ? (
              <div className="flex gap-4 overflow-x-auto pb-3 mb-2">
                {[...new Set(visibleShifts.map((s) => s.date))].map((date) => {
                  const [dy, dm, dd] = date.split("-").map(Number);
                  const dow = WEEKDAYS_HE[new Date(dy, dm - 1, dd).getDay()];
                  return (
                  <div key={date} className="shrink-0 w-60 rounded-3xl overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, boxShadow: "0 3px 10px rgba(58,34,42,0.10)" }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: COLORS.accent }}>
                      <span className="text-xs font-semibold" style={{ color: COLORS.accentLight }}>יום {dow}</span>
                      <span className="text-lg font-black" style={{ fontFamily: FONT_NUM, color: COLORS.bg }}>{dd}.{dm}</span>
                    </div>
                    <div className="p-3 space-y-2.5">
                      {visibleShifts.filter((s) => s.date === date).sort((a, b) => a.start.localeCompare(b.start)).map((s) => {
                        const isTeardown = s.id === TEARDOWN_ID;
                        const names = (isTeardown ? allMembers.map((m) => m.name) : (assignments[s.id] || [])).filter((n) => !removedMembers.includes(n));
                        const spots = isTeardown ? allMembers.length : s.spots;
                        const joined = isJoined(s.id);
                        const full = !s.noLimit && names.length >= spots && !joined;
                        return (
                          <div key={s.id} className="rounded-2xl p-3" style={{ background: COLORS.input, borderRight: `3px solid ${joined ? COLORS.accent2 : COLORS.accent}` }}>
                            {!isTeardown && !s.noTime && (
                              <div className="text-xs flex items-center gap-1" style={{ color: COLORS.accentDark, fontFamily: FONT_NUM }}>
                                <Clock size={11} /> {s.start}–{s.end}
                              </div>
                            )}
                            <div className="text-sm font-bold mt-1">{s.title}</div>
                            {isTeardown ? (
                              <TeardownTaskPicker selected={teardownTasks[identity] || []} onToggle={toggleTeardownTask} compact />
                            ) : (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: COLORS.accentLight, color: COLORS.accentDark, fontFamily: FONT_NUM }}>{s.noLimit ? `${names.length} (ללא הגבלה)` : `${names.length}/${spots}`}</span>
                                <button
                                  onClick={() => (joined ? leave(s) : join(s))}
                                  disabled={full}
                                  className="text-xs px-3 py-1 rounded-full font-semibold"
                                  style={{
                                    background: joined ? "transparent" : full ? COLORS.divider : COLORS.accent,
                                    border: joined ? `1px solid ${COLORS.accent}` : "none",
                                    color: joined ? COLORS.accentDark : COLORS.bg,
                                    opacity: full ? 0.6 : 1,
                                  }}
                                >
                                  {joined ? "בטל" : full ? "מלא" : "הצטרף"}
                                </button>
                              </div>
                            )}
                            {isAdmin && !isTeardown && (
                              <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.divider }}>
                                {names.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {names.map((n) => (
                                      <span key={n} className="text-[10px] pl-1 pr-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: COLORS.surface2 }}>
                                        {n}
                                        <button onClick={() => leave(s, n)} style={{ color: COLORS.textMuted }}><X size={9} /></button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <AdminAssignPicker members={allMembers} onAssign={(name) => join(s, name)} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
            <div className="space-y-2 mb-8">
              {visibleShifts.map((s) => {
                const isTeardown = s.id === TEARDOWN_ID;
                const names = (isTeardown ? allMembers.map((m) => m.name) : (assignments[s.id] || [])).filter((n) => !removedMembers.includes(n));
                const spots = isTeardown ? allMembers.length : s.spots;
                const joined = isJoined(s.id);
                const full = !s.noLimit && names.length >= spots && !joined;
                return (
                  <div key={s.id} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="flex items-center gap-4">
                    {s.noLimit ? (
                      <div className="shrink-0 flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 34, height: 34, background: COLORS.accentLight, color: COLORS.accentDark, fontFamily: FONT_NUM }}>{names.length}</div>
                    ) : (
                      <FillRing filled={names.length} total={spots} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{s.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>{s.team}</span>
                        {isTeardown && <span className="text-xs" style={{ color: COLORS.textMuted }}>כולם משתתפים</span>}
                        {s.noLimit && <span className="text-xs" style={{ color: COLORS.textMuted }}>ללא הגבלת מקומות</span>}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ color: COLORS.textMuted }}>
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(s.date)}</span>
                        {!isTeardown && !s.noTime && <span className="flex items-center gap-1"><Clock size={12} /> {s.start}–{s.end}</span>}
                      </div>
                      {isTeardown && (
                        <TeardownTaskPicker selected={teardownTasks[identity] || []} onToggle={toggleTeardownTask} />
                      )}
                    </div>
                    {!isTeardown && (
                      <button
                        onClick={() => (joined ? leave(s) : join(s))}
                        disabled={full}
                        className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-opacity"
                        style={{
                          background: joined ? "transparent" : full ? COLORS.divider : COLORS.accent,
                          border: joined ? `1px solid ${COLORS.accent}` : "none",
                          color: joined ? COLORS.accentDark : COLORS.bg,
                          opacity: full ? 0.6 : 1,
                          cursor: full ? "not-allowed" : "pointer",
                        }}
                      >
                        {joined ? "לבטל שיבוץ" : full ? "מלא" : "אני משתבץ/ת"}
                      </button>
                    )}
                  </div>

                  {isAdmin && !isTeardown && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.divider }}>
                      <div className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>שיבוץ ידני (מנהל)</div>
                      {names.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {names.map((n) => (
                            <span key={n} className="text-xs pl-1 pr-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: COLORS.input }}>
                              {n}
                              <button onClick={() => leave(s, n)} style={{ color: COLORS.textMuted }}><X size={11} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <AdminAssignPicker members={allMembers} onAssign={(name) => join(s, name)} />
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {tab === "board" && (
          <div>
            <div className="rounded-2xl p-4 mb-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                  <MessageCircle size={15} /> הודעות אישיות
                </h3>
                {!showPrivateMsgForm && (
                  <button
                    onClick={() => setShowPrivateMsgForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: COLORS.accent, color: COLORS.bg }}
                  >
                    <Plus size={13} /> הודעה חדשה
                  </button>
                )}
              </div>
              {showPrivateMsgForm && (
                <PrivateMessageForm
                  members={allMembers.filter((m) => m.name !== identity)}
                  onSend={(to, text) => { sendPrivateMessage(to, text); setShowPrivateMsgForm(false); }}
                />
              )}
              {myPrivateMessages.length === 0 ? (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין הודעות אישיות - שולחים דרך "הודעה חדשה" למעלה.</p>
              ) : (
                <div className="space-y-1.5">
                  {myPrivateMessages.map((m) => {
                    const incoming = m.to === identity;
                    return (
                      <div key={m.id} className="rounded-xl px-3 py-2 text-xs flex items-start justify-between gap-2" style={{ background: incoming ? COLORS.accentLight : COLORS.input, border: `1px solid ${COLORS.divider}` }}>
                        <div className="min-w-0">
                          <div className="font-semibold mb-0.5" style={{ color: COLORS.accentDark }}>
                            {incoming ? `מאת ${m.from}` : `אל ${m.to}`}
                          </div>
                          <div className="whitespace-pre-wrap">{m.text}</div>
                          <div className="mt-1" style={{ color: COLORS.textMuted }}>{new Date(m.ts).toLocaleString("he-IL")}</div>
                        </div>
                        {(m.from === identity || isAdmin) && (
                          <button onClick={() => removePrivateMessage(m.id)} style={{ color: COLORS.textMuted }} className="shrink-0"><Trash2 size={13} /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: COLORS.accentDark }}>סקרים</h3>
              {isAdmin && (showPollForm ? null : (
                <button
                  onClick={() => setShowPollForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  <Plus size={13} /> סקר חדש
                </button>
              ))}
            </div>
            {isAdmin && showPollForm && (
              <PollForm onCreate={(q, opts) => { createPoll(q, opts); setShowPollForm(false); }} onCancel={() => setShowPollForm(false)} />
            )}
            {polls.length > 0 && (
              <div className="space-y-2 mb-6">
                {polls.map((p) => {
                  const counts = p.options.map((_, i) => Object.values(p.responses || {}).filter((v) => v === i).length);
                  const total = counts.reduce((a, b) => a + b, 0) || 1;
                  const answered = p.responses[identity] !== undefined || isAdmin;
                  return (
                    <div key={p.id} className="rounded-2xl p-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{p.question}</span>
                        {(isAdmin) && (
                          <button onClick={() => removePoll(p.id)} style={{ color: COLORS.textMuted }}><Trash2 size={13} /></button>
                        )}
                      </div>
                      {!answered ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.options.map((o, i) => (
                            <button
                              key={i}
                              onClick={() => respondToPoll(p.id, i)}
                              className="text-xs px-3 py-1.5 rounded-full font-semibold"
                              style={{ background: COLORS.accent, color: COLORS.bg }}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1 mt-2">
                          {p.options.map((o, i) => (
                            <div key={i} className="text-xs">
                              <div className="flex items-center justify-between mb-0.5">
                                <span>{o}{i === p.responses[identity] ? " ✓" : ""}</span>
                                <span style={{ color: COLORS.textMuted }}>{counts[i]}</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.divider }}>
                                <div className="h-full rounded-full" style={{ width: `${(counts[i] / total) * 100}%`, background: COLORS.accent2 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>לוח מודעות</h3>
            <AnnouncementForm onPost={addAnnouncement} teams={allTeams.map((t) => t.name)} />
            {announcements.length === 0 ? (
              <p className="text-xs text-center py-10" style={{ color: COLORS.textMuted }}>עדיין אין מודעות. תהיה/י הראשון/ה לפרסם.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                {announcements.map((a, i) => {
                  const tints = [COLORS.accentLight, COLORS.accent2Light, "#fdf0c9", COLORS.surface2];
                  const rotations = ["-1.5deg", "1deg", "-0.5deg", "1.5deg"];
                  const tint = tints[i % tints.length];
                  const rot = rotations[i % rotations.length];
                  return (
                    <div
                      key={a.id}
                      className="relative rounded-md p-4 pt-6"
                      style={{ background: tint, transform: `rotate(${rot})`, boxShadow: "0 6px 14px rgba(58,34,42,0.20)" }}
                    >
                      <div
                        className="absolute rounded-full"
                        style={{
                          top: -8, left: "50%", marginLeft: -8, width: 16, height: 16,
                          background: COLORS.danger, boxShadow: "0 2px 3px rgba(0,0,0,0.35)",
                        }}
                      />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                          {a.author}
                          {a.audience && a.audience !== "all" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-normal" style={{ background: "rgba(255,255,255,0.5)" }}>{a.audience}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>{new Date(a.ts).toLocaleDateString("he-IL")}</span>
                          {(isAdmin || a.author === identity) && (
                            <button onClick={() => removeAnnouncement(a.id)} style={{ color: COLORS.textMuted }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <ReactionBar reactions={a.reactions} identity={identity} onToggle={(emoji) => toggleReaction(a.id, emoji)}>
                        <p className="text-sm whitespace-pre-wrap select-none" style={{ fontFamily: FONT_HEADING, lineHeight: 1.5 }}>{a.text}</p>
                      </ReactionBar>

                      {a.isEvent && (a.eventDate || a.eventTime) && (() => {
                        const authorRole = allMembers.find((m) => m.name === a.author)?.role;
                        const isAdminEvent = authorRole === "admin" || authorRole === "owner";
                        const inMyCalendar = (personalCalendarAdds[identity] || []).includes(a.id);
                        const rsvps = a.rsvps || {};
                        const myRsvp = rsvps[identity];
                        const goingCount = Object.values(rsvps).filter((v) => v === "yes").length;
                        return (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-fit" style={{ background: "rgba(255,255,255,0.55)", color: COLORS.accentDark }}>
                              <CalendarDays size={13} />
                              {a.eventDate ? formatDate(a.eventDate) : ""}{a.eventTime ? ` · ${a.eventTime}` : ""}
                            </div>
                            {!isAdminEvent && (
                              <button
                                onClick={() => toggleMyCalendarAdd(a.id)}
                                className="text-xs font-bold px-2 py-1 rounded-lg"
                                style={{ background: inMyCalendar ? COLORS.accent2 : "rgba(255,255,255,0.55)", color: inMyCalendar ? "white" : COLORS.accentDark }}
                              >
                                {inMyCalendar ? "✓ ביומן שלי" : "הוסף ליומן שלי"}
                              </button>
                            )}
                            <button
                              onClick={() => rsvpEvent(a.id, "yes")}
                              className="text-xs font-bold px-2 py-1 rounded-lg"
                              style={{ background: myRsvp === "yes" ? COLORS.accent2 : "rgba(255,255,255,0.55)", color: myRsvp === "yes" ? "white" : COLORS.accentDark }}
                            >
                              {myRsvp === "yes" ? "✓ מגיע/ה" : "מגיע/ה"}
                            </button>
                            <button
                              onClick={() => rsvpEvent(a.id, "no")}
                              className="text-xs font-bold px-2 py-1 rounded-lg"
                              style={{ background: myRsvp === "no" ? COLORS.divider : "rgba(255,255,255,0.55)", color: COLORS.accentDark }}
                            >
                              {myRsvp === "no" ? "✓ לא מגיע/ה" : "לא מגיע/ה"}
                            </button>
                            {goingCount > 0 && (
                              <span className="text-xs" style={{ color: COLORS.textMuted }}>{goingCount} מגיעים</span>
                            )}
                          </div>
                        );
                      })()}

                      {(a.replies || []).length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {a.replies.map((r) => (
                            <div key={r.id} className="text-xs rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.45)" }}>
                              <b style={{ color: COLORS.accentDark }}>{r.author}:</b> {r.text}
                            </div>
                          ))}
                        </div>
                      )}
                      <ReplyBox onReply={(text) => addReply(a.id, text)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "budget" && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "תקציב מתוכנן", value: budgetTotals.planned },
                { label: "התחייבויות", value: budgetTotals.committed },
                { label: "שולם בפועל", value: budgetTotals.paid },
                { label: "יתרה זמינה", value: budgetTotals.remaining },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: c.label === "יתרה זמינה" && c.value < 0 ? COLORS.danger : COLORS.text }}>
                    ₪{c.value.toLocaleString()}
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                </div>
              ))}
            </div>

            {canEditBudget && (
              <div className="mb-6">
                <button
                  onClick={() => setShowQuickAddExpense((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  <Plus size={15} /> הוספת הוצאה
                </button>
                {showQuickAddExpense && (
                  <div className="mt-3">
                    <BudgetExpenseForm
                      onAdd={(exp) => {
                        addBudgetExpense(exp);
                        setShowQuickAddExpense(false);
                        setShowBudgetSection("expenses");
                      }}
                      onError={(msg) => showToast(msg, "error")}
                      lockedAllocation={isAdmin ? null : myLeadTeam}
                      categories={allBudgetCategories}
                      allMembers={allMembers}
                    />
                  </div>
                )}
              </div>
            )}

            <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.textMuted }}>תקציב לפי קטגוריה</h3>
            <div className="space-y-2 mb-6">
              {allBudgetCategories.map((cat) => {
                const items = budgetItems.filter((b) => b.category === cat);
                const catExpenses = budgetExpenses.filter((e) => e.allocation === cat);
                const planned = Number(categoryBudgets[cat]) || 0;
                const legacyPaid = items.reduce((s, b) => s + (Number(b.paid) || 0), 0);
                const expensesPaid = catExpenses.reduce((s, e) => s + expenseAmounts(e).paid, 0);
                const paid = legacyPaid + expensesPaid;
                const toPay = planned - paid;
                const owedToMembers = catExpenses.filter((e) => e.refundToMember && !e.refundPaid).reduce((s, e) => s + (Number(e.amount) || 0), 0);
                const pct = planned > 0 ? Math.min(paid / planned, 1) * 100 : 0;
                const canManageThis = isAdmin || myLeadTeam === cat;
                return (
                  <div key={cat} className="rounded-2xl px-4 py-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold">{cat}</span>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <span>סכום לתשלום: <b style={{ color: toPay > 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{toPay.toLocaleString()}</b></span>
                        <span>סה"כ שולם: <b style={{ color: COLORS.accent2Dark }}>₪{paid.toLocaleString()}</b></span>
                        {owedToMembers > 0 && (
                          <span>תשלום לחברי קמפ: <b style={{ color: COLORS.danger }}>₪{owedToMembers.toLocaleString()}</b></span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.divider }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS.accent }} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>תקציב מתוכנן: ₪{planned.toLocaleString()}</div>

                    {catExpenses.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {catExpenses.map((e) => {
                          if (editingExpenseId === e.id) {
                            return (
                              <BudgetExpenseForm
                                key={e.id}
                                initial={e}
                                categories={allBudgetCategories}
                                lockedAllocation={isAdmin ? null : myLeadTeam}
                                allMembers={allMembers}
                                onCancel={() => setEditingExpenseId(null)}
                                onError={(msg) => showToast(msg, "error")}
                                onAdd={(patch) => {
                                  updateBudgetExpense(e.id, patch);
                                  setEditingExpenseId(null);
                                }}
                              />
                            );
                          }
                          return (
                            <div key={e.id} className="flex items-center justify-between text-xs rounded-xl px-3 py-2 gap-2" style={{ background: COLORS.input }}>
                              <div className="flex items-center gap-2 min-w-0">
                                {e.receiptUrl && (
                                  <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                    <img src={e.receiptUrl} alt="קבלה" className="h-8 w-8 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.divider}` }} />
                                  </a>
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold">{e.description || e.subcategory || "הוצאה"}{e.vendor ? ` · ${e.vendor}` : ""}</div>
                                  <div className="mt-0.5" style={{ color: COLORS.textMuted }}>
                                    {e.isRefund ? "זיכוי: " : ""}₪{Number(e.amount).toLocaleString()}
                                    {e.paymentStatus === "partial" ? ` · שולם ₪${Number(e.paidAmount || 0).toLocaleString()}, נותר ₪${Number(e.remainingAmount || 0).toLocaleString()}` : ""}
                                    {e.paymentMethod ? ` · ${paymentMethodLabel(e.paymentMethod)}` : ""}
                                    {e.purchaseDate ? ` · ${formatDateShort(e.purchaseDate)}` : ""}
                                  </div>
                                  {e.refundToMember && (
                                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: e.refundPaid ? COLORS.accent2Dark : COLORS.danger }}>
                                      <span>
                                        מגיע החזר ל{e.refundMemberName ? `: ${e.refundMemberName}` : "חבר/ת קמפ"}
                                        {" · "}{e.refundPaid ? "הוחזר" : "טרם הוחזר"}
                                      </span>
                                      {canManageThis && (
                                        <button
                                          type="button"
                                          onClick={() => updateBudgetExpense(e.id, { refundPaid: !e.refundPaid })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                          style={{ background: COLORS.input, color: COLORS.textMuted }}
                                        >
                                          {e.refundPaid ? "סמן כטרם הוחזר" : "סמן כהוחזר"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-0.5" style={{ color: COLORS.textMuted, opacity: 0.7 }}>הוזן ע"י {e.enteredBy}</div>
                                </div>
                              </div>
                              {canManageThis && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button onClick={() => setEditingExpenseId(e.id)} style={{ color: COLORS.textMuted }}>
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => removeBudgetExpense(e.id)} style={{ color: COLORS.textMuted }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {items.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {items.map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-xs rounded-xl px-3 py-2" style={{ background: COLORS.input }}>
                            <div className="min-w-0">
                              <div className="font-semibold">{b.name}</div>
                              <div className="mt-0.5" style={{ color: COLORS.textMuted }}>
                                התחייבנו ₪{Number(b.committed || 0).toLocaleString()} · שולם ₪{Number(b.paid || 0).toLocaleString()}
                                {b.notes ? ` · ${b.notes}` : ""}
                              </div>
                              <div className="mt-0.5" style={{ color: COLORS.textMuted, opacity: 0.7 }}>הוזן ע"י {b.owner}</div>
                            </div>
                            {(isAdmin || myLeadTeam === cat) && (
                              <button onClick={() => removeBudgetItem(b.id)} style={{ color: COLORS.textMuted }} className="shrink-0">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "equipment" && (
          <div>
            <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
              רשימת הציוד ששייך לקמפ - כדי שיהיה מעקב מסודר אחרי מה יש, כמה, ובאיזה מצב.
            </p>
            {(isAdmin || myLeadTeam) && (
              <div className="mb-4">
                <EquipmentForm onAdd={addEquipment} lockedCategory={isAdmin ? null : myLeadTeam} />
              </div>
            )}

            {EQUIPMENT_CATEGORIES.map((cat) => {
              const items = campEquipment.filter((e) => e.category === cat);
              if (items.length === 0) return null;
              const totalQty = items.reduce((s, e) => s + (Number(e.qty) || 0), 0);
              return (
                <div key={cat} className="mb-4">
                  <h3 className="text-xs font-bold mb-1.5 flex items-center justify-between" style={{ color: COLORS.textMuted }}>
                    <span>{cat}</span>
                    <span>{totalQty} יחידות</span>
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((e) =>
                      editingEquipmentId === e.id ? (
                        <EquipmentForm
                          key={e.id}
                          initial={e}
                          lockedCategory={isAdmin ? null : myLeadTeam}
                          onCancel={() => setEditingEquipmentId(null)}
                          onAdd={(patch) => {
                            updateEquipmentField(e.id, patch);
                            setEditingEquipmentId(null);
                          }}
                        />
                      ) : (
                        <div key={e.id} className="rounded-xl px-3 py-2 flex items-center justify-between gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                          <div className="min-w-0 text-xs">
                            <div className="font-semibold text-sm">{e.name} <span style={{ color: COLORS.accentDark }}>× {e.qty}</span></div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap" style={{ color: COLORS.textMuted }}>
                              <span style={{ color: e.condition === "תקין" ? COLORS.accent2Dark : COLORS.danger }}>{e.condition}</span>
                              {e.location && <span className="flex items-center gap-1"><MapPin size={11} /> {e.location}</span>}
                              {e.notes && <span>· {e.notes}</span>}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
                              {e.updatedBy ? `עודכן ע"י ${e.updatedBy}` : e.addedBy ? `נוסף ע"י ${e.addedBy}` : ""}
                            </div>
                          </div>
                          {(isAdmin || myLeadTeam === cat) && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => setEditingEquipmentId(e.id)} style={{ color: COLORS.textMuted }}><Pencil size={14} /></button>
                              <button onClick={() => removeEquipment(e.id)} style={{ color: COLORS.textMuted }}><Trash2 size={14} /></button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
            {campEquipment.length === 0 && (
              <p className="text-xs text-center py-10" style={{ color: COLORS.textMuted }}>עדיין לא נוסף ציוד לרשימה.</p>
            )}
          </div>
        )}

        {tab === "shopping" && (() => {
          const canManageShopping = isAdmin || teamMembers("צוות המטבח").includes(identity);
          // "Pending" = still missing quantity or price - a quick-picked or
          // freshly-added item sits here until the kitchen team fills both
          // in, at which point it automatically counts as part of the real
          // (confirmed) shopping list. No separate status flag to track -
          // it's just derived from whether qty/price are filled in.
          const isPending = (it) => !(Number(it.qty) > 0 && Number(it.price) > 0);
          const pendingItems = shoppingList.filter(isPending);
          const confirmedItems = shoppingList.filter((it) => !isPending(it));
          const totalPrice = confirmedItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
          const sortedConfirmed = [...confirmedItems].sort((a, b) => (a.bought === b.bought ? 0 : a.bought ? 1 : -1));
          const pickableBasics = BASIC_SHOPPING_ITEMS.filter((name) => !shoppingList.some((it) => it.name === name));
          return (
            <div>
              {/* Aggregate-only, on purpose: the kitchen needs to know how many
                  portions to plan for, not who specifically - dietary info itself
                  stays visible only where it already was (emergency info, gated
                  to the member themselves/admins). Comes from a count-only RPC
                  since emergency_info's own RLS wouldn't give a non-admin kitchen
                  member the full picture. */}
              {dietaryCounts && (dietaryCounts.vegetarian > 0 || dietaryCounts.vegan > 0) && (
                <div className="rounded-2xl p-3 mb-4 flex items-center gap-4 text-xs" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>
                  <span className="font-bold">העדפות תזונה בקמפ:</span>
                  {dietaryCounts.vegetarian > 0 && <span>{dietaryCounts.vegetarian} צמחונים</span>}
                  {dietaryCounts.vegan > 0 && <span>{dietaryCounts.vegan} טבעונים</span>}
                </div>
              )}

              {canManageShopping && pickableBasics.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>רשימה בסיסית - בחירה מהירה</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pickableBasics.map((name) => (
                      <button
                        key={name}
                        onClick={() => addShoppingItem({ name, qty: "", unit: "", price: "", notes: "" })}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                      >
                        + {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canManageShopping && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>הוספת מוצר אחר</h3>
                  <ShoppingItemForm onAdd={addShoppingItem} />
                </div>
              )}

              {canManageShopping && pendingItems.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>ממתינים להשלמת כמות ומחיר ({pendingItems.length})</h3>
                  <div className="space-y-2">
                    {pendingItems.map((it) => (
                      <ShoppingItemForm
                        key={it.id}
                        initial={it}
                        onCancel={() => removeShoppingItem(it.id)}
                        onAdd={(patch) => updateShoppingItem(it.id, patch)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {confirmedItems.length > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold" style={{ color: COLORS.textMuted }}>רשימת קניות מאושרת ({confirmedItems.length})</h3>
                  {totalPrice > 0 && (
                    <span className="text-xs font-bold" style={{ color: COLORS.accentDark }}>סה"כ משוער: ₪{totalPrice.toLocaleString()}</span>
                  )}
                </div>
              )}
              <div className="space-y-1.5 mb-6">
                {sortedConfirmed.map((it) =>
                  editingShoppingItemId === it.id ? (
                    <ShoppingItemForm
                      key={it.id}
                      initial={it}
                      onCancel={() => setEditingShoppingItemId(null)}
                      onAdd={(patch) => {
                        updateShoppingItem(it.id, patch);
                        setEditingShoppingItemId(null);
                      }}
                    />
                  ) : (
                    <div
                      key={it.id}
                      className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, opacity: it.bought ? 0.55 : 1 }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {canManageShopping && (
                          <input
                            type="checkbox"
                            checked={!!it.bought}
                            onChange={() => toggleShoppingItemBought(it.id)}
                            className="shrink-0"
                          />
                        )}
                        <div className="min-w-0 text-xs">
                          <div className="font-semibold text-sm" style={{ textDecoration: it.bought ? "line-through" : "none" }}>
                            {it.name} <span style={{ color: COLORS.accentDark }}>× {it.qty}{it.unit ? ` ${it.unit}` : ""}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap" style={{ color: COLORS.textMuted }}>
                            {it.price ? <span>₪{Number(it.price).toLocaleString()}</span> : null}
                            {it.notes && <span>{it.price ? " · " : ""}{it.notes}</span>}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted }}>
                            {it.updatedBy ? `עודכן ע"י ${it.updatedBy}` : it.addedBy ? `נוסף ע"י ${it.addedBy}` : ""}
                          </div>
                        </div>
                      </div>
                      {canManageShopping && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setEditingShoppingItemId(it.id)} style={{ color: COLORS.textMuted }}><Pencil size={14} /></button>
                          <button onClick={() => removeShoppingItem(it.id)} style={{ color: COLORS.textMuted }}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  )
                )}
                {shoppingList.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: COLORS.textMuted }}>עדיין לא נוסף שום דבר לרשימת הקניות.</p>
                )}
              </div>

              <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>בקשות מיוחדות</h3>
              <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                יש אלרגיה, העדפה תזונתית, או משהו ספציפי שתרצו שיוסיפו לקניות? אפשר לכתוב כאן, וצוות המטבח יראה את זה.
              </p>
              <ShoppingRequestForm onAdd={addShoppingRequest} />
              <div className="space-y-1.5 mt-2">
                {shoppingRequests.map((r) => (
                  <div key={r.id} className="rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <div className="min-w-0">
                      <div>{r.text}</div>
                      <div className="mt-0.5" style={{ color: COLORS.textMuted }}>{r.author} · {new Date(r.ts).toLocaleDateString("he-IL")}</div>
                    </div>
                    {(canManageShopping || r.author === identity) && (
                      <button onClick={() => removeShoppingRequest(r.id)} style={{ color: COLORS.textMuted }} className="shrink-0"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
                {shoppingRequests.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: COLORS.textMuted }}>אין עדיין בקשות מיוחדות.</p>
                )}
              </div>
            </div>
          );
        })()}

        {tab === "finances" && canManageFinances && (
          <div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setFinancesView("dues")}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: financesView === "dues" ? COLORS.accent : COLORS.surface, color: financesView === "dues" ? COLORS.bg : COLORS.textMuted }}
              >
                דמי קמפ
              </button>
              <button
                onClick={() => setFinancesView("budget")}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: financesView === "budget" ? COLORS.accent : COLORS.surface, color: financesView === "budget" ? COLORS.bg : COLORS.textMuted }}
              >
                תקציב
              </button>
              <button
                onClick={() => setFinancesView("receipts")}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: financesView === "receipts" ? COLORS.accent : COLORS.surface, color: financesView === "receipts" ? COLORS.bg : COLORS.textMuted }}
              >
                קבלות
              </button>
            </div>

            {financesView === "dues" && (
            <div>
            <div className="rounded-2xl p-4 mb-5 flex items-end gap-2 flex-wrap" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
              <div>
                <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>דמי קמפ אחידים לכולם (₪)</label>
                <input
                  type="number"
                  defaultValue={campFee || ""}
                  onBlur={(e) => setCampFeeValue(e.target.value)}
                  placeholder="0"
                  className="px-3 py-2 rounded-xl text-sm outline-none w-40"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                />
              </div>
              <span className="text-xs pb-2" style={{ color: COLORS.textMuted }}>חל אוטומטית על כל חברי הקמפ</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "סה\"כ לגבייה", value: paymentTotals.due },
                { label: "סה\"כ נגבה", value: paymentTotals.paid },
                { label: "יתרה לגבייה", value: paymentTotals.remaining },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: c.label === "יתרה לגבייה" && c.value > 0 ? COLORS.danger : COLORS.text }}>
                    ₪{c.value.toLocaleString()}
                  </div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {[...allMembers]
                .sort((a, b) => {
                  const paidA = (Array.isArray(memberPayments[a.name]) ? memberPayments[a.name] : []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
                  const paidB = (Array.isArray(memberPayments[b.name]) ? memberPayments[b.name] : []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
                  return paidA - paidB;
                })
                .map((m) => {
                const list = Array.isArray(memberPayments[m.name]) ? memberPayments[m.name] : [];
                const paid = list.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                const effectiveFee = feeOverrides[m.name] !== undefined ? Number(feeOverrides[m.name]) : campFee;
                const remaining = effectiveFee - paid;
                const settled = effectiveFee > 0 && paid >= effectiveFee;
                const open = expandedMember === m.name;
                return (
                  <div key={m.name} className="rounded-xl overflow-hidden" style={{ background: COLORS.surface, borderRight: `3px solid ${settled ? COLORS.accent2 : "transparent"}` }}>
                    <button
                      onClick={() => setExpandedMember(open ? null : m.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm"
                    >
                      <span>{m.name}{feeOverrides[m.name] !== undefined && <span className="text-xs" style={{ color: COLORS.accentDark }}> (מותאם אישית)</span>}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: COLORS.textMuted }}>שולם ₪{paid.toLocaleString()}</span>
                        <span style={{ color: remaining > 0 ? COLORS.danger : COLORS.accent2Dark }}>יתרה ₪{remaining.toLocaleString()}</span>
                        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                      </div>
                    </button>
                    {open && (
                      <div className="px-3 pb-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs" style={{ color: COLORS.textMuted }}>דמי קמפ אישיים (השאר ריק לברירת מחדל ₪{campFee.toLocaleString()}):</label>
                          <input
                            type="number"
                            defaultValue={feeOverrides[m.name] ?? ""}
                            onBlur={(e) => setFeeOverride(m.name, e.target.value)}
                            placeholder={String(campFee)}
                            className="w-24 px-2 py-1 rounded-lg text-xs outline-none"
                            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                          />
                        </div>
                        {remaining > 0 && (
                          !memberPhones[m.name] ? (
                            <div className="text-xs" style={{ color: COLORS.textMuted }}>אין מספר טלפון רשום ל-{m.name} - אי אפשר לשלוח תזכורת (אפשר להוסיף בטאב "אנשי קשר")</div>
                          ) : whatsappConsent[m.name] ? (
                            <a
                              href={buildWhatsAppLink(memberPhones[m.name], duesReminderMessage(m.name, remaining))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                              style={{ background: "#25D366", color: "white" }}
                            >
                              <MessageCircle size={13} /> שליחת תזכורת בוואטסאפ
                            </a>
                          ) : (
                            <div className="text-xs" style={{ color: COLORS.textMuted }}>{m.name} עדיין לא אישר/ה קבלת תזכורות בוואטסאפ</div>
                          )
                        )}
                        {list.length > 0 && (
                          <div className="space-y-1">
                            {list.map((p) => (
                              <div key={p.id} className="flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLORS.input }}>
                                <span>₪{Number(p.amount).toLocaleString()} · {p.date || "ללא תאריך"}</span>
                                <button onClick={() => removePayment(m.name, p.id)} style={{ color: COLORS.textMuted }}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <AddPaymentForm onAdd={(amount, date) => addPayment(m.name, amount, date)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
            )}

            {financesView === "budget" && (
            <div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-sm font-bold" style={{ color: COLORS.accentDark }}>מנוע תקציב מפורט (צוות תקציב)</h3>
                <button
                  onClick={copyEngineToDepartmentBudget}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: COLORS.accent2, color: COLORS.bg }}
                >
                  העתק לתקציב לפי מחלקות
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                מעדכן אוטומטית את הסכומים המתוכננים בטאב "הוצאות" עבור: מים, שירותים ומקלחות, מטבח ומזון, קרח, חשמל, עיצוב ותפאורה וציוד. שאר הקטגוריות (הובלות, בנייה והקמות, תוכן וגיפט, דלק, חשל"ש, ביטוח, שונות) נשארות למילוי ידני.
              </p>
              <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.textMuted }}>פתיחת קטגוריית הוצאה חדשה</h3>
              <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                אם יש הוצאה שלא שייכת לשום צוות קיים - אפשר לפתוח קטגוריה חדשה שתופיע גם בטאב "הוצאות". רק צוות תקציב/מנהלים יכולים לפתוח קטגוריה חדשה.
              </p>
              <NewCategoryForm onAdd={addBudgetCategory} />
              <EditableCategoryList categories={extraBudgetCategories} onRename={renameBudgetCategory} onRemove={removeBudgetCategory} />
              <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.textMuted }}>הגדרת תקציב למחלקה</h3>
              <CategoryBudgetForm onSet={setCategoryBudget} categories={allBudgetCategories} />
            </div>
            {/* 12 - נוסחת האיחוד הסופית */}
            <div className="rounded-2xl p-4 mb-6" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
              <div className="text-xs font-bold mb-2" style={{ color: COLORS.accentDark }}>נוסחת האיחוד הסופית</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "סה\"כ עלות מחנה", value: engine.totalCampCost },
                  { label: "סה\"כ הכנסות", value: engine.totalIncome },
                  { label: "פער לגיוס", value: engine.gapToRaise, danger: engine.gapToRaise > 0 },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl p-3" style={{ background: COLORS.input }}>
                    <div className="text-lg font-black" style={{ fontFamily: FONT_NUM, color: c.danger ? COLORS.danger : COLORS.text }}>₪{Math.round(c.value).toLocaleString()}</div>
                    <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
                N = {engine.N || 0} חברים (לפי רשימת חברי הקמפ בפועל) · עלות לנפש: ₪{Math.round(engine.N > 0 ? engine.totalCampCost / engine.N : 0).toLocaleString()}
              </div>
              {whatIfEngine && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: `${COLORS.accent}55` }}>
                  <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.accentDark }}>תרחיש היפותטי - אם יהיו {whatIfEngine.N} חברים</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-2.5" style={{ background: COLORS.input }}>
                      <div className="text-sm font-black" style={{ fontFamily: FONT_NUM }}>₪{Math.round(whatIfEngine.totalCampCost).toLocaleString()}</div>
                      <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>עלות מחנה כוללת (לעומת ₪{Math.round(engine.totalCampCost).toLocaleString()} בפועל)</div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{ background: COLORS.input }}>
                      <div className="text-sm font-black" style={{ fontFamily: FONT_NUM }}>₪{Math.round(whatIfEngine.N > 0 ? whatIfEngine.totalCampCost / whatIfEngine.N : 0).toLocaleString()}</div>
                      <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>עלות לנפש (לעומת ₪{Math.round(engine.N > 0 ? engine.totalCampCost / engine.N : 0).toLocaleString()} בפועל)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!canEditBudget && (
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>הפרמטרים המלאים ניתנים לעריכה על ידי מנהלים בלבד. זו תצוגת הסיכום.</p>
            )}

            {/* 00 - פרמטרים גלובליים */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "global";
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "global")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>פרמטרים גלובליים</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 grid sm:grid-cols-2 gap-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>N - חברי מחנה (נגזר אוטומטית)</label>
                        <div className="px-3 py-2 rounded-xl text-sm" style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}>
                          {allMembers.length} חברים (לפי רשימת חברי הקמפ)
                        </div>
                      </div>
                      <NumField label={'אחוז בלת"מ (ברירת מחדל)'} value={budgetParams.global.contingencyPct} onChange={(v) => patchBudgetParams("global", { contingencyPct: v })} suffix="%" />
                      <NumField label="ימי הקמה" value={budgetParams.global.setupDays} onChange={(v) => patchBudgetParams("global", { setupDays: v })} />
                      <NumField label="ימי אירוע" value={budgetParams.global.eventDays} onChange={(v) => patchBudgetParams("global", { eventDays: v })} />
                      <label className="flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                        <input type="checkbox" checked={budgetParams.global.vatIncluded} onChange={(e) => patchBudgetParams("global", { vatIncluded: e.target.checked })} />
                        הסכומים כוללים מע"מ
                      </label>
                      <div className="sm:col-span-2 pt-2 mt-1 border-t" style={{ borderColor: COLORS.divider }}>
                        <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: COLORS.accentDark }}>
                          <input
                            type="checkbox"
                            checked={!!budgetParams.global.whatIfEnabled}
                            onChange={(e) => patchBudgetParams("global", { whatIfEnabled: e.target.checked })}
                          />
                          תרחיש היפותטי - כמה יעלה עם מספר חברים אחר?
                        </label>
                        {budgetParams.global.whatIfEnabled && (
                          <div className="mt-2 max-w-[180px]">
                            <NumField
                              label="מספר חברים היפותטי"
                              value={budgetParams.global.whatIfN}
                              onChange={(v) => patchBudgetParams("global", { whatIfN: v })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 02 - מחנה (כולל הסלון) */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "camp";
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "camp")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>מחנה - תשתית כללית (כולל הסלון) · ₪{Math.round(engine.campTotal).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 space-y-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div>
                        <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.textMuted }}>פריטי ציוד מחנה</div>
                        <ItemRowsEditor rows={budgetParams.campInfra.items} onChange={(rows) => patchBudgetParams("campInfra", { items: rows })} />
                      </div>
                      <div>
                        <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.textMuted }}>ציוד סלון (הצללה, ריהוט, תאורה...)</div>
                        <ItemRowsEditor rows={budgetParams.campInfra.loungeItems} onChange={(rows) => patchBudgetParams("campInfra", { loungeItems: rows })} />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2">
                        <NumField label={'קרח - מחיר לק"ג'} value={budgetParams.campInfra.icePricePerKg} onChange={(v) => patchBudgetParams("campInfra", { icePricePerKg: v })} />
                        <NumField label={'קרח - ק"ג ליום'} value={budgetParams.campInfra.iceKgPerDay} onChange={(v) => patchBudgetParams("campInfra", { iceKgPerDay: v })} />
                        <NumField label="קרח - מספר ימים" value={budgetParams.campInfra.iceDays} onChange={(v) => patchBudgetParams("campInfra", { iceDays: v })} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <NumField label="חשמל - מחיר לקילוואט" value={budgetParams.campInfra.elecPricePerKw} onChange={(v) => patchBudgetParams("campInfra", { elecPricePerKw: v })} />
                        <NumField label="חשמל - הספק מבוקש (קילוואט)" value={budgetParams.campInfra.elecKw} onChange={(v) => patchBudgetParams("campInfra", { elecKw: v })} />
                      </div>
                      <div>
                        <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.textMuted }}>תרומות/הכנסות נקודתיות</div>
                        <AmountRowsEditor rows={budgetParams.campInfra.oneTimeIncome} onChange={(rows) => patchBudgetParams("campInfra", { oneTimeIncome: rows })} />
                      </div>
                      <NumField label={'בלת"מ למחנה (אחוז, אופציונלי - דורס ברירת מחדל)'} value={budgetParams.contingencyOverrides.camp ?? ""} onChange={(v) => setContingencyOverride("camp", v)} suffix="%" />
                      <div className="text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        בסיס: ₪{Math.round(engine.campBase).toLocaleString()} · בלת"מ: ₪{Math.round(engine.campContingency).toLocaleString()} · סה"כ: ₪{Math.round(engine.campTotal).toLocaleString()} · לנפש: ₪{Math.round(engine.campPerPerson).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 03 - מים ומקלחות */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "water";
              const w = budgetParams.water;
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "water")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>מים ומקלחות · ₪{Math.round(engine.waterTotal).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 space-y-3 grid sm:grid-cols-2 gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <NumField label="צריכה לנפש ליום (ליטר)" value={w.literPerPersonPerDay} onChange={(v) => patchBudgetParams("water", { literPerPersonPerDay: v })} />
                      <NumField label="עלות מכל + ברז" value={w.tankFaucetCost} onChange={(v) => patchBudgetParams("water", { tankFaucetCost: v })} />
                      <NumField label="עלות מילוי" value={w.fillCost} onChange={(v) => patchBudgetParams("water", { fillCost: v })} />
                      <NumField label="מספר מילויים" value={w.fillCount} onChange={(v) => patchBudgetParams("water", { fillCount: v })} />
                      <NumField label="עלות ריקון" value={w.drainCost} onChange={(v) => patchBudgetParams("water", { drainCost: v })} />
                      <NumField label="מספר ריקונים" value={w.drainCount} onChange={(v) => patchBudgetParams("water", { drainCount: v })} />
                      <NumField label="עלות ליחידת מקלחת" value={w.showerUnitCost} onChange={(v) => patchBudgetParams("water", { showerUnitCost: v })} />
                      <NumField label="מספר יחידות מקלחת" value={w.showerUnitsCount} onChange={(v) => patchBudgetParams("water", { showerUnitsCount: v })} />
                      <div className="sm:col-span-2">
                        <NumField label={'בלת"מ למים (אחוז, אופציונלי)'} value={budgetParams.contingencyOverrides.water ?? ""} onChange={(v) => setContingencyOverride("water", v)} suffix="%" />
                      </div>
                      <div className="sm:col-span-2 text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        סה"כ ליטרים: {Math.round(engine.totalLiters).toLocaleString()} · בסיס: ₪{Math.round(engine.waterBase).toLocaleString()} · סה"כ: ₪{Math.round(engine.waterTotal).toLocaleString()} · לנפש: ₪{Math.round(engine.waterPerPerson).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 04 - שירותים (תברואה) */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "sanitation";
              const s = budgetParams.sanitation;
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "sanitation")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>שירותים (תברואה) · ₪{Math.round(engine.sanitationTotal).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 grid sm:grid-cols-2 gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <NumField label="תדירות פינוי (לאדם ליום)" value={s.pumpFreqPerPersonPerDay} onChange={(v) => patchBudgetParams("sanitation", { pumpFreqPerPersonPerDay: v })} />
                      <NumField label="עלות לפינוי" value={s.pumpCost} onChange={(v) => patchBudgetParams("sanitation", { pumpCost: v })} />
                      <NumField label="תדירות נסורת (מילויים)" value={s.sawdustFreq} onChange={(v) => patchBudgetParams("sanitation", { sawdustFreq: v })} />
                      <NumField label="עלות נסורת ליחידה" value={s.sawdustCost} onChange={(v) => patchBudgetParams("sanitation", { sawdustCost: v })} />
                      <NumField label="עלות תא נגר" value={s.drainCellCost} onChange={(v) => patchBudgetParams("sanitation", { drainCellCost: v })} />
                      <NumField label="שירותים כימיים" value={s.chemicalToiletsCost} onChange={(v) => patchBudgetParams("sanitation", { chemicalToiletsCost: v })} />
                      <div className="sm:col-span-2">
                        <NumField label={'בלת"מ לשירותים (אחוז, אופציונלי)'} value={budgetParams.contingencyOverrides.sanitation ?? ""} onChange={(v) => setContingencyOverride("sanitation", v)} suffix="%" />
                      </div>
                      <div className="sm:col-span-2 text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        עלות פינוי: ₪{Math.round(engine.pumpOutCost).toLocaleString()} · בסיס: ₪{Math.round(engine.sanitationBase).toLocaleString()} · סה"כ: ₪{Math.round(engine.sanitationTotal).toLocaleString()} · לנפש: ₪{Math.round(engine.sanitationPerPerson).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 05 - אוכל */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "food";
              const f = budgetParams.food;
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "food")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>אוכל · ₪{Math.round(engine.foodTotal).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 grid sm:grid-cols-2 gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <NumField label="אנשי הקמה" value={f.setupPeopleCount} onChange={(v) => patchBudgetParams("food", { setupPeopleCount: v })} />
                      <NumField label="ימי הקמה" value={f.setupDays} onChange={(v) => patchBudgetParams("food", { setupDays: v })} />
                      <NumField label="עלות ליום הקמה (לאדם)" value={f.setupCostPerDay} onChange={(v) => patchBudgetParams("food", { setupCostPerDay: v })} />
                      <NumField label="סועדים באירוע (בפועל)" value={f.actualDiners} onChange={(v) => patchBudgetParams("food", { actualDiners: v })} />
                      <NumField label="ארוחות ליום" value={f.mealsPerDay} onChange={(v) => patchBudgetParams("food", { mealsPerDay: v })} />
                      <NumField label="ימי אירוע (לאוכל)" value={f.eventDays} onChange={(v) => patchBudgetParams("food", { eventDays: v })} />
                      <NumField label="עלות לארוחה (לאדם)" value={f.costPerMeal} onChange={(v) => patchBudgetParams("food", { costPerMeal: v })} />
                      <NumField label={'בלת"מ אוכל (סכום קבוע)'} value={f.contingencyAmount} onChange={(v) => patchBudgetParams("food", { contingencyAmount: v })} />
                      <div className="sm:col-span-2 text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        עלות הקמה: ₪{Math.round(engine.setupFoodCost).toLocaleString()} · עלות אירוע: ₪{Math.round(engine.eventFoodCost).toLocaleString()} · סה"כ: ₪{Math.round(engine.foodTotal).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 06 - אלכוהול */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "alcohol";
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "alcohol")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>אלכוהול · ₪{Math.round(engine.alcoholTotal).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <AlcoholRowsEditor rows={budgetParams.alcohol.categories} onChange={(rows) => patchBudgetParams("alcohol", { categories: rows })} />
                      <NumField label="רזרבה נדחית (נרכשת רק בהתאם לצורך)" value={budgetParams.alcohol.deferredReserve} onChange={(v) => patchBudgetParams("alcohol", { deferredReserve: v })} />
                      <div className="text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        סה"כ: ₪{Math.round(engine.alcoholTotal).toLocaleString()} · לנפש: ₪{Math.round(engine.alcoholPerPerson).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 07 - כללי */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "general";
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "general")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>כללי - עלויות משותפות · ₪{Math.round(engine.generalShare).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 grid sm:grid-cols-2 gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <NumField label="עלות שנתית קבועה" value={budgetParams.general.fixedAnnualCost} onChange={(v) => patchBudgetParams("general", { fixedAnnualCost: v })} />
                      <NumField label="יחס חלוקה (% על המחנה)" value={budgetParams.general.splitRatioPct} onChange={(v) => patchBudgetParams("general", { splitRatioPct: v })} suffix="%" placeholder="100" />
                      <div className="sm:col-span-2 text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        חלק המחנה: ₪{Math.round(engine.generalShare).toLocaleString()} · לנפש: ₪{Math.round(engine.generalPerPerson).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 09 - הכנסות */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "income";
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "income")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>הכנסות · ₪{Math.round(engine.totalIncome).toLocaleString()}</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 grid sm:grid-cols-2 gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="rounded-xl p-2 text-xs" style={{ background: COLORS.input }}>
                        דמי חברים שנגבו (מטאב "כספים"): <b>₪{Math.round(engine.duesCollected).toLocaleString()}</b>
                      </div>
                      <div />
                      <NumField label={'החזר מע"מ'} value={budgetParams.income.vatRefund} onChange={(v) => patchBudgetParams("income", { vatRefund: v })} />
                      <NumField label="הכנסה חיצונית - ברוטו" value={budgetParams.income.externalGross} onChange={(v) => patchBudgetParams("income", { externalGross: v })} />
                      <NumField label="הכנסה חיצונית - נטו" value={budgetParams.income.externalNet} onChange={(v) => patchBudgetParams("income", { externalNet: v })} />
                      <div className="sm:col-span-2 text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        סה"כ הכנסות: ₪{Math.round(engine.totalIncome).toLocaleString()} · פער מול עלות מחנה: ₪{Math.round(engine.gapToRaise).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 11 - תזרים מזומנים */}
            {canManageFinances && (() => {
              const open = showBudgetSection === "cashflow";
              return (
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "cashflow")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>תזרים מזומנים</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div>
                        <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.textMuted }}>ערוצי גבייה (בנק, אשראי, ארנקים דיגיטליים, מזומן)</div>
                        <AmountRowsEditor rows={budgetParams.cashflow.channels} onChange={(rows) => patchBudgetParams("cashflow", { channels: rows })} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <NumField label="תשלומים תלויים (טרם נסגרו)" value={budgetParams.cashflow.pendingPayments} onChange={(v) => patchBudgetParams("cashflow", { pendingPayments: v })} />
                        <NumField label="התחייבויות ידועות (טרם שולמו)" value={budgetParams.cashflow.knownCommitments} onChange={(v) => patchBudgetParams("cashflow", { knownCommitments: v })} />
                      </div>
                      <div className="text-xs pt-2 border-t" style={{ color: COLORS.textMuted, borderColor: COLORS.divider }}>
                        מזומן זמין: ₪{Math.round(engine.channelsTotal).toLocaleString()} · פער תזרימי: ₪{Math.round(engine.cashflowGap).toLocaleString()} · יתרה חזויה: ₪{Math.round(engine.projectedBalance).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 10 - רישום הוצאות בפועל */}
            {(() => {
              const open = showBudgetSection === "expenses";
              return (
                <div className="mb-3" id="budget-expenses-section">
                  <button onClick={() => setShowBudgetSection(open ? null : "expenses")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>רישום הוצאות בפועל ({budgetExpenses.length})</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="space-y-3">
                      {canEditBudget && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={downloadBudgetExpensesCsv}
                            className="text-xs px-3 py-1.5 rounded-full font-semibold"
                            style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
                          >
                            ייצוא ל-CSV (נפתח באקסל)
                          </button>
                          {isAdmin && (
                            <label
                              className="text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer"
                              style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
                            >
                              ייבוא מ-CSV
                              <input
                                type="file"
                                accept=".csv,text/csv"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) importBudgetExpensesCsv(file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                      {canEditBudget && <BudgetExpenseForm onAdd={addBudgetExpense} onError={(msg) => showToast(msg, "error")} lockedAllocation={isAdmin ? null : myLeadTeam} categories={allBudgetCategories} allMembers={allMembers} />}
                      <div className="space-y-1.5">
                        {budgetExpenses.map((e) => {
                          const canManageThis = isAdmin || myLeadTeam === e.allocation;
                          if (editingExpenseId === e.id) {
                            return (
                              <BudgetExpenseForm
                                key={e.id}
                                initial={e}
                                categories={allBudgetCategories}
                                lockedAllocation={isAdmin ? null : myLeadTeam}
                                onCancel={() => setEditingExpenseId(null)}
                                onError={(msg) => showToast(msg, "error")}
                                allMembers={allMembers}
                                onAdd={(patch) => {
                                  updateBudgetExpense(e.id, patch);
                                  setEditingExpenseId(null);
                                }}
                              />
                            );
                          }
                          return (
                            <div key={e.id} className="rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2" style={{ background: COLORS.surface }}>
                              <div className="flex items-center gap-2 min-w-0">
                                {e.receiptUrl && (
                                  <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                    <img src={e.receiptUrl} alt="קבלה" className="h-10 w-10 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.divider}` }} />
                                  </a>
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold">{e.allocation || "ללא שיוך תקציבי"}{(e.description || e.subcategory) ? ` · ${e.description || e.subcategory}` : ""}{e.vendor ? ` · ${e.vendor}` : ""}</div>
                                  <div style={{ color: COLORS.textMuted }}>
                                    {e.isRefund ? "זיכוי: " : ""}₪{Number(e.amount).toLocaleString()} · {e.vatIncluded ? "כולל מע\"מ" : "לא כולל מע\"מ"}
                                    {e.paymentMethod ? ` · ${paymentMethodLabel(e.paymentMethod)}` : ""}
                                    {e.purchaseDate ? ` · נקנה ${formatDateShort(e.purchaseDate)}` : ""}
                                  </div>
                                  <div style={{ color: e.paymentStatus === "partial" ? COLORS.danger : COLORS.accent2Dark }}>
                                    {e.paymentStatus === "partial"
                                      ? `שולם ₪${Number(e.paidAmount || 0).toLocaleString()} · נותר ₪${Number(e.remainingAmount || 0).toLocaleString()}${e.dueDate ? ` עד ${formatDateShort(e.dueDate)}` : ""}`
                                      : (e.paymentStatus ? "שולם במלואו" : "")}
                                  </div>
                                  {e.refundToMember && (
                                    <div className="flex items-center gap-1.5 flex-wrap" style={{ color: e.refundPaid ? COLORS.accent2Dark : COLORS.danger }}>
                                      <span>
                                        מגיע החזר ל{e.refundMemberName ? `: ${e.refundMemberName}` : "חבר/ת קמפ"}
                                        {" · "}{e.refundPaid ? "הוחזר" : "טרם הוחזר"}
                                      </span>
                                      {canManageThis && (
                                        <button
                                          type="button"
                                          onClick={() => updateBudgetExpense(e.id, { refundPaid: !e.refundPaid })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                          style={{ background: COLORS.input, color: COLORS.textMuted }}
                                        >
                                          {e.refundPaid ? "סמן כטרם הוחזר" : "סמן כהוחזר"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {canManageThis && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button onClick={() => setEditingExpenseId(e.id)} style={{ color: COLORS.textMuted }}><Pencil size={14} /></button>
                                  <button onClick={() => removeBudgetExpense(e.id)} style={{ color: COLORS.textMuted }}><Trash2 size={14} /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
            )}

            {financesView === "receipts" && (() => {
              const withReceipts = budgetExpenses.filter((e) => e.receiptUrl);
              const NO_ALLOCATION = "ללא שיוך תקציבי";
              const groups = {};
              withReceipts.forEach((e) => {
                const key = e.allocation || NO_ALLOCATION;
                (groups[key] = groups[key] || []).push(e);
              });
              const orderedCategories = [
                ...allBudgetCategories.filter((c) => groups[c]),
                ...Object.keys(groups).filter((c) => c !== NO_ALLOCATION && !allBudgetCategories.includes(c)),
                ...(groups[NO_ALLOCATION] ? [NO_ALLOCATION] : []),
              ];
              return (
                <div>
                  {withReceipts.length === 0 ? (
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>עדיין אין קבלות מצורפות. אפשר לצרף קבלה בעת רישום הוצאה בטאב "הוצאות".</p>
                  ) : (
                    <div className="space-y-5">
                      {orderedCategories.map((cat) => (
                        <div key={cat}>
                          <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.accentDark }}>{cat} ({groups[cat].length})</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {groups[cat]
                              .sort((a, b) => (b.purchaseDate || "").localeCompare(a.purchaseDate || ""))
                              .map((e) => (
                                <a
                                  key={e.id}
                                  href={e.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-2xl overflow-hidden block"
                                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}
                                >
                                  <img src={e.receiptUrl} alt="קבלה" className="w-full h-24 object-cover" />
                                  <div className="px-2 py-1.5 text-xs">
                                    <div className="font-semibold truncate">{e.vendor || e.subcategory || e.allocation || "הוצאה"}</div>
                                    <div style={{ color: COLORS.textMuted }}>₪{Number(e.amount).toLocaleString()}{e.purchaseDate ? ` · ${formatDateShort(e.purchaseDate)}` : ""}</div>
                                  </div>
                                </a>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {tab === "allocations" && isAdmin && (
          <div>
            <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
              כל חבר/ה מעדכן/ת בטאב "לוח בקרה אישי" האם יש לו/ה הקצאה למידברן, האם נוצלה לאחר שעברה המכירה, והאם יש הקצאה נוספת. הטאב הזה מוצג רק למנהלים.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "יש הקצאה", value: membersWithAllocation.length },
                { label: "נוצלה", value: membersUsedAllocation.length },
                { label: "טרם נוצלה", value: membersPendingAllocation.length },
                { label: "הקצאה נוספת", value: membersWithExtraAllocation.length },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                </div>
              ))}
            </div>

            {membersWithoutAllocationInfo.length > 0 && (
              <div className="rounded-2xl p-3 mb-5 text-xs" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>
                {membersWithoutAllocationInfo.length} חברים עדיין לא מילאו פרטי הקצאה
              </div>
            )}

            <div className="space-y-1.5">
              {allMembers.map((m) => {
                const d = allocationInfo[m.name];
                if (!d) return null;
                return (
                  <div key={m.name} className="rounded-xl px-3 py-2 flex items-center justify-between gap-2 flex-wrap text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <span className="font-semibold text-sm">{m.name}</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {d.hasAllocation === "yes" ? (
                        <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: COLORS.accent2Light, color: COLORS.accent2Dark }}>
                          יש הקצאה{d.used === "yes" ? " · נוצלה" : " · טרם נוצלה"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: COLORS.input, color: COLORS.textMuted }}>אין הקצאה</span>
                      )}
                      {d.hasExtra === "yes" && (
                        <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>הקצאה נוספת</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {allMembers.every((m) => !allocationInfo[m.name]) && (
              <p className="text-xs text-center py-10" style={{ color: COLORS.textMuted }}>עדיין אין נתוני הקצאות.</p>
            )}
          </div>
        )}

        {tab === "teams" && (
          <div>
            {isAdmin && <NewTeamForm onAdd={addTeam} />}
            {isAdmin && allTeams.some((t) => checklistItemsFor(t.name).length > 0) && (
              <div className="mb-4 rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                <div className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>צ'קליסטים - סטטוס לפי צוות</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allTeams.filter((t) => checklistItemsFor(t.name).length > 0).map((t) => {
                    const items = checklistItemsFor(t.name);
                    const state = checklistState[t.name] || {};
                    const done = items.filter((_, i) => state[i]).length;
                    const complete = done === items.length;
                    return (
                      <div key={t.name} className="rounded-xl px-3 py-2 text-xs flex items-center justify-between" style={{ background: complete ? COLORS.accent2Light : COLORS.input }}>
                        <span>{t.name}</span>
                        <span style={{ color: complete ? COLORS.accent2Dark : COLORS.textMuted, fontWeight: 700 }}>{done}/{items.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
            {allTeams.map((t) => {
              const leads = teamLeadsOf(t.name);
              const members = teamMembers(t.name);
              const open = expandedTeam === t.name;
              const isLead = leads.some((l) => l.name === identity);
              const canManageTeam = isAdmin || isLead;
              return (
                <div key={t.name} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <button onClick={() => setExpandedTeam(open ? null : t.name)} className="w-full text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold" style={{ color: COLORS.accentDark }}>{t.name}</span>
                      <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", opacity: 0.7 }} />
                    </div>
                    {leads.length > 0 && (
                      <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                        {leads.length > 1 ? "מובילים: " : "מוביל/ה: "}{leads.map((l) => l.name).join(", ")}
                      </div>
                    )}
                  </button>

                  {(isAdmin || isLead) && (
                    <TeamLeadPicker team={t.name} current={teamLeads[t.name]} members={allMembers} onSet={setTeamLead} canEditPrimary={isAdmin} />
                  )}

                  <div className="text-xs leading-relaxed mt-2" style={{ color: COLORS.textMuted }}>{t.desc}</div>
                  {open && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.divider }}>
                      <div className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>מי הצטרף לצוות ({members.length})</div>
                      {members.length === 0 ? (
                        <div className="text-xs" style={{ color: COLORS.textMuted }}>עדיין אף אחד לא שיבץ משמרת בצוות הזה</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {members.map((n) => {
                            const manual = isManualTeamMember(t.name, n);
                            return (
                              <span key={n} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1.5" style={{ background: manual ? COLORS.accent2Light : COLORS.input }}>
                                {n}
                                {canManageTeam && manual && (
                                  <button onClick={() => removeManualTeamMember(t.name, n)} style={{ color: COLORS.textMuted }}><X size={10} /></button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {canManageTeam && (
                        <div className="mt-2">
                          <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>שיוך לצוות ללא משמרת</div>
                          <AdminAssignPicker members={allMembers} onAssign={(name) => addManualTeamMember(t.name, name)} />
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.divider }}>
                        <TeamChecklist
                          items={checklistItemsFor(t.name)}
                          state={checklistState[t.name] || {}}
                          canCheck={canManageTeam}
                          canManage={canManageTeam}
                          onToggle={(i) => toggleChecklistItem(t.name, i)}
                          onAdd={(text) => addChecklistItem(t.name, text)}
                          onEdit={(i, text) => editChecklistItem(t.name, i, text)}
                          onRemove={(i) => removeChecklistItem(t.name, i)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}

        {tab === "rides" && (
          <div>
            <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
              את הפרטים שלך (עיר, יום הגעה, רכב, טרמפים, מקום לציוד) ממלאים בטאב "לוח בקרה אישי". כאן רואים את התוצאה המשותפת של כולם - ואפשר לפנות ישירות למי שיכול/ה לעזור.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "מציעים טרמפ", value: offeringRides.length },
                { label: "מחפשים טרמפ", value: lookingForRide.length },
                { label: "מקום לציוד", value: offeringCargoSpace.length },
                { label: "יכולת גרירה", value: towingCapable.length },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                </div>
              ))}
            </div>

            {isAdmin && offeringRides.length > 0 && (
              <div className="mb-4 rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                <div className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>שיוך נוסעים לנהגים (מנהל)</div>
                <div className="space-y-2">
                  {offeringRides.map((driver) => {
                    const matched = rideMatches[driver.name] || [];
                    const unmatchedSeekers = lookingForRide.filter((s) => !matched.includes(s.name));
                    const seats = rideInfo[driver.name]?.seats;
                    return (
                      <div key={driver.name} className="rounded-xl px-3 py-2" style={{ background: COLORS.input }}>
                        <div className="text-xs font-bold mb-1">{driver.name}{seats ? ` · ${matched.length}/${seats} מקומות` : ""}</div>
                        {matched.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {matched.map((n) => (
                              <span key={n} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: COLORS.accent2Light }}>
                                {n}
                                <button onClick={() => unmatchRide(driver.name, n)} style={{ color: COLORS.textMuted }}><X size={10} /></button>
                              </span>
                            ))}
                          </div>
                        )}
                        {unmatchedSeekers.length > 0 ? (
                          <select
                            defaultValue=""
                            onChange={(e) => { if (e.target.value) { matchRide(driver.name, e.target.value); e.target.value = ""; } }}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                          >
                            <option value="">+ שיוך נוסע/ת...</option>
                            {unmatchedSeekers.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                        ) : (
                          matched.length === 0 && <div className="text-xs" style={{ color: COLORS.textMuted }}>אין כרגע נוסעים שמחפשים טרמפ לשייך</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <RideCategoryCard icon={Car} title="מציעים טרמפ" count={offeringRides.length} headerColor={COLORS.accent2} emptyText="אף אחד עדיין לא הציע טרמפ">
                {offeringRides.map((m, i) => {
                  const d = rideInfo[m.name];
                  const matchedRiders = rideMatches[m.name] || [];
                  const detail = [
                    d.arrivalDay ? formatDate(d.arrivalDay) : "יום לא צוין",
                    d.seats ? `${d.seats} מקומות פנויים` : null,
                    d.city || null,
                    matchedRiders.length > 0 ? `שויכו: ${matchedRiders.join(", ")}` : null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <RouteRow
                      key={m.name}
                      name={m.name}
                      detail={detail}
                      dotColor={COLORS.accent2Dark}
                      isLast={i === offeringRides.length - 1}
                      canContact={m.name !== identity}
                      contacting={contactingRideMember === m.name}
                      onToggleContact={() => setContactingRideMember(contactingRideMember === m.name ? null : m.name)}
                      onSend={(text) => { sendPrivateMessage(m.name, text); setContactingRideMember(null); }}
                    />
                  );
                })}
              </RideCategoryCard>

              <RideCategoryCard icon={Users} title="מחפשים טרמפ" count={lookingForRide.length} headerColor={COLORS.accent} emptyText="אף אחד עדיין לא מחפש טרמפ">
                {lookingForRide.map((m, i) => {
                  const d = rideInfo[m.name];
                  const matchedDriver = Object.keys(rideMatches).find((driver) => (rideMatches[driver] || []).includes(m.name));
                  const detail = [
                    d.arrivalDay ? `מתכנן/ת להגיע ${formatDate(d.arrivalDay)}` : null,
                    d.city || null,
                    matchedDriver ? `✓ שויך/ה ל-${matchedDriver}` : null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <RouteRow
                      key={m.name}
                      name={m.name}
                      detail={detail || null}
                      dotColor={COLORS.accentDark}
                      isLast={i === lookingForRide.length - 1}
                      canContact={m.name !== identity}
                      contacting={contactingRideMember === m.name}
                      onToggleContact={() => setContactingRideMember(contactingRideMember === m.name ? null : m.name)}
                      onSend={(text) => { sendPrivateMessage(m.name, text); setContactingRideMember(null); }}
                    />
                  );
                })}
              </RideCategoryCard>

              <RideCategoryCard icon={UserPlus} title="מקום לציוד/קניות" count={offeringCargoSpace.length} headerColor={COLORS.accent2} emptyText="אף אחד עדיין לא סימן מקום פנוי לציוד">
                {offeringCargoSpace.map((m, i) => {
                  const d = rideInfo[m.name];
                  const detail = [
                    d.arrivalDay ? formatDate(d.arrivalDay) : "יום לא צוין",
                    d.cargoNote || null,
                    d.city || null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <RouteRow
                      key={m.name}
                      name={m.name}
                      detail={detail}
                      dotColor={COLORS.accent2Dark}
                      isLast={i === offeringCargoSpace.length - 1}
                      canContact={m.name !== identity}
                      contacting={contactingRideMember === m.name}
                      onToggleContact={() => setContactingRideMember(contactingRideMember === m.name ? null : m.name)}
                      onSend={(text) => { sendPrivateMessage(m.name, text); setContactingRideMember(null); }}
                    />
                  );
                })}
              </RideCategoryCard>

              <RideCategoryCard icon={Car} title="יכולת גרירה - וו/עגלה" count={towingCapable.length} headerColor={COLORS.accent} emptyText="אף אחד עדיין לא סימן יכולת גרירה">
                {towingCapable.map((m, i) => {
                  const d = rideInfo[m.name];
                  const bits = [];
                  if (d.vehicleType) bits.push(d.vehicleType);
                  if (d.hasTowHitch === "yes") bits.push("וו גרירה");
                  if (d.hasTrailer === "yes") bits.push("עגלה נגררת");
                  const detail = [bits.join(" · ") || "—", d.city || null].filter(Boolean).join(" · ");
                  return (
                    <RouteRow
                      key={m.name}
                      name={m.name}
                      detail={detail}
                      dotColor={COLORS.accentDark}
                      isLast={i === towingCapable.length - 1}
                      canContact={m.name !== identity}
                      contacting={contactingRideMember === m.name}
                      onToggleContact={() => setContactingRideMember(contactingRideMember === m.name ? null : m.name)}
                      onSend={(text) => { sendPrivateMessage(m.name, text); setContactingRideMember(null); }}
                    />
                  );
                })}
              </RideCategoryCard>
            </div>
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-2">
            {/* Read-only: phone/email are only ever edited from "לוח בקרה
                אישי" (each person edits their own) - this tab just displays
                that data, no edit path here at all anymore, not even admin. */}
            {allMembers.map((m) => {
              return (
                <div key={m.name} className="rounded-xl px-4 py-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      {m.name}
                      {rideInfo[m.name]?.city && <span className="font-normal" style={{ color: COLORS.textMuted }}> · {rideInfo[m.name].city}</span>}
                      {m.name !== identity && memberPhones[m.name] && (
                        <a
                          href={buildWhatsAppLink(memberPhones[m.name], "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="הודעה פרטית בוואטסאפ"
                          style={{ color: "#25D366" }}
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                    </span>
                    <div className="text-sm text-left" dir="ltr" style={{ color: COLORS.textMuted }}>
                      {memberPhones[m.name] || "—"} · {memberEmails[m.name] || "—"}
                    </div>
                  </div>
                  {m.name === identity && pushStatus !== "unsupported" && (
                    <div className="mt-2">
                      {pushSubscribed ? (
                        <button onClick={handleDisablePush} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: COLORS.accent2Light, color: COLORS.accent2Dark }}>
                          <Bell size={12} /> התראות דחיפה פעילות - לחץ/י לביטול
                        </button>
                      ) : (
                        <button onClick={handleEnablePush} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: COLORS.accent, color: COLORS.bg }}>
                          <BellOff size={12} /> הפעלת התראות דחיפה למודעות וסקרים
                        </button>
                      )}
                    </div>
                  )}
                  {m.name === identity && memberPhones[m.name] && (
                    <label className="mt-2 flex items-center gap-1.5 text-xs w-fit cursor-pointer" style={{ color: COLORS.textMuted }}>
                      <input
                        type="checkbox"
                        checked={!!whatsappConsent[m.name]}
                        onChange={(e) => setWhatsappConsent(m.name, e.target.checked)}
                      />
                      מאשר/ת קבלת תזכורות בוואטסאפ (תשלומים ואירועים)
                    </label>
                  )}
                  {isAdmin && memberPhones[m.name] && whatsappConsent[m.name] && (
                    <div className="mt-2">
                      <a
                        href={buildWhatsAppLink(memberPhones[m.name], eventReminderMessage(m.name))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: "#25D366", color: "white" }}
                      >
                        <MessageCircle size={13} /> תזכורת אירוע בוואטסאפ
                      </a>
                    </div>
                  )}
                  {isAdmin && memberPhones[m.name] && !whatsappConsent[m.name] && (
                    <div className="mt-2 text-xs" style={{ color: COLORS.textMuted }}>
                      {m.name} עדיין לא אישר/ה קבלת תזכורות בוואטסאפ
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
          style={{ background: toast.kind === "error" ? COLORS.danger : COLORS.accent2, color: "white" }}
        >
          {toast.kind === "error" ? <X size={16} /> : <Check size={16} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
