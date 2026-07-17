import { useState, useEffect, useMemo, useRef } from "react";
import { Users, CalendarDays, Clock, Flame, Tent, ChevronDown, Check, X, LogOut, Wallet, Plus, Trash2, CreditCard, Phone, Car, UserPlus, Megaphone, HeartPulse, History, Bell, BellOff, Package, MapPin, Ticket, MessageCircle, Pencil, ShieldCheck, ShieldOff } from "lucide-react";
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
  adminSetMemberRole,
  listMembersWithIdOnFile,
  adminRenameMember,
  listMembersWithPushEnabled,
  sendEventReminderPush,
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

const DEFAULT_TEAM_LEADS = {
  "הקמות": "גלעד אהרוני",
  "צוות תקציב": "רותם פלש",
  "רכש ולוגיסטיקה": "אורנה חזוט צורים",
  "פירוקים": "תמיר צמח",
  "מים": "מתיאס זיפיליבן",
  "שירותים ומקלחות": "בתאל בר גיורא",
  "צוות חשל\"ש": "יעל נאש",
  "עיצוב המחנה ותפאורה": "רוני דאיה",
  "צוות תוכן גיפט": "מירי אביהו",
  "אחראי קרח": "איתי כהן",
};

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
    shifts.push({ id: `setup-${d}`, phase: "הקמות", title: "יום הקמה", team: "הקמות", date: d, start: "08:00", end: "18:00", spots: 8, desc: "בנייה פיזית של תשתיות ומבני המחנה" })
  );

  const eventDays = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"];
  const lastDay = "2026-11-07";
  eventDays.forEach((d) => {
    shifts.push({ id: `kitchen-am-${d}`, phase: "ימי האירוע", title: "משמרת בישול - בוקר", team: "צוות המטבח", date: d, start: "06:30", end: "09:00", spots: 3, desc: "הכנה והגשה של ארוחת בוקר" });
    if (d !== lastDay) {
      shifts.push({ id: `kitchen-noon-${d}`, phase: "ימי האירוע", title: "משמרת בישול - צהריים", team: "צוות המטבח", date: d, start: "11:30", end: "14:00", spots: 3, desc: "הכנה והגשה של ארוחת צהריים" });
      shifts.push({ id: `kitchen-eve-${d}`, phase: "ימי האירוע", title: "משמרת בישול - ערב", team: "צוות המטבח", date: d, start: "17:30", end: "20:00", spots: 3, desc: "הכנה והגשה של ארוחת ערב" });
    }
    if (d === lastDay) return;
    shifts.push({ id: `ice-${d}`, phase: "ימי האירוע", title: "הבאת קרח", team: "אחראי קרח", date: d, start: "10:00", end: "11:00", spots: 1, desc: "רכישת קרח יומי מנקודת המכירה הרשמית" });
    shifts.push({ id: `clean-${d}`, phase: "ימי האירוע", title: "ניקיון שירותים ומקלחות", team: "שירותים ומקלחות", date: d, start: "09:00", end: "10:00", spots: 2, desc: "ניקיון ותחזוקה יומית" });
    shifts.push({ id: `moop-${d}`, phase: "ימי האירוע", title: "חשל\"ש ופינוי פסולת", team: "צוות חשל\"ש", date: d, start: "16:00", end: "17:00", spots: 2, desc: "מיחזור, פינוי פחים ובדיקת MOOP" });
  });

  shifts.push({ id: "teardown-2026-11-07", phase: "פירוקים", title: "יום פירוק", team: "פירוקים", date: "2026-11-07", start: "08:00", end: "22:00", spots: MEMBERS.length, desc: "פירוק תשתיות, בדיקת MOOP סופית וניקיון השטח - כולם משתתפים" });

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

// ---------------------------------------------------------------------------
// "היומן שלי" phone-calendar sync - exports shifts + calendar events as a
// standard .ics file. No server involved: every phone/desktop calendar app
// (Google Calendar, Apple Calendar, Outlook) can import this directly.
// ---------------------------------------------------------------------------
function icsEscape(text) {
  return String(text || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
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
    if (!newPassword || newPassword.length < 4) return setError("בחר/י סיסמה של לפחות 4 תווים");
    if (newPassword !== confirmPassword) return setError("הסיסמאות לא תואמות");
    setLoading(true);
    setError("");
    try {
      await onSetup(selected.name, idVal, newPassword);
    } catch (err) {
      if (err.message === "id_mismatch") setError("תעודת הזהות לא תואמת לשם שנבחר");
      else if (err.message === "id_required") setError('אין תעודת זהות מאומתת רשומה עבורך במערכת - יש לפנות למנהל/ת הקמפ כדי שיוסיפו אותה לפני הכניסה הראשונה');
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
              placeholder="לפחות 4 תווים"
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

function BudgetForm({ onAdd, onCancel, lockedCategory, categories }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(lockedCategory || categories[0]);
  const [committed, setCommitted] = useState("");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded-2xl p-4 mb-6 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="שם הסעיף (למשל: שכירת גנרטור)"
          className="px-3 py-2 rounded-xl text-sm outline-none sm:col-span-2"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          disabled={!!lockedCategory}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: lockedCategory ? 0.7 : 1 }}
        >
          {(lockedCategory ? [lockedCategory] : categories).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות (אופציונלי)"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          type="number" value={committed} onChange={(e) => setCommitted(e.target.value)}
          placeholder="סכום שהתחייבנו (₪)"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          type="number" value={paid} onChange={(e) => setPaid(e.target.value)}
          placeholder="סכום ששולם בפועל (₪)"
          className="px-3 py-2 rounded-xl text-sm outline-none sm:col-span-2"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAdd({ name, category, committed, paid, notes })}
          className="px-4 py-2 rounded-full text-sm font-semibold"
          style={{ background: COLORS.accent, color: COLORS.bg }}
        >
          הוספה
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-full text-sm" style={{ color: COLORS.textMuted }}>
          ביטול
        </button>
      </div>
    </div>
  );
}

function EquipmentForm({ onAdd, lockedCategory }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(lockedCategory || EQUIPMENT_CATEGORIES[0]);
  const [qty, setQty] = useState("");
  const [condition, setCondition] = useState(EQUIPMENT_CONDITIONS[0]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!name.trim() || !qty) return;
    onAdd({ name: name.trim(), category, qty, condition, location, notes });
    setName(""); setQty(""); setLocation(""); setNotes(""); setCondition(EQUIPMENT_CONDITIONS[0]);
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
      <button
        onClick={submit}
        className="px-4 py-2 rounded-full text-sm font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg }}
      >
        הוספת ציוד
      </button>
    </div>
  );
}

function BudgetExpenseForm({ onAdd, lockedAllocation }) {
  const [allocation, setAllocation] = useState(lockedAllocation || "");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid"); // "paid" | "partial"
  const [paidAmount, setPaidAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [isRefund, setIsRefund] = useState(false);
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
    let receiptUrl = "";
    if (receiptFile) {
      setUploading(true);
      try {
        receiptUrl = await uploadFile(receiptFile, allocation || "כללי");
      } catch {
        setUploading(false);
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
      vatIncluded, isRefund, receiptUrl,
    });
    setDescription(""); setVendor(""); setAmount(""); setPurchaseDate("");
    setPaymentStatus("paid"); setPaidAmount(""); setDueDate(""); setIsRefund(false);
    setReceiptFile(null); setReceiptPreview("");
  }

  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={allocation} onChange={(e) => setAllocation(e.target.value)}
          placeholder="שיוך תקציבי (מחנה/סלון/מים/...)"
          disabled={!!lockedAllocation}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, opacity: lockedAllocation ? 0.7 : 1 }}
        />
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
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>צילום קבלה (אופציונלי)</label>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" onChange={pickReceipt} className="text-xs" style={{ color: COLORS.textMuted }} />
          {receiptPreview && (
            <img src={receiptPreview} alt="" className="h-12 w-12 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.divider}` }} />
          )}
        </div>
      </div>
      <button
        onClick={submit}
        disabled={uploading}
        className="px-4 py-2 rounded-full text-sm font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg, opacity: uploading ? 0.6 : 1 }}
      >
        {uploading ? "מעלה קבלה..." : "רישום הוצאה"}
      </button>
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

function TeamLeadPicker({ team, current, members, onSet }) {
  const [val, setVal] = useState(current || "");
  return (
    <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
      <select
        value={val}
        onChange={(e) => { setVal(e.target.value); onSet(team, e.target.value); }}
        className="text-xs px-2 py-1 rounded-lg outline-none"
        style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
      >
        <option value="">ללא מוביל/ה</option>
        {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
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

function EmergencyCardForm({ data, onChange }) {
  const d = data || {};
  const [local, setLocal] = useState({
    contactName: d.contactName || "",
    contactPhone: d.contactPhone || "",
    allergies: d.allergies || "",
    medical: d.medical || "",
    dietary: d.dietary || "",
  });
  const [saved, setSaved] = useState(false);
  const set = (patch) => { setLocal({ ...local, ...patch }); setSaved(false); };

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
      <div className="grid sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>איש קשר לחירום - שם</label>
          <input
            value={local.contactName}
            onChange={(e) => set({ contactName: e.target.value })}
            placeholder="שם מלא"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>איש קשר לחירום - טלפון</label>
          <input
            value={local.contactPhone}
            onChange={(e) => set({ contactPhone: e.target.value })}
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
        <input
          value={local.allergies}
          onChange={(e) => set({ allergies: e.target.value })}
          placeholder="למשל: בוטנים, פניצילין..."
          autoComplete="off"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>מגבלות רפואיות / תרופות קבועות</label>
        <input
          value={local.medical}
          onChange={(e) => set({ medical: e.target.value })}
          placeholder="אופציונלי - רק אם רלוונטי לחירום"
          autoComplete="off"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>העדפות תזונה</label>
        <input
          value={local.dietary}
          onChange={(e) => set({ dietary: e.target.value })}
          placeholder="טבעוני/צמחוני/ללא גלוטן..."
          autoComplete="off"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => { onChange(local); setSaved(true); }}
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
  const totalIncome = duesCollected + vatRefund + externalNet;
  const gapToRaise = totalCampCost - totalIncome;

  // 11 - תזרים מזומנים
  const channelsTotal = p.cashflow.channels.reduce((s, c) => s + num(c.amount), 0);
  const pendingPayments = num(p.cashflow.pendingPayments);
  const knownCommitments = num(p.cashflow.knownCommitments);
  const cashflowGap = totalCampCost - channelsTotal;
  const projectedBalance = cashflowGap + vatRefund - knownCommitments;

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
  const [allocationInfo, setAllocationInfo] = useState({});
  const [feeOverrides, setFeeOverrides] = useState({});
  const [memberEmails, setMemberEmails] = useState({});
  const [whatsappConsent, setWhatsappConsentState] = useState({});
  const [personalCalendarAdds, setPersonalCalendarAddsState] = useState({});
  const [checklistState, setChecklistState] = useState({});
  const [manualTeamMembers, setManualTeamMembers] = useState({});
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
  const [extraBudgetCategories, setExtraBudgetCategories] = useState([]);
  const [showBudgetSection, setShowBudgetSection] = useState(null);
  const [financesView, setFinancesView] = useState("dues");
  const [activityLog, setActivityLog] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [extraMembers, setExtraMembers] = useState([]);
  const [removedMembers, setRemovedMembers] = useState([]);
  const [idOverrides, setIdOverrides] = useState({});
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
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard-personal");
  const [teamFilter, setTeamFilter] = useState("הכל");
  const [shiftsView, setShiftsView] = useState("calendar");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [contactingRideMember, setContactingRideMember] = useState(null);
  const [toast, setToast] = useState(null);
  const [pushStatus, setPushStatus] = useState("unsupported");
  const [pushSubscribed, setPushSubscribed] = useState(false);
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
        rawAnn, rawPolls, rawBudgetParams, rawBudgetExpenses, rawEquipment, rawExtraCategories,
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
        setTeamLeadsState(JSON.parse(rawLeads));
      } else {
        setTeamLeadsState(DEFAULT_TEAM_LEADS);
        window.storage.set("team-leads", JSON.stringify(DEFAULT_TEAM_LEADS), true).catch(() => {});
      }

      setMemberPhones(rawPhones ? JSON.parse(rawPhones) : {});
      setRideInfo(rawRides ? JSON.parse(rawRides) : {});
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
    }
    loadSharedDataRef.current = loadSharedData;

    (async () => {
      // kv_store now requires a logged-in session (see the security
      // migration) - loadSharedData() only returns real data once
      // there's an active Supabase Auth session. If someone already has
      // one (returning visit), pick it back up here; otherwise this
      // just loads harmless empty defaults and the login screen shows.
      const restoredName = await getSignedInMemberName().catch(() => null);
      await loadSharedData();
      if (restoredName) {
        await applyIdentity(restoredName, false);
      }
      setLoading(false);
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

  function addBudgetItem(item) {
    if (!item.name || !item.category) return showToast("צריך שם וקטגוריה", "error");
    const next = [...budgetItems, { ...item, id: Date.now().toString(), owner: identity }];
    persistBudget(next);
    setShowBudgetForm(false);
    showToast("הסעיף נוסף לתקציב", "ok");
    logActivity("הוספת הוצאה", `${item.name} (${item.category})`);
  }

  function removeBudgetItem(id) {
    const item = budgetItems.find((b) => b.id === id);
    persistBudget(budgetItems.filter((b) => b.id !== id));
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
    const next = [{ ...exp, id: Date.now().toString(), enteredBy: identity }, ...budgetExpenses];
    setBudgetExpenses(next);
    try {
      await window.storage.set("budget-expenses", JSON.stringify(next), true);
      showToast("ההוצאה נרשמה", "ok");
      logActivity("רישום הוצאה בפועל", `${exp.vendor || exp.subcategory || ""} ₪${exp.amount}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeBudgetExpense(id) {
    const next = budgetExpenses.filter((e) => e.id !== id);
    setBudgetExpenses(next);
    try {
      await window.storage.set("budget-expenses", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addEquipment(item) {
    const next = [...campEquipment, { ...item, id: Date.now().toString() }];
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
    const next = campEquipment.filter((e) => e.id !== id);
    setCampEquipment(next);
    try {
      await window.storage.set("camp-equipment", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function updateEquipmentField(id, patch) {
    const next = campEquipment.map((e) => (e.id === id ? { ...e, ...patch } : e));
    setCampEquipment(next);
    try {
      await window.storage.set("camp-equipment", JSON.stringify(next), true);
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
      showToast("התראות פעילות! תקבל/י הודעה על מודעות וסקרים חדשים", "ok");
    } catch (err) {
      if (err.message === "permission-denied") {
        showToast("ההרשאה נדחתה - אפשר לשנות בהגדרות הדפדפן", "error");
        setPushStatus("denied");
      } else {
        showToast("לא ניתן להפעיל התראות במכשיר/דפדפן הזה", "error");
      }
    }
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

  async function logActivity(action, details) {
    const entry = { ts: Date.now(), actor: identity || "לא ידוע", action, details: details || "" };
    const next = [entry, ...activityLog].slice(0, 200);
    setActivityLog(next);
    try {
      await window.storage.set("activity-log", JSON.stringify(next), true);
    } catch {}
  }

  function overlaps(a, b) {
    return a.start < b.end && b.start < a.end;
  }

  function isJoined(shiftId) {
    if (shiftId === TEARDOWN_ID) return true;
    return (assignments[shiftId] || []).includes(identity);
  }

  async function getLatestAssignments() {
    try {
      const fresh = await window.storage.get("shift-assignments", true);
      return fresh && fresh.value ? JSON.parse(fresh.value) : assignments;
    } catch {
      return assignments;
    }
  }

  async function join(shift, targetMember) {
    const who = targetMember || identity;
    const latest = await getLatestAssignments();
    const names = latest[shift.id] || [];
    if (names.includes(who)) return;
    if (names.length >= shift.spots) return showToast("אין מקומות פנויים במשמרת הזו", "error");

    const conflict = SHIFTS.find(
      (s) => s.id !== shift.id && s.date === shift.date && (latest[s.id] || []).includes(who) && overlaps(s, shift)
    );
    if (conflict) return showToast(`יש חפיפה עם "${conflict.title}" באותו יום`, "error");

    persistAssignments({ ...latest, [shift.id]: [...names, who] });
    showToast(targetMember ? `${who} שובץ/ה ל-${shift.title}` : `שובצת ל-${shift.title}`, "ok");
    if (targetMember) logActivity("שיבוץ ידני", `${who} → ${shift.title} (${formatDate(shift.date)})`);
  }

  async function leave(shift, targetMember) {
    const who = targetMember || identity;
    const latest = await getLatestAssignments();
    const names = latest[shift.id] || [];
    persistAssignments({ ...latest, [shift.id]: names.filter((n) => n !== who) });
    if (targetMember) logActivity("ביטול שיבוץ ידני", `${who} ← ${shift.title} (${formatDate(shift.date)})`);
  }

  async function toggleTeardownTask(task) {
    const mine = teardownTasks[identity] || [];
    const nextMine = mine.includes(task) ? mine.filter((t) => t !== task) : [...mine, task];
    const next = { ...teardownTasks, [identity]: nextMine };
    setTeardownTasks(next);
    try {
      await window.storage.set("teardown-tasks", JSON.stringify(next), true);
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
    const list = Array.isArray(memberPayments[name]) ? memberPayments[name] : [];
    const next = { ...memberPayments, [name]: [...list, { id: Date.now().toString(), amount: Number(amount), date }] };
    setMemberPayments(next);
    try {
      await window.storage.set("member-payments", JSON.stringify(next), true);
      logActivity("רישום תשלום", `${name}: ₪${amount}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removePayment(name, id) {
    const list = Array.isArray(memberPayments[name]) ? memberPayments[name] : [];
    const next = { ...memberPayments, [name]: list.filter((p) => p.id !== id) };
    setMemberPayments(next);
    try {
      await window.storage.set("member-payments", JSON.stringify(next), true);
      logActivity("מחיקת תשלום", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setTeamLead(team, name) {
    const next = { ...teamLeads };
    if (name) next[team] = name; else delete next[team];
    setTeamLeadsState(next);
    try {
      await window.storage.set("team-leads", JSON.stringify(next), true);
      showToast(`מוביל/ה ${team} עודכן`, "ok");
      logActivity("שינוי מוביל צוות", `${team}: ${name || "ללא מוביל"}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setPhone(name, phone) {
    const next = { ...memberPhones, [name]: phone };
    setMemberPhones(next);
    try {
      await window.storage.set("member-phones", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setRideData(name, data) {
    const next = { ...rideInfo, [name]: data };
    setRideInfo(next);
    try {
      await window.storage.set("ride-info", JSON.stringify(next), true);
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
    const next = { ...feeOverrides };
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
    const next = { ...memberEmails, [name]: email };
    setMemberEmails(next);
    try {
      await window.storage.set("member-emails", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Each member opts themselves in/out of receiving WhatsApp reminders -
  // separate from having a phone number on file, and separate from push
  // notifications. Admins can still see who's opted in on the dashboard,
  // and the WhatsApp reminder buttons only appear for members who have.
  async function setWhatsappConsent(name, consent) {
    const next = { ...whatsappConsent, [name]: consent };
    setWhatsappConsentState(next);
    try {
      await window.storage.set("whatsapp-consent", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  // Event announcements posted by an admin/owner go into everyone's "היומן
  // שלי" automatically. An event posted by a regular member doesn't - each
  // person opts in individually via this toggle, so the calendar doesn't
  // fill up with events nobody but the poster cares about.
  async function toggleMyCalendarAdd(announcementId) {
    const mine = personalCalendarAdds[identity] || [];
    const nextMine = mine.includes(announcementId) ? mine.filter((id) => id !== announcementId) : [...mine, announcementId];
    const next = { ...personalCalendarAdds, [identity]: nextMine };
    setPersonalCalendarAddsState(next);
    try {
      await window.storage.set("personal-calendar-adds", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function toggleChecklistItem(team, index) {
    const current = checklistState[team] || {};
    const next = { ...checklistState, [team]: { ...current, [index]: !current[index] } };
    setChecklistState(next);
    try {
      await window.storage.set("team-checklists", JSON.stringify(next), true);
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
    const next = [...extraMembers, { name, idOnFile: idSaved, role: "member" }];
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
    const next = [...removedMembers, name];
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
    const next = removedMembers.filter((n) => n !== name);
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
    const next = [{
      id: Date.now().toString(), author: identity, text: text.trim(), ts: Date.now(), replies: [],
      isEvent: !!eventInfo, eventDate: eventInfo?.eventDate || "", eventTime: eventInfo?.eventTime || "",
      audience: audience || "all",
    }, ...announcements];
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removeAnnouncement(id) {
    const next = announcements.filter((a) => a.id !== id);
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function addReply(annId, text) {
    if (!text.trim()) return;
    const next = announcements.map((a) =>
      a.id === annId
        ? { ...a, replies: [...(a.replies || []), { id: Date.now().toString(), author: identity, text: text.trim(), ts: Date.now() }] }
        : a
    );
    setAnnouncements(next);
    try {
      await window.storage.set("announcements", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function setEmergencyData(name, data) {
    const next = { ...emergencyInfo, [name]: data };
    setEmergencyInfo(next);
    try {
      await setMyEmergencyInfo(name, data);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function createPoll(question, options) {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) {
      return showToast("צריך שאלה ולפחות 2 אפשרויות", "error");
    }
    const next = [{ id: Date.now().toString(), question: question.trim(), options: options.filter((o) => o.trim()), responses: {}, ts: Date.now() }, ...polls];
    setPolls(next);
    try {
      await window.storage.set("polls", JSON.stringify(next), true);
      showToast("הסקר פורסם", "ok");
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function removePoll(id) {
    const next = polls.filter((p) => p.id !== id);
    setPolls(next);
    try {
      await window.storage.set("polls", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function respondToPoll(pollId, optionIndex) {
    const next = polls.map((p) =>
      p.id === pollId ? { ...p, responses: { ...p.responses, [identity]: optionIndex } } : p
    );
    setPolls(next);
    try {
      await window.storage.set("polls", JSON.stringify(next), true);
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
  async function addManualTeamMember(teamName, name) {
    if (!name) return;
    const current = manualTeamMembers[teamName] || [];
    if (current.includes(name)) return;
    const next = { ...manualTeamMembers, [teamName]: [...current, name] };
    setManualTeamMembers(next);
    try {
      await window.storage.set("manual-team-members", JSON.stringify(next), true);
      await addTeamMemberRow(teamName, name);
      logActivity("שיוך ידני לצוות", `${name} → ${teamName}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }
  async function removeManualTeamMember(teamName, name) {
    const current = manualTeamMembers[teamName] || [];
    const next = { ...manualTeamMembers, [teamName]: current.filter((n) => n !== name) };
    setManualTeamMembers(next);
    try {
      await window.storage.set("manual-team-members", JSON.stringify(next), true);
      await removeTeamMemberRow(teamName, name);
      logActivity("הסרת שיוך ידני לצוות", `${name} ← ${teamName}`);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }
  function teamLead(teamName) {
    const name = teamLeads[teamName];
    return name ? allMembers.find((m) => m.name === name) : null;
  }

  function isInTeam(teamName) {
    return teamLeads[teamName] === identity || teamMembers(teamName).includes(identity);
  }

  function teamStats(team) {
    const teamShifts = SHIFTS.filter((s) => s.team === team && s.id !== TEARDOWN_ID);
    const unfilled = teamShifts.reduce((sum, s) => sum + Math.max(s.spots - (assignments[s.id] || []).length, 0), 0);
    const planned = Number(categoryBudgets[team]) || 0;
    const paid = budgetItems.filter((b) => b.category === team).reduce((s, b) => s + (Number(b.paid) || 0), 0);
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

  const currentMember = allMembers.find((m) => m.name === identity);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;
  const myLeadTeam = !isAdmin ? Object.keys(teamLeads).find((t) => teamLeads[t] === identity) : null;
  const canEditBudget = isAdmin || !!myLeadTeam;
  const canManageFinances = isAdmin || isInTeam("צוות תקציב");

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
    () => SHIFTS.reduce((sum, s) => (s.id === TEARDOWN_ID ? sum : sum + Math.max(s.spots - (assignments[s.id] || []).length, 0)), 0),
    [assignments]
  );
  const unfilledShiftsCount = useMemo(
    () => SHIFTS.reduce((sum, s) => (s.id === TEARDOWN_ID ? sum : sum + Math.max(s.spots - (assignments[s.id] || []).length, 0)), 0),
    [assignments]
  );
  const membersWithoutShift = useMemo(
    () => allMembers.filter((m) => !SHIFTS.some((s) => s.id !== TEARDOWN_ID && (assignments[s.id] || []).includes(m.name))).length,
    [assignments, allMembers]
  );
  const overBudgetCategories = useMemo(() => {
    return allBudgetCategories.filter((cat) => {
      const planned = Number(categoryBudgets[cat]) || 0;
      const paid = budgetItems.filter((b) => b.category === cat).reduce((s, b) => s + (Number(b.paid) || 0), 0);
      return planned > 0 && paid > planned;
    });
  }, [categoryBudgets, budgetItems, allBudgetCategories]);

  const budgetTotals = useMemo(() => {
    const planned = Object.values(categoryBudgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const committed = budgetItems.reduce((sum, b) => sum + (Number(b.committed) || 0), 0);
    const paid = budgetItems.reduce((sum, b) => sum + (Number(b.paid) || 0), 0);
    return { planned, committed, paid, remaining: planned - committed };
  }, [budgetItems, categoryBudgets]);

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

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-6 pt-4 flex gap-2 flex-wrap">
        {[
          ...dashboardTabs,
          { id: "shifts", label: "שיבוץ עצמי", icon: CalendarDays },
          { id: "board", label: "לוח מודעות", icon: Megaphone },
          { id: "budget", label: "הוצאות", icon: Wallet },
          ...(canManageFinances ? [{ id: "finances", label: "כספים", icon: CreditCard }] : []),
          ...(isAdmin ? [{ id: "allocations", label: "לוח הקצאות", icon: Ticket }] : []),
          { id: "teams", label: "צוותים", icon: Tent },
          { id: "rides", label: "התניידות", icon: Car },
          { id: "contacts", label: "חברי קמפ", icon: Phone },
          { id: "equipment", label: "ציוד קמפ", icon: Package },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors"
            style={{
              background: tab === t.id ? COLORS.accent : COLORS.surface,
              color: tab === t.id ? COLORS.bg : COLORS.textMuted,
              border: `1px solid ${tab === t.id ? COLORS.accent : COLORS.divider}`,
            }}
          >
            {t.icon && <t.icon size={16} />} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {tab === "dashboard-admin" && isAdmin && (
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: COLORS.accentDark }}>לוח בקרה למנהל</h2>
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

            {(paymentTotals.remaining > 0 || unfilledShiftsCount > 0 || membersWithoutShift > 0 || overBudgetCategories.length > 0 || lookingForRide.length > 0) && (
              <div className="mt-4 rounded-2xl p-4 space-y-2" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                <div className="text-xs font-bold mb-1" style={{ color: COLORS.accentDark }}>התרעות חשובות</div>
                {paymentTotals.remaining > 0 && <div className="text-xs">💰 עוד ₪{paymentTotals.remaining.toLocaleString()} לגבייה מחברי הקמפ</div>}
                {unfilledShiftsCount > 0 && <div className="text-xs">📋 עוד {unfilledShiftsCount} מקומות פנויים במשמרות</div>}
                {membersWithoutShift > 0 && <div className="text-xs">🙋 {membersWithoutShift} חברים עדיין לא שיבצו אף משמרת</div>}
                {lookingForRide.length > 0 && <div className="text-xs">🚗 {lookingForRide.length} חברים מחפשים טרמפ ועדיין לא שובצו</div>}
                {overBudgetCategories.map((cat) => (
                  <div key={cat} className="text-xs">⚠️ הקטגוריה "{cat}" חרגה מהתקציב המתוכנן</div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-bold mt-6 mb-2" style={{ color: COLORS.textMuted }}>הוספת חבר קמפ</h3>
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
                  איפוס סיסמה כבר לא נעשה על ידי מנהל - כל חבר/ה עושה זאת בעצמו/ה במסך הכניסה, דרך "כניסה ראשונה / שכחת סיסמה", בעזרת תעודת הזהות שלו/ה.
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
                          {m.role === "member" && Object.values(teamLeads).includes(m.name) && <span className="text-xs" style={{ color: COLORS.accent2Dark }}> (מנהל צוות)</span>}
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

            {isOwner && (
              <>
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="w-full flex items-center justify-between mt-6 mb-2 text-sm font-bold"
                  style={{ color: COLORS.textMuted }}
                >
                  <span className="flex items-center gap-1.5"><History size={14} /> היסטוריית שינויים (רק אתה רואה)</span>
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
                  onClick={() => setShowLoginHistory(!showLoginHistory)}
                  className="w-full flex items-center justify-between mt-4 mb-2 text-sm font-bold"
                  style={{ color: COLORS.textMuted }}
                >
                  <span className="flex items-center gap-1.5"><History size={14} /> היסטוריית כניסות (רק אתה רואה)</span>
                  <ChevronDown size={15} style={{ transform: showLoginHistory ? "rotate(180deg)" : "none" }} />
                </button>
                {showLoginHistory && (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {loginHistory.length === 0 ? (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין כניסות רשומות.</p>
                    ) : (
                      loginHistory.map((l, i) => (
                        <div key={i} className="text-xs rounded-lg px-3 py-1.5 flex items-center justify-between" style={{ background: COLORS.surface }}>
                          <b style={{ color: COLORS.accentDark }}>{l.name}</b>
                          <span style={{ color: COLORS.textMuted }}>{new Date(l.ts).toLocaleString("he-IL")}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowEmergencyList(!showEmergencyList)}
              className="w-full flex items-center justify-between mt-6 mb-2 text-sm font-bold"
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

            <h3 className="text-xs font-bold mt-5 mb-2" style={{ color: COLORS.textMuted }}>המשמרות של הצוות</h3>
            <div className="space-y-1.5">
              {SHIFTS.filter((s) => s.team === myLeadTeam).map((s) => {
                const isTeardownRow = s.id === TEARDOWN_ID;
                const names = isTeardownRow ? allMembers.map((m) => m.name) : (assignments[s.id] || []);
                const spots = isTeardownRow ? allMembers.length : s.spots;
                return (
                  <div key={s.id} className="rounded-xl px-3 py-2 flex items-center justify-between text-xs" style={{ background: COLORS.surface }}>
                    <span>{s.title} · {formatDate(s.date)}{!isTeardownRow ? ` · ${s.start}–${s.end}` : ""}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>{names.length}/{spots}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "dashboard-personal" && (
          <div>
            {pushStatus === "default" && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                <div className="text-sm font-bold mb-1.5 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                  <Bell size={14} /> הפעילו התראות כדי לא לפספס עדכונים
                </div>
                {isIOSDevice() && !isStandaloneDisplay() ? (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    באייפון צריך קודם להוסיף את האתר למסך הבית: כפתור השיתוף בספארי ← "הוסף למסך הבית". אחר כך פותחים מהאייקון שנוסף למסך הבית, ומשם אפשר להפעיל התראות.
                  </p>
                ) : pushSupported() ? (
                  <>
                    <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                      נשלח התראה כשיש מודעה או סקר חדש בקמפ - גם כשהאפליקציה סגורה בנייד.
                    </p>
                    <button onClick={handleEnablePush} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: COLORS.accent, color: COLORS.bg }}>
                      הפעלת התראות
                    </button>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>המכשיר/דפדפן הזה לא תומך בהתראות דחיפה.</p>
                )}
              </div>
            )}
            {pushStatus === "denied" && (
              <div className="rounded-2xl p-3 mb-4 text-xs" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted }}>
                חסמת התראות בעבר - כדי לקבל עדכונים על מודעות וסקרים חדשים, אפשר להפעיל אותן מחדש דרך הגדרות הדפדפן (הרשאות אתר → התראות).
              </div>
            )}
            {pushStatus === "granted" && !pushSubscribed && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: COLORS.accentLight, border: `1px solid ${COLORS.accent}55` }}>
                <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                  ההרשאה להתראות פעילה, אבל אין מנוי פעיל במכשיר הזה כרגע - כנראה בעקבות תקלה קודמת. אפשר להפעיל מחדש:
                </p>
                <button onClick={handleEnablePush} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: COLORS.accent, color: COLORS.bg }}>
                  הפעלה מחדש של התראות
                </button>
              </div>
            )}
            {pushSubscribed && (
              <button
                onClick={sendTestPush}
                disabled={sendingTestPush}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold mb-2"
                style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}`, color: COLORS.textMuted, opacity: sendingTestPush ? 0.6 : 1 }}
              >
                <Bell size={12} /> {sendingTestPush ? "שולח..." : "שליחת התראת בדיקה לעצמי"}
              </button>
            )}
            {pushSubscribed && (
              <div className="mb-4">
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
                      {s.id !== TEARDOWN_ID && (
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


            <div className="pt-5 mt-5 border-t" style={{ borderColor: COLORS.divider }}>
              <button
                onClick={() => setOpenPersonalSection(openPersonalSection === "emergency" ? null : "emergency")}
                className="w-full flex items-center justify-between text-sm font-bold"
                style={{ color: COLORS.accentDark }}
              >
                <span className="flex items-center gap-2"><HeartPulse size={15} /> כרטיס אישי - לשעת חירום</span>
                <ChevronDown size={15} style={{ transform: openPersonalSection === "emergency" ? "rotate(180deg)" : "none" }} />
              </button>
              {openPersonalSection === "emergency" && (
                <div className="mt-3">
                  <EmergencyCardForm data={emergencyInfo[identity]} onChange={(d) => setEmergencyData(identity, d)} />
                </div>
              )}
            </div>

            <div className="pt-5 mt-5 border-t" style={{ borderColor: COLORS.divider }}>
              <button
                onClick={() => setOpenPersonalSection(openPersonalSection === "ride" ? null : "ride")}
                className="w-full flex items-center justify-between text-sm font-bold"
                style={{ color: COLORS.accentDark }}
              >
                <span className="flex items-center gap-2"><Car size={15} /> התניידות - הפרטים שלי</span>
                <ChevronDown size={15} style={{ transform: openPersonalSection === "ride" ? "rotate(180deg)" : "none" }} />
              </button>
              {openPersonalSection === "ride" && (
                <div className="mt-3">
                  <RideWizard data={rideInfo[identity]} onChange={(d) => setRideData(identity, d)} />
                </div>
              )}
            </div>

            <div className="pt-5 mt-5 border-t" style={{ borderColor: COLORS.divider }}>
              <button
                onClick={() => setOpenPersonalSection(openPersonalSection === "allocation" ? null : "allocation")}
                className="w-full flex items-center justify-between text-sm font-bold"
                style={{ color: COLORS.accentDark }}
              >
                <span className="flex items-center gap-2"><Ticket size={15} /> הקצאה למידברן</span>
                <ChevronDown size={15} style={{ transform: openPersonalSection === "allocation" ? "rotate(180deg)" : "none" }} />
              </button>
              {openPersonalSection === "allocation" && (
                <div className="mt-3">
                  <AllocationWizard data={allocationInfo[identity]} onChange={(d) => setAllocationData(identity, d)} />
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "shifts" && (
          <div>
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
                        const full = names.length >= spots && !joined;
                        return (
                          <div key={s.id} className="rounded-2xl p-3" style={{ background: COLORS.input, borderRight: `3px solid ${joined ? COLORS.accent2 : COLORS.accent}` }}>
                            {!isTeardown && (
                              <div className="text-xs flex items-center gap-1" style={{ color: COLORS.accentDark, fontFamily: FONT_NUM }}>
                                <Clock size={11} /> {s.start}–{s.end}
                              </div>
                            )}
                            <div className="text-sm font-bold mt-1">{s.title}</div>
                            {isTeardown ? (
                              <TeardownTaskPicker selected={teardownTasks[identity] || []} onToggle={toggleTeardownTask} compact />
                            ) : (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: COLORS.accentLight, color: COLORS.accentDark, fontFamily: FONT_NUM }}>{names.length}/{spots}</span>
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
                const full = names.length >= spots && !joined;
                return (
                  <div key={s.id} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="flex items-center gap-4">
                    <FillRing filled={names.length} total={spots} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{s.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: COLORS.accentLight, color: COLORS.accentDark }}>{s.team}</span>
                        {isTeardown && <span className="text-xs" style={{ color: COLORS.textMuted }}>כולם משתתפים</span>}
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ color: COLORS.textMuted }}>
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(s.date)}</span>
                        {!isTeardown && <span className="flex items-center gap-1"><Clock size={12} /> {s.start}–{s.end}</span>}
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
            <AnnouncementForm onPost={addAnnouncement} teams={TEAMS.map((t) => t.name)} />
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
                      <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: FONT_HEADING, lineHeight: 1.5 }}>{a.text}</p>

                      {a.isEvent && (a.eventDate || a.eventTime) && (() => {
                        const authorRole = allMembers.find((m) => m.name === a.author)?.role;
                        const isAdminEvent = authorRole === "admin" || authorRole === "owner";
                        const inMyCalendar = (personalCalendarAdds[identity] || []).includes(a.id);
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
              showBudgetForm ? (
                <BudgetForm onAdd={addBudgetItem} onCancel={() => setShowBudgetForm(false)} lockedCategory={isAdmin ? null : myLeadTeam} categories={allBudgetCategories} />
              ) : (
                <button
                  onClick={() => setShowBudgetForm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  <Plus size={15} /> הוספת סעיף תקציב
                </button>
              )
            )}

            <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.textMuted }}>תקציב לפי קטגוריה</h3>
            <div className="space-y-2 mb-6">
              {allBudgetCategories.map((cat) => {
                const items = budgetItems.filter((b) => b.category === cat);
                const planned = Number(categoryBudgets[cat]) || 0;
                const paid = items.reduce((s, b) => s + (Number(b.paid) || 0), 0);
                const toPay = planned - paid;
                const pct = planned > 0 ? Math.min(paid / planned, 1) * 100 : 0;
                return (
                  <div key={cat} className="rounded-2xl px-4 py-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold">{cat}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span>סכום לתשלום: <b style={{ color: toPay > 0 ? COLORS.danger : COLORS.accent2Dark }}>₪{toPay.toLocaleString()}</b></span>
                        <span>סה"כ שולם: <b style={{ color: COLORS.accent2Dark }}>₪{paid.toLocaleString()}</b></span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: COLORS.divider }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS.accent }} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>תקציב מתוכנן: ₪{planned.toLocaleString()}</div>

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
                    {items.map((e) => (
                      <div key={e.id} className="rounded-xl px-3 py-2 flex items-center justify-between gap-2" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                        <div className="min-w-0 text-xs">
                          <div className="font-semibold text-sm">{e.name} <span style={{ color: COLORS.accentDark }}>× {e.qty}</span></div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap" style={{ color: COLORS.textMuted }}>
                            <span style={{ color: e.condition === "תקין" ? COLORS.accent2Dark : COLORS.danger }}>{e.condition}</span>
                            {e.location && <span className="flex items-center gap-1"><MapPin size={11} /> {e.location}</span>}
                            {e.notes && <span>· {e.notes}</span>}
                          </div>
                        </div>
                        {(isAdmin || myLeadTeam === cat) && (
                          <button onClick={() => removeEquipment(e.id)} style={{ color: COLORS.textMuted }} className="shrink-0"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {campEquipment.length === 0 && (
              <p className="text-xs text-center py-10" style={{ color: COLORS.textMuted }}>עדיין לא נוסף ציוד לרשימה.</p>
            )}
          </div>
        )}

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
                <div className="mb-3">
                  <button onClick={() => setShowBudgetSection(open ? null : "expenses")} className="w-full flex items-center justify-between text-sm font-bold py-2" style={{ color: COLORS.accentDark }}>
                    <span>רישום הוצאות בפועל ({budgetExpenses.length})</span>
                    <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {open && (
                    <div className="space-y-3">
                      {canEditBudget && <BudgetExpenseForm onAdd={addBudgetExpense} lockedAllocation={isAdmin ? null : myLeadTeam} />}
                      <div className="space-y-1.5">
                        {budgetExpenses.map((e) => (
                          <div key={e.id} className="rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2" style={{ background: COLORS.surface }}>
                            <div className="flex items-center gap-2 min-w-0">
                              {e.receiptUrl && (
                                <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                  <img src={e.receiptUrl} alt="קבלה" className="h-10 w-10 object-cover rounded-lg" style={{ border: `1px solid ${COLORS.divider}` }} />
                                </a>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold">{e.allocation}{(e.description || e.subcategory) ? ` · ${e.description || e.subcategory}` : ""}{e.vendor ? ` · ${e.vendor}` : ""}</div>
                                <div style={{ color: COLORS.textMuted }}>
                                  {e.isRefund ? "זיכוי: " : ""}₪{Number(e.amount).toLocaleString()} · {e.vatIncluded ? "כולל מע\"מ" : "לא כולל מע\"מ"}
                                  {e.purchaseDate ? ` · נקנה ${formatDateShort(e.purchaseDate)}` : ""}
                                </div>
                                <div style={{ color: e.paymentStatus === "partial" ? COLORS.danger : COLORS.accent2Dark }}>
                                  {e.paymentStatus === "partial"
                                    ? `שולם ₪${Number(e.paidAmount || 0).toLocaleString()} · נותר ₪${Number(e.remainingAmount || 0).toLocaleString()}${e.dueDate ? ` עד ${formatDateShort(e.dueDate)}` : ""}`
                                    : (e.paymentStatus ? "שולם במלואו" : "")}
                                </div>
                              </div>
                            </div>
                            {(isAdmin || myLeadTeam === e.allocation) && (
                              <button onClick={() => removeBudgetExpense(e.id)} style={{ color: COLORS.textMuted }} className="shrink-0"><Trash2 size={14} /></button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
            )}
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
          <div className="grid sm:grid-cols-2 gap-3">
            {TEAMS.map((t) => {
              const lead = teamLead(t.name);
              const members = teamMembers(t.name);
              const open = expandedTeam === t.name;
              return (
                <div key={t.name} className="rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <button onClick={() => setExpandedTeam(open ? null : t.name)} className="w-full text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold" style={{ color: COLORS.accentDark }}>{t.name}</span>
                      <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", opacity: 0.7 }} />
                    </div>
                    {lead && <div className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>מוביל/ה: {lead.name}</div>}
                  </button>

                  {isAdmin && (
                    <TeamLeadPicker team={t.name} current={teamLeads[t.name]} members={allMembers} onSet={setTeamLead} />
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
                                {isAdmin && manual && (
                                  <button onClick={() => removeManualTeamMember(t.name, n)} style={{ color: COLORS.textMuted }}><X size={10} /></button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-2">
                          <div className="text-xs mb-1" style={{ color: COLORS.textMuted }}>שיוך לצוות ללא משמרת (מנהל)</div>
                          <AdminAssignPicker members={allMembers} onAssign={(name) => addManualTeamMember(t.name, name)} />
                        </div>
                      )}

                      {TEAM_CHECKLISTS[t.name] && (() => {
                        const items = TEAM_CHECKLISTS[t.name];
                        const state = checklistState[t.name] || {};
                        const doneCount = items.filter((_, i) => state[i]).length;
                        const canCheck = isAdmin || teamLeads[t.name] === identity;
                        return (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.divider }}>
                            <div className="text-xs mb-1.5 flex items-center justify-between" style={{ color: COLORS.textMuted }}>
                              <span>צ'קליסט בטיחות ותפעול{!canCheck && " (רק מוביל/ת הצוות או מנהל יכולים לסמן)"}</span>
                              <span>{doneCount}/{items.length}</span>
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                              {items.map((item, i) => (
                                <label key={i} className={`flex items-center gap-2 text-xs ${canCheck ? "cursor-pointer" : "cursor-not-allowed"}`}>
                                  <input
                                    type="checkbox"
                                    checked={!!state[i]}
                                    disabled={!canCheck}
                                    onChange={() => canCheck && toggleChecklistItem(t.name, i)}
                                  />
                                  <span style={{ textDecoration: state[i] ? "line-through" : "none", opacity: state[i] ? 0.6 : 1 }}>{item}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
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

            <div className="grid sm:grid-cols-2 gap-4">
              <RideCategoryCard icon={Car} title="מציעים טרמפ" count={offeringRides.length} headerColor={COLORS.accent2} emptyText="אף אחד עדיין לא הציע טרמפ">
                {offeringRides.map((m, i) => {
                  const d = rideInfo[m.name];
                  const detail = [
                    d.arrivalDay ? formatDate(d.arrivalDay) : "יום לא צוין",
                    d.seats ? `${d.seats} מקומות פנויים` : null,
                    d.city || null,
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
                  const detail = [
                    d.arrivalDay ? `מתכנן/ת להגיע ${formatDate(d.arrivalDay)}` : null,
                    d.city || null,
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
            {allMembers.map((m) => {
              const canEdit = isAdmin || m.name === identity;
              return (
                <div key={m.name} className="rounded-xl px-4 py-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-semibold">
                      {m.name}
                      {rideInfo[m.name]?.city && <span className="font-normal" style={{ color: COLORS.textMuted }}> · {rideInfo[m.name].city}</span>}
                    </span>
                    {canEdit ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          defaultValue={memberPhones[m.name] || ""}
                          onBlur={(e) => setPhone(m.name, e.target.value)}
                          placeholder="טלפון"
                          dir="ltr"
                          className="text-sm px-2 py-1 rounded-lg outline-none text-left"
                          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, width: 130 }}
                        />
                        <input
                          defaultValue={memberEmails[m.name] || ""}
                          onBlur={(e) => setEmail(m.name, e.target.value)}
                          placeholder="אימייל"
                          dir="ltr"
                          className="text-sm px-2 py-1 rounded-lg outline-none text-left"
                          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}`, width: 170 }}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-left" dir="ltr" style={{ color: COLORS.textMuted }}>
                        {memberPhones[m.name] || "—"} · {memberEmails[m.name] || "—"}
                      </div>
                    )}
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
