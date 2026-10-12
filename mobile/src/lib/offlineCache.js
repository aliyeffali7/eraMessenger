// Oflayn keş: profil, söhbətlər, mesajlar, iclaslar və fayl siyahısı
// AsyncStorage-də saxlanılır ki, tətbiq internet olmadan da açılsın və son
// görülən məlumatı göstərsin. Çıxışda (logout) tam silinir.

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "offline:v1:";
const MAX_MESSAGES = 500;

// Polling hər bir neçə saniyədən bir eyni cavabı qaytarır — dəyişməyibsə
// diskə yenidən yazmırıq.
const lastWritten = new Map();

export const cacheKeys = {
  me: "me",
  conversations: "conversations",
  conversation: (id) => `conversation:${id}`,
  messages: (id) => `messages:${id}`,
  meetings: "meetings",
  files: "files",
};

export async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key, value) {
  try {
    const json = JSON.stringify(value);
    if (lastWritten.get(key) === json) return;
    lastWritten.set(key, json);
    await AsyncStorage.setItem(PREFIX + key, json);
  } catch {
    /* keş vacib deyil */
  }
}

// Yalnız serverə çatmış mesajları saxla (göndərilməkdə olanları yox).
export function cacheMessages(conversationId, messages) {
  const settled = messages.filter((m) => !m._pending && !m._failed);
  return writeCache(cacheKeys.messages(conversationId), settled.slice(-MAX_MESSAGES));
}

export async function clearOfflineCache() {
  lastWritten.clear();
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    /* ignore */
  }
}

// axios: cavab yoxdursa (internet yoxdur / server əlçatmazdır) — şəbəkə xətası.
export function isNetworkError(err) {
  return Boolean(err) && !err.response;
}
