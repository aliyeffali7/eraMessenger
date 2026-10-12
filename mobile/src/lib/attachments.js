// Səs mesajı və fayl qoşmaları: fayl olduğu kimi yüklənir, meta (ad, növ,
// ölçü, müddət) mesaj mətninin içində gedir. Yüklənmiş qoşmalar cihazın keş
// qovluğunda saxlanılır — internet olmadan da açılır.
import { File, Paths } from "expo-file-system";

import client, { UPLOAD_TIMEOUT_MS } from "../api/client";

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

// Mesaj mətninin qoşma olduğunu göstərən görünməz prefiks.
const MARK = "\u0001ATT:";

export function encodeAttachmentBody(meta) {
  return MARK + JSON.stringify(meta);
}

// { kind: "voice"|"file", name, mime, size, dur? } və ya null
export function parseAttachmentBody(body) {
  if (typeof body !== "string" || !body.startsWith(MARK)) return null;
  try {
    const meta = JSON.parse(body.slice(MARK.length));
    return meta && (meta.kind === "voice" || meta.kind === "file") ? meta : null;
  } catch {
    return null;
  }
}

// Söhbət siyahısı / axtarış üçün qısa mətn.
export function describeBody(body) {
  const meta = parseAttachmentBody(body);
  if (!meta) return body;
  return meta.kind === "voice" ? "🎤 Səs mesajı" : `📎 ${meta.name || "Fayl"}`;
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function extensionOf(meta) {
  if (meta.kind === "voice") return "m4a";
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(meta.name || "");
  return m ? m[1].toLowerCase() : "bin";
}

// Qoşmanı göndərir. asset: { uri, name, mime, size, dur? }.
export function sendAttachment({ conversationId, kind, asset }) {
  const meta = {
    kind,
    name: asset.name || (kind === "voice" ? "voice.m4a" : "file"),
    mime: asset.mime || "application/octet-stream",
    size: asset.size || 0,
    ...(asset.dur ? { dur: asset.dur } : {}),
  };

  const form = new FormData();
  form.append("text", encodeAttachmentBody(meta));
  form.append("attachment", { uri: asset.uri, name: meta.name, type: meta.mime });

  return client.post(`/chat/conversations/${conversationId}/messages/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: UPLOAD_TIMEOUT_MS,
  });
}

// Qoşmanı yükləyir, keşdə saxlayır, file:// uri qaytarır.
export async function getAttachmentUri(conversationId, messageId, meta) {
  // Paylaşanda alıcı tətbiq orijinal adı görsün deyə adı saxlayırıq.
  const safe = (meta.name || "").replace(/[^\w.\- ]+/g, "_").slice(-60);
  const file = new File(
    Paths.cache,
    meta.kind === "voice" ? `att-${messageId}.m4a` : `att-${messageId}-${safe || `file.${extensionOf(meta)}`}`
  );
  if (file.exists && file.size > 0) return file.uri;

  const res = await client.get(
    `/chat/conversations/${conversationId}/messages/${messageId}/attachment/`,
    { responseType: "arraybuffer", timeout: UPLOAD_TIMEOUT_MS }
  );
  if (!file.exists) file.create();
  file.write(new Uint8Array(res.data));
  return file.uri;
}
