import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Implements the exact same interface as Claude's window.storage,
// so App.jsx (copied over unchanged) keeps working as-is.
// - shared=false  -> plain browser localStorage (per-device, e.g. "remember who I am")
// - shared=true   -> Supabase table `kv_store`, shared by everyone using the app
//
// SECURITY NOTE: as of the security migration, kv_store has Row Level
// Security enabled and requires an authenticated session (see
// signInMember / setMemberPasswordAndSignIn below) for every
// read/write. Calls made before a real session exists will fail.
window.storage = {
  async get(key, shared = false) {
    if (!shared) {
      const value = localStorage.getItem(key);
      return value !== null ? { key, value, shared } : null;
    }
    const { data, error } = await supabase
      .from("kv_store")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { key, value: data.value, shared };
  },

  async set(key, value, shared = false) {
    if (!shared) {
      localStorage.setItem(key, value);
      return { key, value, shared };
    }
    const { error } = await supabase
      .from("kv_store")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    if (!shared) {
      localStorage.removeItem(key);
      return { key, deleted: true, shared };
    }
    const { error } = await supabase.from("kv_store").delete().eq("key", key);
    if (error) throw error;
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    if (!shared) {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      return { keys, prefix, shared };
    }
    const { data, error } = await supabase
      .from("kv_store")
      .select("key")
      .like("key", `${prefix}%`);
    if (error) throw error;
    return { keys: (data || []).map((r) => r.key), prefix, shared };
  },
};

// Real file storage (receipts, future attachments) via a Supabase Storage bucket.
// Requires a public bucket named "receipts" to be created once in the Supabase
// dashboard (Storage -> New bucket -> name "receipts" -> Public bucket: on).
export async function uploadFile(file, folder = "receipts") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Real auth (added by the security migration)
//
// Each member gets a genuine Supabase Auth account behind the scenes,
// keyed by a private synthetic email nobody ever sees. Government ID
// verification and password creation/reset happen server-side inside
// the "set-password" Edge Function (see supabase/functions/set-password)
// using the service-role key - the ID number and password hash never
// travel through, or live in, this client code.
// ---------------------------------------------------------------------------

// Must match the same function inside the set-password Edge Function.
function memberEmail(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `camper-${h.toString(36)}@afterglow.internal`;
}

// Normal returning-member login. Throws on wrong password / unknown login.
export async function signInMember(name, password) {
  const email = memberEmail(name);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// First-time setup AND "forgot password" reset - same call either way.
// Verifies the member's ID server-side (if they have one on file) before
// creating/updating their login, then signs the browser in.
export async function setMemberPasswordAndSignIn(name, id, newPassword) {
  const { data, error } = await supabase.functions.invoke("set-password", {
    body: { name, id, newPassword },
  });
  if (error) {
    let message = "set_password_failed";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        message = parsed.error || message;
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return signInMember(name, newPassword);
}

export async function signOutMember() {
  await supabase.auth.signOut();
}

// Resolves the currently active Supabase Auth session (if any) back to
// a member name, for restoring "who's logged in" on page load.
export async function getSignedInMemberName() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const { data, error } = await supabase
    .from("members")
    .select("name")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data.name;
}

// Roles now live in the `members` table (not hardcoded in the client
// bundle), so an admin flag can't just be edited in devtools.
export async function getMemberRole(name) {
  const { data, error } = await supabase.from("members").select("role").eq("name", name).maybeSingle();
  if (error || !data) return "member";
  return data.role;
}

// Bulk version used once per login to populate every member's role for
// the roster/admin views.
export async function getAllMemberRoles() {
  const { data, error } = await supabase.from("members").select("name, role");
  if (error || !data) return {};
  const map = {};
  data.forEach((r) => {
    map[r.name] = r.role;
  });
  return map;
}

// Registers a brand-new camper in the roster table so they can complete
// signup later (the set-password Edge Function requires a matching row
// here). Protected server-side by RLS: only an admin's session can
// insert into `members` - see the security migration.
export async function addMemberRow(name, role = "member") {
  const { error } = await supabase.from("members").insert({ name, role });
  if (error) throw error;
}
