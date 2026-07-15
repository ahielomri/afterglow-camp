import { useState, useEffect, useMemo } from "react";
import { Users, CalendarDays, Clock, Flame, Tent, Sparkles, ChevronDown, Check, X, LogOut, Wallet, Plus, Trash2, CreditCard, Phone, Car, UserPlus, Megaphone, HeartPulse, History, Bell, BellOff, Package, MapPin } from "lucide-react";
import { pushSupported, pushPermission, enablePush, disablePush } from "./push.js";
import { uploadFile } from "./storage.js";

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
  { name: "אורנה חזוט צורים", id: "40180390", role: "admin" },
  { name: "עומרי אחיאל", id: "200450633", role: "admin" },
  { name: "שרון אור", id: "16447070", role: "member" },
  { name: "ליאת ציטרון", id: "31688716", role: "member" },
  { name: "איתי כהן", id: "043019223", role: "member" },
  { name: "מירי אביהו", id: "307802926", role: "member" },
  { name: "גיא יצחקי", id: "052325815", role: "member" },
  { name: "מתיאס זיפיליבן", id: "328893292", role: "member" },
  { name: "גלעד אהרוני", id: "032214579", role: "member" },
  { name: "רוני דאיה", id: "033640640", role: "member" },
  { name: "נטע קישיניאבסקי שני", id: "033178419", role: "admin" },
  { name: "נעם אלמוג", id: "034201764", role: "member" },
  { name: "נירי כהן", id: "201603594", role: "member" },
  { name: "אסי כהן", id: "038399556", role: "member" },
  { name: "אן קליוט", id: null, role: "member" },
  { name: "טליה הבר", id: "0506982095", role: "member" },
  { name: "תמיר צמח", id: "024059131", role: "member" },
  { name: "דן דורות", id: "301592549", role: "member" },
  { name: "אלירם לגזיאל", id: "062840160", role: "member" },
  { name: "ליאת בן סעדון", id: "036536068", role: "member" },
  { name: "אבישי גרינגרד", id: "0526808009", role: "member" },
  { name: "טלי שגב", id: "038704920", role: "member" },
  { name: "רווה מדר", id: "062836291", role: "member" },
  { name: "עידן טחן", id: "212976294", role: "member" },
  { name: "אנה קנטרוביץ", id: "014445746", role: "member" },
  { name: "בתאל בר גיורא", id: "036236602", role: "member" },
  { name: "רותם פלש", id: "037728409", role: "member" },
  { name: "גילי דגן", id: null, role: "member" },
  { name: "יעל נאש", id: null, role: "member" },
  { name: "שלומי קוך", id: null, role: "member" },
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

function normalizeId(str) {
  return (str || "").replace(/\D/g, "").replace(/^0+/, "");
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
function LoginScreen({ members, passwords, onVerified, onSetPassword }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [idVal, setIdVal] = useState("");
  const [password, setPasswordVal] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState("");

  const selected = members.find((m) => m.name === name);
  const needsId = selected && selected.id !== null;
  const hasPassword = selected && !!passwords[selected.name];
  const resetting = hasPassword && forgotMode;

  const filtered = query.trim()
    ? members.filter((m) => m.name.includes(query.trim()))
    : members;

  function pickName(n) {
    setName(n);
    setQuery(n);
    setShowSuggestions(false);
    setError("");
    setPasswordVal("");
    setConfirmPassword("");
    setIdVal("");
    setForgotMode(false);
  }

  function submit() {
    if (!selected) return setError("בחר/י שם מהרשימה");

    if (hasPassword && !forgotMode) {
      if (password !== passwords[selected.name]) {
        return setError("סיסמה שגויה");
      }
      onVerified(selected.name);
      return;
    }

    // first-time setup OR password-reset flow: both require re-verifying identity then choosing a new password
    if (needsId && normalizeId(idVal) !== normalizeId(selected.id)) {
      return setError("תעודת הזהות לא תואמת לשם שנבחר");
    }
    if (!password || password.length < 4) {
      return setError("בחר/י סיסמה של לפחות 4 תווים");
    }
    if (password !== confirmPassword) {
      return setError("הסיסמאות לא תואמות");
    }
    onSetPassword(selected.name, password);
    onVerified(selected.name);
  }

  return (
    <div className="flex items-center justify-center min-h-[500px] px-6">
      <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
        <SunsetMark size={48} />
        <h2 style={{ fontFamily: FONT_HEADING }} className="text-xl mt-4 mb-1">כניסה למחנה</h2>
        <p className="text-xs mb-5" style={{ color: COLORS.textMuted }}>
          {resetting ? "איפוס סיסמה - נזהה אותך שוב לפי ת.ז ותבחר/י סיסמה חדשה" : hasPassword ? "מזהים אותך לפי שם וסיסמה" : "כניסה ראשונה - נזהה אותך ותבחר/י סיסמה לפעם הבאה"}
        </p>

        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>שם</label>
        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              if (name) { setName(""); setError(""); setPasswordVal(""); setConfirmPassword(""); setIdVal(""); setForgotMode(false); }
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

        {selected && (!hasPassword || forgotMode) && needsId && (
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
        )}
        {selected && !hasPassword && !needsId && (
          <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>אין ת.ז רשומה עבורך במערכת - בחר/י סיסמה כדי להמשיך</p>
        )}
        {selected && forgotMode && !needsId && (
          <p className="text-xs mb-3" style={{ color: COLORS.danger }}>אין ת.ז רשומה עבורך במערכת - פנה/י למנהל הקמפ כדי לאפס את הסיסמה</p>
        )}

        {selected && hasPassword && !forgotMode && (
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
            <button onClick={() => setForgotMode(true)} className="text-xs mb-3" style={{ color: COLORS.accentDark }}>
              שכחת סיסמה?
            </button>
          </>
        )}

        {selected && (!hasPassword || (forgotMode && needsId)) && (
          <>
            <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>{forgotMode ? "סיסמה חדשה" : "בחר/י סיסמה"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPasswordVal(e.target.value); setError(""); }}
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
          </>
        )}

        {error && <p className="text-xs mb-3" style={{ color: COLORS.danger }}>{error}</p>}

        <button
          onClick={submit}
          disabled={selected && forgotMode && !needsId}
          className="w-full py-2.5 rounded-xl text-sm font-bold"
          style={{ background: COLORS.accent, color: COLORS.bg, fontFamily: FONT_HEADING, opacity: selected && forgotMode && !needsId ? 0.5 : 1 }}
        >
          כניסה
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
  const [subcategory, setSubcategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [vatIncluded, setVatIncluded] = useState(true);
  const [paidBy, setPaidBy] = useState("");
  const [method, setMethod] = useState("");
  const [isRefund, setIsRefund] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [uploading, setUploading] = useState(false);

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
    onAdd({ allocation, subcategory, vendor, amount, vatIncluded, paidBy, method, isRefund, receiptUrl });
    setSubcategory(""); setVendor(""); setAmount(""); setPaidBy(""); setMethod(""); setIsRefund(false);
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
          value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
          placeholder="סעיף (תת-קטגוריה, למשל: קרח)"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={vendor} onChange={(e) => setVendor(e.target.value)}
          placeholder="ספק"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="סכום"
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <input
          value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
          placeholder={'שולם ע"י (מי בפועל שילם)'}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
        <select
          value={method} onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        >
          <option value="">אופן תשלום</option>
          <option value="מזומן">מזומן</option>
          <option value="העברה">העברה</option>
          <option value="ביט">ביט</option>
          <option value="פייבוקס">פייבוקס</option>
          <option value="כרטיס">כרטיס</option>
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
        <label className="text-xs block mb-1" style={{ color: COLORS.textMuted }}>ת.ז (אופציונלי)</label>
        <input
          value={id} onChange={(e) => setId(e.target.value)}
          placeholder="תעודת זהות"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: COLORS.input, color: COLORS.text, border: `1px solid ${COLORS.divider}` }}
        />
      </div>
      <button
        onClick={() => { if (name.trim()) { onAdd(name.trim(), id.trim() || null); setName(""); setId(""); } }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: COLORS.accent, color: COLORS.bg }}
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
  const [feeOverrides, setFeeOverrides] = useState({});
  const [memberEmails, setMemberEmails] = useState({});
  const [checklistState, setChecklistState] = useState({});
  const [manualTeamMembers, setManualTeamMembers] = useState({});
  const [budgetParams, setBudgetParams] = useState({
    global: { N: "", setupDays: "", eventDays: "", contingencyPct: "", vatIncluded: false },
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
  const [memberPasswords, setMemberPasswords] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [emergencyInfo, setEmergencyInfo] = useState({});
  const [polls, setPolls] = useState([]);
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
  const [toast, setToast] = useState(null);
  const [pushStatus, setPushStatus] = useState("unsupported");

  useEffect(() => {
    async function safeGet(key, shared) {
      try {
        const r = await window.storage.get(key, shared);
        return r && r.value ? r.value : null;
      } catch {
        return null;
      }
    }

    (async () => {
      const [
        rawAssignments, rawBudget, rawCatBudget, rawTeardown, rawPayments, rawFee,
        rawLeads, rawPhones, rawRides, rawFeeOv, rawEmails, rawChecklists,
        rawManualTeam, rawLog, rawLogins, rawExtra, rawRemoved, rawPasswords,
        rawAnn, rawEmg, rawPolls, rawMe, rawBudgetParams, rawBudgetExpenses, rawEquipment, rawExtraCategories,
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
        safeGet("team-checklists", true),
        safeGet("manual-team-members", true),
        safeGet("activity-log", true),
        safeGet("login-history", true),
        safeGet("extra-members", true),
        safeGet("removed-members", true),
        safeGet("member-passwords", true),
        safeGet("announcements", true),
        safeGet("emergency-info", true),
        safeGet("polls", true),
        safeGet("my-identity", false),
        safeGet("budget-params", true),
        safeGet("budget-expenses", true),
        safeGet("camp-equipment", true),
        safeGet("extra-budget-categories", true),
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
      setChecklistState(rawChecklists ? JSON.parse(rawChecklists) : {});
      setManualTeamMembers(rawManualTeam ? JSON.parse(rawManualTeam) : {});
      setActivityLog(rawLog ? JSON.parse(rawLog) : []);
      setLoginHistory(rawLogins ? JSON.parse(rawLogins) : []);
      setExtraMembers(rawExtra ? JSON.parse(rawExtra) : []);
      setRemovedMembers(rawRemoved ? JSON.parse(rawRemoved) : []);
      setMemberPasswords(rawPasswords ? JSON.parse(rawPasswords) : {});
      setAnnouncements(rawAnn ? JSON.parse(rawAnn) : []);
      setEmergencyInfo(rawEmg ? JSON.parse(rawEmg) : {});
      setPolls(rawPolls ? JSON.parse(rawPolls) : []);
      if (rawMe) setIdentity(rawMe);
      if (rawBudgetParams) {
        try {
          setBudgetParams((prev) => ({ ...prev, ...JSON.parse(rawBudgetParams) }));
        } catch {}
      }
      setBudgetExpenses(rawBudgetExpenses ? JSON.parse(rawBudgetExpenses) : []);
      setCampEquipment(rawEquipment ? JSON.parse(rawEquipment) : []);
      setExtraBudgetCategories(rawExtraCategories ? JSON.parse(rawExtraCategories) : []);

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

  async function handleVerified(name) {
    setIdentity(name);
    try {
      await window.storage.set("my-identity", name, false);
    } catch {}
    const entry = { name, ts: Date.now() };
    const next = [entry, ...loginHistory].slice(0, 300);
    setLoginHistory(next);
    try {
      await window.storage.set("login-history", JSON.stringify(next), true);
    } catch {}
  }

  async function logout() {
    setIdentity(null);
    try {
      await window.storage.delete("my-identity", false);
    } catch {}
  }

  function showToast(text, kind = "ok") {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    setPushStatus(pushPermission());
  }, [identity]);

  async function handleEnablePush() {
    try {
      await enablePush(identity);
      setPushStatus("granted");
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
      showToast("התראות בוטלו", "ok");
    } catch {
      showToast("שמירה נכשלה", "error");
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
    const next = [...extraMembers, { name, id: id || null, role: "member" }];
    setExtraMembers(next);
    try {
      await window.storage.set("extra-members", JSON.stringify(next), true);
      showToast(`${name} נוסף/ה לקמפ`, "ok");
      logActivity("הוספת חבר קמפ", name);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
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

  async function setMemberPassword(name, password) {
    const next = { ...memberPasswords, [name]: password };
    setMemberPasswords(next);
    try {
      await window.storage.set("member-passwords", JSON.stringify(next), true);
    } catch {
      showToast("שמירה נכשלה", "error");
    }
  }

  async function clearMemberPassword(name) {
    const next = { ...memberPasswords };
    delete next[name];
    setMemberPasswords(next);
    try {
      await window.storage.set("member-passwords", JSON.stringify(next), true);
      showToast(`הסיסמה של ${name} אופסה`, "ok");
      logActivity("איפוס סיסמה", name);
    } catch {
      showToast("שמירה נכשלה", "error");
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
      await window.storage.set("emergency-info", JSON.stringify(next), true);
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
    const unfilled = teamShifts.filter((s) => (assignments[s.id] || []).length < s.spots).length;
    const planned = Number(categoryBudgets[team]) || 0;
    const paid = budgetItems.filter((b) => b.category === team).reduce((s, b) => s + (Number(b.paid) || 0), 0);
    return { totalShifts: teamShifts.length, unfilled, planned, paid };
  }

  const allMembers = useMemo(
    () => [...MEMBERS, ...extraMembers].filter((m) => !removedMembers.includes(m.name)).sort((a, b) => a.name.localeCompare(b.name, "he")),
    [extraMembers, removedMembers]
  );

  const allBudgetCategories = useMemo(
    () => [...BUDGET_CATEGORIES, ...extraBudgetCategories],
    [extraBudgetCategories]
  );

  const currentMember = allMembers.find((m) => m.name === identity);
  const isAdmin = currentMember?.role === "admin";
  const isOmri = identity === "עומרי אחיאל";
  const myLeadTeam = !isAdmin ? Object.keys(teamLeads).find((t) => teamLeads[t] === identity) : null;
  const canEditBudget = isAdmin || !!myLeadTeam;
  const canManageFinances = isAdmin || isInTeam("צוות תקציב");

  const myShifts = useMemo(
    () => SHIFTS.filter((s) => isJoined(s.id)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [assignments, identity]
  );
  const openShiftsCount = useMemo(
    () => SHIFTS.filter((s) => s.id !== TEARDOWN_ID && (assignments[s.id] || []).length < s.spots).length,
    [assignments]
  );
  const unfilledShiftsCount = useMemo(
    () => SHIFTS.filter((s) => s.id !== TEARDOWN_ID && (assignments[s.id] || []).length < s.spots).length,
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

  // -------------------------------------------------------------------------
  // Camp budget engine - implements the handover-doc formulas exactly.
  // Every number here is an input re-entered each planning cycle; nothing
  // is hardcoded. Section numbers in comments match the source document.
  // -------------------------------------------------------------------------
  const engine = useMemo(() => {
    const p = budgetParams;
    const num = (v) => Number(v) || 0;
    const N = num(p.global.N);
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
  }, [budgetParams, budgetExpenses, paymentTotals]);

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
        <LoginScreen members={allMembers} passwords={memberPasswords} onVerified={handleVerified} onSetPassword={setMemberPassword} />
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
                { label: "משמרות לא מלאות", value: unfilledShiftsCount },
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
                {unfilledShiftsCount > 0 && <div className="text-xs">📋 {unfilledShiftsCount} משמרות עדיין לא מלאות</div>}
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
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {allMembers.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-sm rounded-lg px-3 py-1.5" style={{ background: COLORS.surface }}>
                      <span>{m.name}{m.role === "admin" && <span className="text-xs" style={{ color: COLORS.accentDark }}> (מנהל)</span>}</span>
                      <div className="flex items-center gap-1">
                        {memberPasswords[m.name] && (
                          <button
                            onClick={() => { if (window.confirm(`לאפס את הסיסמה של ${m.name}? הוא/היא יצטרך/תצטרך לבחור סיסמה חדשה בכניסה הבאה.`)) clearMemberPassword(m.name); }}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ color: COLORS.textMuted }}
                          >
                            איפוס סיסמה
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

            {isOmri && (
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

            <h3 className="text-sm font-bold mt-6 mb-2 flex items-center gap-1.5" style={{ color: COLORS.textMuted }}>
              <Sparkles size={14} /> יצירת סקר לכולם
            </h3>
            {showPollForm ? (
              <PollForm onCreate={(q, opts) => { createPoll(q, opts); setShowPollForm(false); }} onCancel={() => setShowPollForm(false)} />
            ) : (
              <button
                onClick={() => setShowPollForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold mb-3"
                style={{ background: COLORS.accent, color: COLORS.bg }}
              >
                <Plus size={14} /> סקר חדש
              </button>
            )}
            {polls.length > 0 && (
              <div className="space-y-2 mt-2">
                {polls.map((p) => {
                  const counts = p.options.map((_, i) => Object.values(p.responses || {}).filter((v) => v === i).length);
                  const total = counts.reduce((a, b) => a + b, 0) || 1;
                  return (
                    <div key={p.id} className="rounded-xl p-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{p.question}</span>
                        <button onClick={() => removePoll(p.id)} style={{ color: COLORS.textMuted }}><Trash2 size={13} /></button>
                      </div>
                      <div className="space-y-1 mt-2">
                        {p.options.map((o, i) => (
                          <div key={i} className="text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span>{o}</span>
                              <span style={{ color: COLORS.textMuted }}>{counts[i]}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.divider }}>
                              <div className="h-full rounded-full" style={{ width: `${(counts[i] / total) * 100}%`, background: COLORS.accent2 }} />
                            </div>
                          </div>
                        ))}
                      </div>
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
                  { label: "משמרות לא מלאות", value: t.unfilled },
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "המשמרות שלי", value: myShifts.length },
                { label: "משמרות עם מקום פנוי", value: openShiftsCount },
                { label: "ימים לפתיחת השערים", value: daysUntil() },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
                  <div className="text-3xl font-black mt-1" style={{ fontFamily: FONT_NUM, color: COLORS.accentDark }}>{c.value}</div>
                  <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{c.label}</div>
                </div>
              ))}
              {(campFee > 0 || feeOverrides[identity] !== undefined) && (
                <div className="col-span-2 sm:col-span-3 rounded-2xl p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.divider}` }}>
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
              {myShifts.length === 0 ? (
                <p className="text-xs" style={{ color: COLORS.textMuted }}>עדיין לא שיבצת אף משמרת. עבור/י לטאב "שיבוץ עצמי" כדי להצטרף.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {myShifts.map((s) => (
                    <div key={s.id} className="shrink-0 rounded-2xl px-4 py-3 min-w-[130px]" style={{ background: COLORS.surface, borderTop: `3px solid ${COLORS.accent}` }}>
                      <div className="text-xs font-bold" style={{ color: COLORS.accentDark }}>{formatDateShort(s.date)}</div>
                      <div className="text-sm font-semibold mt-1">{s.title}</div>
                      {s.id !== TEARDOWN_ID && (
                        <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{s.start}–{s.end}</div>
                      )}
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
                  (a) => !a.audience || a.audience === "all" || isAdmin || isInTeam(a.audience)
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
                        {a.isEvent && (a.eventDate || a.eventTime) && (
                          <div className="mt-1 font-bold" style={{ color: COLORS.accentDark }}>
                            📅 {a.eventDate ? formatDate(a.eventDate) : ""}{a.eventTime ? ` · ${a.eventTime}` : ""}
                          </div>
                        )}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: COLORS.accentDark }}>סקרים</h3>
              {showPollForm ? null : (
                <button
                  onClick={() => setShowPollForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: COLORS.accent, color: COLORS.bg }}
                >
                  <Plus size={13} /> סקר חדש
                </button>
              )}
            </div>
            {showPollForm && (
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

                      {a.isEvent && (a.eventDate || a.eventTime) && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold px-2 py-1 rounded-lg w-fit" style={{ background: "rgba(255,255,255,0.55)", color: COLORS.accentDark }}>
                          <CalendarDays size={13} />
                          {a.eventDate ? formatDate(a.eventDate) : ""}{a.eventTime ? ` · ${a.eventTime}` : ""}
                        </div>
                      )}

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

            {isAdmin && (
              <div className="mb-4 text-xs" style={{ color: COLORS.textMuted }}>
                הגדרת תקציב מתוכנן לכל מחלקה עברה לטאב "תקציב".
              </div>
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
                N = {engine.N || 0} חברים · עלות לנפש: ₪{Math.round(engine.N > 0 ? engine.totalCampCost / engine.N : 0).toLocaleString()}
              </div>
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
                      <NumField label="N - חברי מחנה" value={budgetParams.global.N} onChange={(v) => patchBudgetParams("global", { N: v })} />
                      <NumField label={'אחוז בלת"מ (ברירת מחדל)'} value={budgetParams.global.contingencyPct} onChange={(v) => patchBudgetParams("global", { contingencyPct: v })} suffix="%" />
                      <NumField label="ימי הקמה" value={budgetParams.global.setupDays} onChange={(v) => patchBudgetParams("global", { setupDays: v })} />
                      <NumField label="ימי אירוע" value={budgetParams.global.eventDays} onChange={(v) => patchBudgetParams("global", { eventDays: v })} />
                      <label className="flex items-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                        <input type="checkbox" checked={budgetParams.global.vatIncluded} onChange={(e) => patchBudgetParams("global", { vatIncluded: e.target.checked })} />
                        הסכומים כוללים מע"מ
                      </label>
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
                                <div className="font-semibold">{e.allocation}{e.subcategory ? ` · ${e.subcategory}` : ""}{e.vendor ? ` · ${e.vendor}` : ""}</div>
                                <div style={{ color: COLORS.textMuted }}>
                                  {e.isRefund ? "זיכוי: " : ""}₪{Number(e.amount).toLocaleString()} · {e.vatIncluded ? "כולל מע\"מ" : "לא כולל מע\"מ"} · {e.paidBy ? `שולם ע"י ${e.paidBy}` : ""} {e.method ? `· ${e.method}` : ""}
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
                        return (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.divider }}>
                            <div className="text-xs mb-1.5 flex items-center justify-between" style={{ color: COLORS.textMuted }}>
                              <span>צ'קליסט בטיחות ותפעול</span>
                              <span>{doneCount}/{items.length}</span>
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                              {items.map((item, i) => (
                                <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!state[i]}
                                    onChange={() => toggleChecklistItem(t.name, i)}
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
              את הפרטים שלך (עיר, יום הגעה, רכב, טרמפים, מקום לציוד) ממלאים בטאב "לוח בקרה אישי". כאן רואים את התוצאה המשותפת של כולם.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accent2Dark }}>
                  <Car size={15} /> מציעים טרמפ ({offeringRides.length})
                </h3>
                {offeringRides.length === 0 ? (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>אף אחד עדיין לא הציע טרמפ</p>
                ) : (
                  <div className="space-y-1.5">
                    {offeringRides.map((m) => {
                      const d = rideInfo[m.name];
                      return (
                        <div key={m.name} className="rounded-xl px-3 py-2 text-xs" style={{ background: COLORS.accent2Light }}>
                          <div className="font-semibold">{m.name}{d.city ? ` · ${d.city}` : ""}</div>
                          <div style={{ color: COLORS.accent2Dark }}>
                            {d.arrivalDay ? formatDate(d.arrivalDay) : "יום לא צוין"}{d.seats ? ` · ${d.seats} מקומות פנויים` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                  <Users size={15} /> מחפשים טרמפ ({lookingForRide.length})
                </h3>
                {lookingForRide.length === 0 ? (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>אף אחד עדיין לא מחפש טרמפ</p>
                ) : (
                  <div className="space-y-1.5">
                    {lookingForRide.map((m) => {
                      const d = rideInfo[m.name];
                      return (
                        <div key={m.name} className="rounded-xl px-3 py-2 text-xs" style={{ background: COLORS.accentLight }}>
                          <div className="font-semibold">{m.name}{d.city ? ` · ${d.city}` : ""}</div>
                          {d.arrivalDay && <div style={{ color: COLORS.accentDark }}>מתכנן/ת להגיע {formatDate(d.arrivalDay)}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accent2Dark }}>
                  <UserPlus size={15} /> יש להם מקום לציוד/קניות של הקמפ ({offeringCargoSpace.length})
                </h3>
                {offeringCargoSpace.length === 0 ? (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>אף אחד עדיין לא סימן מקום פנוי לציוד</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {offeringCargoSpace.map((m) => {
                      const d = rideInfo[m.name];
                      return (
                        <div key={m.name} className="rounded-xl px-3 py-2 text-xs" style={{ background: COLORS.accent2Light }}>
                          <div className="font-semibold">{m.name}{d.city ? ` · ${d.city}` : ""}</div>
                          <div style={{ color: COLORS.accent2Dark }}>
                            {d.arrivalDay ? formatDate(d.arrivalDay) : "יום לא צוין"}{d.cargoNote ? ` · ${d.cargoNote}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: COLORS.accentDark }}>
                  <Car size={15} /> יכולת גרירה - וו/עגלה נגררת ({towingCapable.length})
                </h3>
                {towingCapable.length === 0 ? (
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>אף אחד עדיין לא סימן יכולת גרירה</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {towingCapable.map((m) => {
                      const d = rideInfo[m.name];
                      const bits = [];
                      if (d.vehicleType) bits.push(d.vehicleType);
                      if (d.hasTowHitch === "yes") bits.push("וו גרירה");
                      if (d.hasTrailer === "yes") bits.push("עגלה נגררת");
                      return (
                        <div key={m.name} className="rounded-xl px-3 py-2 text-xs" style={{ background: COLORS.accentLight }}>
                          <div className="font-semibold">{m.name}{d.city ? ` · ${d.city}` : ""}</div>
                          <div style={{ color: COLORS.accentDark }}>{bits.join(" · ") || "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                      {pushStatus === "granted" ? (
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

