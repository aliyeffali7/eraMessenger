// Ortaq faylları cihazda saxlayır: bir dəfə açılan fayl keş qovluğunda qalır
// və sonra internet olmadan da açılır.
import { File, Paths } from "expo-file-system";

import { downloadFile } from "../api/files";

function localFile(item) {
  const safe = (item.name || "fayl").replace(/[^\w.\- ]+/g, "_").slice(-80);
  return new File(Paths.cache, `shared-${item.id}-${safe}`);
}

export function isDownloaded(item) {
  try {
    const file = localFile(item);
    return file.exists && file.size > 0;
  } catch {
    return false;
  }
}

// file:// uri qaytarır (lazım olsa əvvəlcə serverdən yükləyir).
export async function getSharedFileUri(item) {
  const file = localFile(item);
  if (file.exists && file.size > 0) return file.uri;
  const res = await downloadFile(item.id);
  if (!file.exists) file.create();
  file.write(new Uint8Array(res.data));
  return file.uri;
}

export function removeLocalCopy(item) {
  try {
    const file = localFile(item);
    if (file.exists) file.delete();
  } catch {
    /* keş — vacib deyil */
  }
}
