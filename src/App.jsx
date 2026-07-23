"use client";

import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "check_timer_vercel_full_v1";

const SYMBOLS = [
  "🪬","🪩","🧿","🪐","🧬","🫧","🪄","🪞","🪶","🪸",
  "🪷","🪻","🛸","🪁","🧭","🧩","🦚","🦋","🪅","🎐"
];

const COLORS = [
  "#A78BFA",
  "#60A5FA",
  "#5FD19A",
  "#EBA33A",
  "#DC6BA8",
  "#7C83ED",
  "#5BC5D6",
  "#E87080"
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

function amountText(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function money(value) {
  const n = Number(value || 0);
  return `${Math.round(n * 100) / 100} ₪`;
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

function sinceText(value) {
  if (!value) return "00:00";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const totalMinutes = Math.floor(diff / 60000);
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function App() {
  const [data, setData] = useState({ mainUser: null, users: [] });
  const [screen, setScreen] = useState("boot");
  const [activeId, setActiveId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clock, setClock] = useState(Date.now());

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

  useEffect(() => {
    document.title = "My G";

    let meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "My G");

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
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeUser = data.users.find((u) => u.id === activeId);
  const activeColor = activeUser?.color || newColor || COLORS[0];

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

    const taken = activeUser.entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const given = activeUser.given.reduce((sum, item) => sum + Number(item.ml || 0), 0);

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
        if (user.id !== userId) return user;
        return { ...user, ...patch };
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
      stock: { name: "", ml: "", price: "" },
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
    setActiveId(user.id);
    setMenuOpen(false);
    setScreen("tracker");
  }

  function startNow() {
    setPendingTime(new Date());
    setScreen("amount");
  }

  function startBefore(minutes) {
    setPendingTime(addMinutes(new Date(), -minutes));
    setScreen("amount");
  }

  function saveEntry(amount, force = false) {
    if (!activeUser || !pendingTime) return;

    const last = activeUser.entries[0];

    if (last && !force) {
      const diff = (pendingTime.getTime
