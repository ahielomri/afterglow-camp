"use client";

import React, { useEffect, useMemo, useState } from "react";

const SYMBOLS = [
  "🪬","🪩","🧿","🪐","🧬","🫧","🪄","🪞","🪶","🪸",
  "🪷","🪻","🪁","🛸","🧭","🧩","🪅","🎐","🦚","🦋"
];

const COLORS = [
  "#B794F4",
  "#60A5FA",
  "#34D399",
  "#F59E0B",
  "#F472B6",
  "#818CF8",
  "#22D3EE",
  "#FB7185"
];

const REMINDERS = [30, 60, 90, 120];
const BEFORE = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const AMOUNTS = [
  0.1, 0.2, 0.3, 0.4,
  0.5, 1, 0.6, 0.7,
  0.8, 0.9, 1.1, 1.2,
  1.3, 1.4, 1.5, 1.6,
  1.7, 1.8, 1.9, 2.1,
  2.2, 2, 2.3, 2.4,
  2.5, 2.6, 2.7
];

const STORAGE_KEY = "check_timer_vercel_full_v1";

function formatAmount(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function timeText(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function dateText(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  });
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function money(value) {
  const n = Number(value || 0);
  return `${Math.round(n * 100) / 100} ₪`;
}

function minutesSince(value) {
  if (!value) return "00:00";

  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default function App() {
  const [data, setData] = useState({
    mainUser: null,
    users: []
  });

  const [screen, setScreen] = useState("boot");
  const [activeUserId, setActiveUserId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [mainName, setMainName] = useState("");
  const [mainSymbol, setMainSymbol] = useState(SYMBOLS[0]);

  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState(SYMBOLS[1]);
  const [newColor, setNewColor] = useState(COLORS[0]);

  const [reminder, setReminder] = useState(90);
  const [pendingTakenAt, setPendingTakenAt] = useState(null);

  const [stockName, setStockName] = useState("");
  const [stockMl, setStockMl] = useState("");
  const [stockPrice, setStockPrice] = useState("");

  const [givePerson, setGivePerson] = useState("");
  const [giveMl, setGiveMl] = useState("");
  const [giveStatus, setGiveStatus] = useState("צריך לשלם");
  const [giveToPay, setGiveToPay] = useState("");
  const [givePaid, setGivePaid] = useState("");
  const [giveNote, setGiveNote] = useState("");

  const [warning, setWarning] = useState(null);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        setScreen(parsed.mainUser ? "users" : "main");
      } else {
        setScreen("main");
      }
    } catch {
      setScreen("main");
    }
  }, []);

  useEffect(() => {
    if (screen !== "boot") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, screen]);

  useEffect(() => {
    const id = setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const activeUser = data.users.find((user) => user.id === activeUserId);

  const stats = useMemo(() => {
    if (!activeUser) {
      return {
        taken: 0,
        given: 0,
        remaining: 0,
        pricePerMl: 0,
        openDebt: 0,
        last: null
      };
    }

    const taken = activeUser.entries.reduce((sum, item) => {
      return sum + Number(item.amount || 0);
    }, 0);

    const given = activeUser.given.reduce((sum, item) => {
      return sum + Number(item.ml || 0);
    }, 0);

    const totalMl = Number(activeUser.stock?.ml || 0);
    const totalPrice = Number(activeUser.stock?.price || 0);
    const pricePerMl = totalMl > 0 ? totalPrice / totalMl : 0;
    const remaining = Math.max(totalMl - taken - given, 0);

    const openDebt = activeUser.given.reduce((sum, item) => {
      return sum + Math.max(Number(item.toPay || 0) - Number(item.paid || 0), 0);
    }, 0);

    return {
      taken,
      given,
      remaining,
      pricePerMl,
      openDebt,
      last: activeUser.entries[0] || null
    };
  }, [activeUser, clock]);

  function updateUser(userId, patch) {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            ...patch
          };
        }

        return user;
      })
    }));
  }

  function saveMainUser() {
    if (!mainName.trim()) return;

    setData((prev) => ({
      ...prev,
      mainUser: {
        name: mainName.trim(),
        symbol: mainSymbol
      }
    }));

    setScreen("users");
  }

  function saveNewUser() {
    if (!newName.trim()) return;

    const user = {
      id: String(Date.now()),
      name: newName.trim(),
      symbol: newSymbol,
      color: newColor,
      entries: [],
      stock: {
        name: "",
        ml: "",
        price: ""
      },
      given: []
    };

    setData((prev) => ({
      ...prev,
      users: [...prev.users, user]
    }));

    setNewName("");
    setNewSymbol(SYMBOLS[1]);
    setNewColor(COLORS[0]);
    setScreen("users");
  }

  function openTracker(user) {
    setActiveUserId(user.id);
    setMenuOpen(false);
    setScreen("tracker");
  }

  function startNow() {
    setPendingTakenAt(new Date());
    setScreen("amount");
  }

  function startBefore(minutes) {
    setPendingTakenAt(addMinutes(new Date(), -minutes));
    setScreen("amount");
  }

  function saveEntry(amount, force = false) {
    if (!activeUser || !pendingTakenAt) return;

    const last = activeUser.entries[0];

    if (last && !force) {
      const diff = (pendingTakenAt.getTime() - new Date(last.takenAt).getTime()) / 60000;

      if (diff > -1 && diff < 60) {
        setWarning({ amount });
        return;
      }
    }

    const entry = {
      id: String(Date.now()),
      amount,
      takenAt: pendingTakenAt.toISOString(),
      nextAt: addMinutes(pendingTakenAt, reminder).toISOString()
    };

    updateUser(activeUser.id, {
      entries: [entry, ...activeUser.entries]
    });

    setWarning(null);
    setPendingTakenAt(null);
    setScreen("tracker");
  }

  function openStock() {
    if (!activeUser) return;

    setStockName(activeUser.stock?.name || "");
    setStockMl(String(activeUser.stock?.ml || ""));
    setStockPrice(String(activeUser.stock?.price || ""));
    setMenuOpen(false);
    setScreen("stock");
  }

  function saveStock() {
    if (!activeUser) return;

    updateUser(activeUser.id, {
      stock: {
        name: stockName,
        ml: stockMl,
        price: stockPrice
      }
    });

    setScreen("tracker");
  }

  function openGive() {
    setGivePerson("");
    setGiveMl("");
    setGiveStatus("צריך לשלם");
    setGiveToPay("");
    setGivePaid("");
    setGiveNote("");
    setMenuOpen(false);
    setScreen("give");
  }

  function saveGive() {
    if (!activeUser || !givePerson.trim() || !Number(giveMl)) return;

    const ml = Number(giveMl);
    const suggested = stats.pricePerMl
      ? Math.round(stats.pricePerMl * ml * 100) / 100
      : 0;

    const item = {
      id: String(Date.now()),
      person: givePerson.trim(),
      ml,
      status: giveStatus,
      toPay: giveToPay.trim() ? Number(giveToPay) : suggested,
      paid: Number(givePaid || 0),
      note: giveNote,
      date: new Date().toISOString()
    };

    updateUser(activeUser.id, {
      given: [item, ...activeUser.given]
    });

    setScreen("tracker");
  }

  function resetApp() {
    const ok = confirm("למחוק את כל הנתונים באפליקציה?");
    if (!ok) return;

    localStorage.removeItem(STORAGE_KEY);
    setData({
      mainUser: null,
      users: []
    });
    setActiveUserId(null);
    setScreen("main");
  }

  if (screen === "boot") {
    return (
      <main style={styles.page}>
        <section style={styles.centerCard}>
          <h1 style={styles.h1}>טוען...</h1>
        </section>
      </main>
    );
  }

  if (screen === "main") {
    return (
      <main style={styles.page}>
        <section style={styles.centerCard}>
          <h1 style={styles.h1}>הקמת משתמש ראשי</h1>
          <p style={styles.sub}>זה המשתמש שמנהל את כל המעקבים באפליקציה.</p>

          <input
            value={mainName}
            onChange={(event) => setMainName(event.target.value)}
            placeholder="שם המשתמש הראשי"
            style={styles.input}
          />

          <div style={styles.symbolGrid}>
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setMainSymbol(symbol)}
                style={{
                  ...styles.symbolButton,
                  ...(mainSymbol === symbol ? styles.selectedDark : {})
                }}
              >
                {symbol}
              </button>
            ))}
          </div>

          <button style={styles.primary} onClick={saveMainUser}>
            שמירה והמשך
          </button>
        </section>
      </main>
    );
  }

  if (screen === "users") {
    return (
      <main style={styles.page}>
        <section style={styles.appShell}>
          <header style={styles.header}>
            <button style={styles.iconMenu} onClick={resetApp}>
              ⌫
            </button>

            <div style={styles.headerTitle}>
              <span>{data.mainUser?.symbol}</span>
              <strong>{data.mainUser?.name}</strong>
            </div>

            <span style={styles.spacer} />
          </header>

          <div style={styles.list}>
            <button style={styles.primary} onClick={() => setScreen("createUser")}>
              הקמת יוזר חדש
            </button>

            {data.users.length === 0 ? (
              <div style={styles.emptyBox}>
                אין עדיין יוזרים. כדאי להקים יוזר ראשון.
              </div>
            ) : (
              data.users.map((user) => (
                <button
                  key={user.id}
                  style={styles.userCard}
                  onClick={() => openTracker(user)}
                >
                  <span style={{ ...styles.userSymbol, background: user.color }}>
                    {user.symbol}
                  </span>

                  <span style={styles.userInfo}>
                    <strong>{user.name}</strong>
                    <small>כניסה למסך מעקב</small>
                  </span>

                  <span style={styles.chevron}>›</span>
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    );
  }

  if (screen === "createUser") {
    return (
      <main style={styles.page}>
        <section style={styles.appShell}>
          <header style={styles.header}>
            <button style={styles.back} onClick={() => setScreen("users")}>
              חזרה
            </button>

            <div style={styles.headerTitle}>
              <strong>הקמת יוזר</strong>
            </div>

            <span style={styles.spacer} />
          </header>

          <div style={styles.form}>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="שם היוזר"
              style={styles.input}
            />

            <label style={styles.label}>בחירת צבע</label>

            <div style={styles.colorGrid}>
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  style={{
                    ...styles.colorButton,
                    background: color,
                    outline: newColor === color ? "4px solid #0F172A" : "4px solid #FFF"
                  }}
                />
              ))}
            </div>

            <label style={styles.label}>בחירת סימן</label>

            <div style={styles.symbolGrid}>
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => setNewSymbol(symbol)}
                  style={{
                    ...styles.symbolButton,
                    ...(newSymbol === symbol ? styles.selectedDark : {})
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>

            <button style={styles.primary} onClick={saveNewUser}>
              שמירה
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "tracker" && activeUser) {
    return (
      <main style={{ ...styles.page, background: `${activeUser.color}22` }}>
        <section style={styles.appShell}>
          <header style={{ ...styles.header, background: `${activeUser.color}24` }}>
            <button style={styles.iconMenu} onClick={() => setMenuOpen(true)}>
              ⋯
            </button>

            <div style={styles.headerTitle}>
              <span>{activeUser.symbol}</span>
              <strong>{activeUser.name}</strong>
            </div>

            <button style={styles.iconMenu} onClick={() => setScreen("users")}>
              ×
            </button>
          </header>

          {menuOpen && (
            <div style={styles.overlay} onClick={() => setMenuOpen(false)}>
              <aside style={styles.drawer} onClick={(event) => event.stopPropagation()}>
                <button style={styles.drawerClose} onClick={() => setMenuOpen(false)}>
                  ×
                </button>

                <h3 style={styles.drawerTitle}>תפריט</h3>

                <button style={styles.drawerItem} onClick={openStock}>
                  מלאי ועלות
                </button>

                <button style={styles.drawerItem} onClick={openGive}>
                  נתתי למישהו
                </button>

                <button
                  style={styles.drawerItem}
                  onClick={() => {
                    setMenuOpen(false);
                    setScreen("payments");
                  }}
                >
                  היסטוריית תשלומים
                </button>

                <button style={styles.drawerItem} onClick={() => setMenuOpen(false)}>
                  סגירה
                </button>
              </aside>
            </div>
          )}

          <section style={styles.historyHeader}>
            <strong>תאריך</strong>
            <strong>שעה ← פעם הבאה</strong>
            <strong>כמות</strong>
          </section>

          <section style={styles.historyList}>
            {activeUser.entries.length === 0 ? (
              <div style={styles.emptyHistory}>ממתין לסימון ראשון</div>
            ) : (
              activeUser.entries.map((entry) => (
                <div key={entry.id} style={styles.historyRow}>
                  <span>{dateText(entry.takenAt)}</span>
                  <span>
                    {timeText(entry.takenAt)} ← {timeText(entry.nextAt)}
                  </span>
                  <span>{formatAmount(entry.amount)}</span>
                </div>
              ))
            )}
          </section>

          <section style={styles.bottomPanel}>
            <div style={styles.statsCards}>
              <div style={styles.statCard}>
                <span>זמן מאז הסימון האחרון</span>
                <strong>{stats.last ? minutesSince(stats.last.takenAt) : "00:00"}</strong>
              </div>

              <div style={styles.divider} />

              <div style={styles.statCard}>
                <span>מצטבר</span>
                <strong>{formatAmount(stats.taken)}</strong>
              </div>
            </div>

            <h3 style={styles.reminderTitle}>תזכיר לי עוד...</h3>

            <div style={styles.reminderGrid}>
              {REMINDERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setReminder(item)}
                  style={{
                    ...styles.reminderButton,
                    ...(reminder === item ? { background: activeUser.color, color: "#FFF" } : {})
                  }}
                >
                  {item === 30
                    ? "30 דק׳"
                    : item === 60
                      ? "1:00"
                      : item === 90
                        ? "1:30"
                        : "2:00"}
                </button>
              ))}
            </div>

            <div style={styles.actions}>
              <button
                style={{ ...styles.actionButton, background: activeUser.color }}
                onClick={startNow}
              >
                לוקח עכשיו
              </button>

              <button
                style={{ ...styles.actionButton, background: `${activeUser.color}CC` }}
                onClick={() => setScreen("before")}
              >
                לקחתי לפני...
              </button>
            </div>
          </section>
        </section>
      </main>
    );
  }

  if (screen === "before") {
    return (
      <ScreenShell title="לקחתי לפני..." onBack={() => setScreen("tracker")}>
        <div style={styles.amountGrid}>
          {BEFORE.map((minutes) => (
            <button
              key={minutes}
              style={styles.amountButton}
              onClick={() => startBefore(minutes)}
            >
              {minutes} דק׳
            </button>
          ))}
        </div>
      </ScreenShell>
    );
  }

  if (screen === "amount") {
    return (
      <ScreenShell title="בחירת כמות" onBack={() => setScreen("tracker")}>
        <div style={styles.amountGrid}>
          {AMOUNTS.map((amount, index) => {
            const big = amount === 1 || amount === 1.5 || amount === 2;

            return (
              <button
                key={`${amount}-${index}`}
                style={{
                  ...styles.amountButton,
                  ...(big ? styles.amountBig : {})
                }}
                onClick={() => saveEntry(amount)}
              >
                {formatAmount(amount)}
              </button>
            );
          })}
        </div>

        {warning && (
          <div style={styles.warning}>
            <h2>רגע, השעון מרים גבה.</h2>
            <p>חלפה פחות משעה מהסימון הקודם.</p>
            <p>שווה לעצור רגע ולבדוק שזה באמת הזמן הנכון.</p>

            <div style={styles.actions}>
              <button style={styles.secondary} onClick={() => setWarning(null)}>
                חזרה
              </button>

              <button
                style={styles.danger}
                onClick={() => saveEntry(warning.amount, true)}
              >
                המשך בכל זאת
              </button>
            </div>
          </div>
        )}
      </ScreenShell>
    );
  }

  if (screen === "stock" && activeUser) {
    const currentPricePerMl = Number(stockMl || 0) > 0
      ? Number(stockPrice || 0) / Number(stockMl || 1)
      : 0;

    return (
      <ScreenShell title="מלאי ועלות" onBack={() => setScreen("tracker")}>
        <div style={styles.form}>
          <input
            style={styles.input}
            value={stockName}
            onChange={(event) => setStockName(event.target.value)}
            placeholder="שם הפריט"
          />

          <input
            style={styles.input}
            value={stockMl}
            onChange={(event) => setStockMl(event.target.value)}
            inputMode="decimal"
            placeholder="כמות התחלתית במ״ל"
          />

          <input
            style={styles.input}
            value={stockPrice}
            onChange={(event) => setStockPrice(event.target.value)}
            inputMode="decimal"
            placeholder="מחיר כולל בש״ח"
          />

          <div style={styles.summaryBox}>
            <p>מחיר למ״ל: <strong>{money(currentPricePerMl)}</strong></p>
            <p>נלקח: <strong>{formatAmount(stats.taken)} מ״ל</strong></p>
            <p>ניתן לאחרים: <strong>{formatAmount(stats.given)} מ״ל</strong></p>
            <p>נשאר: <strong>{formatAmount(stats.remaining)} מ״ל</strong></p>
            <p>עלות שימוש עצמי: <strong>{money(stats.taken * currentPricePerMl)}</strong></p>
            <p>שווי יתרה: <strong>{money(stats.remaining * currentPricePerMl)}</strong></p>
          </div>

          <button style={styles.primary} onClick={saveStock}>
            שמירה
          </button>
        </div>
      </ScreenShell>
    );
  }

  if (screen === "give" && activeUser) {
    const suggested = Number(giveMl || 0) * stats.pricePerMl;

    return (
      <ScreenShell title="נתתי למישהו" onBack={() => setScreen("tracker")}>
        <div style={styles.form}>
          <input
            style={styles.input}
            value={givePerson}
            onChange={(event) => setGivePerson(event.target.value)}
            placeholder="למי נתת"
          />

          <input
            style={styles.input}
            value={giveMl}
            onChange={(event) => setGiveMl(event.target.value)}
            inputMode="decimal"
            placeholder="כמה במ״ל"
          />

          <div style={styles.statusGrid}>
            {["צריך לשלם", "שולם", "חלקי", "מתנה"].map((status) => (
              <button
                key={status}
                style={{
                  ...styles.statusButton,
                  ...(giveStatus === status ? styles.selectedStatus : {})
                }}
                onClick={() => setGiveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div style={styles.hint}>
            סכום מומלץ לפי מלאי: {money(suggested)}
          </div>

          <input
            style={styles.input}
            value={giveToPay}
            onChange={(event) => setGiveToPay(event.target.value)}
            inputMode="decimal"
            placeholder="סכום לתשלום"
          />

          <input
            style={styles.input}
            value={givePaid}
            onChange={(event) => setGivePaid(event.target.value)}
            inputMode="decimal"
            placeholder="כמה שולם בפועל"
          />

          <input
            style={styles.input}
            value={giveNote}
            onChange={(event) => setGiveNote(event.target.value)}
            placeholder="הערה"
          />

          <button style={styles.primary} onClick={saveGive}>
            שמירה
          </button>
        </div>
      </ScreenShell>
    );
  }

  if (screen === "payments" && activeUser) {
    return (
      <ScreenShell title="היסטוריית תשלומים" onBack={() => setScreen("tracker")}>
        <div style={styles.summaryBox}>
          <p>חוב פתוח: <strong>{money(stats.openDebt)}</strong></p>
        </div>

        {activeUser.given.length === 0 ? (
          <div style={styles.emptyBox}>אין עדיין נתינות</div>
        ) : (
          <div style={styles.list}>
            {activeUser.given.map((item) => (
              <div key={item.id} style={styles.paymentCard}>
                <strong>{item.person}</strong>
                <span>כמות: {formatAmount(item.ml)} מ״ל</span>
                <span>סטטוס: {item.status}</span>
                <span>לתשלום: {money(item.toPay)}</span>
                <span>שולם: {money(item.paid)}</span>
                <span>תאריך: {dateText(item.date)}</span>
                {item.note ? <span>הערה: {item.note}</span> : null}
              </div>
            ))}
          </div>
        )}
      </ScreenShell>
    );
  }

  return null;
}

function ScreenShell({ title, children, onBack }) {
  return (
    <main style={styles.page}>
      <section style={styles.appShell}>
        <header style={styles.header}>
          <button style={styles.back} onClick={onBack}>
            חזרה
          </button>

          <div style={styles.headerTitle}>
            <strong>{title}</strong>
          </div>

          <span style={styles.spacer} />
        </header>

        <div style={styles.content}>
          {children}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    direction: "rtl",
    background: "#F4F6FA",
    color: "#0F172A",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "flex",
    justifyContent: "center"
  },
  appShell: {
    width: "100%",
    maxWidth: 520,
    minHeight: "100vh",
    background: "#F7F2FF",
    position: "relative",
    overflow: "hidden"
  },
  centerCard: {
    width: "100%",
    maxWidth: 520,
    minHeight: "100vh",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 18,
    boxSizing: "border-box"
  },
  content: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  h1: {
    fontSize: 34,
    margin: 0,
    textAlign: "center",
    fontWeight: 950
  },
  sub: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 1.5,
    fontWeight: 700
  },
  input: {
    width: "100%",
    minHeight: 56,
    borderRadius: 18,
    border: "1px solid #DDE5F0",
    background: "#FFF",
    padding: "0 16px",
    fontSize: 17,
    boxSizing: "border-box",
    textAlign: "right"
  },
  symbolGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10
  },
  symbolButton: {
    width: 54,
    height: 54,
    border: 0,
    borderRadius: 18,
    background: "#EAF0F6",
    fontSize: 24,
    cursor: "pointer"
  },
  selectedDark: {
    background: "#0F172A",
    color: "#FFF"
  },
  colorGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center"
  },
  colorButton: {
    width: 58,
    height: 44,
    border: 0,
    borderRadius: 14,
    cursor: "pointer"
  },
  label: {
    fontWeight: 900,
    color: "#475569",
    textAlign: "right"
  },
  primary: {
    minHeight: 56,
    border: 0,
    borderRadius: 20,
    background: "#0F172A",
    color: "#FFF",
    fontSize: 18,
    fontWeight: 950,
    cursor: "pointer",
    width: "100%"
  },
  secondary: {
    minHeight: 50,
    border: 0,
    borderRadius: 18,
    background: "#E2E8F0",
    color: "#334155",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    flex: 1
  },
  danger: {
    minHeight: 50,
    border: 0,
    borderRadius: 18,
    background: "#DC2626",
    color: "#FFF",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    flex: 1
  },
  header: {
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    borderBottom: "1px solid rgba(15,23,42,0.1)",
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(16px)"
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 21,
    fontWeight: 950
  },
  iconMenu: {
    width: 48,
    height: 48,
    borderRadius: 24,
    border: "1px solid #E2E8F0",
    background: "#FFF",
    fontSize: 28,
    cursor: "pointer"
  },
  spacer: {
    width: 48
  },
  back: {
    border: 0,
    borderRadius: 16,
    background: "#E2E8F0",
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 18
  },
  userCard: {
    border: 0,
    borderRadius: 24,
    background: "#FFF",
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
    textAlign: "right",
    cursor: "pointer",
    boxShadow: "0 8px 30px rgba(15,23,42,0.08)"
  },
  userSymbol: {
    width: 56,
    height: 56,
    borderRadius: 20,
    color: "#FFF",
    display: "grid",
    placeItems: "center",
    fontSize: 25
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: 4
  },
  chevron: {
    fontSize: 40,
    fontWeight: 900
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14
  },
  historyHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 1fr",
    padding: "18px 14px",
    color: "#64748B",
    fontWeight: 900,
    borderBottom: "1px solid rgba(15,23,42,0.1)",
    textAlign: "center"
  },
  historyList: {
    minHeight: "45vh",
    padding: "18px 12px"
  },
  emptyHistory: {
    color: "#64748B",
    textAlign: "center",
    fontSize: 26,
    fontWeight: 900,
    marginTop: 44
  },
  historyRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr 1fr",
    gap: 8,
    background: "#FFF",
    borderRadius: 16,
    padding: "12px 8px",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: 800
  },
  bottomPanel: {
    position: "sticky",
    bottom: 0,
    background: "rgba(255,255,255,0.92)",
    borderTop: "1px solid rgba(15,23,42,0.1)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    backdropFilter: "blur(14px)"
  },
  statsCards: {
    display: "grid",
    gridTemplateColumns: "1fr 2px 1fr",
    alignItems: "center",
    gap: 12
  },
  statCard: {
    background: "#FFF",
    border: "1px solid #E2E8F0",
    borderRadius: 20,
    minHeight: 74,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  divider: {
    height: 42,
    background: "#CBD5E1",
    borderRadius: 2
  },
  reminderTitle: {
    margin: 0,
    textAlign: "right",
    color: "#475569",
    fontSize: 22
  },
  reminderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10
  },
  reminderButton: {
    minHeight: 48,
    borderRadius: 18,
    border: "1px solid #DDE5F0",
    background: "#FFF",
    fontSize: 17,
    fontWeight: 900,
    color: "#475569",
    cursor: "pointer"
  },
  actions: {
    display: "flex",
    gap: 12
  },
  actionButton: {
    flex: 1,
    minHeight: 60,
    border: 0,
    borderRadius: 22,
    color: "#FFF",
    fontSize: 18,
    fontWeight: 950,
    cursor: "pointer"
  },
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 50,
    background: "rgba(15,23,42,0.22)"
  },
  drawer: {
    width: "76%",
    maxWidth: 330,
    height: "100%",
    background: "#FFF",
    padding: 18,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "-20px 0 50px rgba(15,23,42,0.25)"
  },
  drawerClose: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    border: 0,
    borderRadius: 18,
    background: "#E2E8F0",
    fontSize: 26,
    cursor: "pointer"
  },
  drawerTitle: {
    margin: "6px 0 10px",
    fontSize: 28
  },
  drawerItem: {
    minHeight: 56,
    border: 0,
    borderRadius: 18,
    background: "#F1F5F9",
    color: "#0F172A",
    fontSize: 18,
    fontWeight: 900,
    textAlign: "right",
    padding: "0 16px",
    cursor: "pointer"
  },
  amountGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center"
  },
  amountButton: {
    width: 74,
    height: 58,
    border: "1px solid #DDE5F0",
    borderRadius: 18,
    background: "#FFF",
    color: "#0F172A",
    fontSize: 18,
    fontWeight: 950,
    cursor: "pointer"
  },
  amountBig: {
    width: 112,
    height: 76,
    background: "#0F172A",
    color: "#FFF",
    fontSize: 28
  },
  warning: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "#DC2626",
    color: "#FFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 28,
    textAlign: "center"
  },
  summaryBox: {
    background: "#FFF",
    borderRadius: 24,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxShadow: "0 8px 30px rgba(15,23,42,0.08)"
  },
  statusGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center"
  },
  statusButton: {
    border: 0,
    borderRadius: 16,
    background: "#EAF0F6",
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer"
  },
  selectedStatus: {
    background: "#0F172A",
    color: "#FFF"
  },
  hint: {
    background: "#EEF2FF",
    borderRadius: 18,
    padding: 14,
    color: "#475569",
    fontWeight: 900,
    textAlign: "center"
  },
  paymentCard: {
    background: "#FFF",
    borderRadius: 22,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxShadow: "0 8px 30px rgba(15,23,42,0.08)"
  },
  emptyBox: {
    background: "#FFF",
    borderRadius: 24,
    padding: 22,
    textAlign: "center",
    color: "#64748B",
    fontWeight: 900
  }
};
