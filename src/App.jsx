"use client";

import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "check_timer_vercel_full_v1";

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
  0.1,0.2,0.3,0.4,
  0.5,1,0.6,0.7,
  0.8,0.9,1.1,1.2,
  1.3,1.4,1.5,1.6,
  1.7,1.8,1.9,2.1,
  2.2,2,2.3,2.4,
  2.5,2.6,2.7
];

function formatAmount(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
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

function money(value) {
  const n = Number(value || 0);
  return `${Math.round(n * 100) / 100} ₪`;
}

function sinceText(value) {
  if (!value) return "00:00";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function emptyUser(name, symbol, color) {
  return {
    id: String(Date.now()),
    name,
    symbol,
    color,
    entries: [],
    stock: {
      name: "",
      ml: "",
      price: ""
    },
    given: []
  };
}

export default function App() {
  const [data, setData] = useState({
    mainUser: null,
    users: []
  });

  const [screen, setScreen] = useState("boot");
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [mainName, setMainName] = useState("");
  const [mainSymbol, setMainSymbol] = useState(SYMBOLS[0]);

  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState(SYMBOLS[1]);
  const [newColor, setNewColor] = useState(COLORS[0]);

  const [reminder, setReminder] = useState(90);
  const [pendingTime, setPendingTime] = useState(null);
  const [warningAmount, setWarningAmount] = useState(null);

  const [stockName, setStockName] = useState("");
  const [stockMl, setStockMl] = useState("");
  const [stockPrice, setStockPrice] = useState("");

  const [givePerson, setGivePerson] = useState("");
  const [giveMl, setGiveMl] = useState("");
  const [giveStatus, setGiveStatus] = useState("צריך לשלם");
  const [giveToPay, setGiveToPay] = useState("");
  const [givePaid, setGivePaid] = useState("");
  const [giveNote, setGiveNote] = useState("");

  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    document.title = "My G";

    let meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", "My G");
  }, []);

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
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeUser = data.users.find((user) => user.id === activeId);

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

  function updateUser(patch) {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((user) => {
        if (user.id !== activeId) return user;
        return {
          ...user,
          ...patch
        };
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

    const user = emptyUser(newName.trim(), newSymbol, newColor);

    setData((prev) => ({
      ...prev,
      users: [...prev.users, user]
    }));

    setNewName("");
    setNewSymbol(SYMBOLS[1]);
    setNewColor(COLORS[0]);
    setScreen("users");
  }

  function openUser(user) {
    setActiveId(user.id);
    setMenuOpen(false);
    setScreen("tracker");
  }

  function saveEntry(amount, force = false) {
    if (!activeUser || !pendingTime) return;

    const last = activeUser.entries[0];

    if (last && !force) {
      const diff = (pendingTime.getTime() - new Date(last.takenAt).getTime()) / 60000;

      if (diff > -1 && diff < 60) {
        setWarningAmount(amount);
        return;
      }
    }

    const entry = {
      id: String(Date.now()),
      amount,
      takenAt: pendingTime.toISOString(),
      nextAt: addMinutes(pendingTime, reminder).toISOString()
    };

    updateUser({
      entries: [entry, ...activeUser.entries]
    });

    setPendingTime(null);
    setWarningAmount(null);
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
    updateUser({
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

    updateUser({
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
    setActiveId(null);
    setScreen("main");
  }

  function goBackToTracker() {
    setWarningAmount(null);
    setScreen("tracker");
  }

  if (screen === "boot") {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="center">
          <h1>טוען...</h1>
        </section>
      </main>
    );
  }

  if (screen === "main") {
    return (
      <main className="page">
        <style>{css}</style>

        <section className="center">
          <h1>הקמת משתמש ראשי</h1>
          <p>זה המשתמש שמנהל את כל המעקבים באפליקציה.</p>

          <input
            value={mainName}
            onChange={(event) => setMainName(event.target.value)}
            placeholder="שם המשתמש הראשי"
          />

          <div className="symbol-grid">
            {SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                className={mainSymbol === symbol ? "symbol selected-dark" : "symbol"}
                onClick={() => setMainSymbol(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>

          <button className="primary" onClick={saveMainUser}>
            שמירה והמשך
          </button>
        </section>
      </main>
    );
  }

  if (screen === "users") {
    return (
      <main className="page">
        <style>{css}</style>

        <section className="app">
          <header className="top">
            <button className="circle" onClick={resetApp}>⌫</button>

            <div className="top-title">
              <span>{data.mainUser?.symbol}</span>
              <strong>{data.mainUser?.name}</strong>
            </div>

            <span className="ghost" />
          </header>

          <section className="content">
            <button className="primary" onClick={() => setScreen("createUser")}>
              הקמת יוזר חדש
            </button>

            {data.users.length === 0 ? (
              <div className="empty">אין עדיין יוזרים. כדאי להקים יוזר ראשון.</div>
            ) : (
              data.users.map((user) => (
                <button className="user-row" key={user.id} onClick={() => openUser(user)}>
                  <span className="user-icon" style={{ background: user.color }}>
                    {user.symbol}
                  </span>

                  <span className="user-info">
                    <strong>{user.name}</strong>
                    <small>כניסה למסך מעקב</small>
                  </span>

                  <span className="chevron">›</span>
                </button>
              ))
            )}
          </section>
        </section>
      </main>
    );
  }

  if (screen === "createUser") {
    return (
      <main className="page">
        <style>{css}</style>

        <section className="app">
          <header className="top">
            <button className="back" onClick={() => setScreen("users")}>חזרה</button>
            <div className="top-title"><strong>הקמת יוזר</strong></div>
            <span className="ghost" />
          </header>

          <section className="content form centered-form">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="שם היוזר"
            />

            <h3>בחירת צבע</h3>

            <div className="color-grid">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="color"
                  onClick={() => setNewColor(color)}
                  style={{
                    background: color,
                    outline: newColor === color ? "5px solid #0F172A" : "5px solid #FFF"
                  }}
                />
              ))}
            </div>

            <h3>בחירת סימן</h3>

            <div className="symbol-grid straight">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  className={newSymbol === symbol ? "symbol selected-dark" : "symbol"}
                  onClick={() => setNewSymbol(symbol)}
                >
                  {symbol}
                </button>
              ))}
            </div>

            <button className="primary" onClick={saveNewUser}>
              שמירה
            </button>
          </section>
        </section>
      </main>
    );
  }

  if (screen === "tracker" && activeUser) {
    return (
      <main className="page" style={{ background: `${activeUser.color}24` }}>
        <style>{css}</style>

        <section className="app" style={{ background: `${activeUser.color}16` }}>
          <header className="top" style={{ background: `${activeUser.color}28` }}>
            <button className="circle" onClick={() => setMenuOpen(true)}>⋯</button>

            <div className="top-title">
              <span>{activeUser.symbol}</span>
              <strong>{activeUser.name}</strong>
            </div>

            <button className="circle" onClick={() => setScreen("users")}>×</button>
          </header>

          {menuOpen && (
            <div className="overlay" onClick={() => setMenuOpen(false)}>
              <aside className="drawer" onClick={(event) => event.stopPropagation()}>
                <button className="drawer-close" onClick={() => setMenuOpen(false)}>×</button>
                <h2>תפריט</h2>

                <button onClick={openStock}>מלאי ועלות</button>
                <button onClick={openGive}>נתתי למישהו</button>
                <button onClick={() => { setMenuOpen(false); setScreen("payments"); }}>
                  היסטוריית תשלומים
                </button>
                <button onClick={() => setMenuOpen(false)}>סגירה</button>
              </aside>
            </div>
          )}

          <section className="history-head">
            <strong>תאריך</strong>
            <strong>שעה ← פעם הבאה</strong>
            <strong>כמות</strong>
          </section>

          <section className="history-list">
            {activeUser.entries.length === 0 ? (
              <div className="empty-history">ממתין לסימון ראשון</div>
            ) : (
              activeUser.entries.map((entry) => (
                <div className="history-row" key={entry.id}>
                  <span>{dateText(entry.takenAt)}</span>
                  <span>{timeText(entry.takenAt)} ← {timeText(entry.nextAt)}</span>
                  <span>{formatAmount(entry.amount)}</span>
                </div>
              ))
            )}
          </section>

          <section className="data-strip">
            <div>
              <span>נשאר במלאי</span>
              <strong>{formatAmount(stats.remaining)} מ״ל</strong>
            </div>

            <div>
              <span>ניתן לאחרים</span>
              <strong>{formatAmount(stats.given)} מ״ל</strong>
            </div>

            <div>
              <span>חוב פתוח</span>
              <strong>{money(stats.openDebt)}</strong>
            </div>
          </section>

          <section className="bottom">
            <div className="stats">
              <div>
                <span>מצטבר</span>
                <strong>{formatAmount(stats.taken)}</strong>
              </div>

              <i />

              <div>
                <span>זמן מאז הסימון האחרון</span>
                <strong>{stats.last ? sinceText(stats.last.takenAt) : "00:00"}</strong>
              </div>
            </div>

            <h3>תזכיר לי עוד...</h3>

            <div className="reminders">
              {REMINDERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setReminder(item)}
                  style={{
                    background: reminder === item ? activeUser.color : "#FFF",
                    color: reminder === item ? "#FFF" : "#475569",
                    borderColor: activeUser.color
                  }}
                >
                  {item === 30 ? "30 דק׳" : item === 60 ? "1:00" : item === 90 ? "1:30" : "2:00"}
                </button>
              ))}
            </div>

            <div className="actions">
              <button
                style={{ background: activeUser.color }}
                onClick={() => {
                  setPendingTime(new Date());
                  setScreen("amount");
                }}
              >
                לוקח עכשיו
              </button>

              <button
                style={{ background: activeUser.color }}
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
      <Shell title="לקחתי לפני..." onBack={goBackToTracker}>
        <style>{css}</style>

        <div className="amount-grid">
          {BEFORE.map((minutes) => (
            <button
              key={minutes}
              onClick={() => {
                setPendingTime(addMinutes(new Date(), -minutes));
                setScreen("amount");
              }}
            >
              {minutes} דק׳
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (screen === "amount") {
    return (
      <Shell title="בחירת כמות" onBack={goBackToTracker}>
        <style>{css}</style>

        <div className="amount-grid">
          {AMOUNTS.map((amount, index) => {
            const isBig = amount === 1 || amount === 1.5 || amount === 2;

            return (
              <button
                key={`${amount}-${index}`}
                className={isBig ? "big" : ""}
                onClick={() => saveEntry(amount)}
                style={{
                  background: isBig && activeUser ? activeUser.color : "#FFF",
                  color: isBig ? "#FFF" : "#0F172A",
                  borderColor: activeUser?.color || "#DDE5F0"
                }}
              >
                {formatAmount(amount)}
              </button>
            );
          })}
        </div>

        {warningAmount !== null && (
          <div className="warning">
            <h2>רגע, השעון מרים גבה.</h2>
            <p>חלפה פחות משעה מהסימון הקודם.</p>
            <p>שווה לעצור רגע ולבדוק שזה באמת הזמן הנכון.</p>

            <div className="actions">
              <button onClick={() => setWarningAmount(null)}>חזרה</button>
              <button onClick={() => saveEntry(warningAmount, true)}>המשך בכל זאת</button>
            </div>
          </div>
        )}
      </Shell>
    );
  }

  if (screen === "stock" && activeUser) {
    const currentPricePerMl = Number(stockMl || 0) > 0
      ? Number(stockPrice || 0) / Number(stockMl || 1)
      : 0;

    return (
      <Shell title="מלאי ועלות" onBack={goBackToTracker}>
        <style>{css}</style>

        <div className="form">
          <input value={stockName} onChange={(event) => setStockName(event.target.value)} placeholder="שם הפריט" />
          <input value={stockMl} onChange={(event) => setStockMl(event.target.value)} inputMode="decimal" placeholder="כמות התחלתית במ״ל" />
          <input value={stockPrice} onChange={(event) => setStockPrice(event.target.value)} inputMode="decimal" placeholder="מחיר כולל בש״ח" />

          <div className="summary">
            <p>מחיר למ״ל: <strong>{money(currentPricePerMl)}</strong></p>
            <p>נלקח: <strong>{formatAmount(stats.taken)} מ״ל</strong></p>
            <p>ניתן לאחרים: <strong>{formatAmount(stats.given)} מ״ל</strong></p>
            <p>נשאר: <strong>{formatAmount(stats.remaining)} מ״ל</strong></p>
            <p>עלות שימוש עצמי: <strong>{money(stats.taken * currentPricePerMl)}</strong></p>
            <p>שווי יתרה: <strong>{money(stats.remaining * currentPricePerMl)}</strong></p>
          </div>

          <button className="primary" style={{ background: activeUser.color }} onClick={saveStock}>
            שמירה
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "give" && activeUser) {
    const suggested = Number(giveMl || 0) * stats.pricePerMl;

    return (
      <Shell title="נתתי למישהו" onBack={goBackToTracker}>
        <style>{css}</style>

        <div className="form">
          <input value={givePerson} onChange={(event) => setGivePerson(event.target.value)} placeholder="למי נתת" />
          <input value={giveMl} onChange={(event) => setGiveMl(event.target.value)} inputMode="decimal" placeholder="כמה במ״ל" />

          <div className="status">
            {["צריך לשלם", "שולם", "חלקי", "מתנה"].map((item) => (
              <button
                key={item}
                onClick={() => setGiveStatus(item)}
                style={{
                  background: giveStatus === item ? activeUser.color : "#EAF0F6",
                  color: giveStatus === item ? "#FFF" : "#334155"
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="hint">
            סכום מומלץ לפי מלאי: {money(suggested)}
          </div>

          <input value={giveToPay} onChange={(event) => setGiveToPay(event.target.value)} inputMode="decimal" placeholder="סכום לתשלום" />
          <input value={givePaid} onChange={(event) => setGivePaid(event.target.value)} inputMode="decimal" placeholder="כמה שולם בפועל" />
          <input value={giveNote} onChange={(event) => setGiveNote(event.target.value)} placeholder="הערה" />

          <button className="primary" style={{ background: activeUser.color }} onClick={saveGive}>
            שמירה
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "payments" && activeUser) {
    return (
      <Shell title="היסטוריית תשלומים" onBack={goBackToTracker}>
        <style>{css}</style>

        <div className="summary">
          <p>חוב פתוח: <strong>{money(stats.openDebt)}</strong></p>
        </div>

        {activeUser.given.length === 0 ? (
          <div className="empty">אין עדיין נתינות</div>
        ) : (
          <div className="payment-list">
            {activeUser.given.map((item) => (
              <div className="payment" key={item.id}>
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
      </Shell>
    );
  }

  return null;
}

function Shell({ title, children, onBack }) {
  return (
    <main className="page">
      <section className="app">
        <header className="top">
          <button className="back" onClick={onBack}>חזרה</button>
          <div className="top-title"><strong>{title}</strong></div>
          <span className="ghost" />
        </header>

        <section className="content">
          {children}
        </section>
      </section>
    </main>
  );
}

const css = `
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

button,
input {
  font-family: inherit;
}

.page {
  min-height: 100vh;
  direction: rtl;
  background: #F4F6FA;
  color: #0F172A;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: flex;
  justify-content: center;
}

.app {
  width: 100%;
  max-width: 520px;
  min-height: 100vh;
  background: #F7F2FF;
  position: relative;
  overflow: hidden;
}

.center {
  width: 100%;
  max-width: 520px;
  min-height: 100vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
}

.center h1 {
  margin: 0;
  text-align: center;
  font-size: 34px;
  font-weight: 950;
}

.center p {
  margin: 0;
  text-align: center;
  color: #64748B;
  font-weight: 800;
  line-height: 1.5;
}

.top {
  height: 72px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.72);
  border-bottom: 1px solid rgba(15,23,42,0.1);
  backdrop-filter: blur(16px);
}

.top-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 23px;
  font-weight: 950;
}

.circle {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 1px solid #E2E8F0;
  background: #FFF;
  font-size: 30px;
  font-weight: 950;
  cursor: pointer;
}

.ghost {
  width: 48px;
}

.back {
  border: 0;
  border-radius: 16px;
  background: #E2E8F0;
  padding: 12px 16px;
  font-size: 17px;
  font-weight: 950;
  cursor: pointer;
}

.content {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.centered-form {
  align-items: stretch;
  text-align: center;
}

.centered-form h3 {
  margin: 10px 0 0;
  font-size: 23px;
  font-weight: 950;
  color: #475569;
}

input {
  width: 100%;
  min-height: 58px;
  border: 1px solid #DDE5F0;
  border-radius: 20px;
  background: #FFF;
  padding: 0 18px;
  font-size: 19px;
  text-align: right;
  outline: none;
}

.primary {
  min-height: 58px;
  border: 0;
  border-radius: 22px;
  background: #0F172A;
  color: #FFF;
  font-size: 20px;
  font-weight: 950;
  cursor: pointer;
}

.symbol-grid,
.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  justify-items: center;
  align-items: center;
}

.symbol-grid.straight {
  grid-template-columns: repeat(5, 1fr);
}

.symbol {
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 19px;
  background: #EAF0F6;
  font-size: 25px;
  cursor: pointer;
}

.selected-dark {
  background: #0F172A;
  color: #FFF;
}

.color {
  width: 68px;
  height: 58px;
  border: 0;
  border-radius: 20px;
  cursor: pointer;
}

.empty {
  background: #FFF;
  border-radius: 24px;
  padding: 22px;
  text-align: center;
  color: #64748B;
  font-weight: 900;
}

.user-row {
  min-height: 84px;
  border: 0;
  border-radius: 24px;
  background: #FFF;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: right;
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(15,23,42,0.08);
}

.user-icon {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  color: #FFF;
  display: grid;
  place-items: center;
  font-size: 25px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-info strong {
  font-size: 22px;
}

.user-info small {
  color: #64748B;
  font-weight: 800;
}

.chevron {
  font-size: 40px;
  font-weight: 950;
}

.history-head,
.history-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 8px;
  text-align: center;
}

.history-head {
  padding: 18px 14px;
  color: #64748B;
  font-weight: 950;
  border-bottom: 1px solid rgba(15,23,42,0.1);
}

.history-list {
  min-height: 40vh;
  padding: 18px 12px;
}

.empty-history {
  text-align: center;
  margin-top: 44px;
  font-size: 26px;
  color: #64748B;
  font-weight: 950;
}

.history-row {
  background: #FFF;
  border-radius: 18px;
  padding: 14px 8px;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 950;
}

.data-strip {
  padding: 0 16px 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.data-strip div,
.stats div {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 20px;
  padding: 12px 8px;
  text-align: center;
}

.data-strip span,
.stats span {
  display: block;
  color: #64748B;
  font-weight: 900;
  font-size: 13px;
}

.data-strip strong,
.stats strong {
  display: block;
  margin-top: 6px;
  font-size: 21px;
  font-weight: 950;
}

.bottom {
  position: sticky;
  bottom: 0;
  background: rgba(255,255,255,0.93);
  border-top: 1px solid rgba(15,23,42,0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  backdrop-filter: blur(14px);
}

.stats {
  display: grid;
  grid-template-columns: 1fr 2px 1fr;
  gap: 12px;
  align-items: center;
}

.stats i {
  height: 44px;
  border-radius: 2px;
  background: #CBD5E1;
}

.bottom h3 {
  margin: 0;
  color: #475569;
  font-size: 22px;
  font-weight: 950;
}

.reminders {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.reminders button {
  min-height: 50px;
  border: 2px solid #DDE5F0;
  border-radius: 18px;
  background: #FFF;
  font-size: 17px;
  font-weight: 950;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 12px;
}

.actions button {
  flex: 1;
  min-height: 62px;
  border: 0;
  border-radius: 23px;
  color: #FFF;
  font-size: 20px;
  font-weight: 950;
  cursor: pointer;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(15,23,42,0.22);
}

.drawer {
  width: 76%;
  max-width: 330px;
  height: 100%;
  background: #FFF;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: -20px 0 50px rgba(15,23,42,0.25);
}

.drawer-close {
  align-self: flex-start;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 18px;
  background: #E2E8F0;
  font-size: 26px;
  cursor: pointer;
}

.drawer h2 {
  margin: 6px 0 10px;
  font-size: 30px;
}

.drawer button:not(.drawer-close) {
  min-height: 58px;
  border: 0;
  border-radius: 18px;
  background: #F1F5F9;
  padding: 0 16px;
  text-align: right;
  font-size: 19px;
  font-weight: 950;
  cursor: pointer;
}

.amount-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.amount-grid button {
  width: 74px;
  height: 58px;
  border: 2px solid #DDE5F0;
  border-radius: 18px;
  background: #FFF;
  color: #0F172A;
  font-size: 19px;
  font-weight: 950;
  cursor: pointer;
}

.amount-grid button.big {
  width: 112px;
  height: 76px;
  font-size: 29px;
}

.warning {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #DC2626;
  color: #FFF;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.warning h2 {
  font-size: 32px;
}

.warning p {
  font-size: 20px;
  font-weight: 850;
}

.warning .actions button:first-child {
  background: #FFF;
  color: #DC2626;
}

.warning .actions button:last-child {
  background: #7F1D1D;
}

.summary {
  background: #FFF;
  border-radius: 24px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 8px 30px rgba(15,23,42,0.08);
}

.summary p {
  margin: 0;
  font-size: 17px;
  font-weight: 850;
}

.status {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.status button {
  border: 0;
  border-radius: 16px;
  background: #EAF0F6;
  padding: 12px 14px;
  font-size: 16px;
  font-weight: 950;
  cursor: pointer;
}

.hint {
  background: #EEF2FF;
  border-radius: 18px;
  padding: 14px;
  text-align: center;
  color: #475569;
  font-weight: 950;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment {
  background: #FFF;
  border-radius: 22px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  box-shadow: 0 8px 30px rgba(15,23,42,0.08);
}

@media (max-width: 420px) {
  .symbol-grid,
  .color-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .color {
    width: 62px;
  }

  .data-strip {
    grid-template-columns: 1fr;
  }
}
`;
