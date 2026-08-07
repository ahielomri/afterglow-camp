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
//
// Uploads need an authenticated session, and the underlying supabase-js
// client serializes session reads through a browser lock - if that lock is
// ever left held (e.g. the tab was backgrounded while the phone's camera/
// photo picker was open, which is exactly what happens when someone taps
// "add receipt"), the upload call can hang forever instead of failing. Race
// it against a timeout so the UI always comes back to life either way.
// Supabase Storage object keys only allow ASCII letters/digits plus a small
// punctuation set (see https://supabase.com/docs/guides/storage/uploads/file-limits#file-name-restrictions) -
// Hebrew (or any other non-ASCII) folder name gets the whole upload rejected
// with a 400 before it even reaches the database. Budget category names in
// this app are Hebrew, so strip anything outside that allowed set here
// rather than at every call site.
function sanitizeStorageSegment(s) {
  const cleaned = String(s || "").replace(/[^A-Za-z0-9 _\-.',!*&$@=;:+?()]/g, "").trim();
  return cleaned || "misc";
}

export async function uploadFile(file, folder = "receipts") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${sanitizeStorageSegment(folder)}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("upload_timeout")), 20000)
  );
  const { error } = await Promise.race([
    supabase.storage.from("receipts").upload(path, file, { cacheControl: "3600", upsert: false }),
    timeout,
  ]);
  if (error) throw error;
  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}

// Phone camera photos routinely land at 3-10MB and several thousand pixels
// wide - fine for one photo, but the gallery grid was loading dozens of
// those at full size just to show them in a small tile, which is what was
// making the app bog down. Downscaling to a reasonable display size before
// upload (not after - reprocessing everyone's existing photos isn't worth
// it) fixes that for every photo from here on, without capping how many
// photos or which sources someone can upload - only the stored resolution.
// createImageBitmap can fail to decode some formats (older HEIC support in
// non-Safari browsers) - fall back to the original file rather than
// blocking the upload over it.
async function resizeImageFile(file, maxDim = 1600, quality = 0.82) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close?.();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// Best-effort backup of the original, full-resolution file to the camp
// organizer's Google Drive (via the backup-photo-to-drive Edge Function),
// before the compressed copy goes to the app. Never throws - a slow or
// failed Drive backup should never stop someone from sharing a photo, so
// this is raced against a timeout and any error is swallowed. Returns the
// Drive file id on success (so downloads can fetch the original later) or
// null if the backup didn't happen.
async function backupOriginalToDrive(file, uploaderName) {
  try {
    // backup-photo-to-drive requires a real signed-in member session (not
    // just the public anon key - see the security hardening on the function
    // itself), and every member has a genuine Supabase Auth session by the
    // time they can upload a photo (see applyIdentity/handleLogin in
    // App.jsx), so this should always be available here.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const form = new FormData();
    form.append("file", file, file.name);
    // Camera/share-sheet uploads often arrive with a generic name (no real
    // extension) - fall back to jpg rather than embedding garbage after the
    // last dot of something like "File - 2026-08-01T22:18:43.508Z".
    const rawExt = file.name.split(".").pop() || "";
    const ext = /^[a-z0-9]{2,4}$/i.test(rawExt) ? rawExt.toLowerCase() : "jpg";
    const stamp = new Date().toISOString().slice(0, 19).replace("T", " ").replace(/:/g, "-");
    form.append("filename", `${stamp} - ${uploaderName}.${ext}`);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("drive_backup_timeout")), 25000));
    const { data, error } = await Promise.race([
      supabase.functions.invoke("backup-photo-to-drive", {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      }),
      timeout,
    ]);
    if (error) throw error;
    return data?.ok ? data.fileId : null;
  } catch (err) {
    console.error("Drive backup failed (non-blocking)", err);
    return null;
  }
}

// "מזכרת קטנה מאירוע גדול" - shared event photo gallery. Same
// upload-with-timeout shape as uploadFile (see the comment above it for
// why the timeout race matters on mobile), plus a companion event_photos
// row so every photo can show who posted it and be deleted by its owner
// or an admin - the storage bucket itself has no per-uploader-name RLS,
// only the auto-set `owner` (auth uid) column, so the DB row is what
// carries the human-readable attribution.
export async function uploadEventPhoto(file, uploaderName) {
  const driveFileId = await backupOriginalToDrive(file, uploaderName);
  const resized = await resizeImageFile(file);
  const ext = (resized.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("upload_timeout")), 30000)
  );
  const { error: uploadError } = await Promise.race([
    supabase.storage.from("event-photos").upload(path, resized, { cacheControl: "3600", upsert: false }),
    timeout,
  ]);
  if (uploadError) throw uploadError;
  const ts = Date.now();
  const { error: insertError } = await supabase
    .from("event_photos")
    .insert({ path, uploader_name: uploaderName, ts, drive_file_id: driveFileId });
  if (insertError) {
    await supabase.storage.from("event-photos").remove([path]);
    throw insertError;
  }
  const { data } = supabase.storage.from("event-photos").getPublicUrl(path);
  return { url: data.publicUrl, path, uploader: uploaderName, ts, driveFileId };
}

export async function listEventPhotos() {
  const { data, error } = await supabase
    .from("event_photos")
    .select("id, path, uploader_name, ts, tags, drive_file_id")
    .order("ts", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    path: r.path,
    uploader: r.uploader_name,
    ts: Number(r.ts),
    tags: r.tags || [],
    driveFileId: r.drive_file_id || null,
    url: supabase.storage.from("event-photos").getPublicUrl(r.path).data.publicUrl,
  }));
}

// Fetches the original, full-resolution version of a photo back from the
// organizer's Google Drive (via the get-drive-photo Edge Function) - used
// by the download button so people get the real photo, not the resized
// copy the gallery displays. Throws on failure; callers should fall back
// to the compressed Storage copy (photo.url) rather than block a download.
export async function fetchOriginalPhotoBlob(driveFileId) {
  // get-drive-photo requires a real signed-in member session (see the
  // security hardening on the function itself) - same reasoning as
  // backupOriginalToDrive above.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("not_signed_in");
  const url = `${supabaseUrl}/functions/v1/get-drive-photo?fileId=${encodeURIComponent(driveFileId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnonKey },
  });
  if (!res.ok) throw new Error(`get-drive-photo failed: ${res.status}`);
  return res.blob();
}

export async function deleteEventPhoto(id, path) {
  const { error: dbError } = await supabase.from("event_photos").delete().eq("id", id);
  if (dbError) throw dbError;
  await supabase.storage.from("event-photos").remove([path]);
}

// Re-reads the current tags before writing (instead of trusting whatever
// tags the caller last had in local state) so two people tagging the same
// photo around the same moment don't silently overwrite each other's tag -
// same "fetch fresh, then merge" shape used for the kv_store lists. Each
// tag is {name, x, y} - x/y are 0-100 percentages of the image's width/
// height, i.e. where on the photo that person actually is, not just a
// name in a list.
export async function addEventPhotoTag(id, name, x, y) {
  const { data: current, error: readError } = await supabase
    .from("event_photos")
    .select("tags")
    .eq("id", id)
    .single();
  if (readError) throw readError;
  const tags = current.tags || [];
  if (tags.some((t) => t.name === name)) return tags;
  const next = [...tags, { name, x, y }];
  const { error } = await supabase.from("event_photos").update({ tags: next }).eq("id", id);
  if (error) throw error;
  return next;
}

export async function removeEventPhotoTag(id, name) {
  const { data: current, error: readError } = await supabase
    .from("event_photos")
    .select("tags")
    .eq("id", id)
    .single();
  if (readError) throw readError;
  const next = (current.tags || []).filter((t) => t.name !== name);
  const { error } = await supabase.from("event_photos").update({ tags: next }).eq("id", id);
  if (error) throw error;
  return next;
}

// Photos the caller is tagged in that they haven't been shown the
// "תויגת בתמונה" popup for yet - used as the in-app fallback for members
// without push notifications enabled (push-enabled members get a real
// push instead, from the notify-photo-tag webhook).
export async function listUnseenPhotoTags(myName) {
  const [{ data: tagged, error: taggedError }, { data: seen, error: seenError }] = await Promise.all([
    supabase.from("event_photos").select("id, uploader_name").contains("tags", [{ name: myName }]),
    supabase.from("event_photo_tag_seen").select("photo_id").eq("member_name", myName),
  ]);
  if (taggedError) throw taggedError;
  if (seenError) throw seenError;
  const seenIds = new Set((seen || []).map((r) => r.photo_id));
  return (tagged || [])
    .filter((r) => !seenIds.has(r.id))
    .map((r) => ({ id: r.id, uploader: r.uploader_name }));
}

export async function markPhotoTagsSeen(photoIds, myName) {
  if (photoIds.length === 0) return;
  const { error } = await supabase
    .from("event_photo_tag_seen")
    .upsert(photoIds.map((id) => ({ photo_id: id, member_name: myName })), { onConflict: "photo_id,member_name" });
  if (error) throw error;
}

// Comments load per-photo, on demand (when the preview opens), rather than
// all up front with the photo list - most photos never get opened in a
// given session, so there's no reason to fetch every comment on every one.
export async function listPhotoComments(photoId) {
  const { data, error } = await supabase
    .from("event_photo_comments")
    .select("id, author_name, text, ts")
    .eq("photo_id", photoId)
    .order("ts", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, author: r.author_name, text: r.text, ts: Number(r.ts) }));
}

export async function addPhotoComment(photoId, authorName, text) {
  const ts = Date.now();
  const { data, error } = await supabase
    .from("event_photo_comments")
    .insert({ photo_id: photoId, author_name: authorName, text, ts })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, author: authorName, text, ts };
}

export async function deletePhotoComment(id) {
  const { error } = await supabase.from("event_photo_comments").delete().eq("id", id);
  if (error) throw error;
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

// Records that this member had the app open just now - lets admins tell
// "never logged in" (already tracked separately via login-history) apart
// from "logged in once and hasn't opened it since". RLS + a column-level
// grant restrict this to updating only the caller's own last_seen.
export async function touchLastSeen(name) {
  const { error } = await supabase
    .from("members")
    .update({ last_seen: new Date().toISOString() })
    .eq("name", name);
  if (error) throw error;
}

export async function listLastSeen() {
  const { data, error } = await supabase.from("members").select("name, last_seen");
  if (error || !data) return {};
  const map = {};
  data.forEach((r) => { map[r.name] = r.last_seen; });
  return map;
}

// Real table instead of a kv_store blob - a single INSERT can't race/clobber
// another member's concurrent entry the way a read-modify-write of one
// shared JSON array can, and it's one round trip instead of two (read the
// latest array, then write it back), which made this the most likely write
// in the whole app to get silently abandoned if someone navigated away
// right after their action (exactly when it ran, at the very end of the
// real action they cared about).
export async function insertActivityLog(actor, action, details) {
  // ts is NOT NULL with no DB-side default - has to be supplied here, or
  // every insert fails outright (silently, since callers only log/ignore
  // the error) and nothing ever lands in the table.
  const { error } = await supabase.from("activity_log").insert({ actor, action, details: details || "", ts: Date.now() });
  if (error) throw error;
}

// High default on purpose - every action ever logged stays permanently in
// the table (nothing here ever deletes rows), and the admin log view should
// show the whole history, not just a recent slice, now that logging itself
// actually works (see insertActivityLog's ts fix).
export async function listActivityLog(limit = 5000) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("ts, actor, action, details")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
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

// Archives a full snapshot of a member's data at the moment they're
// removed - gives the 7-day grace window (see purge-removed-members) a
// real starting point, and gives an admin something to download even
// after the person is gone. RLS restricts this to admins.
export async function archiveRemovedMember(name, removedBy, snapshot) {
  const { error } = await supabase
    .from("removed_members")
    .upsert({ name, removed_by: removedBy, snapshot, removed_at: new Date().toISOString() });
  if (error) throw error;
}

export async function listRemovedMembers() {
  const { data, error } = await supabase
    .from("removed_members")
    .select("name, removed_at, removed_by, snapshot")
    .order("removed_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Un-does a removal within the 7-day window - the member's real data was
// never touched during that window (only the archive row + the local
// "hide from view" list), so restoring is just clearing those.
export async function restoreRemovedMember(name) {
  const { error } = await supabase.from("removed_members").delete().eq("name", name);
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

// Kitchen shopping list: how many members marked vegetarian/vegan, as plain
// counts with no names attached - emergency_info itself (where dietary
// preference lives) is RLS-restricted to the member's own row unless you're
// an admin, so any non-admin kitchen-team member needs this aggregate
// instead of reading emergency_info directly.
export async function getDietaryPreferenceCounts() {
  const { data, error } = await supabase.rpc("dietary_preference_counts").single();
  if (error) throw error;
  return {
    vegetarian: Number(data?.vegetarian_count) || 0,
    vegan: Number(data?.vegan_count) || 0,
    allergies: Number(data?.allergy_count) || 0,
  };
}

// Admin/owner-only: sends an ad-hoc push notification (e.g. an event
// reminder) to every subscribed device right now, separate from the
// automatic push that fires when a new announcement/poll is posted.
export async function sendEventReminderPush(title, message, targetName, targetNames) {
  const { data, error } = await supabase.functions.invoke("send-event-reminder", {
    body: {
      title,
      message,
      targetName: targetName || undefined,
      targetNames: targetNames && targetNames.length > 0 ? targetNames : undefined,
    },
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
