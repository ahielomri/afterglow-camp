import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";

const symbols = ["🪬","🪩","🧿","🪐","🧬","🫧","🪄","🪞","🪶","🪸","🪷","🦋"];
const colors = ["#2563EB","#16A34A","#9333EA","#DC2626","#EA580C","#0891B2"];
const reminders = [30, 60, 90, 120];
const beforeOptions = [5,10,15,20,25,30,35,40,45,50];
const amounts = [
  0.1,0.2,0.3,0.4,
  0.5,1,0.6,0.7,
  0.8,0.9,1.1,1.2,
  1.3,1.4,1.5,1.6,
  1.7,1.8,1.9,2.1,
  2.2,2,2.3,2.4,
  2.5,2.6,2.7
];

function amountText(n) {
  const v = Number(n || 0);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function timeText(value) {
  const x = new Date(value);
  return x.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function dateText(value) {
  const x = new Date(value);
  return x.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function money(n) {
  const v = Number(n || 0);
  return `${Math.round(v * 100) / 100} ₪`;
}

export default function App() {
  const [screen, setScreen] = useState("main");

  const [mainUser, setMainUser] = useState(null);
  const [mainName, setMainName] = useState("");
  const [mainSymbol, setMainSymbol] = useState(symbols[0]);

  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState(symbols[1]);
  const [newColor, setNewColor] = useState(colors[0]);

  const [reminder, setReminder] = useState(90);
  const [pendingTime, setPendingTime] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [stockName, setStockName] = useState("");
  const [stockMl, setStockMl] = useState("");
  const [stockPrice, setStockPrice] = useState("");

  const [givePerson, setGivePerson] = useState("");
  const [giveMl, setGiveMl] = useState("");
  const [giveStatus, setGiveStatus] = useState("צריך לשלם");
  const [giveToPay, setGiveToPay] = useState("");
  const [givePaid, setGivePaid] = useState("");
  const [giveNote, setGiveNote] = useState("");

  const activeUser = users.find((u) => u.id === activeId);

  const stats = useMemo(() => {
    if (!activeUser) {
      return { taken: 0, given: 0, pricePerMl: 0, remaining: 0, openDebt: 0, last: null };
    }

    const taken = activeUser.entries.reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const given = activeUser.given.reduce((sum, x) => sum + Number(x.ml || 0), 0);
    const totalMl = Number(activeUser.stock.ml || 0);
    const totalPrice = Number(activeUser.stock.price || 0);
    const pricePerMl = totalMl > 0 ? totalPrice / totalMl : 0;
    const remaining = Math.max(totalMl - taken - given, 0);
    const openDebt = activeUser.given.reduce((sum, x) => {
      return sum + Math.max(Number(x.toPay || 0) - Number(x.paid || 0), 0);
    }, 0);

    return {
      taken,
      given,
      pricePerMl,
      remaining,
      openDebt,
      last: activeUser.entries[0] || null,
    };
  }, [activeUser]);

  function updateActive(patch) {
    setUsers((list) =>
      list.map((u) => (u.id === activeId ? { ...u, ...patch } : u))
    );
  }

  function saveMainUser() {
    if (!mainName.trim()) return;
    setMainUser({ name: mainName.trim(), symbol: mainSymbol });
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
      stock: { name: "", ml: "", price: "" },
      given: [],
    };

    setUsers([...users, user]);
    setNewName("");
    setNewSymbol(symbols[1]);
    setNewColor(colors[0]);
    setScreen("users");
  }

  function openUser(user) {
    setActiveId(user.id);
    setMenuOpen(false);
    setScreen("tracker");
  }

  function saveEntry(amount) {
    if (!activeUser || !pendingTime) return;

    const last = activeUser.entries[0];

    if (last) {
      const diffMinutes =
        (pendingTime.getTime() - new Date(last.takenAt).getTime()) / 60000;

      if (diffMinutes > -1 && diffMinutes < 60) {
        Alert.alert(
          "רגע, השעון מרים גבה",
          "חלפה פחות משעה מהסימון הקודם. שווה לעצור רגע ולבדוק שזה באמת הזמן הנכון."
        );
      }
    }

    const entry = {
      id: String(Date.now()),
      amount,
      takenAt: pendingTime.toISOString(),
      nextAt: addMinutes(pendingTime, reminder).toISOString(),
    };

    updateActive({ entries: [entry, ...activeUser.entries] });
    setPendingTime(null);
    setScreen("tracker");
  }

  function openStock() {
    setStockName(activeUser.stock.name || "");
    setStockMl(String(activeUser.stock.ml || ""));
    setStockPrice(String(activeUser.stock.price || ""));
    setMenuOpen(false);
    setScreen("stock");
  }

  function saveStock() {
    updateActive({
      stock: {
        name: stockName,
        ml: stockMl,
        price: stockPrice,
      },
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
      date: new Date().toISOString(),
    };

    updateActive({ given: [item, ...activeUser.given] });
    setScreen("tracker");
  }

  if (screen === "main") {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.center}>
          <Text style={styles.title}>הקמת משתמש ראשי</Text>
          <Text style={styles.sub}>המשתמש שמנהל את כל המעקבים באפליקציה.</Text>

          <TextInput
            value={mainName}
            onChangeText={setMainName}
            placeholder="שם המשתמש הראשי"
            style={styles.input}
            textAlign="right"
          />

          <View style={styles.grid}>
            {symbols.map((s) => (
              <Pressable
                key={s}
                onPress={() => setMainSymbol(s)}
                style={[styles.symbolBtn, mainSymbol === s && styles.selectedDark]}
              >
                <Text style={styles.symbolText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.primary} onPress={saveMainUser}>
            <Text style={styles.primaryText}>שמירה והמשך</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "users") {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          {mainUser && (
            <View style={styles.card}>
              <Text style={styles.bigSymbol}>{mainUser.symbol}</Text>
              <Text style={styles.cardTitle}>{mainUser.name}</Text>
              <Text style={styles.cardSub}>משתמש ראשי</Text>
            </View>
          )}

          <Pressable style={styles.primary} onPress={() => setScreen("createUser")}>
            <Text style={styles.primaryText}>הקמת יוזר חדש</Text>
          </Pressable>

          {users.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => openUser(user)}
              style={styles.userRow}
            >
              <View style={[styles.userIcon, { backgroundColor: user.color }]}>
                <Text style={styles.userIconText}>{user.symbol}</Text>
              </View>

              <View style={styles.userText}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userSub}>כניסה למסך מעקב</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "createUser") {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>הקמת יוזר</Text>

          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="שם היוזר"
            style={styles.input}
            textAlign="right"
          />

          <Text style={styles.label}>בחירת צבע</Text>
          <View style={styles.grid}>
            {colors.map((c) => (
              <Pressable
                key={c}
                onPress={() => setNewColor(c)}
                style={[
                  styles.colorBtn,
                  { backgroundColor: c },
                  newColor === c && styles.selectedColor,
                ]}
              />
            ))}
          </View>

          <Text style={styles.label}>בחירת סימן</Text>
          <View style={styles.grid}>
            {symbols.map((s) => (
              <Pressable
                key={s}
                onPress={() => setNewSymbol(s)}
                style={[styles.symbolBtn, newSymbol === s && styles.selectedDark]}
              >
                <Text style={styles.symbolText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.primary} onPress={saveNewUser}>
            <Text style={styles.primaryText}>שמירה</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={() => setScreen("users")}>
            <Text style={styles.secondaryText}>חזרה</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "tracker" && activeUser) {
    return (
      <SafeAreaView style={[styles.shell, { backgroundColor: activeUser.color + "12" }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen("users")} style={styles.topSmallBtn}>
            <Text style={styles.topSmallText}>חזרה</Text>
          </Pressable>

          <View style={styles.topName}>
            <Text style={styles.topTitle}>
              {activeUser.symbol} {activeUser.name}
            </Text>
          </View>

          <Pressable
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.dotsBtn}
          >
            <Text style={styles.dots}>⋯</Text>
          </Pressable>
        </View>

        {menuOpen && (
          <View style={styles.menu}>
            <Pressable onPress={openStock} style={styles.menuItem}>
              <Text style={styles.menuText}>מלאי ועלות</Text>
            </Pressable>

            <Pressable onPress={openGive} style={styles.menuItem}>
              <Text style={styles.menuText}>נתתי למישהו</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setScreen("payments");
              }}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>היסטוריית תשלומים</Text>
            </Pressable>

            <Pressable onPress={() => setMenuOpen(false)} style={styles.menuItem}>
              <Text style={styles.menuText}>סגירה</Text>
            </Pressable>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>מצטבר</Text>
              <Text style={styles.statValue}>{amountText(stats.taken)} מ״ל</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>זמן מאז הסימון האחרון</Text>
              <Text style={styles.statValue}>
                {stats.last ? timeText(stats.last.takenAt) : "אין סימון"}
              </Text>
            </View>
          </View>

          <View style={styles.historyBox}>
            <View style={styles.historyHead}>
              <Text style={styles.hCell}>כמות</Text>
              <Text style={styles.hCell}>שעה ← פעם הבאה</Text>
              <Text style={styles.hCell}>תאריך</Text>
            </View>

            {activeUser.entries.length === 0 ? (
              <Text style={styles.empty}>אין עדיין סימונים</Text>
            ) : (
              activeUser.entries.map((entry) => (
                <View key={entry.id} style={styles.historyRow}>
                  <Text style={styles.hCell}>{amountText(entry.amount)}</Text>
                  <Text style={styles.hCell}>
                    {timeText(entry.takenAt)} ← {timeText(entry.nextAt)}
                  </Text>
                  <Text style={styles.hCell}>{dateText(entry.takenAt)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomPanel}>
          <Text style={styles.labelCenter}>תזכיר לי עוד...</Text>

          <View style={styles.reminderRow}>
            {reminders.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReminder(r)}
                style={[
                  styles.reminderBtn,
                  reminder === r && { backgroundColor: activeUser.color },
                ]}
              >
                <Text
                  style={[
                    styles.reminderText,
                    reminder === r && styles.white,
                  ]}
                >
                  {r === 30 ? "30 דק׳" : r === 60 ? "1:00" : r === 90 ? "1:30" : "2:00"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                setPendingTime(new Date());
                setScreen("amount");
              }}
              style={[styles.actionBtn, { backgroundColor: activeUser.color }]}
            >
              <Text style={styles.actionText}>לוקח עכשיו</Text>
            </Pressable>

            <Pressable
              onPress={() => setScreen("before")}
              style={[styles.actionBtn, { backgroundColor: activeUser.color + "CC" }]}
            >
              <Text style={styles.actionText}>לקחתי לפני...</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "before") {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>לקחתי לפני...</Text>

          <View style={styles.amountGrid}>
            {beforeOptions.map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setPendingTime(addMinutes(new Date(), -m));
                  setScreen("amount");
                }}
                style={styles.amountBtn}
              >
                <Text style={styles.amountText}>{m} דק׳</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.secondary} onPress={() => setScreen("tracker")}>
            <Text style={styles.secondaryText}>חזרה</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "amount") {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>בחירת כמות</Text>

          <View style={styles.amountGrid}>
            {amounts.map((a, index) => {
              const big = a === 1 || a === 1.5 || a === 2;

              return (
                <Pressable
                  key={`${a}-${index}`}
                  onPress={() => saveEntry(a)}
                  style={[styles.amountBtn, big && styles.amountBig]}
                >
                  <Text style={[styles.amountText, big && styles.amountTextBig]}>
                    {amountText(a)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.secondary} onPress={() => setScreen("tracker")}>
            <Text style={styles.secondaryText}>חזרה</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "stock" && activeUser) {
    const pricePerMl = Number(stockMl || 0) > 0
      ? Number(stockPrice || 0) / Number(stockMl || 1)
      : 0;

    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>מלאי ועלות</Text>

          <TextInput
            value={stockName}
            onChangeText={setStockName}
            placeholder="שם פריט"
            style={styles.input}
            textAlign="right"
          />

          <TextInput
            value={stockMl}
            onChangeText={setStockMl}
            placeholder="כמות התחלתית במ״ל"
            keyboardType="numeric"
            style={styles.input}
            textAlign="right"
          />

          <TextInput
            value={stockPrice}
            onChangeText={setStockPrice}
            placeholder="מחיר כולל בש״ח"
            keyboardType="numeric"
            style={styles.input}
            textAlign="right"
          />

          <View style={styles.card}>
            <Text style={styles.rowText}>מחיר למ״ל: {money(pricePerMl)}</Text>
            <Text style={styles.rowText}>נלקח: {amountText(stats.taken)} מ״ל</Text>
            <Text style={styles.rowText}>ניתן לאחרים: {amountText(stats.given)} מ״ל</Text>
            <Text style={styles.rowText}>נשאר: {amountText(stats.remaining)} מ״ל</Text>
          </View>

          <Pressable style={styles.primary} onPress={saveStock}>
            <Text style={styles.primaryText}>שמירה</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={() => setScreen("tracker")}>
            <Text style={styles.secondaryText}>חזרה</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "give" && activeUser) {
    const suggested = Number(giveMl || 0) * stats.pricePerMl;

    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>נתתי למישהו</Text>

          <TextInput
            value={givePerson}
            onChangeText={setGivePerson}
            placeholder="למי נתת"
            style={styles.input}
            textAlign="right"
          />

          <TextInput
            value={giveMl}
            onChangeText={setGiveMl}
            placeholder="כמה במ״ל"
            keyboardType="numeric"
            style={styles.input}
            textAlign="right"
          />

          <View style={styles.statusRow}>
            {["צריך לשלם","שולם","חלקי","מתנה"].map((s) => (
              <Pressable
                key={s}
                onPress={() => setGiveStatus(s)}
                style={[styles.statusBtn, giveStatus === s && styles.selectedDark]}
              >
                <Text style={[styles.statusText, giveStatus === s && styles.white]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.hint}>סכום מומלץ לפי מלאי: {money(suggested)}</Text>

          <TextInput
            value={giveToPay}
            onChangeText={setGiveToPay}
            placeholder="סכום לתשלום"
            keyboardType="numeric"
            style={styles.input}
            textAlign="right"
          />

          <TextInput
            value={givePaid}
            onChangeText={setGivePaid}
            placeholder="כמה שולם בפועל"
            keyboardType="numeric"
            style={styles.input}
            textAlign="right"
          />

          <TextInput
            value={giveNote}
            onChangeText={setGiveNote}
            placeholder="הערה"
            style={styles.input}
            textAlign="right"
          />

          <Pressable style={styles.primary} onPress={saveGive}>
            <Text style={styles.primaryText}>שמירה</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={() => setScreen("tracker")}>
            <Text style={styles.secondaryText}>חזרה</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === "payments" && activeUser) {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>היסטוריית תשלומים</Text>

          <View style={styles.card}>
            <Text style={styles.rowText}>חוב פתוח: {money(stats.openDebt)}</Text>
          </View>

          {activeUser.given.length === 0 ? (
            <Text style={styles.empty}>אין עדיין נתינות</Text>
          ) : (
            activeUser.given.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitleSmall}>{item.person}</Text>
                <Text style={styles.rowText}>כמות: {amountText(item.ml)} מ״ל</Text>
                <Text style={styles.rowText}>סטטוס: {item.status}</Text>
                <Text style={styles.rowText}>לתשלום: {money(item.toPay)}</Text>
                <Text style={styles.rowText}>שולם: {money(item.paid)}</Text>
                <Text style={styles.rowText}>תאריך: {dateText(item.date)}</Text>
                {!!item.note && <Text style={styles.rowText}>הערה: {item.note}</Text>}
              </View>
            ))
          )}

          <Pressable style={styles.secondary} onPress={() => setScreen("tracker")}>
            <Text style={styles.secondaryText}>חזרה</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },
  center: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 18,
  },
  content: {
    padding: 18,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#0F172A",
  },
  sub: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#64748B",
    lineHeight: 24,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    fontSize: 17,
  },
  label: {
    textAlign: "right",
    fontSize: 15,
    fontWeight: "900",
    color: "#475569",
  },
  labelCenter: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "900",
    color: "#475569",
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  symbolBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDark: {
    backgroundColor: "#0F172A",
  },
  symbolText: {
    fontSize: 24,
  },
  colorBtn: {
    width: 58,
    height: 44,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  selectedColor: {
    borderColor: "#0F172A",
  },
  primary: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  secondary: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#334155",
    fontSize: 17,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    gap: 5,
  },
  bigSymbol: {
    fontSize: 38,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardTitleSmall: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSub: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },
  userRow: {
    minHeight: 82,
    borderRadius: 22,
    padding: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
  },
  userIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  userIconText: {
    color: "#FFFFFF",
    fontSize: 22,
  },
  userText: {
    flex: 1,
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  userSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
  topBar: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFFCC",
  },
  topSmallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  topSmallText: {
    fontWeight: "900",
    color: "#334155",
  },
  topName: {
    flex: 1,
    alignItems: "center",
  },
  topTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  dotsBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: -8,
  },
  menu: {
    position: "absolute",
    top: 58,
    right: 12,
    zIndex: 10,
    width: 210,
    borderRadius: 20,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  menuText: {
    textAlign: "right",
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 14,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    textAlign: "center",
  },
  statValue: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 6,
    textAlign: "center",
  },
  historyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 12,
  },
  historyHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingBottom: 8,
  },
  historyRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  hCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "800",
    color: "#334155",
  },
  empty: {
    textAlign: "center",
    color: "#64748B",
    fontWeight: "800",
    padding: 18,
  },
  bottomPanel: {
    padding: 14,
    backgroundColor: "#FFFFFFE6",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  reminderRow: {
    flexDirection: "row",
    gap: 8,
  },
  reminderBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderText: {
    fontWeight: "900",
    color: "#334155",
  },
  white: {
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  amountGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  amountBtn: {
    width: 72,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  amountBig: {
    width: 108,
    height: 72,
    backgroundColor: "#0F172A",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  amountTextBig: {
    fontSize: 26,
    color: "#FFFFFF",
  },
  rowText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
  hint: {
    fontSize: 15,
    fontWeight: "900",
    color: "#475569",
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  statusBtn: {
    paddingHorizontal: 14,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
  },
});
