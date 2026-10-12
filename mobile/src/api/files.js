import client, { UPLOAD_TIMEOUT_MS } from "./client";

export function fetchFiles() {
  return client.get("/files/");
}

// asset: { uri, name, mime } — expo-document-picker nəticəsi.
export function uploadFile(asset) {
  const form = new FormData();
  form.append("file", {
    uri: asset.uri,
    name: asset.name || "fayl",
    type: asset.mime || "application/octet-stream",
  });
  return client.post("/files/", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: UPLOAD_TIMEOUT_MS,
  });
}

export function downloadFile(fileId) {
  return client.get(`/files/${fileId}/download/`, {
    responseType: "arraybuffer",
    timeout: UPLOAD_TIMEOUT_MS,
  });
}

export function deleteFile(fileId) {
  return client.delete(`/files/${fileId}/`);
}
