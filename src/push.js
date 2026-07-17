import { supabase } from "./storage.js";

// Public VAPID key (safe to expose in client code - it's the public half of the pair)
const VAPID_PUBLIC_KEY = "BPLqeRQu_1F-xLH38HpEr74mtgW8Q3_KugaV12lvW9pWbBXkfzDJp5PRjzt0OO22zqHTJRkZLty4UnkNV_g9zkc";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export function pushPermission() {
  if (!pushSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

// Notification.permission is a one-way, browser/OS-level grant that JS can
// never revoke - "denying" push in-app can only remove the subscription
// itself, so that's what actually reflects "am I currently receiving
// notifications", not the (permanently "granted") permission value.
export async function isPushSubscribed() {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function enablePush(memberName) {
  if (!pushSupported()) throw new Error("Push not supported on this device/browser");

  const reg = await navigator.serviceWorker.register("/sw.js");
  // Browsers can keep serving an old cached service worker for a long time
  // otherwise - force a check against the live file every time someone
  // (re-)enables push, so a stale worker from before this feature existed
  // (or before a fix to it) can't silently keep controlling the page.
  try {
    await reg.update();
  } catch {
    // ignore - not fatal, registration itself still succeeded
  }
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permission-denied");

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ member_name: memberName, subscription: sub.toJSON(), updated_at: new Date().toISOString() }, { onConflict: "member_name" });
  if (error) throw error;

  return true;
}

export async function disablePush(memberName) {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) await sub.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("member_name", memberName);
}

// Full reset for troubleshooting: unregisters every service worker
// controlling this page (clearing out any stale/broken worker that
// predates this feature or a fix to it), then registers a fresh one and
// re-subscribes from scratch. Use when push looks "on" in the UI but
// nothing actually arrives on the device.
export async function resetPush(memberName) {
  if (!pushSupported()) throw new Error("Push not supported on this device/browser");
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  await supabase.from("push_subscriptions").delete().eq("member_name", memberName);
  return enablePush(memberName);
}
