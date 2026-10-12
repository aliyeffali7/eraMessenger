import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import Button from "../components/Button";
import Card from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import OfflineBanner from "../components/OfflineBanner";
import SearchBar from "../components/SearchBar";
import { deleteFile, fetchFiles, uploadFile } from "../api/files";
import { useAuth } from "../context/AuthContext";
import { formatSize } from "../lib/attachments";
import { fullDateTime } from "../lib/format";
import { cacheKeys, isNetworkError, readCache, writeCache } from "../lib/offlineCache";
import { getSharedFileUri, isDownloaded, removeLocalCopy } from "../lib/sharedFiles";
import { useTheme } from "../theme";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function uploaderName(u) {
  if (!u) return "Naməlum";
  return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username;
}

function iconFor(item) {
  const mime = item.mime || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "musical-notes";
  if (mime.startsWith("video/")) return "film";
  if (mime === "application/pdf") return "document-text";
  return "document";
}

// Ortaq fayllar: hər kəs fayl yükləyə və hamının yüklədiyi faylları aça bilər.
export default function FilesScreen({ navigation }) {
  const t = useTheme();
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [offline, setOffline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState(null);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(null), 2600);
  }

  function replaceFiles(next) {
    setFiles(next);
    writeCache(cacheKeys.files, next);
  }

  useEffect(() => {
    readCache(cacheKeys.files).then((cached) => {
      if (cached) setFiles((prev) => (prev.length ? prev : cached));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchFiles()
        .then(({ data }) => {
          if (!active) return;
          replaceFiles(data);
          setOffline(false);
        })
        .catch((err) => active && isNetworkError(err) && setOffline(true));
      return () => {
        active = false;
      };
    }, [])
  );

  async function pickAndUpload() {
    if (uploading) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      if (a.size && a.size > MAX_FILE_BYTES) {
        flash("Fayl 15 MB-dan böyük ola bilməz");
        return;
      }
      setUploading(true);
      const { data } = await uploadFile({ uri: a.uri, name: a.name, mime: a.mimeType });
      setFiles((prev) => {
        const next = [data, ...prev.filter((f) => f.id !== data.id)];
        writeCache(cacheKeys.files, next);
        return next;
      });
      setOffline(false);
      flash("Fayl yükləndi ✓");
    } catch (err) {
      if (isNetworkError(err)) setOffline(true);
      flash(isNetworkError(err) ? "İnternet yoxdur — fayl yüklənmədi" : "Fayl yüklənə bilmədi");
    } finally {
      setUploading(false);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        uploading ? (
          <ActivityIndicator color={t.color.accent} style={{ marginRight: 16 }} />
        ) : (
          <Pressable onPress={pickAndUpload} hitSlop={10} style={{ marginRight: 16 }}>
            <Ionicons name="add-circle-outline" size={24} color={t.color.accent} />
          </Pressable>
        ),
    });
  });

  async function open(item) {
    setBusyId(item.id);
    try {
      const uri = await getSharedFileUri(item);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: item.mime || undefined, dialogTitle: item.name });
      } else {
        flash("Bu cihazda faylı açmaq mümkün deyil");
      }
    } catch (err) {
      flash(isNetworkError(err) ? "Fayl hələ yüklənməyib — internet lazımdır" : "Fayl açıla bilmədi");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const item = toDelete;
    setToDelete(null);
    if (!item) return;
    try {
      await deleteFile(item.id);
      removeLocalCopy(item);
      replaceFiles(files.filter((f) => f.id !== item.id));
    } catch (err) {
      flash(isNetworkError(err) ? "İnternet yoxdur — fayl silinmədi" : "Fayl silinə bilmədi");
    }
  }

  const q = search.trim().toLowerCase();
  const rows = files.filter((f) => !q || f.name.toLowerCase().includes(q));

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <View style={styles.top}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Fayl axtar" />
      </View>
      <OfflineBanner visible={offline} />
      {notice ? (
        <View style={styles.noticeWrap}>
          <View style={[styles.pill, { backgroundColor: t.color.accent }]}>
            <Text style={[t.typography.caption, { color: t.color.textOnAccent }]}>{notice}</Text>
          </View>
        </View>
      ) : null}
      <FlatList
        data={rows}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        renderItem={({ item }) => {
          const canDelete = user.is_staff || item.uploaded_by?.id === user.id;
          const saved = isDownloaded(item);
          return (
            <Card style={styles.card}>
              <View style={[styles.fileIcon, { backgroundColor: t.color.accentMuted }]}>
                <Ionicons name={iconFor(item)} size={22} color={t.color.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.bodySm, { fontSize: 15, color: t.color.textPrimary }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[t.typography.caption, { color: t.color.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                  {[formatSize(item.size), uploaderName(item.uploaded_by)].filter(Boolean).join(" · ")}
                </Text>
                <Text style={[t.typography.caption, { color: t.color.textSecondary }]}>
                  {fullDateTime(item.created_at)}
                  {saved ? " · cihazda saxlanılıb" : ""}
                </Text>
                <View style={styles.actions}>
                  <Button
                    title="Aç"
                    variant="secondary"
                    loading={busyId === item.id}
                    onPress={() => open(item)}
                    style={styles.actionBtn}
                  />
                  {canDelete ? (
                    <Button title="Sil" variant="ghost" onPress={() => setToDelete(item)} style={styles.actionBtn} />
                  ) : null}
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title={search ? "Fayl tapılmadı" : "Hələ fayl yoxdur"}
            hint={search ? "Başqa açar söz yazın" : "İlk faylı siz yükləyin"}
            actionLabel={search ? null : "Fayl yüklə"}
            onAction={pickAndUpload}
          />
        }
      />

      <ConfirmDialog
        visible={!!toDelete}
        title="Fayl silinsin?"
        message={toDelete ? `"${toDelete.name}" hamı üçün silinəcək.` : ""}
        confirmLabel="Sil"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  card: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  fileIcon: { width: 42, height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: { paddingHorizontal: 20, minHeight: 36 },
  noticeWrap: { alignItems: "center", paddingVertical: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
