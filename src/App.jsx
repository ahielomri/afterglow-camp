import { useState, useEffect, useMemo, useRef } from "react";
import { Users, CalendarDays, Clock, Flame, Tent, ChevronDown as ChevronDownThin, Check, X, LogOut, Wallet, Plus, Trash2, CreditCard, Phone, Car, UserPlus, Megaphone, HeartPulse, History, Bell, BellOff, Package, MapPin, Ticket, MessageCircle, Pencil, ShieldCheck, ShieldOff, LockKeyhole, LayoutDashboard, Home, ShoppingCart, Camera, ImagePlus, Download, Tag, MoreVertical, Crown, WifiOff } from "lucide-react";
// Every ChevronDown in the app should read as bold/clickable, not just the
// default thin stroke - default it here once instead of at each call site.
function ChevronDown(props) {
  return <ChevronDownThin strokeWidth={3} {...props} />;
}
import { pushSupported, pushPermission, enablePush, disablePush, isPushSubscribed, resetPush } from "./push.js";
import { runBudgetEngine } from "./budgetEngine.js";
import heroDesert from "./assets/hero-sunset-logo-2.jpg";
import funBanner from "./assets/fun-banner.jpg";
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
  getDietaryPreferenceCounts,
  insertActivityLog,
  listActivityLog,
  uploadEventPhoto,
  listEventPhotos,
  fetchOriginalPhotoBlob,
  deleteEventPhoto,
  addEventPhotoTag,
  removeEventPhotoTag,
  listUnseenPhotoTags,
  markPhotoTagsSeen,
  listPhotoComments,
  addPhotoComment,
  deletePhotoComment,
  archiveRemovedMember,
  listRemovedMembers,
  restoreRemovedMember,
} from "./storage.js";

// ---------------------------------------------------------------------------
// Design tokens - "Earth and Ash" palette (2b)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#ede6da",
  surface: "#dfd1bf",
  surface2: "#e6dbc9",
  input: "#f8f4ec",
  text: "#2b2420",
  textMuted: "rgba(43,36,32,0.65)",
  divider: "#d6c2a9",
  accent: "#9c5b42",
  accentDark: "#6e3f2c",
  accentLight: "#ecdccb",
  accent2: "#b9834f",
  accent2Dark: "#8a5f34",
  accent2Light: "#ecd9bd",
  danger: "#a8433a",
  fullBg: "#d8cdbd",
  moneyAccent: "#c97390",
  heroLight: "#d9bba0",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Caprasimo&family=Rubik:wght@400;500;600;700;800&family=Frank+Ruhl+Libre:wght@500;700;900&display=swap');
* { font-weight: 600; }
.text-xs, .text-sm, .text-base, .text-lg { font-weight: 700 !important; }
input, select, textarea, button, label { font-weight: 700 !important; }
p, span, div { font-weight: 600; }
`;
const FONT_HEADING = `"Caprasimo", "Frank Ruhl Libre", serif`;
const FONT_BODY = `"Rubik", sans-serif`;
const FONT_NUM = `"Rubik", sans-serif`;

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

// Seed data for the "תוכן" (content) tab's evening-program table, taken
// from the schedule handed over when the tab was first built. Editable
// afterwards by "צוות תוכן גיפט" (leads + members) and admins. Each occupied
// slot is a structured item (title/facilitator/description), not bare text,
// so it can render as a button that expands into its own detail view - an
// empty slot is simply `null`.
function contentItem(title, description, facilitator = "") {
  return { title, facilitator, description };
}
const DEFAULT_CONTENT_SCHEDULE = {
  columns: [
    "יום 1 – סיפורי המדבר",
    "יום 2 – מסע הצלילים",
    "יום 3 – שערי המדבר",
    "יום 4 – ערב רוגע וחיבור",
  ],
  rows: [
    {
      id: "r1",
      label: "16:45–17:00",
      cells: [
        contentItem("טקס קבלת פנים בדואי", ""),
        contentItem("טקס קבלת פנים בדואי", ""),
        contentItem("טקס קבלת פנים בדואי", ""),
        contentItem("טקס קבלת פנים בדואי", ""),
      ],
    },
    {
      id: "r2",
      label: "17:00–17:10",
      cells: [
        contentItem("התיישבות במעגל ופתיחת המארח", ""),
        contentItem("התיישבות במעגל", ""),
        contentItem("פתיחת מספר מעגלים", "פעילות בקבוצות קטנות"),
        contentItem("פתיחת המעגל בנשימות קצרות", ""),
      ],
    },
    {
      id: "r3",
      label: "17:00–18:30",
      cells: [
        contentItem(
          "מספר סיפורים",
          "סיפורי מדבר, נוודים ואגדות בסגנון אלף לילה ולילה - הסגנון הוא סגנון אימפרוביזציה ווידוי - סיפורים שמספרים לתוך הלילה לרוח"
        ),
        contentItem("סאונד הילינג ומסע צלילים", "ניקוי אנרגטי, מסע צלילים עם קערות וכלים אתניים, מדיטציה מונחית"),
        contentItem("מגלי עתידות", "פתיחה בקלפים / טארוט, ניקוי אנרגטי, שיחות פתוחות וחיבורים"),
        contentItem("להשאיר חלק ממך", "כותבים כוונה ומשאירים אותה במדורה"),
      ],
    },
    {
      id: "r4",
      label: "18:30–18:45",
      cells: [
        contentItem("מעגל סיום קצר", "והזמנה להישאר במרחב"),
        contentItem("סגירת המסע בשקט", ""),
        contentItem("תפילה קצרה לזימונים", ""),
        contentItem("טקס הודיה וסיום", ""),
      ],
    },
    {
      id: "r5",
      label: "ארוח",
      cells: [
        contentItem("כיבוד", "קפה שחור, תה עם נענע, מרווה, מוזיקה מדברית, התכנסות באוהל"),
        contentItem("כיבוד", "תה היביסקוס מתוק וקר"),
        contentItem("כיבוד", "תה היביסקוס מתוק וקר"),
        contentItem("כיבוד", "קפה שחור, תה עם נענע, מרווה, מוזיקה מדברית, התכנסות באוהל"),
      ],
    },
  ],
};
const CONTENT_TEAM_NAME = "צוות תוכן גיפט";

const TEAMS = [
  { name: "תכנון המחנה", desc: "תכנון פיזי והעמדה של הקמפ: מיקומי המטבח, השירותים, המקלחות, אזור הלינה ומרחב הגיפט/הסלון" },
  { name: "הקמות", desc: "הגעה לפלאיה יומיים עד ארבעה ימים לפני פתיחת האירוע. בנייה פיזית של כל תשתיות ומבני המחנה מאפס" },
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
  const setupDays = ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];
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

// Offline fallback: the event site itself has no signal (see the emergency-
// card PDF export, which exists for exactly that reason). A member who
// closes and reopens the app there would otherwise land back on the login
// screen with nothing to show - identity restore and every kv_store read
// both require a live round-trip to Supabase, so a pure network failure
// silently wipes everything to empty. This snapshot is a plain localStorage
// mirror of the two things worth having offline (their own shifts, their
// own emergency contact) written after every successful load, and read
// back only when a fresh load genuinely can't reach the network.
const OFFLINE_SNAPSHOT_KEY = "offline-snapshot-v1";

function saveOfflineSnapshot(identity, assignments, emergencyInfo) {
  try {
    localStorage.setItem(OFFLINE_SNAPSHOT_KEY, JSON.stringify({
      identity,
      ts: Date.now(),
      assignments,
      myEmergencyInfo: emergencyInfo[identity] || null,
    }));
  } catch {
    // Storage full/unavailable - offline mode just won't have anything to
    // fall back to next time, same as never having been online before.
  }
}

function loadOfflineSnapshot() {
  try {
    const raw = localStorage.getItem(OFFLINE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
const BUDGET_CATEGORIES = [
  "מטבח ומזון", "מים", "שירותים ומקלחות", "הובלות", "ציוד", "בנייה והקמות",
  "עיצוב ותפאורה", "תוכן וגיפט", "חשמל", "דלק", "גז", "קרח", "חשל\"ש", "ביטוח", "שונות",
];

// Operational teams (TEAMS, above) and budget categories (BUDGET_CATEGORIES)
// are two different naming schemes - a team lead adding an expense from
// their own team dashboard used to get it stored under the team's own name
// (e.g. "צוות המטבח"), which doesn't match the "מטבח ומזון" category the
// rest of the budget screens (parameters, "תקציב מול ביצוע", category
// cards) group everything by - so that spend would silently vanish from
// every category-level total even though it's real money. This maps every
// team that actually has a matching cost category to it; a team with no
// natural budget category (e.g. תכנון המחנה, נציג.ת מיט"ה) falls back to
// its own name, same as before.
const TEAM_BUDGET_CATEGORY = {
  "הקמות": "בנייה והקמות",
  "צוות המטבח": "מטבח ומזון",
  "אחראי קרח": "קרח",
  "עיצוב המחנה ותפאורה": "עיצוב ותפאורה",
  "צוות תוכן גיפט": "תוכן וגיפט",
  "צוות חשל\"ש": "חשל\"ש",
  "רכש ולוגיסטיקה": "לוגיסטיקה",
};
function budgetCategoryForTeam(team) {
  return TEAM_BUDGET_CATEGORY[team] || team;
}

const EQUIPMENT_CATEGORIES = TEAMS.map((t) => t.name);
const EQUIPMENT_CONDITIONS = ["תקין", "דורש תיקון", "חסר / אבד"];

// Price catalog for the kitchen shopping list - common camp staples with
// an approximate per-unit price (₪, VAT included, as on an Israeli shelf
// price tag) and a department (category) so the picker can group them.
// There's no live connection to a real supermarket price feed from this
// environment (Shufersal/Rami Levy block direct fetches, and a real
// Shufersal price-transparency export that was tried turned out to only
// cover ~18 essentially random SKUs from one store - not usable as a
// catalog), so these were cross-checked via web search against real
// current listings and price-comparison sites (Pricez/Zap Market) rather
// than pure guesses - but they're still real-world snapshots, not a live
// feed, so the kitchen team should correct them as actual receipts come in
// (either by editing the item after adding it, or updating this list).
const SHOPPING_CATALOG = [
  // ירקות ופירות
  { category: "ירקות ופירות", name: "עגבניות", unit: "ק\"ג", pricePerUnit: 6 },
  { category: "ירקות ופירות", name: "מלפפונים", unit: "ק\"ג", pricePerUnit: 6 },
  { category: "ירקות ופירות", name: "גזר", unit: "ק\"ג", pricePerUnit: 5 },
  { category: "ירקות ופירות", name: "תפוחי אדמה", unit: "ק\"ג", pricePerUnit: 5 },
  { category: "ירקות ופירות", name: "בטטה", unit: "ק\"ג", pricePerUnit: 7 },
  { category: "ירקות ופירות", name: "פלפל אדום", unit: "ק\"ג", pricePerUnit: 8 },
  { category: "ירקות ופירות", name: "כרוב לבן", unit: "ק\"ג", pricePerUnit: 4 },
  { category: "ירקות ופירות", name: "קישואים", unit: "ק\"ג", pricePerUnit: 6 },
  { category: "ירקות ופירות", name: "חציל", unit: "ק\"ג", pricePerUnit: 6 },
  { category: "ירקות ופירות", name: "חסה", unit: "יחידה", pricePerUnit: 6 },
  { category: "ירקות ופירות", name: "בצל", unit: "ק\"ג", pricePerUnit: 5 },
  { category: "ירקות ופירות", name: "שום קלוף", unit: "250 גרם", pricePerUnit: 7 },
  { category: "ירקות ופירות", name: "לימונים", unit: "ק\"ג", pricePerUnit: 7 },
  { category: "ירקות ופירות", name: "פטרוזיליה/כוסברה", unit: "חבילה", pricePerUnit: 4 },
  { category: "ירקות ופירות", name: "אבוקדו", unit: "יחידה", pricePerUnit: 4 },
  { category: "ירקות ופירות", name: "תפוחי עץ", unit: "ק\"ג", pricePerUnit: 8 },
  { category: "ירקות ופירות", name: "בננות", unit: "ק\"ג", pricePerUnit: 7 },
  { category: "ירקות ופירות", name: "תפוזים", unit: "ק\"ג", pricePerUnit: 6 },
  { category: "ירקות ופירות", name: "ענבים", unit: "ק\"ג", pricePerUnit: 12 },
  { category: "ירקות ופירות", name: "אבטיח", unit: "ק\"ג", pricePerUnit: 3 },
  // חלבון ובשר
  { category: "חלבון ובשר", name: "ביצים", unit: "תבנית 30 יח'", pricePerUnit: 28 },
  { category: "חלבון ובשר", name: "חזה עוף (שניצל)", unit: "ק\"ג", pricePerUnit: 42 },
  { category: "חלבון ובשר", name: "כרעיים עוף", unit: "ק\"ג", pricePerUnit: 28 },
  { category: "חלבון ובשר", name: "בשר טחון/הודו טחון", unit: "ק\"ג", pricePerUnit: 40 },
  { category: "חלבון ובשר", name: "נקניקיות", unit: "חבילה 400 גרם", pricePerUnit: 18 },
  { category: "חלבון ובשר", name: "המבורגר קפוא", unit: "חבילה 4 יח'", pricePerUnit: 22 },
  { category: "חלבון ובשר", name: "נקניק/סלמי ארוז", unit: "200 גרם", pricePerUnit: 16 },
  { category: "חלבון ובשר", name: "פילה סלמון", unit: "ק\"ג", pricePerUnit: 85 },
  { category: "חלבון ובשר", name: "קציצות דגים קפואות", unit: "חבילה", pricePerUnit: 25 },
  { category: "חלבון ובשר", name: "טופו", unit: "יחידה", pricePerUnit: 10 },
  // מוצרי חלב ולחם
  { category: "מוצרי חלב ולחם", name: "חלב 3%", unit: "ליטר", pricePerUnit: 8 },
  { category: "מוצרי חלב ולחם", name: "גבינה צהובה", unit: "200 גרם", pricePerUnit: 11 },
  { category: "מוצרי חלב ולחם", name: "גבינה לבנה", unit: "אריזה", pricePerUnit: 6 },
  { category: "מוצרי חלב ולחם", name: "גבינת קוטג'", unit: "250 גרם", pricePerUnit: 7 },
  { category: "מוצרי חלב ולחם", name: "יוגורט", unit: "חבילה 4 יח'", pricePerUnit: 12 },
  { category: "מוצרי חלב ולחם", name: "שמנת מתוקה/מטבח", unit: "אריזה", pricePerUnit: 7 },
  { category: "מוצרי חלב ולחם", name: "חמאה", unit: "200 גרם", pricePerUnit: 10 },
  { category: "מוצרי חלב ולחם", name: "לחם", unit: "כיכר", pricePerUnit: 9 },
  { category: "מוצרי חלב ולחם", name: "לחם טוסט", unit: "אריזה", pricePerUnit: 12 },
  { category: "מוצרי חלב ולחם", name: "פיתות", unit: "חבילה 10 יח'", pricePerUnit: 13 },
  { category: "מוצרי חלב ולחם", name: "לחמניות המבורגר", unit: "חבילה 6 יח'", pricePerUnit: 12 },
  { category: "מוצרי חלב ולחם", name: "בייגלה", unit: "חבילה", pricePerUnit: 10 },
  // קטניות ושימורים
  { category: "קטניות ושימורים", name: "שימורי טונה", unit: "יחידה 160 גרם", pricePerUnit: 7 },
  { category: "קטניות ושימורים", name: "שימורי תירס", unit: "יחידה", pricePerUnit: 6 },
  { category: "קטניות ושימורים", name: "שימורי אפונה וגזר", unit: "יחידה", pricePerUnit: 9 },
  { category: "קטניות ושימורים", name: "רסק עגבניות", unit: "יחידה", pricePerUnit: 5 },
  { category: "קטניות ושימורים", name: "חומוס וטחינה", unit: "יחידה", pricePerUnit: 16 },
  { category: "קטניות ושימורים", name: "עדשים ירוקות", unit: "500 גרם", pricePerUnit: 4 },
  { category: "קטניות ושימורים", name: "שעועית לבנה יבשה", unit: "500 גרם", pricePerUnit: 4 },
  { category: "קטניות ושימורים", name: "שעועית אדומה משומרת", unit: "יחידה", pricePerUnit: 6 },
  { category: "קטניות ושימורים", name: "גרגירי חומוס יבשים", unit: "500 גרם", pricePerUnit: 4 },
  { category: "קטניות ושימורים", name: "קינואה", unit: "500 גרם", pricePerUnit: 5 },
  // יבשים ומזווה
  { category: "יבשים ומזווה", name: "שמן בישול", unit: "בקבוק 1 ליטר", pricePerUnit: 10 },
  { category: "יבשים ומזווה", name: "שמן זית", unit: "בקבוק 750 מ\"ל", pricePerUnit: 25 },
  { category: "יבשים ומזווה", name: "אורז", unit: "ק\"ג", pricePerUnit: 7 },
  { category: "יבשים ומזווה", name: "פסטה", unit: "500 גרם", pricePerUnit: 3 },
  { category: "יבשים ומזווה", name: "קוסקוס", unit: "500 גרם", pricePerUnit: 7 },
  { category: "יבשים ומזווה", name: "בורגול/סולת", unit: "500 גרם", pricePerUnit: 6 },
  { category: "יבשים ומזווה", name: "קמח", unit: "ק\"ג", pricePerUnit: 5 },
  { category: "יבשים ומזווה", name: "מלח", unit: "ק\"ג", pricePerUnit: 4 },
  { category: "יבשים ומזווה", name: "סוכר", unit: "ק\"ג", pricePerUnit: 5 },
  // תבלינים ואפייה
  { category: "תבלינים ואפייה", name: "תבלינים בסיסיים", unit: "יחידה", pricePerUnit: 10 },
  { category: "תבלינים ואפייה", name: "פלפל שחור גרוס", unit: "יחידה", pricePerUnit: 12 },
  { category: "תבלינים ואפייה", name: "פפריקה מתוקה", unit: "יחידה", pricePerUnit: 10 },
  { category: "תבלינים ואפייה", name: "כמון", unit: "יחידה", pricePerUnit: 10 },
  { category: "תבלינים ואפייה", name: "אבקת אפייה", unit: "שקית", pricePerUnit: 6 },
  { category: "תבלינים ואפייה", name: "סוכר חום", unit: "ק\"ג", pricePerUnit: 7 },
  { category: "תבלינים ואפייה", name: "דבש", unit: "צנצנת", pricePerUnit: 20 },
  // רטבים ותוספות
  { category: "רטבים ותוספות", name: "קטשופ", unit: "בקבוק 750 גרם", pricePerUnit: 10 },
  { category: "רטבים ותוספות", name: "חרדל", unit: "בקבוק", pricePerUnit: 8 },
  { category: "רטבים ותוספות", name: "מיונז", unit: "בקבוק 500 גרם", pricePerUnit: 12 },
  { category: "רטבים ותוספות", name: "רוטב סויה", unit: "בקבוק", pricePerUnit: 12 },
  { category: "רטבים ותוספות", name: "חומץ יין", unit: "בקבוק", pricePerUnit: 8 },
  { category: "רטבים ותוספות", name: "שמן שומשום", unit: "בקבוק קטן", pricePerUnit: 15 },
  // דגני בוקר וממרחים
  { category: "דגני בוקר וממרחים", name: "דגני בוקר", unit: "חבילה", pricePerUnit: 20 },
  { category: "דגני בוקר וממרחים", name: "ריבה", unit: "צנצנת", pricePerUnit: 14 },
  { category: "דגני בוקר וממרחים", name: "ממרח שוקולד", unit: "צנצנת", pricePerUnit: 18 },
  { category: "דגני בוקר וממרחים", name: "קפה נמס", unit: "צנצנת 200 גרם", pricePerUnit: 24 },
  { category: "דגני בוקר וממרחים", name: "תה", unit: "קופסה 25 שקיקים", pricePerUnit: 10 },
  // משקאות
  { category: "משקאות", name: "מים מינרלים", unit: "מארז 6 בקבוקים", pricePerUnit: 14 },
  { category: "משקאות", name: "משקה מוגז", unit: "בקבוק 1.5 ליטר", pricePerUnit: 8 },
  { category: "משקאות", name: "מיץ פירות", unit: "קרטון 1 ליטר", pricePerUnit: 9 },
  { category: "משקאות", name: "משקה אנרגיה", unit: "פחית", pricePerUnit: 7 },
  // חטיפים וממתקים
  { category: "חטיפים וממתקים", name: "חטיפי אנרגיה", unit: "חבילה", pricePerUnit: 15 },
  { category: "חטיפים וממתקים", name: "עוגיות", unit: "חבילה", pricePerUnit: 10 },
  { category: "חטיפים וממתקים", name: "חטיף מלוח (במבה/ביסלי)", unit: "שקית", pricePerUnit: 7 },
  { category: "חטיפים וממתקים", name: "אגוזים ובוטנים", unit: "שקית 200 גרם", pricePerUnit: 12 },
  { category: "חטיפים וממתקים", name: "חטיפי שוקולד", unit: "חבילה", pricePerUnit: 15 },
  { category: "חטיפים וממתקים", name: "וופלים", unit: "חבילה", pricePerUnit: 10 },
  { category: "חטיפים וממתקים", name: "מרשמלו (לגחלים)", unit: "שקית", pricePerUnit: 12 },
  { category: "חטיפים וממתקים", name: "פופקורן", unit: "חבילה", pricePerUnit: 8 },
  // חד פעמי ומגבות
  { category: "חד פעמי ומגבות", name: "צלחות חד פעמיות", unit: "חבילה 50 יח'", pricePerUnit: 8 },
  { category: "חד פעמי ומגבות", name: "כוסות חד פעמיות", unit: "חבילה 50 יח'", pricePerUnit: 10 },
  { category: "חד פעמי ומגבות", name: "קעריות חד פעמיות", unit: "חבילה", pricePerUnit: 9 },
  { category: "חד פעמי ומגבות", name: "סכו\"ם חד פעמי", unit: "סט 50 יח'", pricePerUnit: 13 },
  { category: "חד פעמי ומגבות", name: "מפיות נייר", unit: "חבילה", pricePerUnit: 6 },
  { category: "חד פעמי ומגבות", name: "מגבות נייר", unit: "גליל", pricePerUnit: 6 },
  { category: "חד פעמי ומגבות", name: "נייר אלומיניום", unit: "גליל", pricePerUnit: 10 },
  { category: "חד פעמי ומגבות", name: "ניילון נצמד", unit: "גליל", pricePerUnit: 9 },
  { category: "חד פעמי ומגבות", name: "שקיות סנדוויץ'/הקפאה", unit: "חבילה", pricePerUnit: 10 },
  { category: "חד פעמי ומגבות", name: "נייר טואלט", unit: "חבילת 24", pricePerUnit: 35 },
  // ניקיון
  { category: "ניקיון", name: "סבון כלים", unit: "בקבוק", pricePerUnit: 9 },
  { category: "ניקיון", name: "ספוגי ניקוי", unit: "חבילה 5 יח'", pricePerUnit: 8 },
  { category: "ניקיון", name: "כפפות ניקוי חד פעמיות", unit: "חבילה", pricePerUnit: 10 },
  { category: "ניקיון", name: "שקיות זבל גדולות", unit: "חבילה", pricePerUnit: 16 },
  { category: "ניקיון", name: "שקיות אשפה קטנות", unit: "חבילה", pricePerUnit: 8 },
  { category: "ניקיון", name: "אקונומיקה", unit: "בקבוק", pricePerUnit: 8 },
  { category: "ניקיון", name: "ספריי ניקוי כללי", unit: "בקבוק", pricePerUnit: 12 },
  { category: "ניקיון", name: "מגבונים לחים", unit: "חבילה", pricePerUnit: 10 },
  { category: "ניקיון", name: "אבקת כביסה", unit: "אריזה", pricePerUnit: 35 },
  { category: "ניקיון", name: "מרכך כביסה", unit: "בקבוק", pricePerUnit: 15 },
  // שונות
  { category: "שונות", name: "סוללות AA", unit: "חבילת 4", pricePerUnit: 20 },
  { category: "שונות", name: "גפרורים/מצית", unit: "יחידה", pricePerUnit: 5 },
];

const TEAM_FILTERS = [...new Set(SHIFTS.map((s) => s.team))];
const TRAVEL_DAYS = ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"];

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

const EVENT_START = new Date(2026, 9, 28);
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
  // "committed" is what's still owed - the unpaid remainder - not the full
  // expense amount. A fully-paid expense has nothing outstanding, so it
  // contributes 0 here (only to `paid`); a partial one contributes just
  // the gap still due.
  const outstanding = Math.max(amount - paidAmount, 0);
  const sign = e.isRefund ? -1 : 1;
  return { committed: sign * outstanding, paid: sign * paidAmount };
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

// Separate from PAYMENT_METHODS (that's for camp expenses going out) -
// dues payments coming in from members only ever arrive by Paybox or cash.
const DUES_PAYMENT_METHODS = [
  { value: "paybox", label: "פייבוקס" },
  { value: "cash", label: "מזומן" },
];
function duesMethodLabel(value) {
  return DUES_PAYMENT_METHODS.find((m) => m.value === value)?.label || value || "";
}

// Threshold requested for the dues list's color coding, independent of each
// member's actual camp-fee amount (which may be overridden per person).
const DUES_PAID_THRESHOLD = 800;
// Literal red/green requested for this indicator - the rest of the app's
// palette is warm browns/tans, but this specific signal was asked for by color.
const DUES_BELOW_BG = "#f8d7d3";
const DUES_ABOVE_BG = "#d7ecd1";

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Builds a real multi-sheet .xls workbook (Excel 2003 XML / SpreadsheetML)
// with no external library - the obvious alternative, the "xlsx" npm
// package, ships a known high-severity prototype-pollution/ReDoS
// vulnerability, and the patched build SheetJS actually recommends is only
// distributed from their own CDN (not npm), which this environment's
// network policy blocks. SpreadsheetML is a plain, well-documented XML
// schema that Excel and Google Sheets both open natively, so it sidesteps
// the dependency (and its vulnerability) entirely.
function buildSpreadsheetMLWorkbook(sheets) {
  const sheetsXml = sheets.map(({ name, rows }) => {
    const rowsXml = rows.map((row) => {
      const cellsXml = row.map((cell) => {
        const isNumber = typeof cell === "number" && Number.isFinite(cell);
        return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXml(cell)}</Data></Cell>`;
      }).join("");
      return `<Row>${cellsXml}</Row>`;
    }).join("");
    // Excel sheet names: 31 chars max, and a handful of characters are
    // outright forbidden - stripped rather than escaped, since an escaped
    // "&amp;" would still count against (and likely blow) the 31-char cap.
    const safeName = escapeXml(name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31));
    return `<Worksheet ss:Name="${safeName}"><Table>${rowsXml}</Table></Worksheet>`;
  }).join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheetsXml}
</Workbook>`;
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
      const [y, m, d] = a.eventDate.split("-").map(Number);
      const [hh, mm] = a.eventTime.split(":").map(Number);
      const end = new Date(y, m - 1, d, hh + 1, mm);
      const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      lines.push(`DTSTART:${icsDateTime(a.eventDate, a.eventTime)}`, `DTEND:${icsDateTime(endDateStr, endTime)}`);
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
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, boxShadow: "0 10px 34px rgba(74,52,43,0.28)" }}>
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

// One row per budget category/department, entirely self-contained: a
// category with a live parameter/item-row calculation shows "מחושב" vs
// "מפורסם" and its own publish button+confirm (always visible, just
// disabled/grayed when the two already match - so the row never
// disappears or silently changes shape). A category with no calculation
// at all is a plain manual number, editable right here.
function DepartmentBudgetRow({ cat, hasComputed, computed, published, onSet }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(published || "");
  const [confirming, setConfirming] = useState(false);
  const upToDate = hasComputed && Math.round(computed) === Math.round(published);

  function commit() {
    setEditing(false);
    if ((Number(value) || 0) !== published) onSet(cat, value);
  }

  return (
    <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold">{cat}</span>
        {hasComputed ? (
          <span style={{ fontFamily: FONT_NUM, color: COLORS.textMuted }}>
            מחושב: ₪{Math.round(computed).toLocaleString()} · מפורסם: ₪{Math.round(published).toLocaleString()}
          </span>
        ) : editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              onBlur={commit}
              placeholder="0"
              className="w-24 px-2 py-1.5 rounded-lg text-sm outline-none text-left"
              style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, fontFamily: FONT_NUM }}
            />
            <button onMouseDown={(e) => e.preventDefault()} onClick={commit} style={{ color: COLORS.accent2Dark }}>
              <Check size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => { setValue(published || ""); setEditing(true); }} className="flex items-center gap-1" style={{ color: published > 0 ? COLORS.textMuted : COLORS.danger }}>
            {published > 0 ? `הוזן ידנית: ₪${published.toLocaleString()}` : "אין נתון - לחיצה להזנה ידנית"}
            <Pencil size={12} />
          </button>
        )}
      </div>

      {hasComputed && !confirming && (
        <button
          onClick={() => !upToDate && setConfirming(true)}
          disabled={upToDate}
          className="mt-2 text-sm px-3 py-1.5 rounded-full font-semibold"
          style={{
            background: upToDate ? COLORS.divider : COLORS.accent,
            color: upToDate ? COLORS.textMuted : COLORS.bg,
            cursor: upToDate ? "default" : "pointer",
          }}
        >
          {upToDate ? "✓ מעודכן" : "פרסום עדכון למחלקה"}
        </button>
      )}
      {hasComputed && confirming && (
        <div className="mt-2 rounded-lg p-2.5 text-sm" style={{ background: COLORS.input }}>
          <div className="mb-2">בלחיצת שמירה תקציב הצוות יעודכן. להמשיך?</div>
          <div className="flex gap-2">
            <button
              onClick={() => { onSet(cat, computed); setConfirming(false); }}
              className="px-4 py-1.5 rounded-full font-semibold"
              style={{ background: COLORS.accent, color: COLORS.bg }}
            >
              כן, לפרסם
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-1.5 rounded-full font-semibold"
              style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
            >
              לא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Bulk-publish bar at the top of the מחלקות tab - always visible (grayed
// out with count 0 when nothing changed) so the control never disappears,
// matching each row's own always-visible publish button below it.
function PublishAllBar({ count, onPublishAll }) {
  const [confirming, setConfirming] = useState(false);
  const disabled = count === 0;

  if (confirming) {
    return (
      <div className="rounded-2xl p-3 mb-4 text-sm" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
        <div className="mb-2">בלחיצת שמירה תקציב כל המחלקות שהשתנו יעודכן. להמשיך?</div>
        <div className="flex gap-2">
          <button
            onClick={() => { onPublishAll(); setConfirming(false); }}
            className="px-4 py-1.5 rounded-full font-semibold"
            style={{ background: COLORS.accent, color: COLORS.bg }}
          >
            כן, לשייך הכל
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-4 py-1.5 rounded-full font-semibold"
            style={{ background: COLORS.surface, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
          >
            לא
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setConfirming(true)}
      disabled={disabled}
      className="w-full py-3 rounded-2xl text-sm font-bold mb-4"
      style={{
        background: disabled ? COLORS.divider : COLORS.accent,
        color: disabled ? COLORS.textMuted : COLORS.bg,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {disabled ? "אין עדכונים לשייך" : `שייך את כל התקציבים (${count})`}
    </button>
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

function CatalogItemPicker({ catalog, onAdd }) {
  const categories = [...new Set(catalog.map((c) => c.category || "אחר"))];
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || "");
  const itemsInCategory = catalog.filter((c) => (c.category || "אחר") === selectedCategory);
  const [selectedName, setSelectedName] = useState(itemsInCategory[0]?.name || "");
  const [qty, setQty] = useState(1);
  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory(categories[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);
  useEffect(() => {
    if (!itemsInCategory.some((c) => c.name === selectedName)) setSelectedName(itemsInCategory[0]?.name || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, catalog]);
  const item = itemsInCategory.find((c) => c.name === selectedName);
  const totalPrice = item ? Math.round((Number(qty) || 0) * item.pricePerUnit * 100) / 100 : 0;

  function submit() {
    if (!item || !(Number(qty) > 0)) return;
    onAdd({ name: item.name, qty, unit: item.unit, price: totalPrice, notes: "מחיר משוער מקטלוג" });
  }

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-3 gap-2">
        <div className="relative">
          <select
            value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none pl-9 pr-3 py-2 rounded-xl text-sm outline-none font-semibold"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          >
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.text }} />
        </div>
        <div className="relative">
          <select
            value={selectedName} onChange={(e) => setSelectedName(e.target.value)}
            className="w-full appearance-none pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          >
            {itemsInCategory.map((c) => <option key={c.name} value={c.name}>{c.name} · ₪{c.pricePerUnit} ל{c.unit}</option>)}
          </select>
          <ChevronDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.text }} />
        </div>
        <input
          type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
          placeholder="כמות"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          מחיר משוער כולל מע"מ: <b style={{ color: COLORS.accentDark }}>₪{totalPrice.toLocaleString()}</b>
        </span>
        <button
          onClick={submit}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          הוספה לרשימת הקניות
        </button>
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

function ContentSuggestionForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="שם התוכן המוצע"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="פירוט - במה מדובר, איך זה עובד..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <button
        onClick={() => { if (!title.trim()) return; onAdd(title, description); setTitle(""); setDescription(""); }}
        className="px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        <Plus size={13} className="inline -mt-0.5" /> שליחת הצעה
      </button>
    </div>
  );
}

function ContentSuggestionAssignPicker({ schedule, onAssign }) {
  const [rowId, setRowId] = useState(schedule.rows[0]?.id || "");
  const [colIndex, setColIndex] = useState(0);
  return (
    <div className="mt-2 pt-2 border-t flex items-center gap-1.5 flex-wrap" style={{ borderColor: COLORS.divider }}>
      <select
        value={rowId}
        onChange={(e) => setRowId(e.target.value)}
        className="px-2 py-1 rounded-lg text-xs outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      >
        {schedule.rows.map((r) => (
          <option key={r.id} value={r.id}>{r.label || "(ללא שם)"}</option>
        ))}
      </select>
      <select
        value={colIndex}
        onChange={(e) => setColIndex(Number(e.target.value))}
        className="px-2 py-1 rounded-lg text-xs outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      >
        {schedule.columns.map((c, i) => (
          <option key={i} value={i}>{c}</option>
        ))}
      </select>
      <button
        onClick={() => onAssign(rowId, colIndex)}
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        אישור שיבוץ
      </button>
    </div>
  );
}

function ContentCellEditor({ cell, canEdit, onSave, onClear }) {
  const [title, setTitle] = useState(cell?.title || "");
  const [facilitator, setFacilitator] = useState(cell?.facilitator || "");
  const [description, setDescription] = useState(cell?.description || "");
  if (!canEdit) {
    if (!cell) return <p className="text-sm" style={{ color: COLORS.textMuted }}>אין עדיין תוכן במשבצת הזו.</p>;
    return (
      <div className="space-y-2 text-sm">
        <div className="font-bold" style={{ color: COLORS.accentDark }}>{cell.title}</div>
        {cell.facilitator && <div style={{ color: COLORS.textMuted }}>מי מעביר/ה: {cell.facilitator}</div>}
        {cell.description && <div style={{ color: COLORS.textMuted, whiteSpace: "pre-line" }}>{cell.description}</div>}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="שם התוכן"
        className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <input
        value={facilitator}
        onChange={(e) => setFacilitator(e.target.value)}
        placeholder="מי מעביר/ה את התוכן"
        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="מהות התוכן / פירוט"
        rows={4}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-y"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { if (!title.trim()) return; onSave({ title: title.trim(), facilitator: facilitator.trim(), description: description.trim() }); }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          שמירה
        </button>
        {cell && (
          <button onClick={onClear} className="px-3 py-1.5 rounded-full text-xs" style={{ color: COLORS.danger }}>
            הסרת תוכן מהמשבצת
          </button>
        )}
      </div>
    </div>
  );
}

function AddPaymentForm({ onAdd }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState("paybox");
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
      <div className="flex rounded-full p-0.5" style={{ background: COLORS.input, border: `1px solid ${COLORS.divider}` }}>
        {DUES_PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: method === m.value ? COLORS.accent : "transparent", color: method === m.value ? COLORS.bg : COLORS.textMuted }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => { onAdd(amount, date, method); setAmount(""); setDate(""); }}
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
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
            <div key={i} className="flex items-center gap-2 text-sm rounded-xl px-2 py-1.5" style={{ background: COLORS.input }}>
              <label className={`flex items-center gap-2.5 flex-1 ${canCheck ? "cursor-pointer" : "cursor-not-allowed"}`}>
                <input
                  type="checkbox"
                  checked={!!state[i]}
                  disabled={!canCheck}
                  onChange={() => canCheck && onToggle(i)}
                  className="shrink-0"
                  style={{ width: 22, height: 22, accentColor: COLORS.accent2 }}
                />
                <span style={{ textDecoration: state[i] ? "line-through" : "none", opacity: state[i] ? 0.6 : 1 }}>{item}</span>
              </label>
              {canManage && (
                <>
                  <button onClick={() => { setEditingIndex(i); setEditText(item); }} className="shrink-0" style={{ color: COLORS.textMuted }}><Pencil size={14} /></button>
                  <button onClick={() => onRemove(i)} className="shrink-0" style={{ color: COLORS.textMuted }}><Trash2 size={14} /></button>
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
        <YesNoButtons value={local.hasAllocation} onChange={(v) => set({ hasAllocation: v, used: v === "yes" ? local.used : undefined })} />
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

// Same search-or-browse picker used at login and for private messages -
// typing filters the list, an empty query shows everyone, and tapping a
// name tags immediately (no separate "add" step to fumble with on mobile).
function TagPicker({ members, onTag }) {
  return (
    <div className="mt-1">
      <MemberSearchPicker
        members={members}
        value=""
        onSelect={(name) => { if (name) onTag(name); }}
        placeholder="מי בתמונה? חיפוש או בחירה..."
      />
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

// Generic repeating-row editor, driven by a column schema - covers what used
// to be three near-identical editors (item name/qty/price, name/amount,
// alcohol name/units/price - the last one since removed) with one
// implementation. `fields` describes the input columns in order,
// `subtotal(row)` computes that row's contribution to the running total,
// and `emptyRow` is what a new row starts as. `categories`, when passed,
// adds a per-row budget-category picker on a second line (so "how much"
// and "which line item of the real budget this is" live together) -
// every row always shows its own subtotal there too, not just the combined
// total at the bottom, so a category can be trimmed row-by-row if needed.
function GenericRowEditor({ rows, onChange, fields, subtotal, emptyRow, addLabel = "+ הוספת שורה", categories, subtotalLabel = 'סה"כ' }) {
  function updateRow(i, patch) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  const total = rows.reduce((s, r) => s + subtotal(r), 0);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="space-y-1 pb-1.5 border-b" style={{ borderColor: COLORS.divider }}>
          <div className="flex items-center gap-1.5">
            {fields.map((f) => (
              <input
                key={f.key}
                type={f.type}
                value={r[f.key]}
                onChange={(e) => updateRow(i, { [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className={`${f.flex ? "flex-1 min-w-0" : f.width} px-2 py-1.5 rounded-lg text-sm outline-none`}
                style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
              />
            ))}
            <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} style={{ color: COLORS.textMuted }}><X size={14} /></button>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            {categories ? (
              <select
                value={r.category || ""}
                onChange={(e) => updateRow(i, { category: e.target.value })}
                className="flex-1 min-w-0 px-2 py-1 rounded-lg text-xs outline-none"
                style={{ background: COLORS.input, color: COLORS.textMuted, border: `1px solid ${COLORS.divider}` }}
              >
                <option value="">שיוך לסעיף תקציבי...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : <span />}
            <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>{subtotalLabel}: ₪{subtotal(r).toLocaleString()}</span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={() => onChange([...rows, emptyRow])} className="text-xs font-semibold" style={{ color: COLORS.accentDark }}>
          {addLabel}
        </button>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>סכום ביניים: ₪{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

// Repeating rows of {name, qty, price, category} - used for equipment/
// lounge items etc. `vatIncluded=false` (the real-world default - supplier
// quotes are pre-VAT) marks up the displayed per-row subtotal by 18%, same
// as runBudgetEngine does for the real totals - the number shown here is
// what's actually owed, not just qty*price.
function ItemRowsEditor({ rows, onChange, qtyLabel = "כמות", priceLabel = "מחיר ליחידה (לפני מע\"מ)", categories, vatIncluded = false }) {
  const vat = vatIncluded ? 1 : 1.18;
  return (
    <GenericRowEditor
      rows={rows}
      onChange={onChange}
      fields={[
        { key: "name", type: "text", placeholder: "שם הפריט", flex: true },
        { key: "qty", type: "number", placeholder: qtyLabel, width: "w-20" },
        { key: "price", type: "number", placeholder: priceLabel, width: "w-24" },
      ]}
      subtotal={(r) => (Number(r.qty) || 0) * (Number(r.price) || 0) * vat}
      emptyRow={{ name: "", qty: "", price: "", category: "" }}
      categories={categories}
      subtotalLabel={vatIncluded ? 'סה"כ' : 'סה"כ (כולל מע"מ)'}
    />
  );
}

// Repeating rows of {name, amount} - used for one-time income.
function AmountRowsEditor({ rows, onChange, placeholder = "שם" }) {
  return (
    <GenericRowEditor
      rows={rows}
      onChange={onChange}
      fields={[
        { key: "name", type: "text", placeholder, flex: true },
        { key: "amount", type: "number", placeholder: "סכום", width: "w-28" },
      ]}
      subtotal={(r) => Number(r.amount) || 0}
      emptyRow={{ name: "", amount: "" }}
    />
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
function RideCategoryCard({ id, icon: Icon, title, count, headerColor, emptyText, children }) {
  return (
    <div id={id} className="rounded-3xl overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
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

export default function App() {
  const [identity, setIdentity] = useState(null);
  // True when identity/assignments/emergencyInfo came from the offline
  // fallback snapshot (see OFFLINE_SNAPSHOT_KEY below) instead of a real,
  // just-verified Supabase session - the event site itself has no signal,
  // so someone reopening the app there would otherwise get bounced back to
  // the login screen with nothing to show. Read-only: there's no real
  // session backing this, so any write action still fails normally.
  const [isOfflineMode, setIsOfflineMode] = useState(false);
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
  const [contentSchedule, setContentSchedule] = useState(DEFAULT_CONTENT_SCHEDULE);
  const [contentSuggestions, setContentSuggestions] = useState([]);
  const [openContentCell, setOpenContentCell] = useState(null);
  const [assigningSuggestionId, setAssigningSuggestionId] = useState(null);
  const [extraTeams, setExtraTeams] = useState([]);
  const [customChecklists, setCustomChecklists] = useState({});
  const [budgetParams, setBudgetParams] = useState({
    global: { N: "", setupDays: "", eventDays: "", contingencyPct: "", vatIncluded: false, whatIfEnabled: false, whatIfN: "" },
    campInfra: { items: [], loungeItems: [], oneTimeIncome: [], icePricePerKg: "", iceKgPerDay: "", iceDays: "", elecPricePerKw: "", elecKw: "" },
    water: { literPerPersonPerDay: "", tankFaucetCost: "", fillCost: "", fillCount: "", drainCost: "", drainCount: "", showerUnitCost: "", showerUnitsCount: "" },
    sanitation: { pumpFreqPerPersonPerDay: "", pumpCost: "", sawdustFreq: "", sawdustCost: "", drainCellCost: "", chemicalToiletsCost: "" },
    food: { setupPeopleCount: "", setupDays: "", setupCostPerDay: "", actualDiners: "", mealsPerDay: "", eventDays: "", costPerMeal: "", contingencyAmount: "" },
    general: { fixedAnnualCost: "", splitRatioPct: "", notes: "" },
    contingencyOverrides: {},
    income: { vatRefund: "", externalGross: "", externalNet: "" },
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
  const [openBvaCategory, setOpenBvaCategory] = useState(null);
  const [financesView, setFinancesView] = useState("dues");
  const [teamDashboardView, setTeamDashboardView] = useState("shifts");
  const [activityLog, setActivityLog] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showMemberActivity, setShowMemberActivity] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [lastSeenMap, setLastSeenMap] = useState(null);
  const [logsRefreshing, setLogsRefreshing] = useState(false);
  const [extraMembers, setExtraMembers] = useState([]);
  const [removedMembers, setRemovedMembers] = useState([]);
  // The removed_members table (removed_at + a full data snapshot) - separate
  // from the `removedMembers` kv list above, which only ever held bare
  // names and has no sense of "when". Loaded for admins so the "הוסרו
  // מהקמפ" list can show a real countdown and offer the snapshot for download.
  const [removedMembersArchive, setRemovedMembersArchive] = useState([]);
  const [dbRoles, setDbRoles] = useState({});
  const [idOnFileNames, setIdOnFileNames] = useState(null);
  const [pushEnabledNames, setPushEnabledNames] = useState(null);
  const [showPushStatusList, setShowPushStatusList] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [eventPhotos, setEventPhotos] = useState(null);
  const [eventPhotosUploading, setEventPhotosUploading] = useState(false);
  const [eventPhotosZipping, setEventPhotosZipping] = useState(false);
  const [eventPhotoPreview, setEventPhotoPreview] = useState(null);
  const [pendingTagPos, setPendingTagPos] = useState(null);
  const [previewComments, setPreviewComments] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [unseenPhotoTags, setUnseenPhotoTags] = useState([]);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingItemReminderId, setSendingItemReminderId] = useState(null);
  const [expandedPollVoters, setExpandedPollVoters] = useState(null);
  const [remindingNonVotersPollId, setRemindingNonVotersPollId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editIdValue, setEditIdValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");
  const [openMemberMenu, setOpenMemberMenu] = useState(null);
  const [teamLeadPickerFor, setTeamLeadPickerFor] = useState(null);
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
  const [openPaymentMenu, setOpenPaymentMenu] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("paybox");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard-personal");
  const [adminSubTab, setAdminSubTab] = useState("overview");
  const [exportingKey, setExportingKey] = useState(null);
  const [expandedNavCategory, setExpandedNavCategory] = useState(null);
  const [showMissingAllocation, setShowMissingAllocation] = useState(false);
  // Owner-only: lets the owner open any team's "לוח בקרה צוות" view (the
  // same screen a team's own lead sees) without actually being that team's
  // lead - regular admins don't get this, only the owner.
  const [ownerTeamView, setOwnerTeamView] = useState("");
  const [pendingScrollTargetId, setPendingScrollTargetId] = useState(null);
  useEffect(() => {
    if (!pendingScrollTargetId) return;
    const el = document.getElementById(pendingScrollTargetId);
    if (el) {
      // Plain scrollIntoView aligns the target's top edge to the very top
      // of the viewport - but the nav bar up there is sticky, so the target
      // just lands hidden underneath it instead of visible below it. Offset
      // by the sticky bar's actual (not guessed) current height instead.
      const stickyBar = document.getElementById("sticky-nav-bar");
      const offset = (stickyBar?.offsetHeight || 0) + 12;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setPendingScrollTargetId(null);
  }, [tab, pendingScrollTargetId]);
  const [teamFilter, setTeamFilter] = useState("הכל");
  const [shiftsView, setShiftsView] = useState("calendar");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [expandedMemberShifts, setExpandedMemberShifts] = useState(null);
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
  const [profileGateDismissed, setProfileGateDismissed] = useState(false);
  const [largeText, setLargeText] = useState(() => localStorage.getItem("large-text") === "1");
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    localStorage.setItem("large-text", largeText ? "1" : "0");
  }, [largeText]);
  const loadSharedDataRef = useRef(null);

  // Android's hardware/gesture back button (and iOS Safari's edge-swipe)
  // both just fire the browser's native back navigation - with no history
  // entries for our in-app tab changes, that immediately exits the PWA
  // instead of stepping back through the app. Push a history entry every
  // time the tab changes, and on "back" (popstate) restore the previous
  // tab instead of leaving. isPopping distinguishes "we're reacting to a
  // back-navigation" from "the user just picked a new tab", so we don't
  // push a redundant new entry for a state that's already in history.
  const isPopping = useRef(false);
  const prevTabRef = useRef(tab);
  useEffect(() => {
    window.history.replaceState({ tab }, "");
    function onPopState(e) {
      isPopping.current = true;
      setTab(e.state?.tab || "dashboard-personal");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tab !== prevTabRef.current) {
      if (!isPopping.current) {
        window.history.pushState({ tab }, "");
      }
      isPopping.current = false;
      prevTabRef.current = tab;
    }
  }, [tab]);

  useEffect(() => {
    // A member's auth session can be mid-refresh for a brief moment right
    // as the app opens (seen in the wild as a burst of 401s on some of the
    // parallel requests below, while others in the same batch succeed) -
    // one retry after a short pause is usually enough for the session to
    // settle, instead of silently treating a transient auth hiccup as "no
    // data" (e.g. someone's real payment history showing as empty).
    async function safeGet(key, shared, attempt = 0) {
      try {
        const r = await window.storage.get(key, shared);
        return r && r.value ? r.value : null;
      } catch {
        if (attempt === 0) {
          await new Promise((res) => setTimeout(res, 900));
          return safeGet(key, shared, 1);
        }
        return null;
      }
    }

    async function loadSharedData() {
      const [
        rawAssignments, rawBudget, rawCatBudget, rawTeardown, rawPayments, rawFee,
        rawLeads, rawPhones, rawRides, rawFeeOv, rawEmails, rawWhatsappConsent, rawPersonalCalendarAdds, rawChecklists,
        rawManualTeam, rawLogins, rawExtra, rawRemoved,
        rawAnn, rawPolls, rawBudgetParams, rawBudgetExpenses, rawEquipment, rawExtraCategories, rawRideMatches,
        rawShoppingList, rawShoppingRequests, rawExtraTeams, rawCustomChecklists, rawContentSchedule, rawContentSuggestions,
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
        safeGet("content-schedule", true),
        safeGet("content-suggestions", true),
      ]);

      async function safeCall(fn, fallback, attempt = 0) {
        try {
          return await fn();
        } catch {
          if (attempt === 0) {
            await new Promise((res) => setTimeout(res, 900));
            return safeCall(fn, fallback, 1);
          }
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
      if (rawContentSchedule) {
        setContentSchedule(JSON.parse(rawContentSchedule));
      } else {
        setContentSchedule(DEFAULT_CONTENT_SCHEDULE);
        window.storage.set("content-schedule", JSON.stringify(DEFAULT_CONTENT_SCHEDULE), true).catch(() => {});
      }
      setContentSuggestions(rawContentSuggestions ? JSON.parse(rawContentSuggestions) : []);
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
        } else if (!navigator.onLine) {
          // getSignedInMemberName came back empty, but that's expected
          // offline (it needs a live "members" table lookup even though
          // the local auth session itself is still on the device) - fall
          // back to whatever was last cached instead of stranding a
          // returning member on the login screen with no signal to log in.
          const snap = loadOfflineSnapshot();
          if (snap?.identity) {
            setAssignments(snap.assignments || {});
            if (snap.myEmergencyInfo) {
              setEmergencyInfo((prev) => ({ ...prev, [snap.identity]: snap.myEmergencyInfo }));
            }
            setIdentity(snap.identity);
            setIsOfflineMode(true);
          }
        }
      } catch (err) {
        showToast("חלק מהנתונים לא נטענו כמו שצריך - נסה/י לרענן את הדף", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Keeps the offline snapshot fresh after every real (online) load, so
  // whatever the next offline-restore falls back to is never more than one
  // successful session out of date. Skipped in offline mode itself, since
  // there assignments/emergencyInfo already came from the snapshot and
  // rewriting it would just bump its timestamp without adding anything.
  useEffect(() => {
    if (!identity || isOfflineMode || !navigator.onLine) return;
    saveOfflineSnapshot(identity, assignments, emergencyInfo);
  }, [identity, isOfflineMode, assignments, emergencyInfo]);

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

  async function setCategoryBudget(cat, amount) {
    const value = Number(amount) || 0;
    const latest = await getFreshShared("category-budgets", categoryBudgets);
    await persistCategoryBudgets({ ...latest, [cat]: value });
    showToast(`תקציב ${cat} עודכן`, "ok");
    logActivity("עדכון תקציב מחלקה", `${cat}: ₪${value}`);
    // Every team whose budget lands in this category (see
    // TEAM_BUDGET_CATEGORY) gets pushed the moment its number changes -
    // whether that's a manual entry here or a publish from the parameters
    // engine. Best-effort: a non-admin budget-team member can save a
    // budget but the push edge function is admin/owner-only, so a failure
    // here must never block the save itself.
    const leadNames = [...TEAMS, ...extraTeams]
      .filter((t) => budgetCategoryForTeam(t.name) === cat)
      .flatMap((t) => teamLeads[t.name] || []);
    const uniqueLeads = [...new Set(leadNames)];
    if (uniqueLeads.length > 0) {
      try {
        await sendEventReminderPush("עדכון תקציב", `תקציב "${cat}" עודכן ל-₪${value.toLocaleString()}`, undefined, uniqueLeads);
      } catch {}
    }
  }

  // Publishes every category whose live-computed value differs from what's
  // currently published, in one shot - the "שייך את כל התקציבים" button.
  // One shared persist (instead of N separate setCategoryBudget calls) so
  // it can't race itself, then one push per affected team's leads.
  async function publishAllCategoryBudgets() {
    const latest = await getFreshShared("category-budgets", categoryBudgets);
    const changed = allBudgetCategories.filter((cat) => {
      const computed = engine.categoryPlanned[cat] || 0;
      return computed > 0 && Math.round(computed) !== Math.round(Number(latest[cat]) || 0);
    });
    if (changed.length === 0) return;
    const next = { ...latest };
    changed.forEach((cat) => { next[cat] = Math.round(engine.categoryPlanned[cat]); });
    await persistCategoryBudgets(next);
    showToast(`תקציב עודכן ל-${changed.length} מחלקות`, "ok");
    logActivity("שיוך תקציב לכל המחלקות", changed.join(", "));
    const leadNames = [...TEAMS, ...extraTeams]
      .filter((t) => changed.includes(budgetCategoryForTeam(t.name)))
      .flatMap((t) => teamLeads[t.name] || []);
    const uniqueLeads = [...new Set(leadNames)];
    if (uniqueLeads.length > 0) {
      try {
        await sendEventReminderPush("עדכון תקציב", "תקציב המחלקה שלך עודכן", undefined, uniqueLeads);
      } catch {}
    }
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

  function downloadCsvFile(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // Admin list exports - "ייצוא רשימות" tab.
  //
  // Every builder below takes a `data` bag instead of reading component
  // state directly, and getFreshExportData() re-fetches that bag from the
  // server right before each export runs. State here is "whatever was true
  // the last time this screen loaded" - a list an admin is about to hand to
  // the whole camp needs to be current, not that (this is the same class of
  // staleness that made a payment someone had just recorded look like ₪0 on
  // a screen that was already open). Builders return rows as a plain
  // array-of-arrays (header row first) so the same data feeds the CSV,
  // Excel and PDF outputs without three formatters drifting out of sync.
  // ---------------------------------------------------------------------------

  async function getFreshExportData() {
    const [
      freshExtra, freshRoles, freshAssignments, freshPayments, freshFeeOverrides, freshCampFeeRaw,
      freshPhones, freshEmails, freshManualTeam, freshLeadsRaw, freshEquipment, freshExpenses,
      freshShopping, freshContentSchedule, freshAllocationInfo, freshEmergencyInfo,
    ] = await Promise.all([
      getFreshShared("extra-members", extraMembers),
      getAllMemberRoles().catch(() => dbRoles),
      getFreshShared("shift-assignments", assignments),
      getFreshShared("member-payments", memberPayments),
      getFreshShared("fee-overrides", feeOverrides),
      getFreshShared("camp-fee", campFee),
      getFreshShared("member-phones", memberPhones),
      getFreshShared("member-emails", memberEmails),
      getFreshShared("manual-team-members", manualTeamMembers),
      getFreshShared("team-leads", teamLeads),
      getFreshShared("camp-equipment", campEquipment),
      getFreshShared("budget-expenses", budgetExpenses),
      getFreshShared("kitchen-shopping-list", shoppingList),
      getFreshShared("content-schedule", contentSchedule),
      listAllocationInfo().catch(() => allocationInfo),
      listEmergencyInfo().catch(() => emergencyInfo),
    ]);

    // Same union/de-dup logic as the allMembers useMemo, just fed from the
    // fresh fetches above instead of state.
    const byName = new Map();
    [...MEMBERS, ...freshExtra, ...Object.keys(freshRoles).map((name) => ({ name, role: freshRoles[name] }))]
      .filter((m) => !removedMembers.includes(m.name))
      .forEach((m) => {
        const existing = byName.get(m.name);
        if (!existing || (!existing.idOnFile && m.idOnFile)) byName.set(m.name, m);
      });
    const freshAllMembers = [...byName.values()]
      .map((m) => ({ ...m, role: freshRoles[m.name] || m.role }))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));

    return {
      allMembers: freshAllMembers,
      memberPhones: freshPhones,
      memberEmails: freshEmails,
      allocationInfo: freshAllocationInfo,
      assignments: freshAssignments,
      memberPayments: freshPayments,
      feeOverrides: freshFeeOverrides,
      campFee: Number(freshCampFeeRaw) || 0,
      campEquipment: freshEquipment,
      budgetExpenses: freshExpenses,
      contentSchedule: freshContentSchedule,
      manualTeamMembers: freshManualTeam,
      teamLeads: normalizeTeamLeads(freshLeadsRaw),
      shoppingList: freshShopping,
      emergencyInfo: freshEmergencyInfo,
    };
  }

  function freshTeamMembers(data, teamName) {
    const teamShiftIds = SHIFTS.filter((s) => s.team === teamName).map((s) => s.id);
    const names = new Set();
    teamShiftIds.forEach((id) => {
      (id === TEARDOWN_ID ? data.allMembers.map((m) => m.name) : (data.assignments[id] || [])).forEach((n) => names.add(n));
    });
    (data.manualTeamMembers[teamName] || []).forEach((n) => names.add(n));
    return [...names].filter((n) => !removedMembers.includes(n));
  }
  function freshTeamLeadsOf(data, teamName) {
    return (data.teamLeads[teamName] || [])
      .map((name) => data.allMembers.find((m) => m.name === name))
      .filter(Boolean);
  }

  function buildMembersRows(data) {
    // ת.ז left blank on purpose - the app only ever stores a one-way hash
    // of it (never the number itself), so there's nothing real to put here.
    const rows = [["טלפון", "ת.ז", "שם", "מייל", "נקנה כרטיס"]];
    data.allMembers.forEach((m) => {
      const used = data.allocationInfo[m.name]?.used;
      const ticket = used === "yes" ? "כן" : used === "no" ? "לא" : "";
      rows.push([data.memberPhones[m.name] || "", "", m.name, data.memberEmails[m.name] || "", ticket]);
    });
    return rows;
  }

  function buildMemberShiftsRows(data) {
    const countedShifts = SHIFTS.filter((s) => s.id !== TEARDOWN_ID && s.phase !== "הקמות");
    const counts = data.allMembers
      .map((m) => ({ name: m.name, count: countedShifts.filter((s) => (data.assignments[s.id] || []).includes(m.name)).length }))
      .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name, "he"));
    const rows = [["שם", "כמות משמרות"]];
    counts.forEach((m) => rows.push([m.name, m.count]));
    return rows;
  }

  function buildContentScheduleRows(data) {
    const rows = [["שעה", "יום", "כותרת", "מנחה/ת", "תיאור"]];
    data.contentSchedule.rows.forEach((r) => {
      r.cells.forEach((cell, i) => {
        if (!cell || !cell.title) return;
        rows.push([r.label, data.contentSchedule.columns[i] || "", cell.title, cell.facilitator || "", cell.description || ""]);
      });
    });
    return rows;
  }

  function buildFinancesRows(data) {
    const rows = [["שם", "שולם", "דמי קמפ", "יתרה"]];
    data.allMembers.forEach((m) => {
      const list = Array.isArray(data.memberPayments[m.name]) ? data.memberPayments[m.name] : [];
      const paid = list.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const fee = data.feeOverrides[m.name] !== undefined ? Number(data.feeOverrides[m.name]) : data.campFee;
      rows.push([m.name, paid, fee, fee - paid]);
    });
    return rows;
  }

  function buildCampEquipmentRows(data) {
    const rows = [["קטגוריה", "שם פריט", "כמות", "מצב", "מיקום", "הערות"]];
    data.campEquipment.forEach((e) => rows.push([e.category || "", e.name, e.qty, e.condition || "", e.location || "", e.notes || ""]));
    return rows;
  }

  function buildExpensesRows(data) {
    const rows = [EXPENSE_CSV_HEADERS];
    data.budgetExpenses.forEach((e) => rows.push(EXPENSE_CSV_HEADERS.map((h) => e[h])));
    return rows;
  }

  function buildTeamsRows(data) {
    const rows = [["צוות", "מוביל/ה", "מוביל/ה משנה", "חברי הצוות"]];
    allTeams.forEach((t) => {
      const leads = freshTeamLeadsOf(data, t.name);
      const members = freshTeamMembers(data, t.name);
      rows.push([t.name, leads[0]?.name || "", leads[1]?.name || "", members.join("; ")]);
    });
    return rows;
  }

  function buildKitchenShoppingRows(data) {
    const rows = [["פריט", "כמות", "יחידה", "מחיר", "הערות", "נקנה"]];
    data.shoppingList.forEach((it) => rows.push([it.name, it.qty || "", it.unit || "", it.price || "", it.notes || "", it.bought ? "כן" : "לא"]));
    return rows;
  }

  function rowsToCsv(rows) {
    return "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  }

  const EXPORT_LISTS = [
    { key: "members", label: "רשימת חברי קמפ", filename: "רשימת-חברי-קמפ", build: buildMembersRows, icon: Users },
    { key: "shifts", label: "משמרות חברי קמפ", filename: "משמרות-חברי-קמפ", build: buildMemberShiftsRows, icon: CalendarDays },
    { key: "content", label: "לוח תוכן", filename: "לוח-תוכן", build: buildContentScheduleRows, icon: Flame },
    { key: "finances", label: "כספים - דמי קמפ", filename: "כספים-דמי-קמפ", build: buildFinancesRows, icon: CreditCard },
    { key: "equipment", label: "ציוד קמפ", filename: "ציוד-קמפ", build: buildCampEquipmentRows, icon: Package },
    { key: "expenses", label: "הוצאות", filename: "הוצאות-קמפ", build: buildExpensesRows, icon: Wallet },
    { key: "teams", label: "צוותים", filename: "צוותים", build: buildTeamsRows, icon: Users },
    { key: "shopping", label: "קניות מטבח", filename: "קניות-מטבח", build: buildKitchenShoppingRows, icon: ShoppingCart },
  ];

  async function downloadListCsv(listKey) {
    const list = EXPORT_LISTS.find((l) => l.key === listKey);
    setExportingKey(listKey);
    try {
      const data = await getFreshExportData();
      downloadCsvFile(rowsToCsv(list.build(data)), `${list.filename}-${new Date().toISOString().slice(0, 10)}.csv`);
      logActivity("ייצוא רשימה", list.label);
    } catch (err) {
      showToast(`הייצוא נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setExportingKey(null);
    }
  }

  function downloadMembersCsv() {
    downloadListCsv("members");
  }
  function downloadBudgetExpensesCsv() {
    downloadListCsv("expenses");
  }

  // "ייצא הכל" - bundles every list into one zip instead of firing eight
  // separate downloads at once, which browsers routinely throttle or block
  // as if they were popups.
  async function exportAllListsZip() {
    setExportingKey("all-zip");
    try {
      const [{ default: JSZip }, data] = await Promise.all([import("jszip"), getFreshExportData()]);
      const zip = new JSZip();
      EXPORT_LISTS.forEach((list) => zip.file(`${list.filename}.csv`, rowsToCsv(list.build(data))));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `afterglow-כל-הרשימות-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      logActivity("ייצוא כל הרשימות (ZIP)", "");
    } catch (err) {
      showToast(`ייצוא הכל נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setExportingKey(null);
    }
  }

  // "ייצוא Excel" - one .xlsx workbook, one sheet per list, instead of a
  // zip of separate CSVs - opens straight in Excel/Sheets, no extracting.
  async function exportAllListsExcel() {
    setExportingKey("all-excel");
    try {
      const data = await getFreshExportData();
      const workbook = buildSpreadsheetMLWorkbook(EXPORT_LISTS.map((list) => ({ name: list.label, rows: list.build(data) })));
      const blob = new Blob([workbook], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `afterglow-כל-הרשימות-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
      logActivity("ייצוא כל הרשימות (Excel)", "");
    } catch (err) {
      showToast(`ייצוא ה-Excel נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setExportingKey(null);
    }
  }

  // "ייצוא PDF" - one printable document, all lists as tables, same
  // window.open + print pattern as exportShiftsPdf/exportEmergencyCardsPdf
  // below. The window has to open synchronously in the click handler
  // (before the fresh-data fetch), or popup blockers kill it.
  async function exportAllListsPdf() {
    const win = window.open("", "_blank");
    if (!win) return showToast("נחסמה פתיחת חלון - יש לאפשר חלונות קופצים לאתר", "error");
    setExportingKey("all-pdf");
    try {
      const data = await getFreshExportData();
      const sections = EXPORT_LISTS.map((list) => {
        const [header, ...body] = list.build(data);
        return `<h2>${escapeHtml(list.label)}</h2>
<table>
  <thead><tr>${header.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
  <tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
</table>`;
      }).join("");
      win.document.write(`<!doctype html>
<html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>ייצוא רשימות - Afterglow</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; break-before: page; }
  h2:first-of-type { break-before: avoid; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; break-inside: avoid; }
  th, td { border: 1px solid #ddd; padding: 4px 8px; font-size: 11px; text-align: right; vertical-align: top; }
  th { background: #f4f4f4; }
</style>
</head><body>
<h1>ייצוא רשימות - Afterglow (${escapeHtml(new Date().toLocaleDateString("he-IL"))})</h1>
${sections}
</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
      logActivity("ייצוא כל הרשימות (PDF)", "");
    } catch (err) {
      showToast(`ייצוא ה-PDF נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setExportingKey(null);
    }
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
    const latestCats = await getFreshShared("extra-budget-categories", extraBudgetCategories);
    if (BUDGET_CATEGORIES.includes(trimmed) || latestCats.includes(trimmed)) {
      return showToast("הקטגוריה כבר קיימת", "error");
    }
    const next = [...latestCats, trimmed];
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
    const latestCats = await getFreshShared("extra-budget-categories", extraBudgetCategories);
    if (!latestCats.includes(oldName)) return;
    if (BUDGET_CATEGORIES.includes(trimmed) || latestCats.includes(trimmed)) {
      return showToast("הקטגוריה כבר קיימת", "error");
    }
    const nextCats = latestCats.map((c) => (c === oldName ? trimmed : c));
    setExtraBudgetCategories(nextCats);

    const latestBudgets = await getFreshShared("category-budgets", categoryBudgets);
    const nextBudgets = { ...latestBudgets };
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
    const latestCats = await getFreshShared("extra-budget-categories", extraBudgetCategories);
    if (!latestCats.includes(name)) return;
    const [latestItems, latestExpenses] = await Promise.all([
      getFreshShared("budget-items", budgetItems),
      getFreshShared("budget-expenses", budgetExpenses),
    ]);
    const hasItems = latestItems.some((b) => b.category === name) || latestExpenses.some((e) => e.allocation === name);
    if (hasItems) {
      return showToast("יש הוצאות משויכות לקטגוריה זו - יש להעביר או למחוק אותן קודם", "error");
    }
    const nextCats = latestCats.filter((c) => c !== name);
    setExtraBudgetCategories(nextCats);
    const latestBudgets = await getFreshShared("category-budgets", categoryBudgets);
    const nextBudgets = { ...latestBudgets };
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
    setIsOfflineMode(false);
    // Fired immediately and not awaited, before the slower calls below -
    // this used to run last in a long sequential await chain, so a member
    // who opened the app and navigated away (or hit a slow/failing call
    // earlier in that chain) quickly would never reach it, and their login
    // would never be recorded anywhere. Independent of everything else now.
    (async () => {
      try {
        const touchKey = `last-seen-touched-${name}`;
        const lastTouch = Number(localStorage.getItem(touchKey)) || 0;
        if (Date.now() - lastTouch > 60 * 60 * 1000) {
          await touchLastSeen(name);
          localStorage.setItem(touchKey, String(Date.now()));
          logActivity("כניסה לאפליקציה", "", name);
        }
      } catch (err) {
        console.error("touchLastSeen/login-activity failed", err);
      }
    })();
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
    setIsOfflineMode(false);
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

  // Members with push notifications on already got a real push when someone
  // tagged them (see the notify-photo-tag webhook) - this is only the
  // fallback for everyone else: a one-time in-app popup the next time they
  // open the app, so a tag never just silently goes unnoticed.
  useEffect(() => {
    if (!identity || pushStatus === "granted") return;
    listUnseenPhotoTags(identity).then(setUnseenPhotoTags).catch(() => {});
  }, [identity, pushStatus]);

  function dismissTagAlert(goToGallery) {
    const ids = unseenPhotoTags.map((t) => t.id);
    setUnseenPhotoTags([]);
    markPhotoTagsSeen(ids, identity).catch(() => {});
    if (goToGallery) setTab("gallery");
  }

  // Comments load lazily, only for whichever photo is currently open in
  // the preview - not fetched at all for the rest of the gallery.
  useEffect(() => {
    if (!eventPhotoPreview) {
      setPreviewComments(null);
      return;
    }
    setPreviewComments(null);
    listPhotoComments(eventPhotoPreview.id).then(setPreviewComments).catch(() => setPreviewComments([]));
  }, [eventPhotoPreview?.id]);

  async function submitPhotoComment() {
    const text = newCommentText.trim();
    if (!text || !eventPhotoPreview) return;
    setNewCommentText("");
    try {
      const comment = await addPhotoComment(eventPhotoPreview.id, identity, text);
      setPreviewComments((prev) => [...(prev || []), comment]);
    } catch {
      showToast("שליחת התגובה נכשלה", "error");
    }
  }

  async function removePhotoComment(id) {
    try {
      await deletePhotoComment(id);
      setPreviewComments((prev) => (prev || []).filter((c) => c.id !== id));
    } catch {
      showToast("מחיקת התגובה נכשלה", "error");
    }
  }

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
    const actor = actorOverride || identity || "לא ידוע";
    const entry = { ts: Date.now(), actor, action, details: details || "" };
    // Optimistic local update so the owner's own screen reflects it
    // immediately if they're looking at the logs tab; the real write below
    // is a single INSERT (see storage.js) - no read-modify-write race, and
    // only one round trip instead of two.
    setActivityLog((prev) => [entry, ...prev].slice(0, 200));
    try {
      await insertActivityLog(actor, action, details || "");
    } catch (err) {
      console.error("logActivity failed", err);
    }
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

  async function refreshEventPhotos() {
    try {
      setEventPhotos(await listEventPhotos());
    } catch {
      showToast("טעינת התמונות נכשלה - אפשר לנסות שוב", "error");
    }
  }

  async function uploadEventPhotos(files) {
    setEventPhotosUploading(true);
    let failed = 0;
    for (const file of files) {
      try {
        await uploadEventPhoto(file, identity);
      } catch {
        failed++;
      }
    }
    setEventPhotosUploading(false);
    await refreshEventPhotos();
    if (failed > 0) {
      showToast(`${failed} תמונות לא הועלו - אפשר לנסות שוב`, "error");
    } else {
      showToast("התמונות הועלו 🎉");
    }
  }

  async function removeEventPhoto(photo) {
    try {
      await deleteEventPhoto(photo.id, photo.path);
      setEventPhotos((prev) => (prev || []).filter((p) => p.id !== photo.id));
    } catch {
      showToast("מחיקת התמונה נכשלה", "error");
    }
  }

  // iOS Safari doesn't save `<a download>` blobs straight to Photos - it
  // shows a generic "downloaded file" sheet instead, requiring a couple of
  // extra taps to actually get the image into the camera roll. Sharing the
  // file via the native Web Share sheet gives iPhone users the real
  // one-tap "שמירת תמונה" option they expect, so try that first and only
  // fall back to the manual blob-link download where Web Share (or sharing
  // files specifically) isn't supported, e.g. desktop browsers.
  async function downloadEventPhoto(photo) {
    try {
      // Prefer the original, full-resolution backup from Drive over the
      // resized copy the gallery displays - fall back to the resized copy
      // if there's no backup for this photo (older upload, or the Drive
      // backup failed) or the fetch back from Drive itself fails.
      let blob;
      if (photo.driveFileId) {
        try {
          blob = await fetchOriginalPhotoBlob(photo.driveFileId);
        } catch {
          blob = null;
        }
      }
      if (!blob) {
        const res = await fetch(photo.url);
        blob = await res.blob();
      }
      const ext = (photo.path.split(".").pop() || "jpg").toLowerCase();
      const filename = `afterglow-${photo.uploader}-${photo.ts}.${ext}`;
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err?.name === "AbortError") return;
      showToast("הורדת התמונה נכשלה", "error");
    }
  }

  async function downloadAllEventPhotos() {
    if (!eventPhotos || eventPhotos.length === 0) return;
    setEventPhotosZipping(true);
    try {
      // Loaded on demand - jszip is only needed for this one bulk-download
      // action, so keeping it out of the main bundle saves everyone else
      // (checking a shift, reading the board) real download weight on
      // mobile data in the field.
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      await Promise.all(
        eventPhotos.map(async (photo) => {
          const res = await fetch(photo.url);
          const blob = await res.blob();
          const ext = (photo.path.split(".").pop() || "jpg").toLowerCase();
          zip.file(`${photo.uploader}-${photo.ts}.${ext}`, blob);
        })
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFilename = "afterglow-מזכרת-קטנה-מאירוע-גדול.zip";
      const zipFile = new File([zipBlob], zipFilename, { type: "application/zip" });
      if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
        await navigator.share({ files: [zipFile] });
        return;
      }
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      if (err?.name !== "AbortError") {
        showToast("הורדת כל התמונות נכשלה - אפשר לנסות שוב", "error");
      }
    } finally {
      setEventPhotosZipping(false);
    }
  }

  // Tagging pushes a personal notification to whoever gets newly tagged
  // (via a DB webhook on event_photos that diffs old/new tags server-side -
  // see notify-photo-tag) - this just needs to save the updated array. x/y
  // are 0-100 percentages of the image, i.e. where the person was tapped -
  // set via the preview's "tap the photo to tag" flow.
  async function addPhotoTag(photo, name, x, y) {
    try {
      const tags = await addEventPhotoTag(photo.id, name, x, y);
      setEventPhotos((prev) => (prev || []).map((p) => (p.id === photo.id ? { ...p, tags } : p)));
      setEventPhotoPreview((prev) => (prev && prev.id === photo.id ? { ...prev, tags } : prev));
    } catch {
      showToast("התיוג נכשל", "error");
    }
  }

  async function removePhotoTag(photo, name) {
    try {
      const tags = await removeEventPhotoTag(photo.id, name);
      setEventPhotos((prev) => (prev || []).map((p) => (p.id === photo.id ? { ...p, tags } : p)));
      setEventPhotoPreview((prev) => (prev && prev.id === photo.id ? { ...prev, tags } : prev));
    } catch {
      showToast("הסרת התיוג נכשלה", "error");
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
        listActivityLog().catch(() => activityLog),
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
      // Total unfilled shifts left across the whole schedule (same formula
      // as unfilledShiftsCount in the admin overview) - not just spots left
      // in this one shift, which is what was there before.
      const shiftsRemaining = SHIFTS.reduce(
        (sum, s) => (s.id === TEARDOWN_ID || s.noLimit ? sum : sum + Math.max(s.spots - (nextAssignments[s.id] || []).length, 0)),
        0
      );
      logActivity(
        "שיבוץ עצמי למשמרת",
        `${who} → ${shift.title} (${formatDate(shift.date)}) · נותרו עוד ${shiftsRemaining} מקומות פנויים במשמרות בסה"כ`
      );
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

  async function addPayment(name, amount, date, method) {
    if (!amount) return;
    const latest = await getFreshShared("member-payments", memberPayments);
    const list = Array.isArray(latest[name]) ? latest[name] : [];
    const next = { ...latest, [name]: [...list, { id: Date.now().toString(), amount: Number(amount), date, method: method || null, recordedBy: identity, recordedAt: Date.now() }] };
    setMemberPayments(next);
    try {
      await window.storage.set("member-payments", JSON.stringify(next), true);
      logActivity("רישום תשלום", `${name}: ₪${amount}${method ? ` (${duesMethodLabel(method)})` : ""}`);
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

  async function editPayment(name, id, amount, date, method) {
    if (!amount) return;
    const latest = await getFreshShared("member-payments", memberPayments);
    const list = Array.isArray(latest[name]) ? latest[name] : [];
    const next = { ...latest, [name]: list.map((p) => (p.id === id ? { ...p, amount: Number(amount), date, method: method || null } : p)) };
    setMemberPayments(next);
    try {
      await window.storage.set("member-payments", JSON.stringify(next), true);
      logActivity("עריכת תשלום", `${name}: ₪${amount}${method ? ` (${duesMethodLabel(method)})` : ""}`);
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
    // A rider can only be matched to one driver at a time - drop them from
    // any other driver's list before adding them here, so they can't end up
    // double-booked across two cars.
    const next = { [driverName]: [...current, riderName] };
    Object.keys(latest).forEach((d) => {
      if (d === driverName) return;
      next[d] = (latest[d] || []).filter((n) => n !== riderName);
    });
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

  // Snapshot of everything the app knows about a member, taken at the
  // moment they're removed - this is what "הוסרו מהקמפ" lets an admin
  // download, and it's the only trace of them left once the 7-day grace
  // window ends and purge-removed-members erases the real data.
  function buildMemberSnapshot(name) {
    const myShiftTitles = SHIFTS.filter((s) => (assignments[s.id] || []).includes(name)).map((s) => s.title);
    const leadOfTeams = Object.keys(teamLeads).filter((t) => (teamLeads[t] || []).includes(name));
    return {
      role: dbRoles[name] || "member",
      phone: memberPhones[name] || null,
      email: memberEmails[name] || null,
      emergencyInfo: emergencyInfo[name] || null,
      rideInfo: rideInfo[name] || null,
      allocationInfo: allocationInfo[name] || null,
      payments: memberPayments[name] || [],
      feeOverride: feeOverrides[name] ?? null,
      idOnFile: idOnFileNames?.includes(name) || false,
      pushEnabled: pushEnabledNames?.includes(name) || false,
      whatsappConsent: !!whatsappConsent[name],
      teardownTasks: teardownTasks[name] || [],
      shiftTitles: myShiftTitles,
      leadOfTeams,
      manualTeamMemberships: Object.keys(manualTeamMembers).filter((t) => (manualTeamMembers[t] || []).includes(name)),
    };
  }

  async function removeMember(name) {
    const latest = await getFreshShared("removed-members", removedMembers);
    const next = [...latest, name];
    setRemovedMembers(next);
    try {
      await window.storage.set("removed-members", JSON.stringify(next), true);
      try {
        await archiveRemovedMember(name, identity, buildMemberSnapshot(name));
      } catch (err) {
        showToast(`${name} הוסר/ה, אך שמירת הגיבוי נכשלה: ${err?.message || "שגיאה לא ידועה"}`, "error");
      }
      showToast(`${name} הוסר/ה מהקמפ - הנתונים יישמרו 7 ימים ואז יימחקו לצמיתות`, "ok");
      logActivity("הסרת חבר קמפ", name);
      refreshRemovedMembersArchive();
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
      try {
        await restoreRemovedMember(name);
      } catch (err) {
        console.error("removing archive row failed (non-blocking)", err);
      }
      showToast(`${name} שוחזר/ה`, "ok");
      logActivity("שחזור חבר קמפ", name);
      refreshRemovedMembersArchive();
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function refreshRemovedMembersArchive() {
    try {
      setRemovedMembersArchive(await listRemovedMembers());
    } catch {}
  }

  function downloadRemovedMemberFile(row) {
    const payload = { name: row.name, removedAt: row.removed_at, removedBy: row.removed_by, ...row.snapshot };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.name}-גיבוי-הסרה.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  // Admin-only: re-pushes a notification about one specific announcement or
  // poll that's already on the board - separate from the automatic push a
  // new post triggers once, for nudging people who missed it the first time.
  async function sendItemReminder(itemId, title, message) {
    setSendingItemReminderId(itemId);
    try {
      const result = await sendEventReminderPush(title, message);
      const sent = result?.sent ?? 0;
      if (sent > 0) {
        showToast(`תזכורת נשלחה ל-${sent} מכשירים`, "ok");
      } else {
        showToast("לא נשלחה אף התראה בפועל - כנראה שאף אחד עדיין לא אישר התראות דחיפה", "error");
      }
      logActivity("שליחת תזכורת ללוח מודעות", title);
    } catch (err) {
      showToast(`שליחת התזכורת נכשלה: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setSendingItemReminderId(null);
    }
  }

  // Admin-only: pushes a reminder only to members who haven't answered this
  // specific poll yet - unlike sendItemReminder above (which broadcasts to
  // everyone who's approved push, answered or not).
  async function remindNonVoters(poll, nonVoterNames) {
    if (nonVoterNames.length === 0) return;
    setRemindingNonVotersPollId(poll.id);
    try {
      const result = await sendEventReminderPush("תזכורת: סקר ממתין לך", poll.question, undefined, nonVoterNames);
      const sent = result?.sent ?? 0;
      if (sent > 0) {
        showToast(`תזכורת נשלחה ל-${sent} ממי שעדיין לא הצביע/ה`, "ok");
      } else {
        showToast("לא נשלחה אף התראה בפועל - כנראה שאף אחד ממי שלא הצביע לא אישר התראות דחיפה", "error");
      }
      logActivity("שליחת תזכורת למי שלא הצביע בסקר", poll.question);
    } catch (err) {
      showToast(`שליחת התזכורת נכשלה: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setRemindingNonVotersPollId(null);
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
  async function exportEmergencyCardsPdf() {
    const win = window.open("", "_blank");
    if (!win) return showToast("נחסמה פתיחת חלון - יש לאפשר חלונות קופצים לאתר", "error");
    setExportingKey("emergency-pdf");
    try {
      // Fetched fresh rather than trusting state - this is exactly the kind
      // of "just updated it, still shows old data" gap a printout can't
      // afford, since the medical team may only see this once, on paper.
      const data = await getFreshExportData();
      const cards = data.allMembers.map((m) => {
        const d = data.emergencyInfo[m.name] || {};
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
    } catch (err) {
      showToast(`הייצוא נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setExportingKey(null);
    }
  }

  // Admin-only: a printable (save-as-PDF) roster of every shift and who's
  // in it, with a summary up top. "Shifts" and "volunteers" are deliberately
  // different counts - a shift with 5 spots and 3 people signed up is still
  // 1 shift, but 3 volunteers; "open"/"filled" are the same two numbers
  // restated as spots rather than people.
  async function exportShiftsPdf() {
    const win = window.open("", "_blank");
    if (!win) return showToast("נחסמה פתיחת חלון - יש לאפשר חלונות קופצים לאתר", "error");
    setExportingKey("shifts-pdf");
    try {
    // Fetched fresh rather than trusting state, same reasoning as
    // exportEmergencyCardsPdf above.
    const freshAssignments = await getFreshShared("shift-assignments", assignments);

    // Teardown is excluded from the summary counts, same as
    // unfilledShiftsCount/openShiftsCount elsewhere - it isn't a normal
    // slot-limited shift people opt into (spots = every member, "everyone
    // participates"), so counting its ~30 nominally-"open" spots would
    // swamp the real numbers from the actual self-scheduled shifts. Setup
    // ("הקמות") is excluded too - it's an open-ended arrival day, not a shift.
    const countedShifts = SHIFTS.filter((s) => s.id !== TEARDOWN_ID && s.phase !== "הקמות");
    const totalShifts = countedShifts.length;
    const totalVolunteers = countedShifts.reduce((s, sh) => s + (freshAssignments[sh.id] || []).length, 0);
    // Uncapped shifts (noLimit) don't have a meaningful "people needed"
    // number, so they're left out of the spots/open-spots math the same
    // way teardown is - but they still count toward totalShifts/totalVolunteers above.
    const cappedShifts = countedShifts.filter((s) => !s.noLimit);
    const totalSpots = cappedShifts.reduce((s, sh) => s + sh.spots, 0);
    const cappedVolunteers = cappedShifts.reduce((s, sh) => s + (freshAssignments[sh.id] || []).length, 0);
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
          const names = freshAssignments[s.id] || [];
          const namesHtml = names.length > 0 ? names.map((n) => escapeHtml(n)).join(", ") : "";
          return `<tr>
            <td>${escapeHtml(s.title)}</td>
            <td>${escapeHtml(s.team)}</td>
            <td>${s.noTime ? "" : `${s.start}–${s.end}`}</td>
            <td>${s.noLimit ? "ללא הגבלה" : `${names.length}/${s.spots}`}</td>
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
          const count = (freshAssignments[s.id] || []).length;
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
    } catch (err) {
      showToast(`הייצוא נכשל: ${err?.message || "שגיאה לא ידועה"}`, "error");
    } finally {
      setExportingKey(null);
    }
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

  // Team membership is a deliberate assignment (by an admin or that team's
  // own lead, via addManualTeamMember - backed by the real team_members
  // table, see the comment below), not an inference from "signed up for a
  // shift under this team" - someone helping out with one kitchen shift
  // isn't automatically "on" צוות המטבח, and letting shift signup imply
  // membership also meant it could silently grant team-gated permissions
  // (isInTeam feeds canManageFinances/canManageShopping) to someone who
  // never was actually assigned to the team.
  function teamMembers(teamName) {
    return (manualTeamMembers[teamName] || []).filter((n) => !removedMembers.includes(n));
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

  async function saveContentSchedule(next) {
    setContentSchedule(next);
    try {
      await window.storage.set("content-schedule", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }
  async function updateContentCell(rowId, colIndex, value) {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { ...latest, rows: latest.rows.map((r) => (r.id === rowId ? { ...r, cells: r.cells.map((c, i) => (i === colIndex ? value : c)) } : r)) };
    await saveContentSchedule(next);
  }
  async function updateContentRowLabel(rowId, label) {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { ...latest, rows: latest.rows.map((r) => (r.id === rowId ? { ...r, label } : r)) };
    await saveContentSchedule(next);
  }
  async function updateContentColumnHeader(colIndex, value) {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { ...latest, columns: latest.columns.map((c, i) => (i === colIndex ? value : c)) };
    await saveContentSchedule(next);
  }
  async function addContentRow() {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { ...latest, rows: [...latest.rows, { id: Date.now().toString(), label: "", cells: latest.columns.map(() => null) }] };
    await saveContentSchedule(next);
  }
  async function removeContentRow(rowId) {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { ...latest, rows: latest.rows.filter((r) => r.id !== rowId) };
    await saveContentSchedule(next);
  }
  async function addContentColumn() {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { columns: [...latest.columns, `יום ${latest.columns.length + 1}`], rows: latest.rows.map((r) => ({ ...r, cells: [...r.cells, null] })) };
    await saveContentSchedule(next);
  }
  async function removeContentColumn(colIndex) {
    const latest = await getFreshShared("content-schedule", contentSchedule);
    const next = { columns: latest.columns.filter((_, i) => i !== colIndex), rows: latest.rows.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== colIndex) })) };
    await saveContentSchedule(next);
  }

  async function saveContentSuggestions(next) {
    setContentSuggestions(next);
    try {
      await window.storage.set("content-suggestions", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }
  async function submitContentSuggestion(title, description) {
    if (!title.trim()) return;
    const latest = await getFreshShared("content-suggestions", contentSuggestions);
    const next = [...latest, { id: Date.now().toString(), title: title.trim(), description: description.trim(), suggestedBy: identity, createdAt: Date.now(), status: "pending" }];
    await saveContentSuggestions(next);
    showToast("ההצעה נשלחה לצוות תוכן - תודה!", "ok");
    logActivity("הצעת תוכן חדשה", title.trim());
  }
  async function rejectContentSuggestion(id) {
    const latest = await getFreshShared("content-suggestions", contentSuggestions);
    const next = latest.map((s) => (s.id === id ? { ...s, status: "rejected" } : s));
    await saveContentSuggestions(next);
    logActivity("דחיית הצעת תוכן", id);
  }
  // Places a suggestion straight into a table slot (overwriting whatever was
  // there) and marks it placed - the suggester's name becomes the default
  // facilitator since they're who proposed running it, easy to edit after.
  async function assignSuggestionToCell(suggestion, rowId, colIndex) {
    const latestSchedule = await getFreshShared("content-schedule", contentSchedule);
    const nextSchedule = {
      ...latestSchedule,
      rows: latestSchedule.rows.map((r) =>
        r.id === rowId
          ? { ...r, cells: r.cells.map((c, i) => (i === colIndex ? contentItem(suggestion.title, suggestion.description, suggestion.suggestedBy) : c)) }
          : r
      ),
    };
    await saveContentSchedule(nextSchedule);
    const latestSuggestions = await getFreshShared("content-suggestions", contentSuggestions);
    const nextSuggestions = latestSuggestions.map((s) => (s.id === suggestion.id ? { ...s, status: "placed" } : s));
    await saveContentSuggestions(nextSuggestions);
    logActivity("שיבוץ הצעת תוכן בטבלה", suggestion.title);
  }

  function teamStats(team) {
    const teamShifts = SHIFTS.filter((s) => s.team === team && s.id !== TEARDOWN_ID);
    const unfilled = teamShifts.reduce((sum, s) => (s.noLimit ? sum : sum + Math.max(s.spots - (assignments[s.id] || []).length, 0)), 0);
    // Budget tracking is keyed by budget category, not team name (see
    // TEAM_BUDGET_CATEGORY) - route through the mapping so a team's own
    // dashboard shows the same planned/paid numbers as the rest of the app.
    const cat = budgetCategoryForTeam(team);
    const planned = plannedForCategory(cat);
    // Actual spend lives in two places: the legacy budgetItems list (older
    // planned-line-items, matched by `category`) and budgetExpenses (the
    // list the team dashboard's own quick-add form writes to, matched by
    // `allocation`) - both need to be counted or a team lead's own expense
    // entries silently wouldn't show up in their own "paid so far" stat.
    const legacyPaid = budgetItems.filter((b) => b.category === cat).reduce((s, b) => s + (Number(b.paid) || 0), 0);
    const expensesPaid = budgetExpenses.filter((e) => e.allocation === cat).reduce((s, e) => s + expenseAmounts(e).paid, 0);
    const paid = legacyPaid + expensesPaid;
    return { totalShifts: teamShifts.length, unfilled, planned, paid };
  }

  const allMembers = useMemo(() => {
    const byName = new Map();
    // Base list is the static roster + the locally-synced "extra members"
    // cache (kv_store) - needed pre-login, when we can't read the real
    // `members` table yet. Once logged in, `dbRoles` is a fresh
    // `select name, role from members` from the real table, so it's
    // unioned in too: that catches any member whose kv_store sync missed
    // or raced (the same class of bug the activity log had), so a newly
    // added member always shows up everywhere - including the dues list -
    // even if the redundant local cache never got their name.
    [...MEMBERS, ...extraMembers, ...Object.keys(dbRoles).map((name) => ({ name, role: dbRoles[name] }))]
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

  // The teardown shift's real roster is "everyone currently in camp", which
  // is dynamic (allMembers.length) - but SHIFTS itself is a static,
  // module-level array built once at load time, so its own `spots` field
  // is frozen at whatever MEMBERS.length was back then. Every render site
  // that shows a shift's names/capacity needs to special-case teardown
  // through allMembers instead of trusting s.spots directly, or it'll
  // silently show a stale headcount once anyone's added outside the
  // original static roster - this centralizes that so a future call site
  // can't forget the check.
  function shiftNamesAndSpots(s) {
    const isTeardown = s.id === TEARDOWN_ID;
    const names = (isTeardown ? allMembers.map((m) => m.name) : (assignments[s.id] || [])).filter((n) => !removedMembers.includes(n));
    const spots = isTeardown ? allMembers.length : s.spots;
    return { names, spots };
  }

  // Every team needs a slot to receive a manually-set budget from finance
  // (CategoryBudgetForm) even if it has no parameter/item-row linkage (see
  // TEAM_BUDGET_CATEGORY) - without this, a team like "ארטקאר" wouldn't
  // appear in that dropdown at all until someone first went and manually
  // opened a same-named category through "פתיחת קטגוריית הוצאה חדשה".
  const allBudgetCategories = useMemo(() => {
    const base = [...BUDGET_CATEGORIES, ...extraBudgetCategories];
    [...TEAMS, ...extraTeams].forEach((t) => {
      const cat = budgetCategoryForTeam(t.name);
      if (!base.includes(cat)) base.push(cat);
    });
    return base;
  }, [extraBudgetCategories, extraTeams]);
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
  const canEditContent = isAdmin || isInTeam(CONTENT_TEAM_NAME);
  const canManageContentSuggestions = isAdmin || (teamLeads[CONTENT_TEAM_NAME] || []).includes(identity);
  const pendingContentSuggestions = contentSuggestions.filter((s) => s.status === "pending");
  // Pending suggestions are only actionable by admins/content-team leads -
  // a regular member who submitted one can still see its own status, but
  // shouldn't see (or act on) anyone else's queue.
  const visiblePendingSuggestions = pendingContentSuggestions.filter((s) => canManageContentSuggestions || s.suggestedBy === identity);

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

  // Owner-only view (in "יומנים") of who has filled in their personal
  // details and who hasn't - same fields as missingProfileFields above,
  // minus the push-notification decision, since that's a per-device
  // setting with no shared record of other members' choice.
  const membersProfileStatus = useMemo(() => {
    return allMembers.map((m) => {
      const missing = [];
      if (!memberPhones[m.name]?.trim()) missing.push("טלפון");
      if (!memberEmails[m.name]?.trim()) missing.push("אימייל");
      const emg = emergencyInfo[m.name] || {};
      if (!emg.contactName?.trim() || !emg.contactPhone?.trim()) missing.push("פרטי חירום");
      const ride = rideInfo[m.name] || {};
      if (ride.hasCar !== "yes" && ride.hasCar !== "no") missing.push("התניידות");
      const alloc = allocationInfo[m.name] || {};
      if (alloc.hasAllocation !== "yes" && alloc.hasAllocation !== "no") missing.push("הקצאה");
      return { name: m.name, missing };
    });
  }, [allMembers, memberPhones, memberEmails, emergencyInfo, rideInfo, allocationInfo]);

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
  const PROFILE_GATE_EXEMPT_TABS = ["dashboard-personal", "shifts", "board", "gallery"];

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
  // instead of a stale snapshot from then. Also refresh on "תקשורת" since
  // that tab shows the owner-only notification history, which reads from
  // the same activityLog state - otherwise it stays stuck at the empty
  // initial [] until the owner happens to visit "יומנים" first.
  useEffect(() => {
    if ((adminSubTab === "logs" || adminSubTab === "comms") && isOwner) {
      refreshLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSubTab, isOwner]);

  useEffect(() => {
    if (tab === "gallery" && identity) {
      refreshEventPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, identity]);

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
  // "המשמרות שלי" stat card count - unlike the myShifts list itself (which
  // still lists setup/teardown days so people see them in their personal
  // schedule), the tally excludes teardown (automatic for everyone) and
  // setup/הקמות (open-ended arrival days, not a real shift), same convention
  // as memberShiftCounts/membersWithoutShift on the admin side.
  const myShiftsCount = useMemo(
    () => myShifts.filter((s) => s.id !== TEARDOWN_ID && s.phase !== "הקמות").length,
    [myShifts]
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
    () => allMembers.filter((m) => !SHIFTS.some((s) => s.id !== TEARDOWN_ID && s.phase !== "הקמות" && (assignments[s.id] || []).includes(m.name))).length,
    [assignments, allMembers]
  );
  // Per-member shift count for the admin "משמרות חברי קמפ" list - teardown
  // excluded since everyone's on it by default, same convention as
  // membersWithoutShift/unfilledShiftsCount above. Setup ("הקמות") shifts
  // are excluded too - they're open-ended arrival days, not a real shift.
  const memberShiftCounts = useMemo(() => {
    const countedShifts = SHIFTS.filter((s) => s.id !== TEARDOWN_ID && s.phase !== "הקמות");
    return allMembers
      .map((m) => ({
        name: m.name,
        count: countedShifts.filter((s) => (assignments[s.id] || []).includes(m.name)).length,
      }))
      .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name, "he"));
  }, [allMembers, assignments]);
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
  // "תקציב מתוכנן" per category is always the last *published* number
  // (categoryBudgets), never the live engine.categoryPlanned value directly -
  // deliberately. While Netta is mid-edit on the parameters below, the
  // live-computed number would otherwise flicker through every department's
  // screen with every keystroke, including half-typed numbers. A department
  // only sees a new number once someone explicitly publishes it (see the
  // "מחלקות" tab in כספים), which copies the live computed value into
  // categoryBudgets at that moment.
  function plannedForCategory(cat) {
    return Number(categoryBudgets[cat]) || 0;
  }
  const whatIfN = Number(budgetParams.global.whatIfN) || 0;
  const whatIfEngine = useMemo(() => {
    if (!budgetParams.global.whatIfEnabled || whatIfN <= 0) return null;
    return runBudgetEngine(budgetParams, whatIfN, budgetExpenses, paymentTotals);
  }, [budgetParams, budgetExpenses, paymentTotals, whatIfN]);

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
      const planned = plannedForCategory(cat);
      return planned > 0 && categorySpend[cat] > planned;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryBudgets, categorySpend, allBudgetCategories, engine.categoryPlanned]);
  // "Approaching" the budget (85%+) but not over it yet - a separate,
  // softer warning so admins/team leads get a heads-up before it's too late.
  const nearBudgetCategories = useMemo(() => {
    return allBudgetCategories.filter((cat) => {
      const planned = plannedForCategory(cat);
      if (!planned) return false;
      const ratio = categorySpend[cat] / planned;
      return ratio >= 0.85 && ratio <= 1;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryBudgets, categorySpend, allBudgetCategories, engine.categoryPlanned]);

  const budgetTotals = useMemo(() => {
    const planned = allBudgetCategories.reduce((sum, cat) => sum + plannedForCategory(cat), 0);
    // budgetItems.committed is a raw admin-entered total that stays nonzero
    // even once fully paid, unlike expenseAmounts().committed below (which
    // means "still owed" and drops to 0 once paid) - use the same "still
    // owed" meaning here too so the merged total is one consistent number.
    let committed = budgetItems.reduce((sum, b) => sum + Math.max((Number(b.committed) || 0) - (Number(b.paid) || 0), 0), 0);
    let paid = budgetItems.reduce((sum, b) => sum + (Number(b.paid) || 0), 0);
    budgetExpenses.forEach((e) => {
      const amounts = expenseAmounts(e);
      committed += amounts.committed;
      paid += amounts.paid;
    });
    // "Available balance" is real money on hand - dues actually collected
    // minus what's actually been paid out - not the planning gap (planned
    // minus committed), which doesn't reflect real cash at all.
    const duesCollected = paymentTotals.paid;
    return { planned, committed, paid, duesCollected, remaining: duesCollected - paid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetItems, budgetExpenses, categoryBudgets, paymentTotals, allBudgetCategories, engine.categoryPlanned]);

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
    { id: "my-shifts", label: "המשמרות שלי", icon: Check },
    { id: "board", label: "לוח מודעות", icon: Megaphone },
  ];
  const navCampTabs = [
    { id: "content", label: "תוכן", icon: Flame },
    { id: "budget", label: "הוצאות", icon: Wallet },
    ...(canManageFinances ? [{ id: "finances", label: "כספים", icon: CreditCard }] : []),
    { id: "teams", label: "צוותים", icon: Tent },
    { id: "rides", label: "התניידות", icon: Car },
    { id: "contacts", label: "חברי קמפ", icon: Phone },
    { id: "equipment", label: "ציוד קמפ", icon: Package },
    { id: "shopping", label: "קניות מטבח", icon: ShoppingCart },
    { id: "gallery", label: "גלריית המחנה", icon: Camera },
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
        className={`btn-nav-3d flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors relative text-center ${fullWidth ? "col-span-2" : ""}`}
        style={{
          minWidth: 0,
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

  // Lays out a category's tabs 2-per-row (grid-cols-2) via renderNavItem's
  // fullWidth flag - if a pinned full-width item (like the personal
  // dashboard) leaves an odd number of regular items, the last one would
  // otherwise sit alone with an empty cell beside it, so stretch it to
  // full width too instead of leaving that gap.
  function renderNavTabsGrid(tabs, isPinnedFullWidth) {
    const regular = tabs.filter((t) => !isPinnedFullWidth(t));
    const lastRegularId = regular[regular.length - 1]?.id;
    const trailingOrphan = regular.length % 2 === 1;
    return tabs.map((t) => {
      const pinned = isPinnedFullWidth(t);
      return renderNavItem(t, pinned || (trailingOrphan && !pinned && t.id === lastRegularId));
    });
  }

  const visibleShifts = (teamFilter === "הכל" ? SHIFTS : SHIFTS.filter((s) => s.team === teamFilter))
    .slice()
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  // Grouped by uploader (whoever most recently added a photo floats their
  // whole group to the top) - each group gets one plain text heading, not a
  // separate boxed "album" card, so the page still reads as one continuous
  // gallery rather than a stack of albums.
  const groupedEventPhotos = useMemo(() => {
    if (!eventPhotos) return eventPhotos;
    const order = [];
    const byUploader = {};
    eventPhotos.forEach((p) => {
      if (!byUploader[p.uploader]) {
        byUploader[p.uploader] = [];
        order.push(p.uploader);
      }
      byUploader[p.uploader].push(p);
    });
    order.forEach((name) => byUploader[name].sort((a, b) => b.ts - a.ts));
    order.sort((a, b) => byUploader[b][0].ts - byUploader[a][0].ts);
    return order.map((uploader) => ({ uploader, photos: byUploader[uploader] }));
  }, [eventPhotos]);

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
      <div
        dir="rtl"
        style={{
          fontFamily: FONT_BODY,
          color: COLORS.text,
          minHeight: "100dvh",
          fontWeight: 700,
          backgroundImage: `linear-gradient(180deg, rgba(255,250,240,0.35) 0%, rgba(255,250,240,0.1) 30%, rgba(43,36,32,0.15) 100%), url(${heroDesert})`,
          backgroundSize: "cover",
          backgroundPosition: "center 65%",
        }}
      >
        <style>{FONT_IMPORT}</style>
        <LoginScreen members={allMembers} onLogin={handleLogin} onSetup={handleSetup} />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: FONT_BODY, background: COLORS.bg, color: COLORS.text, minHeight: "100dvh", fontWeight: 700 }}>
      <style>{FONT_IMPORT}</style>

      {/* Popup gate on entry - nudges anyone with an incomplete profile
          straight to "פרטים אישיים", every entry, until it's actually
          complete (dismissible per-session, reappears next entry since
          the underlying problem hasn't been fixed). */}
      {!profileComplete && !profileGateDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(20,15,10,0.6)" }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: COLORS.bg, border: `1px solid ${COLORS.divider}` }}>
            <div className="p-5 text-center">
              <div className="text-lg" style={{ fontFamily: FONT_HEADING, color: COLORS.accentDark }}>עוד רגע לפני שממשיכים</div>
              <p className="text-sm font-bold mt-2 mb-1">על מנת להמשיך לאפליקציה נא למלא את כל הפרטים:</p>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>{missingProfileFields.join(", ")}</p>
              <div className="flex gap-3 justify-center mb-3">
                <button
                  onClick={() => {
                    setProfileGateDismissed(true);
                    setTab("dashboard-personal");
                    setOpenPersonalSection("details");
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        document.getElementById("personal-details-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      });
                    });
                  }}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-bold"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  קח אותי לשם
                </button>
              </div>
              <button onClick={() => setProfileGateDismissed(true)} className="text-xs" style={{ color: COLORS.textMuted }}>
                אחר כך
              </button>
            </div>
          </div>
        </div>
      )}

      {profileComplete && unseenPhotoTags.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(20,15,10,0.6)" }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: COLORS.bg, border: `1px solid ${COLORS.divider}` }}>
            <div className="p-5 text-center">
              <Camera size={28} style={{ color: COLORS.accentDark, margin: "0 auto 8px" }} />
              <div className="text-lg" style={{ fontFamily: FONT_HEADING, color: COLORS.accentDark }}>תויגת בתמונה 📸</div>
              <p className="text-sm mt-2 mb-4">
                {unseenPhotoTags.length === 1
                  ? `${unseenPhotoTags[0].uploader} תייג/ה אותך בתמונה בגלריית המחנה`
                  : `תויגת ב-${unseenPhotoTags.length} תמונות בגלריית המחנה`}
              </p>
              <div className="flex gap-3 justify-center mb-3">
                <button
                  onClick={() => dismissTagAlert(true)}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-bold"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  קח אותי לשם
                </button>
              </div>
              <button onClick={() => dismissTagAlert(false)} className="text-xs" style={{ color: COLORS.textMuted }}>
                אחר כך
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative px-6 pt-8 pb-6 overflow-hidden" style={{ borderBottom: `1px solid ${COLORS.divider}` }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-20px",
            backgroundImage: `url(${heroDesert})`,
            backgroundSize: "cover",
            backgroundPosition: "center 60%",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${COLORS.heroLight}40 0%, ${COLORS.heroLight}66 55%, ${COLORS.heroLight}b3 100%)`,
          }}
        />
        <div className="relative flex items-center gap-4 max-w-4xl mx-auto">
          <button
            onClick={() => { setTab("dashboard-personal"); setExpandedNavCategory(null); }}
            className="flex items-center gap-4 flex-1 text-right"
            style={{ minWidth: 0 }}
          >
            <SunsetMark size={64} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: FONT_HEADING }} className="text-3xl tracking-tight">
                Afterglow 2026
              </h1>
            </div>
          </button>
          <div className="text-center px-2 py-1" style={{ flexShrink: 0 }}>
            <div className="text-2xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.text, textShadow: "0 1px 6px rgba(255,255,255,0.7)" }}>{daysUntil()}</div>
            <div className="text-xs font-bold" style={{ color: COLORS.text, textShadow: "0 1px 6px rgba(255,255,255,0.7)" }}>ימים לפתיחת ימים</div>
            <div className="text-[8px] font-semibold" style={{ color: COLORS.text, opacity: 0.85, textShadow: "0 1px 6px rgba(255,255,255,0.7)" }}>(הקמות)</div>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto mt-5 flex items-center justify-between">
          <span className="text-sm">
            שלום, <b style={{ color: COLORS.accentDark }}>{identity}</b>
          </span>
          <button onClick={logout} className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
            <LogOut size={13} /> לא אני, החלף/י משתמש
          </button>
        </div>
        {isOfflineMode && (
          <div className="relative max-w-4xl mx-auto mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: COLORS.accent2Light, color: COLORS.accent2Dark }}>
            <WifiOff size={13} />
            אין חיבור לרשת - מוצג מידע שמור ממועד ההתחברות האחרון. לא ניתן לשמור שינויים כרגע.
          </div>
        )}
      </div>

      {/* Primary nav - "מקובץ למעלה" layout - sticky so the current-page
          label below it stays visible even after scrolling into content,
          not just for a moment right after picking a tab. */}
      <div id="sticky-nav-bar" className="sticky top-0 z-30 pb-2" style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.divider}` }}>
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

        {isOwner && (
          <button
            onClick={() => setTab("dashboard-team")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-colors mb-2"
            style={{
              background: tab === "dashboard-team" ? COLORS.accent2 : COLORS.surface,
              color: tab === "dashboard-team" ? "white" : COLORS.accent2Dark,
              border: `1px solid ${tab === "dashboard-team" ? COLORS.accent2 : COLORS.divider}`,
            }}
          >
            <Tent size={16} /> לוח בקרה צוות (הצגה לכל צוות)
          </button>
        )}

        <div className="relative">
          <div className="flex gap-2">
            {[
              { key: "personal", label: "אישי", tabs: navPersonalTabs },
              { key: "camp", label: "קמפ", tabs: navCampTabs },
            ].map((cat) => {
              const open = expandedNavCategory === cat.key;
              const activeTabInCat = cat.tabs.find((t) => t.id === tab);
              const showBadge = cat.key === "personal" && hasNewBoardItems;
              // "open" (just expanded to browse) and "actually viewing a screen
              // in this category" are different things - only the latter should
              // read as "selected"; merely browsing gets a lighter highlight.
              return (
                <button
                  key={cat.key}
                  onClick={() => setExpandedNavCategory(open ? null : cat.key)}
                  className="btn-nav-3d flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-sm font-bold transition-colors"
                  style={{
                    position: "relative",
                    background: activeTabInCat ? COLORS.accent : open ? COLORS.accentLight : COLORS.surface,
                    color: activeTabInCat ? COLORS.bg : open ? COLORS.accentDark : COLORS.textMuted,
                    border: `1px solid ${activeTabInCat || open ? COLORS.accent : COLORS.divider}`,
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
            <>
              {/* Floating, not inline - a 10-item category list used to push the
                  whole page's content down when expanded, forcing a lot of
                  scrolling just to get back to what you were looking at. This
                  overlays instead, capped at 60vh with its own scroll, and a
                  backdrop click closes it same as picking an item does. */}
              <div className="fixed inset-0 z-30" onClick={() => setExpandedNavCategory(null)} />
              <div
                className="absolute right-0 left-0 mt-2 rounded-2xl p-3 grid grid-cols-2 gap-2 overflow-y-auto z-40"
                style={{ background: COLORS.input, border: `1px solid ${COLORS.divider}`, maxHeight: "60vh", boxShadow: "0 10px 30px rgba(58,34,42,0.28)" }}
              >
                {expandedNavCategory === "personal"
                  ? renderNavTabsGrid(navPersonalTabs, (t) => t.id === "dashboard-personal")
                  : renderNavTabsGrid(navCampTabs, () => false)}
              </div>
            </>
          )}
        </div>
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
                { id: "member-shifts", label: "משמרות חברי קמפ", icon: CalendarDays },
                { id: "allocations", label: "הקצאות", icon: Ticket },
                { id: "exports", label: "ייצוא רשימות", icon: Download },
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
                    { label: "חברים ללא משמרת", value: membersWithoutShift, onClick: () => setAdminSubTab("member-shifts") },
                    { label: "ימים לפתיחת השערים", value: daysUntil() },
                  ].map((c) => (
                    <div
                      key={c.label}
                      onClick={c.onClick}
                      className={`rounded-2xl p-4 ${c.onClick ? "text-right cursor-pointer active:scale-[0.97] transition-transform" : ""}`}
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, boxShadow: c.onClick ? "0 1px 3px rgba(58,34,42,0.15)" : "none" }}
                    >
                      <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                      <div className="text-xs mt-1 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                        {c.label}
                        {c.onClick && <ChevronDown size={11} style={{ transform: "rotate(90deg)" }} />}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-bold mt-5 mb-2" style={{ color: COLORS.textMuted }}>מוכנות התניידות</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "טרם מילאו פרטי הגעה", value: membersWithoutRideInfo, onClick: () => { setAdminSubTab("members"); setShowProfileCompletion(true); } },
                    { label: "מציעים טרמפ", value: offeringRides.length, onClick: () => { setTab("rides"); setPendingScrollTargetId("ride-offering"); } },
                    { label: "מחפשים טרמפ", value: lookingForRide.length, onClick: () => { setTab("rides"); setPendingScrollTargetId("ride-looking"); } },
                  ].map((c) => (
                    <div
                      key={c.label}
                      onClick={c.onClick}
                      className={`rounded-2xl p-4 ${c.onClick ? "text-right cursor-pointer active:scale-[0.97] transition-transform" : ""}`}
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, boxShadow: c.onClick ? "0 1px 3px rgba(58,34,42,0.15)" : "none" }}
                    >
                      <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                      <div className="text-xs mt-1 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                        {c.label}
                        {c.onClick && <ChevronDown size={11} style={{ transform: "rotate(90deg)" }} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "יש להם מקום לציוד", value: offeringCargoSpace.length, onClick: () => { setTab("rides"); setPendingScrollTargetId("ride-cargo"); } },
                    { label: "יכולת גרירה (וו/עגלה)", value: towingCapable.length, onClick: () => { setTab("rides"); setPendingScrollTargetId("ride-towing"); } },
                  ].map((c) => (
                    <div
                      key={c.label}
                      onClick={c.onClick}
                      className={`rounded-2xl p-4 ${c.onClick ? "text-right cursor-pointer active:scale-[0.97] transition-transform" : ""}`}
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, boxShadow: c.onClick ? "0 1px 3px rgba(58,34,42,0.15)" : "none" }}
                    >
                      <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accent2Dark }}>{c.value}</div>
                      <div className="text-xs mt-1 flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                        {c.label}
                        {c.onClick && <ChevronDown size={11} style={{ transform: "rotate(90deg)" }} />}
                      </div>
                    </div>
                  ))}
                </div>

                {(paymentTotals.remaining > 0 || unfilledShiftsCount > 0 || membersWithoutShift > 0 || overBudgetCategories.length > 0 || nearBudgetCategories.length > 0 || lookingForRide.length > 0 || pendingContentSuggestions.length > 0) && (
                  <div className="mt-4 rounded-2xl p-4 space-y-2" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                    <div className="text-xs font-bold mb-1" style={{ color: COLORS.accentDark }}>התרעות חשובות</div>
                    {paymentTotals.remaining > 0 && <div className="text-xs">💰 עוד ₪{paymentTotals.remaining.toLocaleString()} לגבייה מחברי הקמפ</div>}
                    {unfilledShiftsCount > 0 && <div className="text-xs">📋 עוד {unfilledShiftsCount} מקומות פנויים במשמרות</div>}
                    {membersWithoutShift > 0 && <div className="text-xs">🙋 {membersWithoutShift} חברים עדיין לא שיבצו אף משמרת</div>}
                    {lookingForRide.length > 0 && <div className="text-xs">🚗 {lookingForRide.length} חברים מחפשים טרמפ ועדיין לא שובצו</div>}
                    {pendingContentSuggestions.length > 0 && (
                      <div className="text-xs">
                        {pendingContentSuggestions.length} הצעות תוכן ממתינות לשיבוץ -{" "}
                        <button onClick={() => setTab("content")} className="underline font-bold">מעבר ללוח תוכן</button>
                      </div>
                    )}
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
                  onClick={downloadMembersCsv}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold mt-3"
                  style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted }}
                >
                  <Download size={13} /> ייצוא רשימת חברי קמפ (טלפון, ת.ז, שם, מייל, כרטיס)
                </button>

            <button
              onClick={() => { setShowMemberList(!showMemberList); if (!showMemberList) refreshRemovedMembersArchive(); }}
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
                        <div className="relative">
                          <button
                            onClick={() => {
                              const next = openMemberMenu === m.name ? null : m.name;
                              setOpenMemberMenu(next);
                              if (next === null) setTeamLeadPickerFor(null);
                            }}
                            className="p-1 rounded-lg"
                            style={{ color: COLORS.textMuted }}
                            title="פעולות"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMemberMenu === m.name && (
                            <div
                              className="absolute left-0 top-full mt-1 z-20 rounded-lg py-1 min-w-[180px] shadow-lg"
                              style={{ background: COLORS.input, border: `1px solid ${COLORS.divider}` }}
                            >
                              {isOwner && (
                                <button
                                  onClick={() => {
                                    setEditingMemberId(editingMemberId === m.name ? null : m.name);
                                    setEditIdValue("");
                                    setEditNameValue("");
                                    setOpenMemberMenu(null);
                                  }}
                                  className="w-full text-right px-3 py-2 text-xs flex items-center gap-1.5"
                                  style={{ color: COLORS.textMuted }}
                                >
                                  <Pencil size={12} /> עריכה
                                </button>
                              )}
                              {isOwner && m.role !== "owner" && (
                                <button
                                  onClick={() => { if (window.confirm(`לאפס את הגישה של ${m.name}? הם יצטרכו לעבור "כניסה ראשונה" מחדש עם תעודת הזהות שלהם.`)) { resetMemberAccess(m.name); setOpenMemberMenu(null); } }}
                                  className="w-full text-right px-3 py-2 text-xs flex items-center gap-1.5"
                                  style={{ color: COLORS.textMuted }}
                                >
                                  <LockKeyhole size={12} /> איפוס גישה
                                </button>
                              )}
                              {isOwner && m.role !== "owner" && (
                                <button
                                  onClick={() => setTeamLeadPickerFor(teamLeadPickerFor === m.name ? null : m.name)}
                                  className="w-full text-right px-3 py-2 text-xs flex items-center gap-1.5"
                                  style={{ color: COLORS.accent2Dark }}
                                >
                                  <Crown size={12} /> הפוך למנהל צוות
                                </button>
                              )}
                              {teamLeadPickerFor === m.name && (
                                <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      const team = e.target.value;
                                      if (!team) return;
                                      const current = teamLeads[team] || [];
                                      const slot = !current[0] ? 0 : (!current[1] ? 1 : 0);
                                      setTeamLead(team, m.name, slot);
                                      setTeamLeadPickerFor(null);
                                      setOpenMemberMenu(null);
                                    }}
                                    className="w-full px-2 py-1 rounded-lg text-xs outline-none"
                                    style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                                  >
                                    <option value="">בחר/י צוות...</option>
                                    {TEAMS.map((t) => (
                                      <option key={t.name} value={t.name}>{t.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {isOwner && m.role !== "owner" && (
                                <button
                                  onClick={() => { setMemberRole(m.name, m.role === "admin" ? "member" : "admin"); setOpenMemberMenu(null); }}
                                  className="w-full text-right px-3 py-2 text-xs flex items-center gap-1.5"
                                  style={{ color: COLORS.accentDark }}
                                >
                                  {m.role === "admin" ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                                  {m.role === "admin" ? "הסרת ניהול (מוביל מחנה)" : "הפוך למוביל מחנה"}
                                </button>
                              )}
                              <button
                                onClick={() => { setOpenMemberMenu(null); if (window.confirm(`להסיר את ${m.name} מהקמפ? הנתונים יישמרו 7 ימים ואז יימחקו לצמיתות.`)) removeMember(m.name); }}
                                className="w-full text-right px-3 py-2 text-xs flex items-center gap-1.5 border-t"
                                style={{ color: COLORS.danger, borderColor: COLORS.divider }}
                              >
                                <Trash2 size={12} /> הסרה מהמחנה
                              </button>
                            </div>
                          )}
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
                    <div className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>
                      הוסרו מהקמפ - הנתונים נשמרים 7 ימים מרגע ההסרה ואז נמחקים לצמיתות:
                    </div>
                    <div className="space-y-1.5">
                      {removedMembers.map((name) => {
                        const row = removedMembersArchive.find((r) => r.name === name);
                        const daysLeft = row
                          ? Math.max(0, 7 - Math.floor((Date.now() - new Date(row.removed_at).getTime()) / 86400000))
                          : null;
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs"
                            style={{ background: COLORS.input, color: COLORS.textMuted }}
                          >
                            <span>
                              {name}
                              {daysLeft !== null && (
                                <span> · {daysLeft > 0 ? `${daysLeft} ימים עד מחיקה סופית` : "נמחק/ת בקרוב"}</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {row && (
                                <button
                                  onClick={() => downloadRemovedMemberFile(row)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                  style={{ color: COLORS.accentDark }}
                                  title="הורדת קובץ גיבוי"
                                >
                                  <Download size={12} /> הורדת קובץ
                                </button>
                              )}
                              <button
                                onClick={() => restoreMember(name)}
                                className="px-2 py-1 rounded-lg"
                                style={{ color: COLORS.accentDark }}
                              >
                                שחזור
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            )}

            {adminSubTab === "member-shifts" && (
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>משמרות חברי קמפ</h3>
                <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                  כמות המשמרות שכל חבר/ה שיבץ/ה את עצמו/ה אליהן (לא כולל פירוקים - כולם משתתפים בו, ולא כולל הקמות - זה לא נחשב משמרת). מי שאין לו/ה משמרת בכלל מוצג/ת עם 0.
                </p>
                <div className="space-y-1.5">
                  {memberShiftCounts.map((m) => {
                    const open = expandedMemberShifts === m.name;
                    const theirShifts = SHIFTS.filter((s) => s.id !== TEARDOWN_ID && s.phase !== "הקמות" && (assignments[s.id] || []).includes(m.name));
                    return (
                      <div key={m.name} className="rounded-xl overflow-hidden" style={{ background: m.count === 0 ? COLORS.accent2Light : COLORS.surface }}>
                        <button
                          onClick={() => setExpandedMemberShifts(open ? null : m.name)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-right"
                        >
                          <span className="flex items-center gap-1.5">
                            <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", opacity: 0.6 }} />
                            {m.name}
                          </span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              fontFamily: FONT_NUM,
                              background: m.count === 0 ? COLORS.accent2 : COLORS.accentLight,
                              color: m.count === 0 ? COLORS.bg : COLORS.accentDark,
                            }}
                          >
                            {m.count}
                          </span>
                        </button>
                        {open && (
                          <div className="px-3 pb-2.5 pt-0.5 space-y-1">
                            {theirShifts.length === 0 ? (
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>אין משמרות משובצות.</p>
                            ) : (
                              theirShifts.map((s) => (
                                <div key={s.id} className="text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLORS.input }}>
                                  <span className="font-semibold">{s.title}</span>
                                  <span style={{ color: COLORS.textMuted }}> · {formatDate(s.date)}{!s.noTime ? ` · ${s.start}–${s.end}` : ""}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {adminSubTab === "allocations" && (
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
                  <div className="rounded-2xl p-3 mb-5" style={{ background: COLORS.accentLight, color: COLORS.accentDark, boxShadow: "0 3px 0 rgba(58,34,42,0.18)" }}>
                    <button
                      onClick={() => setShowMissingAllocation(!showMissingAllocation)}
                      className="w-full flex items-center justify-between text-xs font-bold"
                    >
                      <span>{membersWithoutAllocationInfo.length} חברים עדיין לא מילאו פרטי הקצאה</span>
                      <ChevronDown size={14} style={{ transform: showMissingAllocation ? "rotate(180deg)" : "none" }} />
                    </button>
                    {showMissingAllocation && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {membersWithoutAllocationInfo.map((m) => (
                          <span key={m.name} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.55)" }}>
                            {m.name}
                          </span>
                        ))}
                      </div>
                    )}
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

            {adminSubTab === "exports" && (
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>ייצוא רשימות</h3>
                <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                  ניתן להוריד כל רשימה בנפרד, או את כולן ביחד.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={exportAllListsZip}
                    disabled={!!exportingKey}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl text-xs font-bold"
                    style={{ background: COLORS.accent, color: COLORS.bg, opacity: exportingKey && exportingKey !== "all-zip" ? 0.5 : exportingKey === "all-zip" ? 0.7 : 1, boxShadow: "0 3px 0 rgba(58,34,42,0.18)" }}
                  >
                    <Download size={16} /> {exportingKey === "all-zip" ? "מייצא..." : "הכל · ZIP"}
                  </button>
                  <button
                    onClick={exportAllListsExcel}
                    disabled={!!exportingKey}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl text-xs font-bold"
                    style={{ background: COLORS.accent2, color: COLORS.bg, opacity: exportingKey && exportingKey !== "all-excel" ? 0.5 : exportingKey === "all-excel" ? 0.7 : 1, boxShadow: "0 3px 0 rgba(58,34,42,0.18)" }}
                  >
                    <Download size={16} /> {exportingKey === "all-excel" ? "מייצא..." : "הכל · Excel"}
                  </button>
                  <button
                    onClick={exportAllListsPdf}
                    disabled={!!exportingKey}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl text-xs font-bold"
                    style={{ background: COLORS.accentDark, color: COLORS.bg, opacity: exportingKey && exportingKey !== "all-pdf" ? 0.5 : exportingKey === "all-pdf" ? 0.7 : 1, boxShadow: "0 3px 0 rgba(58,34,42,0.18)" }}
                  >
                    <Download size={16} /> {exportingKey === "all-pdf" ? "מייצא..." : "הכל · PDF"}
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {EXPORT_LISTS.map((list) => (
                    <button
                      key={list.key}
                      onClick={() => downloadListCsv(list.key)}
                      disabled={!!exportingKey}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: exportingKey && exportingKey !== list.key ? 0.5 : 1 }}
                    >
                      <list.icon size={14} style={{ color: COLORS.accentDark }} /> {exportingKey === list.key ? "מייצא..." : list.label}
                    </button>
                  ))}
                  <button
                    onClick={exportEmergencyCardsPdf}
                    disabled={!!exportingKey}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: exportingKey && exportingKey !== "emergency-pdf" ? 0.5 : 1 }}
                  >
                    <HeartPulse size={14} style={{ color: COLORS.accentDark }} /> {exportingKey === "emergency-pdf" ? "מייצא..." : "כרטיסי חירום (PDF)"}
                  </button>
                  <button
                    onClick={exportShiftsPdf}
                    disabled={!!exportingKey}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: exportingKey && exportingKey !== "shifts-pdf" ? 0.5 : 1 }}
                  >
                    <CalendarDays size={14} style={{ color: COLORS.accentDark }} /> {exportingKey === "shifts-pdf" ? "מייצא..." : "לוח משמרות (PDF)"}
                  </button>
                </div>
              </div>
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

            {isOwner && (() => {
              const NOTIFICATION_ACTIONS = ["שליחת תזכורת התראה", "התראת דחיפה נשלחה"];
              const notificationHistory = activityLog
                .filter((a) => NOTIFICATION_ACTIONS.includes(a.action))
                .sort((a, b) => b.ts - a.ts);
              return (
                <>
                  <button
                    onClick={() => setShowNotificationHistory(!showNotificationHistory)}
                    className="w-full flex items-center justify-between mb-2 text-sm font-bold"
                    style={{ color: COLORS.textMuted }}
                  >
                    <span className="flex items-center gap-1.5"><History size={14} /> היסטוריית התראות (רק אצלך) ({notificationHistory.length})</span>
                    <ChevronDown size={15} style={{ transform: showNotificationHistory ? "rotate(180deg)" : "none" }} />
                  </button>
                  {showNotificationHistory && (
                    <div className="space-y-1 max-h-72 overflow-y-auto pr-1 mb-2">
                      {notificationHistory.length === 0 ? (
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין התראות רשומות.</p>
                      ) : (
                        notificationHistory.map((a, i) => (
                          <div key={i} className="text-xs rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                            {a.details}
                            <span style={{ color: COLORS.textMuted }}> · {new Date(a.ts).toLocaleString("he-IL")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              );
            })()}
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
                {showActivityLog && (() => {
                  // activityLog (the DB-backed table) only has real coverage
                  // going forward from when its permissions got fixed - it
                  // was silently 403ing for everyone before that, so most
                  // members' history is missing from it. login-history
                  // (a separate, older kv_store mechanism) was never
                  // affected by that bug and already has real login events
                  // for a much wider set of members, so it's merged in here
                  // as "כניסה לאפליקציה" entries to give an honestly fuller
                  // picture instead of just the DB table's narrow slice.
                  const mergedLog = [
                    ...activityLog,
                    ...loginHistory.map((l) => ({ actor: l.name, action: "כניסה לאפליקציה", details: "", ts: l.ts })),
                  ].sort((a, b) => b.ts - a.ts);
                  return (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1 mb-2">
                    {mergedLog.length === 0 ? (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין פעולות רשומות.</p>
                    ) : (
                      mergedLog.map((a, i) => (
                        <div key={i} className="text-xs rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                          <b style={{ color: COLORS.accentDark }}>{a.actor}</b> · {a.action}
                          {a.details ? ` · ${a.details}` : ""}
                          <span style={{ color: COLORS.textMuted }}> · {new Date(a.ts).toLocaleString("he-IL")}</span>
                        </div>
                      ))
                    )}
                  </div>
                  );
                })()}

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
                                <span style={{ color: seen ? COLORS.textMuted : everLoggedIn ? COLORS.accent2Dark : COLORS.danger }}>
                                  {seen
                                    ? new Date(seen).toLocaleString("he-IL")
                                    : everLoggedIn
                                    ? "נכנס/ה בעבר (תאריך אחרון לא נרשם)"
                                    : "מעולם לא נראה/תה פעיל/ה"}
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

                <button
                  onClick={() => setShowProfileCompletion(!showProfileCompletion)}
                  className="w-full flex items-center justify-between mt-4 mb-2 text-sm font-bold"
                  style={{ color: COLORS.textMuted }}
                >
                  <span className="flex items-center gap-1.5">
                    <Check size={14} /> מילוי פרטים אישיים - {membersProfileStatus.filter((m) => m.missing.length > 0).length} עם פרטים חסרים
                  </span>
                  <ChevronDown size={15} style={{ transform: showProfileCompletion ? "rotate(180deg)" : "none" }} />
                </button>
                {showProfileCompletion && (
                  <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                    {[...membersProfileStatus]
                      .sort((a, b) => b.missing.length - a.missing.length || a.name.localeCompare(b.name, "he"))
                      .map((m) => (
                        <div key={m.name} className="text-xs rounded-lg px-3 py-1.5 flex items-center justify-between gap-2" style={{ background: COLORS.surface }}>
                          <b>{m.name}</b>
                          <span style={{ color: m.missing.length === 0 ? COLORS.accent2Dark : COLORS.danger }}>
                            {m.missing.length === 0 ? "מילא/ה הכל ✓" : `חסר: ${m.missing.join(", ")}`}
                          </span>
                        </div>
                      ))}
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

        {tab === "dashboard-team" && (myLeadTeam || isOwner) && (() => {
          const viewedTeam = myLeadTeam || ownerTeamView;
          if (!viewedTeam) {
            return (
              <div>
                <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>לוח בקרה צוות - הצגה לכל צוות</h2>
                <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>בחר/י צוות כדי לראות את לוח הבקרה שלו, בדיוק כפי שמובילת הצוות רואה אותו.</p>
                <select
                  value={ownerTeamView}
                  onChange={(e) => setOwnerTeamView(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                >
                  <option value="">בחר/י צוות...</option>
                  {allTeams.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            );
          }
          return (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-bold" style={{ color: COLORS.accentDark }}>לוח בקרה - צוות {viewedTeam}</h2>
              {isOwner && !myLeadTeam && (
                <select
                  value={ownerTeamView}
                  onChange={(e) => setOwnerTeamView(e.target.value)}
                  className="px-2 py-1 rounded-lg text-xs outline-none"
                  style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                >
                  {allTeams.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            {(() => {
              const leads = teamLeadsOf(viewedTeam).map((l) => l.name);
              const label = leads.length === 0
                ? "אין מוביל/ה"
                : leads.length === 1
                ? leads[0]
                : leads.slice(0, -1).join(", ") + " ו-" + leads[leads.length - 1];
              return (
                <div className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                  מוביל/ה: <b style={{ color: COLORS.accentDark }}>{label}</b>
                </div>
              );
            })()}

            <div className="flex gap-2 mb-4">
              {[
                { id: "shifts", label: "משמרות" },
                { id: "budget", label: "תקציב" },
                { id: "tasks", label: "משימות" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setTeamDashboardView(v.id)}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    background: teamDashboardView === v.id ? COLORS.accent : COLORS.surface,
                    color: teamDashboardView === v.id ? COLORS.bg : COLORS.textMuted,
                    border: `1px solid ${teamDashboardView === v.id ? COLORS.accent : COLORS.divider}`,
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {teamDashboardView === "shifts" && (() => {
              const t = teamStats(viewedTeam);
              return (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: "משמרות הצוות", value: t.totalShifts },
                      { label: "מקומות פנויים", value: t.unfilled },
                    ].map((c) => (
                      <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                        <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                        <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {viewedTeam === CONTENT_TEAM_NAME && pendingContentSuggestions.length > 0 && (
                    <div className="mb-3 rounded-2xl p-3" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                      <div className="text-xs">
                        {pendingContentSuggestions.length} הצעות תוכן ממתינות לשיבוץ -{" "}
                        <button onClick={() => setTab("content")} className="underline font-bold">מעבר ללוח תוכן</button>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>לוח המשמרות של הצוות - מי אמור להיות בכל משמרת</h3>
                  <div className="space-y-1.5">
                    {SHIFTS.filter((s) => s.team === viewedTeam).map((s) => {
                      const { names, spots } = shiftNamesAndSpots(s);
                      return (
                        <div key={s.id} className="rounded-xl px-3 py-2 text-xs" style={{ background: COLORS.surface }}>
                          <div className="flex items-center justify-between">
                            <span>{s.title} · {formatDate(s.date)}{s.id === TEARDOWN_ID || s.noTime ? "" : ` · ${s.start}–${s.end}`}</span>
                            <span className="px-2 py-0.5 rounded-full shrink-0" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>{s.noLimit ? "ללא הגבלה" : `${names.length}/${spots}`}</span>
                          </div>
                          <div className="mt-1" style={{ color: names.length > 0 ? COLORS.textMuted : COLORS.danger }}>
                            {names.length > 0 ? names.join(", ") : "אף אחד עדיין לא שובץ"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <h3 className="text-xs font-bold mt-5 mb-2" style={{ color: COLORS.textMuted }}>חברי הצוות ({teamMembers(viewedTeam).length})</h3>
                  <div className="grid grid-cols-2 gap-1.5 mb-1">
                    {teamMembers(viewedTeam).length === 0 ? (
                      <p className="text-xs col-span-2" style={{ color: COLORS.textMuted }}>עדיין אף אחד לא שיבץ משמרת בצוות הזה.</p>
                    ) : (
                      teamMembers(viewedTeam).map((n) => (
                        <span key={n} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: COLORS.surface }} dir="ltr">
                          <span dir="rtl" className="truncate">{n}</span>{memberPhones[n] ? ` · ${memberPhones[n]}` : ""}
                          {isManualTeamMember(viewedTeam, n) && (
                            <button onClick={() => removeManualTeamMember(viewedTeam, n)} style={{ color: COLORS.textMuted }} className="shrink-0"><X size={10} /></button>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>הוספת חבר/ה לצוות ללא משמרת</div>
                    <AdminAssignPicker members={allMembers} onAssign={(name) => addManualTeamMember(viewedTeam, name)} />
                  </div>
                </div>
              );
            })()}

            {teamDashboardView === "budget" && (() => {
              const t = teamStats(viewedTeam);
              return (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { label: "תקציב הצוות", value: `₪${t.planned.toLocaleString()}` },
                      { label: "שולם בפועל", value: `₪${t.paid.toLocaleString()}` },
                    ].map((c) => (
                      <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                        <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                        <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {(overBudgetCategories.includes(budgetCategoryForTeam(viewedTeam)) || nearBudgetCategories.includes(budgetCategoryForTeam(viewedTeam))) && (
                    <div className="mb-3 rounded-2xl p-3" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                      {overBudgetCategories.includes(budgetCategoryForTeam(viewedTeam)) && <div className="text-xs">⚠️ תקציב הצוות חרג מהתכנון</div>}
                      {nearBudgetCategories.includes(budgetCategoryForTeam(viewedTeam)) && <div className="text-xs">🟡 תקציב הצוות מתקרב לתכנון (מעל 85%)</div>}
                    </div>
                  )}

                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>הוספת הוצאה לצוות</h3>
                  <BudgetExpenseForm onAdd={addBudgetExpense} onError={(msg) => showToast(msg, "error")} lockedAllocation={budgetCategoryForTeam(viewedTeam)} categories={allBudgetCategories} allMembers={allMembers} />
                </div>
              );
            })()}

            {teamDashboardView === "tasks" && (
              <TeamChecklist
                items={checklistItemsFor(viewedTeam)}
                state={checklistState[viewedTeam] || {}}
                canCheck
                canManage
                onToggle={(i) => toggleChecklistItem(viewedTeam, i)}
                onAdd={(text) => addChecklistItem(viewedTeam, text)}
                onEdit={(i, text) => editChecklistItem(viewedTeam, i, text)}
                onRemove={(i) => removeChecklistItem(viewedTeam, i)}
              />
            )}
          </div>
          );
        })()}

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
            {profileComplete && myShifts.length === 0 && (
              <button
                onClick={() => setTab("shifts")}
                className="w-full text-right rounded-2xl p-4 mb-4"
                style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}
              >
                <div className="text-sm font-bold mb-1" style={{ color: COLORS.accentDark }}>⏰ עדיין לא נרשמת לאף משמרת</div>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  לחצו כאן כדי לעבור לשיבוץ עצמי ולבחור משמרת.
                </p>
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: "המשמרות שלי", value: myShiftsCount, onClick: () => setTab("my-shifts") },
                { label: "מקומות פנויים במשמרות", value: openShiftsCount, onClick: () => setTab("shifts") },
                { label: "ימים לפתיחת השערים", value: daysUntil() },
              ].map((c) => (
                <div
                  key={c.label}
                  onClick={c.onClick}
                  className={`rounded-2xl p-2.5 sm:p-5 ${c.onClick ? "cursor-pointer active:scale-[0.97] transition-transform" : ""}`}
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.divider}`,
                    boxShadow: c.onClick ? "0 3px 0 rgba(58,34,42,0.18)" : "none",
                  }}
                >
                  <div className="text-xl sm:text-3xl font-black mt-1" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                  <div className="text-[10px] sm:text-xs mt-1 font-bold flex items-center gap-1" style={{ color: COLORS.text }}>
                    {c.label}
                    {c.onClick && <ChevronDown size={10} style={{ transform: "rotate(90deg)" }} />}
                  </div>
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
                      <>
                        <div className="text-sm">
                          שילמת <b style={{ color: COLORS.moneyAccent }}>₪{myPaid.toLocaleString()}</b> מתוך ₪{myFee.toLocaleString()}
                          {myRemaining > 0 && <span> · נותר <b style={{ color: COLORS.danger }}>₪{myRemaining.toLocaleString()}</b></span>}
                        </div>
                        {myList.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {myList.map((p) => (
                              <div key={p.id} className="text-xs rounded-lg px-2.5 py-1.5" style={{ background: COLORS.input, color: COLORS.textMuted }}>
                                <div>
                                  ₪{Number(p.amount).toLocaleString()} · {p.date || "ללא תאריך"}
                                  {p.method && ` · ${duesMethodLabel(p.method)}`}
                                </div>
                                {p.recordedBy && (
                                  <div className="mt-0.5" style={{ opacity: 0.8 }}>
                                    {"נרשם ע\"י "}{p.recordedBy}
                                    {p.recordedAt ? ` · ${new Date(p.recordedAt).toLocaleString("he-IL")}` : ""}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl p-3 mt-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
              <span className="text-xs font-bold" style={{ color: COLORS.text }}>הגדלת טקסט באפליקציה</span>
              <button
                onClick={() => setLargeText((v) => !v)}
                className="rounded-full"
                style={{ width: 44, height: 26, background: largeText ? COLORS.accent : COLORS.divider, position: "relative", transition: "background 0.15s ease" }}
              >
                <span
                  className="rounded-full"
                  style={{
                    position: "absolute", top: 3, insetInlineStart: largeText ? 21 : 3,
                    width: 20, height: 20, background: "#fff", transition: "inset-inline-start 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                />
              </button>
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

            <div className="pt-3 mt-3 border-t" style={{ borderColor: COLORS.divider }}>
              <img
                src={funBanner}
                alt="Because Afterglowers just wanna have fun"
                className="w-full rounded-2xl"
                style={{ height: 90, objectFit: "cover" }}
              />
            </div>
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
            <div className="mb-4">
              <div
                className="grid gap-2 justify-items-center mb-2"
                style={{ gridTemplateColumns: `repeat(${Math.ceil((TEAM_FILTERS.length + 1) / 2)}, minmax(0, 1fr))` }}
              >
                {["הכל", ...TEAM_FILTERS].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(t)}
                    className="w-full px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: teamFilter === t ? COLORS.accent : COLORS.surface,
                      color: teamFilter === t ? COLORS.bg : COLORS.text,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
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
            </div>

            {shiftsView === "calendar" ? (
              <div className="flex gap-2.5 overflow-x-auto pb-3 mb-2">
                {(() => {
                  const uniqueDates = [...new Set(visibleShifts.map((s) => s.date))];
                  // Setup ("הקמות") days only ever hold one open-ended
                  // signup shift each, so a whole card per day wastes a lot
                  // of horizontal space - pair consecutive setup-only days
                  // into a single card instead. Event/teardown days keep
                  // one card each since they're packed with several shifts.
                  const isSetupOnlyDate = (d) => visibleShifts.filter((s) => s.date === d).every((s) => s.phase === "הקמות");
                  const dateGroups = [];
                  uniqueDates.forEach((d) => {
                    const prevGroup = dateGroups[dateGroups.length - 1];
                    if (isSetupOnlyDate(d) && prevGroup && prevGroup.length === 1 && isSetupOnlyDate(prevGroup[0])) {
                      prevGroup.push(d);
                    } else {
                      dateGroups.push([d]);
                    }
                  });
                  return dateGroups.map((group) => (
                    <div
                      key={group.join("_")}
                      className="shrink-0 w-52 rounded-2xl overflow-hidden"
                      style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, boxShadow: "0 3px 10px rgba(58,34,42,0.10)" }}
                    >
                      {group.map((date, groupIndex) => {
                        const [dy, dm, dd] = date.split("-").map(Number);
                        const dow = WEEKDAYS_HE[new Date(dy, dm - 1, dd).getDay()];
                        return (
                        <div
                          key={date}
                          style={groupIndex > 0 ? { borderTop: `1px solid ${COLORS.divider}`, marginTop: 10 } : undefined}
                        >
                          <div className="px-3 py-2 flex items-center justify-between" style={{ background: COLORS.accent }}>
                            <span className="text-xs font-semibold" style={{ color: COLORS.accentLight }}>יום {dow}</span>
                            <span className="text-base font-black" style={{ fontFamily: FONT_NUM, color: COLORS.bg }}>{dd}.{dm}</span>
                          </div>
                          <div className="p-2 space-y-1.5">
                            {visibleShifts.filter((s) => s.date === date).sort((a, b) => a.start.localeCompare(b.start)).map((s) => {
                              const isTeardown = s.id === TEARDOWN_ID;
                              const { names, spots } = shiftNamesAndSpots(s);
                              const joined = isJoined(s.id);
                              // isAtCapacity is a pure fact about the shift (no room left) -
                              // shown regardless of whether the viewer is one of the people
                              // filling it. `full` (which excludes shifts the viewer already
                              // joined) is only for whether the join button should be disabled.
                              const isAtCapacity = !s.noLimit && names.length >= spots;
                              const full = isAtCapacity && !joined;
                              return (
                                <div key={s.id} className="rounded-xl p-2" style={{ background: isAtCapacity ? COLORS.fullBg : COLORS.input, borderRight: `3px solid ${joined ? COLORS.accent2 : isAtCapacity ? COLORS.textMuted : COLORS.accent}` }}>
                                  {!isTeardown && !s.noTime && (
                                    <div className="text-[10px] flex items-center gap-1" style={{ color: isAtCapacity ? COLORS.textMuted : COLORS.accentDark, fontFamily: FONT_NUM }}>
                                      <Clock size={9} /> {s.start}–{s.end}
                                    </div>
                                  )}
                                  <div className="text-xs font-bold mt-0.5">{s.title}</div>
                                  {isTeardown ? (
                                    <TeardownTaskPicker selected={teardownTasks[identity] || []} onToggle={toggleTeardownTask} compact />
                                  ) : (
                                    <div className="flex items-center justify-between mt-1.5">
                                      <div className="flex items-center gap-1">
                                        {s.noLimit ? (
                                          <div className="shrink-0 flex items-center justify-center rounded-full text-[9px] font-bold" style={{ width: 17, height: 17, background: COLORS.accentLight, color: COLORS.accentDark }}>∞</div>
                                        ) : (
                                          <FillRing filled={names.length} total={spots} size={17} />
                                        )}
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: COLORS.accentLight, color: COLORS.accentDark, fontFamily: FONT_NUM }}>{s.noLimit ? "ללא הגבלה" : `${names.length}/${spots}`}</span>
                                      </div>
                                      <button
                                        onClick={() => (joined ? leave(s) : join(s))}
                                        disabled={full}
                                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
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
                                  {!isTeardown && names.length > 0 && (
                                    <div className="mt-1.5 pt-1.5 border-t flex flex-wrap gap-1" style={{ borderColor: COLORS.divider }}>
                                      {names.map((n) => (
                                        <span key={n} className="text-[9px] pl-1 pr-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: COLORS.surface2 }}>
                                          {n}
                                          {isAdmin && <button onClick={() => leave(s, n)} style={{ color: COLORS.textMuted }}><X size={8} /></button>}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {isAdmin && !isTeardown && (
                                    <div className="mt-1.5">
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
                  ));
                })()}
              </div>
            ) : (
            <div className="space-y-2 mb-8">
              {visibleShifts.map((s) => {
                const isTeardown = s.id === TEARDOWN_ID;
                const { names, spots } = shiftNamesAndSpots(s);
                const joined = isJoined(s.id);
                const isAtCapacity = !s.noLimit && names.length >= spots;
                const full = isAtCapacity && !joined;
                return (
                  <div key={s.id} className="rounded-2xl p-4" style={{ background: isAtCapacity ? COLORS.fullBg : COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="flex items-center gap-4">
                    {s.noLimit ? (
                      <div className="shrink-0 flex items-center justify-center rounded-full text-base font-bold" style={{ width: 34, height: 34, background: COLORS.accentLight, color: COLORS.accentDark }}>∞</div>
                    ) : (
                      <FillRing filled={names.length} total={spots} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{s.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: isAtCapacity ? COLORS.surface2 : COLORS.accentLight, color: isAtCapacity ? COLORS.textMuted : COLORS.accentDark }}>{s.team}</span>
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

                  {!isTeardown && names.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.divider }}>
                      <div className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>מי במשמרת</div>
                      <div className="flex flex-wrap gap-1.5">
                        {names.map((n) => (
                          <span key={n} className="text-xs pl-1 pr-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: COLORS.input }}>
                            {n}
                            {isAdmin && <button onClick={() => leave(s, n)} style={{ color: COLORS.textMuted }}><X size={11} /></button>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {isAdmin && !isTeardown && (
                    <div className={names.length > 0 ? "mt-2" : "mt-3 pt-3 border-t"} style={names.length > 0 ? {} : { borderColor: COLORS.divider }}>
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

        {tab === "my-shifts" && (
          <div>
            {myShifts.length === 0 && myCalendarEvents.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: COLORS.textMuted }}>
                עדיין לא שיבצת אף משמרת, ואין אירועים ביומן. עבור/י לטאב "שיבוץ עצמי" כדי להצטרף למשמרת.
              </p>
            ) : (
              <div className="space-y-2">
                {myShifts.map((s) => (
                  <div key={s.id} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: COLORS.surface, borderRight: `3px solid ${COLORS.accent}` }}>
                    <div className="min-w-0">
                      <div className="text-xs font-bold" style={{ color: COLORS.accentDark }}>
                        {formatDate(s.date)}{s.id !== TEARDOWN_ID && !s.noTime ? ` · ${s.start}–${s.end}` : ""}
                      </div>
                      <div className="text-sm font-semibold mt-1">{s.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{s.team}</div>
                    </div>
                    <button
                      onClick={() => downloadMyCalendarIcs([s], [])}
                      className="shrink-0 text-[11px] px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: COLORS.input, color: COLORS.textMuted }}
                    >
                      הוספה ליומן בטלפון
                    </button>
                  </div>
                ))}
                {myCalendarEvents.map((a) => (
                  <div key={`event-${a.id}`} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: COLORS.accentLight, borderRight: `3px solid ${COLORS.accent2}` }}>
                    <div className="min-w-0">
                      <div className="text-xs font-bold" style={{ color: COLORS.accent2Dark }}>
                        {a.eventDate ? formatDateShort(a.eventDate) : ""}{a.eventTime ? ` · ${a.eventTime}` : ""}
                      </div>
                      <div className="text-sm font-semibold mt-1">{a.text}</div>
                      <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>אירוע · {a.author}</div>
                    </div>
                    <button
                      onClick={() => downloadMyCalendarIcs([], [a])}
                      className="shrink-0 text-[11px] px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: "rgba(255,255,255,0.6)", color: COLORS.accent2Dark }}
                    >
                      הוספה ליומן בטלפון
                    </button>
                  </div>
                ))}
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
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => sendItemReminder(p.id, "תזכורת: סקר ממתין לך", p.question)}
                              disabled={sendingItemReminderId === p.id}
                              title="שליחת תזכורת דחיפה על הסקר הזה"
                              style={{ color: COLORS.textMuted, opacity: sendingItemReminderId === p.id ? 0.5 : 1 }}
                            >
                              <Bell size={13} />
                            </button>
                            <button onClick={() => removePoll(p.id)} style={{ color: COLORS.textMuted }}><Trash2 size={13} /></button>
                          </div>
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
                      {isAdmin && (() => {
                        const nonVoterNames = allMembers.map((m) => m.name).filter((n) => p.responses?.[n] === undefined);
                        const voterCount = allMembers.length - nonVoterNames.length;
                        const open = expandedPollVoters === p.id;
                        return (
                          <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.divider }}>
                            <button
                              onClick={() => setExpandedPollVoters(open ? null : p.id)}
                              className="text-xs font-semibold flex items-center gap-1"
                              style={{ color: COLORS.accentDark }}
                            >
                              <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                              הצביעו: {voterCount} · לא הצביעו: {nonVoterNames.length}
                            </button>
                            {open && (
                              <div className="mt-1.5 space-y-1.5">
                                {nonVoterNames.length > 0 ? (
                                  <>
                                    <div className="flex flex-wrap gap-1">
                                      {nonVoterNames.map((n) => (
                                        <span key={n} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: COLORS.accent2Light, color: COLORS.accent2Dark }}>{n}</span>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => remindNonVoters(p, nonVoterNames)}
                                      disabled={remindingNonVotersPollId === p.id}
                                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                                      style={{ background: COLORS.accent2, color: COLORS.bg, opacity: remindingNonVotersPollId === p.id ? 0.6 : 1, boxShadow: "0 3px 0 rgba(58,34,42,0.18)" }}
                                    >
                                      {remindingNonVotersPollId === p.id ? "שולח..." : `שליחת תזכורת ל-${nonVoterNames.length} שלא הצביעו`}
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-[11px]" style={{ color: COLORS.textMuted }}>כולם הצביעו 🎉</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                          {isAdmin && (
                            <button
                              onClick={() => sendItemReminder(a.id, "תזכורת: מודעה בלוח", a.text)}
                              disabled={sendingItemReminderId === a.id}
                              title="שליחת תזכורת דחיפה על המודעה הזו"
                              style={{ color: COLORS.textMuted, opacity: sendingItemReminderId === a.id ? 0.5 : 1 }}
                            >
                              <Bell size={13} />
                            </button>
                          )}
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

        {tab === "gallery" && (
          <div>
            <h3 className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
              <Camera size={15} /> גלריית המחנה
            </h3>
            <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
              כל תמונה שמעלים כאן נשארת לכולם - זו הדרך שלנו לזכור ביחד את יום הגיבוש.
            </p>

            <div className="flex gap-2 mb-6">
              <label
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer"
                style={{ background: COLORS.accent, color: COLORS.bg, opacity: eventPhotosUploading ? 0.6 : 1 }}
              >
                <ImagePlus size={16} />
                {eventPhotosUploading ? "מעלה..." : "העלאת תמונות"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={eventPhotosUploading}
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (files.length > 0) uploadEventPhotos(files);
                  }}
                />
              </label>
              {eventPhotos && eventPhotos.length > 0 && (
                <button
                  onClick={downloadAllEventPhotos}
                  disabled={eventPhotosZipping}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: eventPhotosZipping ? 0.6 : 1 }}
                >
                  <Download size={16} />
                  {eventPhotosZipping ? "מוריד..." : "הורדת הכל"}
                </button>
              )}
            </div>

            {eventPhotos === null ? (
              <p className="text-xs text-center py-10" style={{ color: COLORS.textMuted }}>טוען תמונות...</p>
            ) : eventPhotos.length === 0 ? (
              <p className="text-xs text-center py-10" style={{ color: COLORS.textMuted }}>עדיין אין תמונות - תהיה/י הראשון/ה להעלות אחת.</p>
            ) : (
              <div className="space-y-4">
                {groupedEventPhotos.map((g) => (
                  <div key={g.uploader}>
                    <h4 className="text-xs font-bold mb-1.5" style={{ color: COLORS.accentDark }}>הועלה ע"י {g.uploader}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {g.photos.map((p) => (
                        <div key={p.id} className="relative rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.divider}`, aspectRatio: "1 / 1" }}>
                          <button onClick={() => setEventPhotoPreview(p)} className="w-full h-full block" title="תצוגה מקדימה">
                            <img src={p.url} alt={`תמונה מ-${p.uploader}`} className="w-full h-full object-cover" loading="lazy" />
                          </button>
                          {p.tags && p.tags.length > 0 && (
                            <span
                              className="absolute bottom-1 right-1 rounded-full p-1 flex items-center gap-0.5 text-[9px] font-bold px-1.5"
                              style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
                            >
                              <Tag size={10} /> {p.tags.length}
                            </span>
                          )}
                          {(p.uploader === identity || isAdmin) && (
                            <button
                              onClick={() => removeEventPhoto(p)}
                              className="absolute top-1 left-1 rounded-full p-1"
                              style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {eventPhotoPreview && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(0,0,0,0.85)" }}
                onClick={() => { setEventPhotoPreview(null); setPendingTagPos(null); }}
              >
                <button
                  onClick={() => { setEventPhotoPreview(null); setPendingTagPos(null); }}
                  className="absolute top-4 left-4 rounded-full p-2"
                  style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                >
                  <X size={18} />
                </button>
                <div className="max-w-full max-h-full flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[11px] text-white opacity-80">הקש/י על התמונה כדי לתייג מישהו</p>
                  <div className="relative">
                    <img
                      src={eventPhotoPreview.url}
                      alt={`תמונה מ-${eventPhotoPreview.uploader}`}
                      className="max-w-full max-h-[65vh] rounded-xl object-contain block"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPendingTagPos({
                          x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                          y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
                        });
                      }}
                    />
                    {(eventPhotoPreview.tags || []).map((t) => (
                      <button
                        key={t.name}
                        onClick={(e) => { e.stopPropagation(); removePhotoTag(eventPhotoPreview, t.name); }}
                        className="absolute flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap"
                        style={{ left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.65)", color: "white", border: "1.5px solid white" }}
                        title="הסרת תיוג"
                      >
                        <span className="rounded-full" style={{ width: 6, height: 6, background: "white" }} />
                        {t.name}
                      </button>
                    ))}
                  </div>

                  {pendingTagPos && (
                    <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-white text-center mb-1">מי זה?</p>
                      <TagPicker
                        members={allMembers.filter((m) => !(eventPhotoPreview.tags || []).some((t) => t.name === m.name))}
                        onTag={(name) => { addPhotoTag(eventPhotoPreview, name, pendingTagPos.x, pendingTagPos.y); setPendingTagPos(null); }}
                      />
                    </div>
                  )}

                  <span className="text-xs font-semibold text-white mt-1">
                    הועלה ע"י {eventPhotoPreview.uploader} · {new Date(eventPhotoPreview.ts).toLocaleString("he-IL")}
                  </span>
                  <button
                    onClick={() => downloadEventPhoto(eventPhotoPreview)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
                    style={{ background: COLORS.accent, color: COLORS.bg }}
                  >
                    <Download size={15} /> הורדה
                  </button>

                  <div className="w-full max-w-sm mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 10 }}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
                      <MessageCircle size={13} /> תגובות{previewComments ? ` (${previewComments.length})` : ""}
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-2">
                      {previewComments === null ? (
                        <p className="text-xs text-white opacity-60">טוען תגובות...</p>
                      ) : previewComments.length === 0 ? (
                        <p className="text-xs text-white opacity-60">אין עדיין תגובות - תהיה/י הראשון/ה.</p>
                      ) : (
                        previewComments.map((c) => (
                          <div key={c.id} className="flex items-start justify-between gap-2 text-xs rounded-xl px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="min-w-0">
                              <b style={{ color: COLORS.accentLight }}>{c.author}</b>
                              <span className="text-white"> {c.text}</span>
                            </div>
                            {(c.author === identity || isAdmin) && (
                              <button onClick={() => removePhotoComment(c.id)} className="shrink-0 text-white opacity-60"><X size={11} /></button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitPhotoComment(); }}
                        placeholder="הוספת תגובה..."
                        className="flex-1 min-w-0 px-3 py-1.5 rounded-full text-xs outline-none"
                        style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }}
                      />
                      <button
                        onClick={submitPhotoComment}
                        className="text-xs px-3 py-1.5 rounded-full font-bold shrink-0"
                        style={{ background: COLORS.accent, color: COLORS.bg }}
                      >
                        שלח
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "content" && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-bold" style={{ color: COLORS.accentDark }}>לוח תוכן</h2>
              {canEditContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={addContentRow}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: COLORS.accent, color: COLORS.bg }}
                  >
                    <Plus size={12} /> הוספת שורה
                  </button>
                  <button
                    onClick={addContentColumn}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
                    style={{ background: COLORS.accent2, color: COLORS.bg }}
                  >
                    <Plus size={12} /> הוספת יום
                  </button>
                </div>
              )}
            </div>
            {!canEditContent && (
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                לוח זה מנוהל על ידי צוות תוכן גיפט - רק חברי הצוות ומובילי הצוות יכולים לערוך אותו.
              </p>
            )}
            <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.divider}` }}>
              <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: COLORS.surface }}>
                    <th className="p-2 text-right" style={{ borderBottom: `1px solid ${COLORS.divider}`, minWidth: 112, width: 112 }}>שעה</th>
                    {contentSchedule.columns.map((col, ci) => (
                      <th key={ci} className="p-2 text-right align-top" style={{ borderBottom: `1px solid ${COLORS.divider}`, minWidth: 160 }}>
                        <div className="flex items-start justify-between gap-1">
                          {canEditContent ? (
                            <textarea
                              defaultValue={col}
                              onBlur={(e) => { if (e.target.value !== col) updateContentColumnHeader(ci, e.target.value); }}
                              className="w-full px-1.5 py-1 rounded-lg text-xs font-bold outline-none resize-none"
                              rows={2}
                              style={{ background: COLORS.input, color: COLORS.accentDark, border: `1px solid ${COLORS.divider}` }}
                            />
                          ) : (
                            <span className="font-bold" style={{ color: COLORS.accentDark }}>{col}</span>
                          )}
                          {canEditContent && contentSchedule.columns.length > 1 && (
                            <button onClick={() => { if (window.confirm(`להסיר את העמודה "${col}"?`)) removeContentColumn(ci); }} style={{ color: COLORS.textMuted }}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    {canEditContent && <th style={{ borderBottom: `1px solid ${COLORS.divider}` }} />}
                  </tr>
                </thead>
                <tbody>
                  {contentSchedule.rows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${COLORS.divider}` }}>
                      <td className="p-2 align-top font-bold" style={{ color: COLORS.text, minWidth: 112, width: 112 }}>
                        {canEditContent ? (
                          <input
                            defaultValue={row.label}
                            onBlur={(e) => { if (e.target.value !== row.label) updateContentRowLabel(row.id, e.target.value); }}
                            className="w-full px-1.5 py-1 rounded-lg text-xs font-bold outline-none"
                            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, minWidth: 96 }}
                          />
                        ) : (
                          row.label
                        )}
                      </td>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className="p-1.5 align-top">
                          <button
                            onClick={() => setOpenContentCell({ rowId: row.id, colIndex: ci })}
                            className="w-full text-right px-2 py-2 rounded-lg text-xs active:scale-[0.97] transition-transform"
                            style={{
                              background: cell ? COLORS.accentLight : COLORS.input,
                              color: cell ? COLORS.accentDark : COLORS.textMuted,
                              border: `1px dashed ${cell ? "transparent" : COLORS.divider}`,
                              fontWeight: cell ? 700 : 500,
                              boxShadow: "0 1px 3px rgba(58,34,42,0.18), 0 1px 1px rgba(58,34,42,0.1)",
                            }}
                          >
                            {cell ? cell.title : canEditContent ? "+ הוספת תוכן" : "—"}
                          </button>
                        </td>
                      ))}
                      {canEditContent && (
                        <td className="p-2 align-top">
                          <button onClick={() => { if (window.confirm("להסיר את השורה הזו?")) removeContentRow(row.id); }} style={{ color: COLORS.danger }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 pt-4 border-t" style={{ borderColor: COLORS.divider }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.accentDark }}>הצעות תוכן</h3>
              <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                יש לך רעיון לתוכן בגיפט? שלח/י הצעה - צוות תוכן גיפט יבחן ויעדכן.
              </p>
              <ContentSuggestionForm onAdd={submitContentSuggestion} />
            </div>

            {visiblePendingSuggestions.length > 0 && (
              <div className="mt-5 pt-4 border-t" style={{ borderColor: COLORS.divider }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.accentDark }}>
                  {canManageContentSuggestions ? `הצעות ממתינות (${visiblePendingSuggestions.length})` : "ההצעות שלי - ממתינות לבדיקה"}
                </h3>
                <div className="space-y-2">
                  {visiblePendingSuggestions.map((s) => (
                    <div key={s.id} className="rounded-xl p-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="text-sm font-bold" style={{ color: COLORS.text }}>{s.title}</div>
                      {s.description && (
                        <div className="text-xs mt-1" style={{ color: COLORS.textMuted, whiteSpace: "pre-line" }}>{s.description}</div>
                      )}
                      <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{"הוצע ע\"י "}{s.suggestedBy}</div>
                      {canManageContentSuggestions && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <button
                            onClick={() => setAssigningSuggestionId(assigningSuggestionId === s.id ? null : s.id)}
                            className="text-xs px-3 py-1.5 rounded-full font-semibold"
                            style={{ background: COLORS.accent, color: COLORS.bg }}
                          >
                            שיבוץ בטבלה
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`לדחות את ההצעה "${s.title}"?`)) rejectContentSuggestion(s.id); }}
                            className="text-xs px-3 py-1.5 rounded-full"
                            style={{ color: COLORS.danger }}
                          >
                            דחייה
                          </button>
                        </div>
                      )}
                      {canManageContentSuggestions && assigningSuggestionId === s.id && (
                        <ContentSuggestionAssignPicker
                          schedule={contentSchedule}
                          onAssign={(rowId, colIndex) => { assignSuggestionToCell(s, rowId, colIndex); setAssigningSuggestionId(null); }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openContentCell && (() => {
              const row = contentSchedule.rows.find((r) => r.id === openContentCell.rowId);
              if (!row) return null;
              const cell = row.cells[openContentCell.colIndex];
              const colLabel = contentSchedule.columns[openContentCell.colIndex];
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-6"
                  style={{ background: "rgba(20,15,10,0.6)" }}
                  onClick={() => setOpenContentCell(null)}
                >
                  <div
                    className="w-full max-w-sm rounded-3xl overflow-hidden"
                    style={{ background: COLORS.bg, border: `1px solid ${COLORS.divider}` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold" style={{ color: COLORS.textMuted }}>{row.label} · {colLabel}</div>
                        <button onClick={() => setOpenContentCell(null)} style={{ color: COLORS.textMuted }}>
                          <X size={18} />
                        </button>
                      </div>
                      <ContentCellEditor
                        key={`${openContentCell.rowId}-${openContentCell.colIndex}`}
                        cell={cell}
                        canEdit={canEditContent}
                        onSave={(item) => { updateContentCell(openContentCell.rowId, openContentCell.colIndex, item); setOpenContentCell(null); }}
                        onClear={() => { updateContentCell(openContentCell.rowId, openContentCell.colIndex, null); setOpenContentCell(null); }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tab === "budget" && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: "תקציב מתוכנן", value: budgetTotals.planned, icon: Wallet },
                { label: "הכנסות", value: budgetTotals.duesCollected, icon: Ticket },
                { label: "התחייבויות", value: budgetTotals.committed, icon: Clock },
                { label: "שולם בפועל", value: budgetTotals.paid, icon: Check },
                { label: "יתרה זמינה", value: budgetTotals.remaining, icon: CreditCard },
              ].map((c) => {
                // Green = positive, red = negative, brown (the app's normal
                // neutral surface) = exactly zero - same sign-based scheme
                // requested for the dues list earlier. "שולם בפועל" is money
                // going out, so it's always red regardless of sign, not
                // judged by the same +/- rule as the others.
                const isPaidTile = c.label === "שולם בפועל";
                const tint = isPaidTile ? DUES_BELOW_BG : c.value > 0 ? DUES_ABOVE_BG : c.value < 0 ? DUES_BELOW_BG : COLORS.surface;
                const danger = isPaidTile || c.value < 0;
                const Icon = c.icon;
                return (
                  <div key={c.label} className="rounded-2xl p-4" style={{ background: tint, border: `1px solid ${COLORS.divider}`, boxShadow: "0 1px 4px rgba(58,34,42,0.06)" }}>
                    <Icon size={16} style={{ color: danger ? COLORS.danger : COLORS.accentDark, opacity: 0.75, marginBottom: 6 }} />
                    <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: danger ? COLORS.danger : COLORS.text }}>
                      ₪{c.value.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                  </div>
                );
              })}
            </div>

            {canManageFinances && (() => {
              // Item rows (campInfra.items/loungeItems) are the only place
              // budget params get per-row granularity - the scalar cost
              // drivers (water/sanitation/food/ice/electricity/general) are
              // each already a single number per category, nothing to expand.
              // There's no per-item *actual* spend to show here: real
              // expenses are only ever recorded against a category
              // (budgetExpenses.allocation), never against one specific
              // planned item row, so the "actual" side of a sub-row would be
              // fabricated - left as "—" instead of a fake number.
              const vat = budgetParams.global.vatIncluded ? 1 : 1.18;
              const itemRowsForCategory = (cat) => {
                const rows = [...budgetParams.campInfra.items, ...budgetParams.campInfra.loungeItems];
                return rows
                  .filter((r) => (r.category || "ציוד") === cat && (Number(r.qty) || 0) * (Number(r.price) || 0) > 0)
                  .map((r) => ({ name: r.name || "(ללא שם)", planned: (Number(r.qty) || 0) * (Number(r.price) || 0) * vat }));
              };
              const rowsForCat = allBudgetCategories
                .map((cat) => ({ cat, planned: plannedForCategory(cat), paid: categorySpend[cat] || 0, subRows: itemRowsForCategory(cat) }))
                .filter((r) => r.planned !== 0 || r.paid !== 0);
              const totalPaid = rowsForCat.reduce((s, r) => s + r.paid, 0);
              const gapBudgetVsDues = budgetTotals.planned - engine.duesCollected;
              const gapActualVsIncome = totalPaid - engine.totalIncome;
              return (
                <div className="mb-6">
                  <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.textMuted }}>תקציב מול ביצוע</h3>
                  {rowsForCat.length === 0 ? (
                    <div className="text-xs rounded-2xl px-4 py-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted }}>
                      עדיין אין תקציב מתוכנן או הוצאות בפועל להשוואה - מלאו את הפרמטרים למטה כדי לראות טבלה כאן.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${COLORS.divider}` }}>
                      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: COLORS.surface }}>
                            <th className="text-right px-3 py-2 font-bold">קטגוריה</th>
                            <th className="text-right px-3 py-2 font-bold">תקציב מתוכנן</th>
                            <th className="text-right px-3 py-2 font-bold">{'סה"כ שולם'}</th>
                            <th className="text-right px-3 py-2 font-bold">הפרש</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rowsForCat.flatMap(({ cat, planned, paid, subRows }) => {
                            const gap = planned - paid;
                            const open = openBvaCategory === cat;
                            const trs = [
                              <tr
                                key={cat}
                                onClick={() => subRows.length > 0 && setOpenBvaCategory(open ? null : cat)}
                                style={{ borderTop: `1px solid ${COLORS.divider}`, cursor: subRows.length > 0 ? "pointer" : "default" }}
                              >
                                <td className="px-3 py-2 font-semibold">
                                  {subRows.length > 0 && (
                                    <ChevronDown size={12} style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", marginInlineEnd: 4 }} />
                                  )}
                                  {cat}
                                </td>
                                <td className="px-3 py-2" style={{ fontFamily: FONT_NUM }}>₪{Math.round(planned).toLocaleString()}</td>
                                <td className="px-3 py-2" style={{ fontFamily: FONT_NUM }}>₪{Math.round(paid).toLocaleString()}</td>
                                <td className="px-3 py-2" style={{ fontFamily: FONT_NUM, color: gap < 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{Math.round(gap).toLocaleString()}</td>
                              </tr>,
                            ];
                            if (open) {
                              subRows.forEach((r, i) => {
                                trs.push(
                                  <tr key={`${cat}-${i}`} style={{ background: COLORS.input }}>
                                    <td className="px-3 py-1.5" style={{ color: COLORS.textMuted, paddingRight: 22 }}>· {r.name}</td>
                                    <td className="px-3 py-1.5" style={{ fontFamily: FONT_NUM, color: COLORS.textMuted }}>₪{Math.round(r.planned).toLocaleString()}</td>
                                    <td className="px-3 py-1.5" style={{ color: COLORS.textMuted }}>—</td>
                                    <td className="px-3 py-1.5" />
                                  </tr>
                                );
                              });
                            }
                            return trs;
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: `2px solid ${COLORS.divider}`, fontWeight: 700 }}>
                            <td className="px-3 py-2">{'סה"כ'}</td>
                            <td className="px-3 py-2" style={{ fontFamily: FONT_NUM }}>₪{Math.round(budgetTotals.planned).toLocaleString()}</td>
                            <td className="px-3 py-2" style={{ fontFamily: FONT_NUM }}>₪{Math.round(totalPaid).toLocaleString()}</td>
                            <td className="px-3 py-2" style={{ fontFamily: FONT_NUM, color: (budgetTotals.planned - totalPaid) < 0 ? COLORS.danger : COLORS.accent2Dark }}>
                              ₪{Math.round(budgetTotals.planned - totalPaid).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                  <div className="rounded-2xl p-4 mt-2 text-xs space-y-1.5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <div>דמי קמפ שנגבו: <b style={{ fontFamily: FONT_NUM }}>₪{Math.round(engine.duesCollected).toLocaleString()}</b></div>
                    <div>{'תקציב מתוכנן (סה"כ)'}: <b style={{ fontFamily: FONT_NUM }}>₪{Math.round(budgetTotals.planned).toLocaleString()}</b></div>
                    <div>{'הוצאות בפועל (סה"כ)'}: <b style={{ fontFamily: FONT_NUM }}>₪{Math.round(totalPaid).toLocaleString()}</b></div>
                    <div>
                      פער בין דמי הקמפ שנגבו לתקציב המתוכנן:{" "}
                      <b style={{ fontFamily: FONT_NUM, color: gapBudgetVsDues > 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{Math.round(gapBudgetVsDues).toLocaleString()}</b>
                    </div>
                    <div>
                      פער בין ההוצאות בפועל לסה{'"'}כ הכנסות הקמפ:{" "}
                      <b style={{ fontFamily: FONT_NUM, color: gapActualVsIncome > 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{Math.round(gapActualVsIncome).toLocaleString()}</b>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                      lockedAllocation={isAdmin ? null : budgetCategoryForTeam(myLeadTeam)}
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
                const planned = plannedForCategory(cat);
                const legacyPaid = items.reduce((s, b) => s + (Number(b.paid) || 0), 0);
                const expensesPaid = catExpenses.reduce((s, e) => s + expenseAmounts(e).paid, 0);
                const paid = legacyPaid + expensesPaid;
                const committed = catExpenses.reduce((s, e) => s + expenseAmounts(e).committed, 0);
                const remainingFromBudget = planned - paid;
                const owedToMembers = catExpenses.filter((e) => e.refundToMember && !e.refundPaid).reduce((s, e) => s + (Number(e.amount) || 0), 0);
                const pct = planned > 0 ? Math.min(paid / planned, 1) * 100 : 0;
                const canManageThis = isAdmin || budgetCategoryForTeam(myLeadTeam) === cat;
                return (
                  <div key={cat} className="rounded-2xl px-4 py-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold">{cat}</span>
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <span>סה"כ שולם: <b style={{ color: COLORS.moneyAccent }}>₪{paid.toLocaleString()}</b></span>
                        <span>סה"כ התחייבות: <b style={{ color: committed > 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{committed.toLocaleString()}</b></span>
                        {owedToMembers > 0 && (
                          <span>תשלום לחברי קמפ: <b style={{ color: COLORS.danger }}>₪{owedToMembers.toLocaleString()}</b></span>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.divider }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS.accent }} />
                    </div>
                    <div className="text-xs mt-1 text-left" style={{ color: COLORS.textMuted }}>
                      תקציב מתוכנן: ₪{planned.toLocaleString()} · נותר מתקציב: <b style={{ color: remainingFromBudget < 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{remainingFromBudget.toLocaleString()}</b>
                    </div>

                    {catExpenses.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {catExpenses.map((e) => {
                          if (editingExpenseId === e.id) {
                            return (
                              <BudgetExpenseForm
                                key={e.id}
                                initial={e}
                                categories={allBudgetCategories}
                                lockedAllocation={isAdmin ? null : budgetCategoryForTeam(myLeadTeam)}
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
                            {(isAdmin || budgetCategoryForTeam(myLeadTeam) === cat) && (
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
          // "Pending" = still missing quantity or price - a manually-added
          // item sits here until the kitchen team fills both in, at which
          // point it automatically counts as part of the real (confirmed)
          // shopping list. No separate status flag to track - it's just
          // derived from whether qty/price are filled in. Catalog items are
          // never pending: the picker below computes price × qty up front,
          // so they land straight in the confirmed list.
          const isPending = (it) => !(Number(it.qty) > 0 && Number(it.price) > 0);
          const pendingItems = shoppingList.filter(isPending);
          const confirmedItems = shoppingList.filter((it) => !isPending(it));
          const totalPrice = confirmedItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
          const sortedConfirmed = [...confirmedItems].sort((a, b) => (a.bought === b.bought ? 0 : a.bought ? 1 : -1));
          const pickableCatalog = SHOPPING_CATALOG.filter((c) => !shoppingList.some((it) => it.name === c.name));
          return (
            <div>
              {/* Aggregate-only, on purpose: the kitchen needs to know how many
                  portions to plan for, not who specifically - dietary info itself
                  stays visible only where it already was (emergency info, gated
                  to the member themselves/admins). Comes from a count-only RPC
                  since emergency_info's own RLS wouldn't give a non-admin kitchen
                  member the full picture. Always shown (even at 0), so a real
                  "nobody marked this" is visible rather than the box just
                  disappearing. */}
              {dietaryCounts && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "צמחונים בקמפ", value: dietaryCounts.vegetarian },
                    { label: "טבעונים בקמפ", value: dietaryCounts.vegan },
                  ].map((c) => (
                    <div key={c.label} className="rounded-2xl p-4 text-center" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}` }}>
                      <div className="text-3xl font-black" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                      <div className="text-xs font-bold mt-1" style={{ color: COLORS.accentDark }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {canManageShopping && pickableCatalog.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>קטלוג מוצרים - בחירה עם מחיר משוער</h3>
                  <p className="text-[11px] mb-2" style={{ color: COLORS.textMuted }}>
                    בוחרים מוצר וכמות - המחיר הכולל (כולל מע"מ) מחושב אוטומטית לפי מחיר משוער ליחידה. לוחצים "הוספה" כדי שהמוצר ייכנס ישר לרשימת הקניות המאושרת.
                  </p>
                  <CatalogItemPicker catalog={pickableCatalog} onAdd={addShoppingItem} />
                </div>
              )}

              {canManageShopping && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold mb-2" style={{ color: COLORS.textMuted }}>הוספת מוצר שלא ברשימה</h3>
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
                onClick={() => setFinancesView("departments")}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: financesView === "departments" ? COLORS.accent : COLORS.surface, color: financesView === "departments" ? COLORS.bg : COLORS.textMuted }}
              >
                מחלקות
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "חברי קמפ", value: allMembers.length, prefix: "" },
                { label: "סה\"כ לגבייה", value: paymentTotals.due, prefix: "₪" },
                { label: "סה\"כ נגבה", value: paymentTotals.paid, prefix: "₪" },
                { label: "יתרה לגבייה", value: paymentTotals.remaining, prefix: "₪" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-xl font-black" style={{ fontFamily: FONT_NUM, color: c.label === "יתרה לגבייה" && c.value > 0 ? COLORS.danger : COLORS.text }}>
                    {c.prefix}{c.value.toLocaleString()}
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
                const aboveThreshold = paid > DUES_PAID_THRESHOLD;
                const open = expandedMember === m.name;
                return (
                  <div key={m.name} className="rounded-xl overflow-hidden" style={{ background: aboveThreshold ? DUES_ABOVE_BG : DUES_BELOW_BG }}>
                    <button
                      onClick={() => setExpandedMember(open ? null : m.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm"
                      style={{ color: COLORS.text }}
                    >
                      <span>{m.name}{feeOverrides[m.name] !== undefined && <span className="text-xs" style={{ color: COLORS.text }}> (מותאם אישית)</span>}</span>
                      <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.text }}>
                        <span>שולם ₪{paid.toLocaleString()}</span>
                        <span>יתרה ₪{remaining.toLocaleString()}</span>
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
                            {list.map((p) => {
                              const menuKey = `${m.name}:${p.id}`;
                              const isEditing = editingPaymentId === menuKey;
                              return (
                                <div key={p.id} className="rounded-lg px-2.5 py-1.5 text-xs" style={{ background: COLORS.input }}>
                                  <div className="flex items-center justify-between">
                                    <span>
                                      <div>
                                        ₪{Number(p.amount).toLocaleString()} · {p.date || "ללא תאריך"}
                                        {p.method && ` · ${duesMethodLabel(p.method)}`}
                                      </div>
                                      {p.recordedBy && (
                                        <div className="mt-0.5" style={{ color: COLORS.textMuted }}>
                                          {"נרשם ע\"י "}{p.recordedBy}
                                          {p.recordedAt ? ` · ${new Date(p.recordedAt).toLocaleString("he-IL")}` : ""}
                                        </div>
                                      )}
                                    </span>
                                    <div className="relative">
                                      <button
                                        onClick={() => setOpenPaymentMenu(openPaymentMenu === menuKey ? null : menuKey)}
                                        className="p-1 rounded-lg"
                                        style={{ color: COLORS.textMuted }}
                                        title="פעולות"
                                      >
                                        <MoreVertical size={14} />
                                      </button>
                                      {openPaymentMenu === menuKey && (
                                        <div
                                          className="absolute left-0 top-full mt-1 z-20 rounded-lg py-1 min-w-[110px] shadow-lg"
                                          style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}
                                        >
                                          <button
                                            onClick={() => {
                                              setEditingPaymentId(menuKey);
                                              setEditPaymentAmount(String(p.amount));
                                              setEditPaymentDate(p.date || "");
                                              setEditPaymentMethod(p.method || "paybox");
                                              setOpenPaymentMenu(null);
                                            }}
                                            className="w-full text-right px-3 py-1.5 flex items-center gap-1.5"
                                            style={{ color: COLORS.textMuted }}
                                          >
                                            <Pencil size={12} /> עריכה
                                          </button>
                                          <button
                                            onClick={() => { setOpenPaymentMenu(null); removePayment(m.name, p.id); }}
                                            className="w-full text-right px-3 py-1.5 flex items-center gap-1.5"
                                            style={{ color: COLORS.danger }}
                                          >
                                            <Trash2 size={12} /> מחיקה
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {isEditing && (
                                    <div className="mt-2 pt-2 border-t flex items-center gap-1.5 flex-wrap" style={{ borderColor: COLORS.divider }}>
                                      <input
                                        type="number"
                                        value={editPaymentAmount}
                                        onChange={(e) => setEditPaymentAmount(e.target.value)}
                                        className="w-20 px-2 py-1 rounded-lg outline-none"
                                        style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                                      />
                                      <input
                                        type="date"
                                        value={editPaymentDate}
                                        onChange={(e) => setEditPaymentDate(e.target.value)}
                                        className="px-2 py-1 rounded-lg outline-none"
                                        style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                                      />
                                      <div className="flex items-center gap-1">
                                        {DUES_PAYMENT_METHODS.map((opt) => (
                                          <button
                                            key={opt.value}
                                            onClick={() => setEditPaymentMethod(opt.value)}
                                            className="px-2 py-1 rounded-full"
                                            style={{
                                              background: editPaymentMethod === opt.value ? COLORS.accent : COLORS.surface,
                                              color: editPaymentMethod === opt.value ? COLORS.bg : COLORS.textMuted,
                                              border: `1px solid ${editPaymentMethod === opt.value ? COLORS.accent : COLORS.divider}`,
                                            }}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                      <button
                                        onClick={() => {
                                          editPayment(m.name, p.id, editPaymentAmount, editPaymentDate, editPaymentMethod);
                                          setEditingPaymentId(null);
                                        }}
                                        className="px-3 py-1 rounded-full font-semibold"
                                        style={{ background: COLORS.accent, color: COLORS.bg }}
                                      >
                                        שמירה
                                      </button>
                                      <button
                                        onClick={() => setEditingPaymentId(null)}
                                        style={{ color: COLORS.textMuted }}
                                      >
                                        ביטול
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <AddPaymentForm onAdd={(amount, date, method) => addPayment(m.name, amount, date, method)} />
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

            {canEditBudget && (
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                השינויים למטה הם טיוטה - מחלקה רואה מספר חדש רק אחרי שמפרסמים אותו בטאב "מחלקות".
              </p>
            )}

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
                        <ItemRowsEditor
                          rows={budgetParams.campInfra.items}
                          onChange={(rows) => patchBudgetParams("campInfra", { items: rows })}
                          categories={allBudgetCategories}
                          vatIncluded={budgetParams.global.vatIncluded}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.textMuted }}>ציוד סלון (הצללה, ריהוט, תאורה...)</div>
                        <ItemRowsEditor
                          rows={budgetParams.campInfra.loungeItems}
                          onChange={(rows) => patchBudgetParams("campInfra", { loungeItems: rows })}
                          categories={allBudgetCategories}
                          vatIncluded={budgetParams.global.vatIncluded}
                        />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-2">
                        <NumField label={'קרח - מחיר לק"ג (לפני מע"מ)'} value={budgetParams.campInfra.icePricePerKg} onChange={(v) => patchBudgetParams("campInfra", { icePricePerKg: v })} />
                        <NumField label={'קרח - ק"ג ליום'} value={budgetParams.campInfra.iceKgPerDay} onChange={(v) => patchBudgetParams("campInfra", { iceKgPerDay: v })} />
                        <NumField label="קרח - מספר ימים" value={budgetParams.campInfra.iceDays} onChange={(v) => patchBudgetParams("campInfra", { iceDays: v })} />
                      </div>
                      <div className="text-xs -mt-2" style={{ color: COLORS.textMuted }}>סה"כ קרח: ₪{Math.round(engine.iceCost).toLocaleString()}</div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <NumField label={'חשמל - מחיר לקילוואט (לפני מע"מ)'} value={budgetParams.campInfra.elecPricePerKw} onChange={(v) => patchBudgetParams("campInfra", { elecPricePerKw: v })} />
                        <NumField label="חשמל - הספק מבוקש (קילוואט)" value={budgetParams.campInfra.elecKw} onChange={(v) => patchBudgetParams("campInfra", { elecKw: v })} />
                      </div>
                      <div className="text-xs -mt-2" style={{ color: COLORS.textMuted }}>סה"כ חשמל: ₪{Math.round(engine.elecCost).toLocaleString()}</div>
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
                      <NumField label="תדירות פינוי ליום (למחנה כולו)" value={s.pumpFreqPerPersonPerDay} onChange={(v) => patchBudgetParams("sanitation", { pumpFreqPerPersonPerDay: v })} />
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
                      <div className="sm:col-span-2">
                        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>הערה - מה כלול בעלות הזו (למשל: השכרת מכולה)</label>
                        <textarea
                          value={budgetParams.general.notes || ""}
                          onChange={(e) => patchBudgetParams("general", { notes: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
                        />
                      </div>
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
                      {canEditBudget && <BudgetExpenseForm onAdd={addBudgetExpense} onError={(msg) => showToast(msg, "error")} lockedAllocation={isAdmin ? null : budgetCategoryForTeam(myLeadTeam)} categories={allBudgetCategories} allMembers={allMembers} />}
                      <div className="space-y-1.5">
                        {budgetExpenses.map((e) => {
                          const canManageThis = isAdmin || budgetCategoryForTeam(myLeadTeam) === e.allocation;
                          if (editingExpenseId === e.id) {
                            return (
                              <BudgetExpenseForm
                                key={e.id}
                                initial={e}
                                categories={allBudgetCategories}
                                lockedAllocation={isAdmin ? null : budgetCategoryForTeam(myLeadTeam)}
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

            {financesView === "departments" && (() => {
              const rows = allBudgetCategories.map((cat) => ({
                cat,
                computed: engine.categoryPlanned[cat] || 0,
                published: Number(categoryBudgets[cat]) || 0,
              }));
              const changedCount = rows.filter((r) => r.computed > 0 && Math.round(r.computed) !== Math.round(r.published)).length;
              return (
              <div>
                <h3 className="text-base font-bold mb-2" style={{ color: COLORS.accentDark }}>מנוע תקציב מפורט (צוות תקציב)</h3>
                <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                  מחלקה עם חישוב מפרמטרים מתעדכנת רק כשמפרסמים אליה עדכון - לא באופן חי - כדי לא להראות מספר שעדיין באמצע עריכה. אפשר לשייך הכל ביחד למעלה, או כל מחלקה בנפרד בשורה שלה. מחלקה בלי חישוב אפשר לעדכן ישירות בשורה.
                </p>
                <PublishAllBar count={changedCount} onPublishAll={publishAllCategoryBudgets} />
                <div className="space-y-1.5 mb-4">
                  {rows.map((r) => (
                    <DepartmentBudgetRow
                      key={r.cat}
                      cat={r.cat}
                      hasComputed={r.computed > 0}
                      computed={r.computed}
                      published={r.published}
                      onSet={setCategoryBudget}
                    />
                  ))}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: COLORS.textMuted }}>פתיחת קטגוריית הוצאה חדשה</h3>
                <p className="text-sm mb-2" style={{ color: COLORS.textMuted }}>
                  אם יש הוצאה שלא שייכת לשום צוות קיים - אפשר לפתוח קטגוריה חדשה שתופיע גם בטאב "הוצאות". רק צוות תקציב/מנהלים יכולים לפתוח קטגוריה חדשה.
                </p>
                <NewCategoryForm onAdd={addBudgetCategory} />
                <EditableCategoryList categories={extraBudgetCategories} onRename={renameBudgetCategory} onRemove={removeBudgetCategory} />
              </div>
              );
            })()}

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
                    const allMatchedNames = new Set(Object.values(rideMatches).flat());
                    const unmatchedSeekers = lookingForRide.filter((s) => !allMatchedNames.has(s.name));
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
              <RideCategoryCard id="ride-offering" icon={Car} title="מציעים טרמפ" count={offeringRides.length} headerColor={COLORS.accent2} emptyText="אף אחד עדיין לא הציע טרמפ">
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

              <RideCategoryCard id="ride-looking" icon={Users} title="מחפשים טרמפ" count={lookingForRide.length} headerColor={COLORS.accent} emptyText="אף אחד עדיין לא מחפש טרמפ">
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

              <RideCategoryCard id="ride-cargo" icon={UserPlus} title="מקום לציוד/קניות" count={offeringCargoSpace.length} headerColor={COLORS.accent2} emptyText="אף אחד עדיין לא סימן מקום פנוי לציוד">
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

              <RideCategoryCard id="ride-towing" icon={Car} title="יכולת גרירה - וו/עגלה" count={towingCapable.length} headerColor={COLORS.accent} emptyText="אף אחד עדיין לא סימן יכולת גרירה">
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
