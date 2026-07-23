import { supabase, getDeviceId } from "./supabase.js";

// Public VAPID key (safe to expose in client code - it's the public half of
// the pair). Must match the vapid_public_key row in the app_secrets table,
// which the send-due-reminders edge function signs pushes with.
const VAPID_PUBLIC_KEY = "BFEYpLhNGzeBpxudkgarPlzWsAM2VtDjUxSaSMtTKJgccNvSzXJVtPxuy3TAukn4CSxymLOo9OiF-4aZq8wIq90";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

// Registers the service worker, asks for notification permission, and makes
// sure a push subscription for this device is on file in Supabase. Safe to
// call repeatedly - it's a no-op once already subscribed.
export async function ensurePushEnabled() {
  if (!pushSupported()) throw new Error("push-unsupported");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permission-denied");

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { device_id: getDeviceId(), subscription: sub.toJSON(), updated_at: new Date().toISOString() },
      { onConflict: "device_id" }
    );
  if (error) throw error;
}

// Queues a reminder that a scheduled cron job on the server will push to
// this device at the right time, even if the app/tab is closed by then.
export async function scheduleServerReminder({ title, body, remindAt }) {
  const { error } = await supabase.from("pending_reminders").insert({
    device_id: getDeviceId(),
    title,
    body,
    remind_at: remindAt,
  });
  if (error) throw error;
}
