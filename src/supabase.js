import { createClient } from "@supabase/supabase-js";

// Not secrets: the anon key is meant to be public (access is enforced by
// RLS, not by hiding this key), so it's baked in directly rather than
// requiring a Vercel environment variable step. Project: check-timer-app,
// a dedicated Supabase project with no connection to Afterglow's.
const supabaseUrl = "https://qfiuooahinioysfxnmki.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXVvb2FoaW5pb3lzZnhubWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3OTcwMjksImV4cCI6MjEwMDM3MzAyOX0.qTje5ZPt3ISTNs5HoMtlABk8SBiV2DBAy-Z6Vhd9Ps4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEVICE_ID_KEY = "check_timer_device_id";

// Stands in for a login: an unguessable id generated once per device/browser
// and reused to tie that device's push subscription and pending reminders
// together. There is no real account system behind this app.
export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
