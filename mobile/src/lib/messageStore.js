// Lokal mesaj indeksi — söhbət mətnlərində axtarış üçün (WhatsApp kimi).
//
// ChatScreen açılan söhbətlərin mesajlarını bura yazır; ChatListScreen-in
// axtarışı bu indeksə də baxır, ona görə axtarış internet olmadan da işləyir.
// AsyncStorage-də saxlanılır və çıxışda (logout) silinir.

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "msgindex:v1:";
const MAX_PER_CONVERSATION = 300;
const MAX_RESULTS = 60;

function keyFor(conversationId) {
  return `${PREFIX}${conversationId}`;
}

// msgs: [{ id, text, from, at, mine }]
export async function rememberMessages(conversationId, meta, msgs) {
  if (!conversationId || !msgs?.length) return;
  try {
    const raw = await AsyncStorage.getItem(keyFor(conversationId));
    const prev = raw ? JSON.parse(raw) : { messages: [] };

    const byId = new Map(prev.messages.map((m) => [m.id, m]));
    for (const m of msgs) {
      if (m.text == null || m.text === "") continue;
      byId.set(m.id, { id: m.id, text: m.text, from: m.from || "", at: m.at, mine: !!m.mine });
    }

    let merged = [...byId.values()].sort((a, b) => new Date(a.at) - new Date(b.at));
    if (merged.length > MAX_PER_CONVERSATION) {
      merged = merged.slice(merged.length - MAX_PER_CONVERSATION);
    }

    await AsyncStorage.setItem(
      keyFor(conversationId),
      JSON.stringify({
        name: meta?.name ?? prev.name ?? "",
        isGroup: meta?.isGroup ?? prev.isGroup ?? false,
        messages: merged,
      })
    );
  } catch {
    /* index is best-effort */
  }
}

// Returns [{ conversationId, name, isGroup, message: {id,text,from,at,mine} }]
// newest first, capped.
export async function searchMessages(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (!keys.length) return [];
    const entries = await AsyncStorage.multiGet(keys);

    const hits = [];
    for (const [k, raw] of entries) {
      if (!raw) continue;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const conversationId = k.slice(PREFIX.length);
      for (const m of parsed.messages || []) {
        if (m.text && m.text.toLowerCase().includes(q)) {
          hits.push({ conversationId, name: parsed.name, isGroup: parsed.isGroup, message: m });
        }
      }
    }
    hits.sort((a, b) => new Date(b.message.at) - new Date(a.message.at));
    return hits.slice(0, MAX_RESULTS);
  } catch {
    return [];
  }
}

export async function clearMessageIndex() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    /* ignore */
  }
}
