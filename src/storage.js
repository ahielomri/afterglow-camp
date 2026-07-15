import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Implements the exact same interface as Claude's window.storage,
// so App.jsx (copied over unchanged) keeps working as-is.
// - shared=false  -> plain browser localStorage (per-device, e.g. "remember who I am")
// - shared=true   -> Supabase table `kv_store`, shared by everyone using the app
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
