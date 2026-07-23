import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";

const STORAGE_KEY = "check_timer_app_data_v1";

const amountOptions = [
  "0.1", "0.2", "0.3", "0.4",
  "0.5", "1.0", "0.6", "0.7",
  "0.8", "0.9", "1.1", "1.2",
  "1.3", "1.4", "1.5", "1.6",
  "1.7", "1.8", "1.9", "2.1",
  "2.2", "2.0", "2.3", "2.4",
  "2.5", "2.6", "2.7",
];

const featuredAmounts = ["1.0", "1.5", "2.0"];

const minutesAgoOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const reminderOptions = [
  { label: "30 דק׳", minutes: 30 },
  { label: "1:00", minutes: 60 },
  { label: "1:30", minutes: 90 },
  { label: "2:00", minutes: 120 },
];

const colorOptions = [
  "#2563EB", "#16A34A", "#9333EA", "#DC2626",
  "#EA580C", "#0891B2", "#4F46E5", "#BE123C",
];

const symbolOptions = [
  "🪬", "🪩", "🧿", "🪐", "🧬", "🫧",
  "🪄", "🪞", "🪶", "🪸", "🪷", "🪻",
  "🪁", "🛸", "🧭", "🪆", "🧩", "🪅",
  "🪙", "🎐", "🎏", "🎎", "🦚", "🦦",
  "🦥", "🦔", "🪼", "🦑", "🐚", "🦋",
];

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function mixWithWhite(hex, mix = 0.9) {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb.r * (1 - mix) + 255 * mix);
  const g = Math.round(rgb.g * (1 - mix) + 255 * mix);
  const b = Math.round(rgb.b * (1 - mix) + 255 * mix);
  return `rgb(${r}, ${g}, ${b})`;
}

function mixTextColor(hex, amount = 0.35) {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb.r * (1 - amount));
  const g = Math.round(rgb.g * (1 - amount));
  const b = Math.round(rgb.b * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function formatAmount(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function formatTime(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

function addMinutes(dateValue, minutes) {
  return new Date(new Date(dateValue).getTime() + minutes * 60000).toISOString();
}

function subtractMinutes(dateValue, minutes) {
  return new Date(new Date(dateValue).getTime() - minutes * 60000).toISOString();
}

function diffMinutes(a, b) {
  return Math.floor((new Date(a).getTime() - new Date(b).getTime()) / 60000);
}

function elapsedDurationFrom(dateValue, nowValue) {
  if (!dateValue) return "00:00";
  const ms = nowValue - new Date(dateValue).getTime();
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function gapBetween(currentEntry, olderEntry) {
  if (!olderEntry) return "";
  const minutes = Math.max(
    0,
    Math.floor((new Date(currentEntry.takenAt).getTime() - new Date(olderEntry.takenAt).getTime()) / 60000)
  );
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `↓ ${hours}h${String(mins).padStart(2, "0")}`;
  if (hours) return `↓ ${hours}h`;
  return `↓ ${mins}m`;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: [], entries: [] };
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch {
    return { users: [], entries: [] };
  }
}

// Reminder timers only survive while this tab stays open - there's no
// backend/push wiring here (unlike Afterglow), so a closed tab or a
// backgrounded phone can silently miss the notification.
async function scheduleReminder(entry) {
  if (!("Notification" in window)) return;
  try {
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return;

    const ms = new Date(entry.nextReminderAt).getTime() - Date.now();
    if (ms <= 0) return;

    const passedLabel = entry.reminderAfterMinutes >= 60
      ? `${Math.floor(entry.reminderAfterMinutes / 60)}:${String(entry.reminderAfterMinutes % 60).padStart(2, "0")}`
      : `${entry.reminderAfterMinutes} דק׳`;

    window.setTimeout(() => {
      try {
        new Notification("תזכורת", {
          body: `עברו ${passedLabel} מאז הסימון האחרון.\nהשעון עשה את שלו, עכשיו תורך לבדוק מה המצב.`,
        });
      } catch {
        // ignore - notification best-effort only
      }
    }, ms);
  } catch {
    // ignore - notification scheduling failed
  }
}

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [screen, setScreen] = useState(() => (loadData().users.length ? "users" : "welcome"));
  const [activeUserId, setActiveUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    color: colorOptions[0],
    symbol: symbolOptions[0],
  });
  const [flow, setFlow] = useState(null);
  const [warning, setWarning] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const activeUser = data.users.find((user) => user.userId === activeUserId) || null;

  const activeEntries = useMemo(() => {
    return data.entries
      .filter((entry) => entry.userId === activeUserId)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  }, [data.entries, activeUserId]);

  const chronologicalEntries = useMemo(() => {
    return data.entries
      .filter((entry) => entry.userId === activeUserId)
      .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
  }, [data.entries, activeUserId]);

  function totalAmountForUser(userId = activeUserId) {
    return data.entries
      .filter((entry) => entry.userId === userId)
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }

  function selectUser(userId) {
    setActiveUserId(userId);
    setScreen("user");
  }

  function createUser() {
    const cleanName = newUser.name.trim();
    if (!cleanName) return;

    const user = {
      userId: uid("user"),
      name: cleanName,
      color: newUser.color,
      symbol: newUser.symbol,
      createdAt: new Date().toISOString(),
      lastTakenAt: null,
      lastAmount: null,
      nextReminderAt: null,
      selectedReminderAfterMinutes: 120,
    };

    setData((current) => ({
      ...current,
      users: [...current.users, user],
    }));

    setActiveUserId(user.userId);
    setNewUser({ name: "", color: colorOptions[0], symbol: symbolOptions[0] });
    setScreen("user");
  }

  function updateUserReminder(minutes) {
    if (!activeUser) return;
    setData((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.userId === activeUser.userId
          ? { ...user, selectedReminderAfterMinutes: minutes }
          : user
      ),
    }));
  }

  function beginNow() {
    const nextFlow = {
      mode: "now",
      selectedTakenAt: new Date().toISOString(),
      minutesAgo: null,
    };
    checkWarningOrContinue(nextFlow);
  }

  function beginBefore(minutesAgo) {
    const nextFlow = {
      mode: "before",
      selectedTakenAt: subtractMinutes(new Date().toISOString(), minutesAgo),
      minutesAgo,
    };
    checkWarningOrContinue(nextFlow);
  }

  function checkWarningOrContinue(nextFlow) {
    if (activeUser?.lastTakenAt) {
      const minutesSinceLast = diffMinutes(nextFlow.selectedTakenAt, activeUser.lastTakenAt);
      if (minutesSinceLast < 60) {
        setFlow(nextFlow);
        setWarning({
          lastTakenAt: activeUser.lastTakenAt,
          minutesSinceLast: Math.max(0, minutesSinceLast),
          continuedAnyway: false,
        });
        setScreen("warning");
        return;
      }
    }

    setFlow(nextFlow);
    setScreen("amount");
  }

  function continueAfterWarning() {
    setWarning((current) => ({ ...current, continuedAnyway: true }));
    setScreen("amount");
  }

  async function chooseAmount(amount) {
    if (!activeUser || !flow) return;

    const reminderMinutes = activeUser.selectedReminderAfterMinutes || 120;
    const nextReminderAt = addMinutes(flow.selectedTakenAt, reminderMinutes);

    const entry = {
      entryId: uid("entry"),
      userId: activeUser.userId,
      mode: flow.mode,
      amount,
      takenAt: flow.selectedTakenAt,
      minutesAgo: flow.minutesAgo,
      reminderAfterMinutes: reminderMinutes,
      nextReminderAt,
      redWarningShown: Boolean(warning),
      continuedAnyway: Boolean(warning?.continuedAnyway),
      createdAt: new Date().toISOString(),
    };

    setData((current) => ({
      users: current.users.map((user) =>
        user.userId === activeUser.userId
          ? { ...user, lastTakenAt: flow.selectedTakenAt, lastAmount: amount, nextReminderAt }
          : user
      ),
      entries: [...current.entries, entry],
    }));

    await scheduleReminder(entry);

    setFlow(null);
    setWarning(null);
    setScreen("user");
  }

  function resetAllData() {
    if (!window.confirm("למחוק את כל הנתונים? הפעולה בלתי הפיכה.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setData({ users: [], entries: [] });
    setActiveUserId(null);
    setScreen("welcome");
  }

  if (screen === "welcome") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-7 text-center">
          <h1 className="text-3xl font-black text-slate-900">ברוכים הבאים</h1>
          <p className="max-w-xs text-lg font-bold leading-relaxed text-slate-500">
            כדי להתחיל, נקים יוזר אישי.
          </p>
          <PrimaryButton label="הקמת יוזר חדש" onClick={() => setScreen("createUser")} />
        </div>
      </Shell>
    );
  }

  if (screen === "users") {
    return (
      <Shell>
        <TopBar title="בחר יוזר" rightIcon={<Plus size={26} />} onRight={() => setScreen("createUser")} />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3.5">
            {data.users.map((user) => (
              <button
                key={user.userId}
                onClick={() => selectUser(user.userId)}
                className="flex min-h-[78px] items-center gap-3.5 rounded-[22px] border border-slate-900/5 p-3.5 text-right"
                style={{ backgroundColor: mixWithWhite(user.color, 0.9) }}
              >
                <span
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: user.color }}
                >
                  {user.symbol}
                </span>
                <span className="flex-1">
                  <span className="block text-xl font-black text-slate-900">{user.name}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">כניסה למסך היוזר</span>
                </span>
                <span className="min-w-[70px] text-left text-lg font-black text-slate-900">
                  {user.lastTakenAt ? elapsedDurationFrom(user.lastTakenAt, now) : ""}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={resetAllData}
            className="mt-6 min-h-[48px] w-full rounded-2xl bg-slate-200 text-base font-black text-slate-700"
          >
            איפוס נתונים
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "createUser") {
    return (
      <Shell>
        <TopBar
          title="הקמת יוזר"
          leftIcon={<ChevronRight size={28} />}
          onLeft={() => setScreen(data.users.length ? "users" : "welcome")}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3.5">
            <label className="text-right text-sm font-black text-slate-700">שם היוזר</label>
            <input
              value={newUser.name}
              onChange={(e) => setNewUser((current) => ({ ...current, name: e.target.value }))}
              placeholder="לדוגמה: עומרי"
              dir="rtl"
              className="min-h-[54px] rounded-2xl border border-slate-200 bg-white px-3.5 text-right text-lg text-slate-900 outline-none focus:border-slate-400"
            />

            <label className="mt-2 text-right text-sm font-black text-slate-700">בחירת צבע</label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewUser((current) => ({ ...current, color }))}
                  className="h-12 w-16 rounded-2xl border-4"
                  style={{
                    backgroundColor: color,
                    borderColor: newUser.color === color ? "#0F172A" : "#FFFFFF",
                  }}
                />
              ))}
            </div>

            <label className="mt-2 text-right text-sm font-black text-slate-700">בחירת סימן מזהה</label>
            <div className="flex flex-wrap gap-2.5">
              {symbolOptions.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setNewUser((current) => ({ ...current, symbol }))}
                  className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: newUser.symbol === symbol ? "#0F172A" : "#EEF2F7" }}
                >
                  {symbol}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <PrimaryButton label="שמירה והתחלה" onClick={createUser} fullWidth />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "user" && activeUser) {
    return (
      <Shell backgroundColor={mixWithWhite(activeUser.color, 0.92)}>
        <TopBar
          title={`${activeUser.name} ${activeUser.symbol}`}
          leftIcon={<ChevronRight size={28} />}
          onLeft={() => setScreen("users")}
          backgroundColor={mixWithWhite(activeUser.color, 0.87)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-[42px] items-center border-b border-slate-900/15 px-4">
            <span className="flex-1 text-center text-xs font-black text-slate-500">כמות</span>
            <span className="flex-[1.8] text-center text-xs font-black text-slate-500">שעה ← פעם הבאה</span>
            <span className="flex-1 text-center text-xs font-black text-slate-500">תאריך</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeEntries.length ? (
              activeEntries.slice(0, 20).map((entry) => {
                const index = chronologicalEntries.findIndex((item) => item.entryId === entry.entryId);
                const older = index > 0 ? chronologicalEntries[index - 1] : null;
                const gap = gapBetween(entry, older);

                return (
                  <div
                    key={entry.entryId}
                    className="flex min-h-[62px] items-center border-b border-slate-900/10 px-4"
                  >
                    <span className="flex-1 text-center text-lg font-black text-slate-900">
                      {formatAmount(entry.amount)}
                    </span>
                    <div className="flex flex-[1.8] flex-col items-center">
                      <span className="text-xl font-black text-slate-900">
                        {formatTime(entry.nextReminderAt)} ← {formatTime(entry.takenAt)}
                      </span>
                      {gap ? <span className="mt-1 text-xs font-black text-slate-400">{gap}</span> : null}
                    </div>
                    <span className="flex-1 text-center text-sm font-black text-slate-900">
                      {formatShortDate(entry.takenAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="mt-6 text-center text-lg font-bold text-slate-500">ממתין לסימון ראשון</p>
            )}
          </div>

          <div className="border-t border-slate-900/10 bg-white/[0.98] p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-2xl border border-slate-900/10 bg-white py-2">
                <span className="mb-1 text-xs font-black text-slate-600">מצטבר</span>
                <span className="text-xl font-black text-slate-900">{formatAmount(totalAmountForUser())}</span>
              </div>
              <span className="text-2xl font-bold text-slate-400">|</span>
              <div className="flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-2xl border border-slate-900/10 bg-white py-2">
                <span className="mb-1 text-xs font-black text-slate-600">זמן מאז הסימון האחרון</span>
                <span className="text-xl font-black text-slate-900">
                  {activeUser.lastTakenAt ? elapsedDurationFrom(activeUser.lastTakenAt, now) : "00:00"}
                </span>
              </div>
            </div>

            <p className="mb-2 text-right text-sm font-black text-slate-600">תזכיר לי עוד...</p>

            <div className="mb-2.5 flex gap-2">
              {reminderOptions.map((option) => {
                const selected = activeUser.selectedReminderAfterMinutes === option.minutes;
                return (
                  <button
                    key={option.minutes}
                    onClick={() => updateUserReminder(option.minutes)}
                    className="min-h-[40px] flex-1 rounded-xl border text-base font-black"
                    style={{
                      backgroundColor: selected ? "#D9E9FF" : "#FFFFFF",
                      borderColor: selected ? "#BFD7F7" : "#D7DCE4",
                      color: selected ? "#325B8C" : "#516072",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={beginNow}
                className="min-h-[50px] flex-1 rounded-2xl border text-lg font-black"
                style={{
                  backgroundColor: mixWithWhite(activeUser.color, 0.6),
                  borderColor: mixWithWhite(activeUser.color, 0.5),
                  color: mixTextColor(activeUser.color, 0.18),
                }}
              >
                לוקח עכשיו
              </button>
              <button
                onClick={() => setScreen("before")}
                className="min-h-[50px] flex-1 rounded-2xl border text-lg font-black"
                style={{
                  backgroundColor: mixWithWhite(activeUser.color, 0.72),
                  borderColor: mixWithWhite(activeUser.color, 0.6),
                  color: mixTextColor(activeUser.color, 0.26),
                }}
              >
                לקחתי לפני...
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "before") {
    return (
      <Shell backgroundColor={activeUser ? mixWithWhite(activeUser.color, 0.92) : "#F8FAFC"}>
        <TopBar
          title="מתי לקחת?"
          leftIcon={<ChevronRight size={28} />}
          onLeft={() => setScreen("user")}
          backgroundColor={activeUser ? mixWithWhite(activeUser.color, 0.87) : "#FFFFFF"}
        />
        <div className="grid grid-cols-2 gap-2.5 p-4">
          {minutesAgoOptions.map((minutes) => (
            <button
              key={minutes}
              onClick={() => beginBefore(minutes)}
              className="flex min-h-[58px] items-center justify-center rounded-2xl border border-slate-900/10 bg-white text-lg font-black text-slate-900"
            >
              {minutes} דק׳
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (screen === "warning") {
    return (
      <div className="flex h-full min-h-screen flex-col bg-red-600 p-5" dir="rtl">
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <h1 className="mb-5 text-3xl font-black text-white">רגע, השעון מרים גבה.</h1>
          <p className="text-lg font-bold leading-loose text-white">חלפה פחות משעה מהסימון הקודם.</p>
          <p className="text-lg font-bold leading-loose text-white">
            הסימון האחרון היה בשעה {formatTime(warning?.lastTakenAt)},
          </p>
          <p className="text-lg font-bold leading-loose text-white">ומאז עברו רק {warning?.minutesSinceLast} דקות.</p>
          <p className="mt-3.5 text-xl font-black leading-loose text-white">
            שווה לעצור רגע ולבדוק שזה באמת הזמן הנכון.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setWarning(null);
              setFlow(null);
              setScreen("user");
            }}
            className="min-h-[56px] flex-1 rounded-[18px] bg-white text-lg font-black text-red-700"
          >
            חזרה
          </button>
          <button
            onClick={continueAfterWarning}
            className="min-h-[56px] flex-1 rounded-[18px] bg-red-900 text-lg font-black text-white"
          >
            המשך בכל זאת
          </button>
        </div>
      </div>
    );
  }

  if (screen === "amount") {
    const bg = activeUser ? mixWithWhite(activeUser.color, 0.92) : "#F8FAFC";
    const headerBg = activeUser ? mixWithWhite(activeUser.color, 0.87) : "#FFFFFF";
    const modeText = flow?.mode === "before" ? `לקחת לפני ${flow.minutesAgo} דק׳` : "לוקח עכשיו";

    return (
      <Shell backgroundColor={bg}>
        <TopBar title="כמה לקחת?" leftIcon={<ChevronRight size={28} />} onLeft={() => setScreen("user")} backgroundColor={headerBg} />
        <div className="flex-1 overflow-y-auto p-4 pb-6">
          <p className="mb-2 text-center text-sm font-bold text-slate-500">
            {activeUser ? `${activeUser.symbol} ${activeUser.name}` : ""}
          </p>
          <h2 className="mb-2.5 text-center text-3xl font-black text-slate-900">בחירת כמות</h2>
          <p className="mb-4.5 text-center text-sm font-bold text-slate-500">{modeText}</p>

          <div className="flex flex-wrap gap-2.5">
            {amountOptions.map((amount) => {
              const featured = featuredAmounts.includes(amount);
              return (
                <button
                  key={amount}
                  onClick={() => chooseAmount(amount)}
                  className={
                    featured
                      ? "flex h-[146px] w-[48%] items-center justify-center rounded-[22px] border border-slate-900/10 bg-white/[0.97]"
                      : "flex h-[68px] w-[22.7%] items-center justify-center rounded-2xl border border-slate-900/10 bg-white/90"
                  }
                >
                  <span className={featured ? "text-4xl font-black text-slate-900" : "text-xl font-black text-slate-900"}>
                    {formatAmount(amount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Shell>
    );
  }

  return null;
}

function Shell({ children, backgroundColor = "#FFFFFF" }) {
  return (
    <div className="flex h-full min-h-screen flex-col" style={{ backgroundColor }} dir="rtl">
      {children}
    </div>
  );
}

function TopBar({ title, leftIcon, onLeft, rightIcon, onRight, backgroundColor = "#FFFFFF" }) {
  return (
    <div className="flex h-[62px] items-center border-b border-slate-900/10 px-3" style={{ backgroundColor }}>
      <button className="flex w-[54px] items-center justify-center text-slate-900" onClick={onLeft}>
        {leftIcon}
      </button>
      <span className="flex-1 text-center text-xl font-black text-slate-900">{title}</span>
      <button className="flex w-[54px] items-center justify-center text-slate-900" onClick={onRight}>
        {rightIcon}
      </button>
    </div>
  );
}

function PrimaryButton({ label, onClick, fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[54px] rounded-2xl bg-slate-900 text-lg font-black text-white ${fullWidth ? "w-full" : "px-8"}`}
    >
      {label}
    </button>
  );
}
