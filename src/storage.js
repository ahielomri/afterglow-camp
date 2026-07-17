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
        message = parsed.detail ? `${parsed.error}: ${parsed.detail}` : (parsed.error || message);
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.detail ? `${data.error}: ${data.detail}` : data.error);
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

// Admin-only: registers a real ID number (hashed server-side) for a
// member, giving them real ID verification instead of the weaker
// "no ID on file" path. Only succeeds if the caller is actually an
// admin/owner - checked inside the Edge Function itself. Works for both
// brand-new members and existing ones (e.g. adding/replacing an ID for
// someone who was added without one).
export async function adminSetMemberId(name, idNumber) {
  const { data, error } = await supabase.functions.invoke("admin-set-member-id", {
    body: { name, id: idNumber },
  });
  if (error) {
    let message = "set_id_failed";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        message = parsed.detail ? `${parsed.error}: ${parsed.detail}` : (parsed.error || message);
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Owner-only: clears a member's login (deletes their Supabase Auth account
// and unlinks it from their members row) without the admin ever setting or
// seeing a password - the member then goes through "כניסה ראשונה" again,
// which re-verifies their ID before letting them pick a new password. This
// is the secure replacement for an admin directly resetting someone's
// password (removed on purpose - see the note in the admin panel).
export async function adminResetMemberAccess(name) {
  const { data, error } = await supabase.functions.invoke("admin-reset-member-access", {
    body: { name },
  });
  if (error) {
    let message = "reset_failed";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        message = parsed.detail ? `${parsed.error}: ${parsed.detail}` : (parsed.error || message);
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Owner-only: promotes/demotes a member between "member" and "admin".
// Deliberately narrower than the admin-only actions above - checked
// server-side against the caller's own role, and the owner row itself
// can never be changed this way.
export async function adminSetMemberRole(name, role) {
  const { data, error } = await supabase.functions.invoke("admin-set-member-role", {
    body: { name, role },
  });
  if (error) {
    let message = "set_role_failed";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        message = parsed.detail ? `${parsed.error}: ${parsed.detail}` : (parsed.error || message);
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Owner-only: renames a member everywhere - the members table (and
// everything FK-linked to it), every kv_store blob that stores their
// name, and (if they already have an account) their login email, which
// is derived from their name. Checked server-side against the caller's
// own role.
export async function adminRenameMember(oldName, newName) {
  const { data, error } = await supabase.functions.invoke("admin-rename-member", {
    body: { oldName, newName },
  });
  if (error) {
    let message = "rename_failed";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        message = parsed.detail ? `${parsed.error}: ${parsed.detail}` : (parsed.error || message);
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Which members currently have a verified ID hash on file - names only,
// never the hash itself. Used to keep the login screen's "ID required"
// prompt in sync with DB truth instead of a static/optimistic client flag.
export async function listMembersWithIdOnFile() {
  const { data, error } = await supabase.rpc("members_with_id_on_file");
  if (error) throw error;
  return new Set((data || []).map((r) => r.name));
}

// Admin dashboard: who currently has push notifications enabled.
export async function listMembersWithPushEnabled() {
  const { data, error } = await supabase.rpc("members_with_push_enabled");
  if (error) throw error;
  return new Set((data || []).map((r) => r.name));
}

// Admin/owner-only: sends an ad-hoc push notification (e.g. an event
// reminder) to every subscribed device right now, separate from the
// automatic push that fires when a new announcement/poll is posted.
export async function sendEventReminderPush(title, message, targetName) {
  const { data, error } = await supabase.functions.invoke("send-event-reminder", {
    body: { title, message, targetName: targetName || undefined },
  });
  if (error) {
    let msg = "send_failed";
    try {
      const ctx = error.context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        msg = parsed.detail ? `${parsed.error}: ${parsed.detail}` : (parsed.error || msg);
      }
    } catch {
      // ignore - fall back to generic message
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// ---------------------------------------------------------------------------
// Per-row tables (added by security migration part 2). RLS on each of
// these enforces "only the owner (and admins where noted) can read this
// row" at the database level - not just in the app's UI.
// ---------------------------------------------------------------------------

// Private messages: RLS only returns rows where the caller is the
// sender or recipient, so this naturally returns "my messages".
export async function listMyPrivateMessages() {
  const { data, error } = await supabase
    .from("private_messages")
    .select("id, from_name, to_name, body, ts")
    .order("ts", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, from: r.from_name, to: r.to_name, text: r.body, ts: Number(r.ts) }));
}

export async function sendPrivateMessageRow(fromName, toName, text) {
  const { error } = await supabase.from("private_messages").insert({
    from_name: fromName,
    to_name: toName,
    body: text,
    ts: Date.now(),
  });
  if (error) throw error;
}

export async function deletePrivateMessageRow(id) {
  const { error } = await supabase.from("private_messages").delete().eq("id", id);
  if (error) throw error;
}

// Emergency info: RLS returns only the caller's own row unless they're
// an admin, in which case it returns everyone's - so this one query
// serves both the personal dashboard and the admin view correctly.
export async function listEmergencyInfo() {
  const { data, error } = await supabase.from("emergency_info").select("*");
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => {
    map[r.name] = {
      contactName: r.contact_name || "",
      contactPhone: r.contact_phone || "",
      allergies: r.allergies || "",
      medical: r.medical || "",
      dietary: r.dietary || "",
    };
  });
  return map;
}

export async function setMyEmergencyInfo(name, info) {
  const { error } = await supabase.from("emergency_info").upsert({
    name,
    contact_name: info.contactName || null,
    contact_phone: info.contactPhone || null,
    allergies: info.allergies || null,
    medical: info.medical || null,
    dietary: info.dietary || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Allocation info: same "own row, or everyone if admin" RLS shape as
// emergency_info above.
export async function listAllocationInfo() {
  const { data, error } = await supabase.from("allocation_info").select("*");
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => {
    map[r.name] = { hasAllocation: r.has_allocation, used: r.used, hasExtra: r.has_extra };
  });
  return map;
}

export async function setMyAllocationInfo(name, info) {
  const { error } = await supabase.from("allocation_info").upsert({
    name,
    has_allocation: info.hasAllocation || null,
    used: info.used || null,
    has_extra: info.hasExtra || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Keeps the real team_members table (used to gate finance permissions
// for the budget team) in sync whenever an admin manually assigns or
// removes someone from a team.
export async function addTeamMemberRow(teamName, memberName) {
  const { error } = await supabase.from("team_members").insert({ team_name: teamName, member_name: memberName });
  if (error) throw error;
}

export async function removeTeamMemberRow(teamName, memberName) {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_name", teamName)
    .eq("member_name", memberName);
  if (error) throw error;
}
