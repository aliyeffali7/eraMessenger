import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, Text, View } from "react-native";

import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import { createUser, fetchAllUsers } from "../api/admin";
import { useTheme } from "../theme";

function UserRow({ item }) {
  const t = useTheme();
  return (
    <Card style={styles.card}>
      <Text style={[t.typography.bodySm, { fontSize: 15, color: t.color.textPrimary }]}>
        {item.first_name} {item.last_name} {item.is_staff ? "· Admin" : ""}
      </Text>
      <Text style={[t.typography.caption, { color: t.color.textSecondary }]}>@{item.username}</Text>
    </Card>
  );
}

export default function AdminUsersScreen() {
  const t = useTheme();
  const [users, setUsers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    fetchAllUsers().then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  async function create() {
    setError("");
    setCreating(true);
    try {
      await createUser({
        username: username.trim(),
        password,
        firstName,
        lastName,
      });
      setUsername("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setFormOpen(false);
      load();
    } catch {
      setError("Üzv yaradıla bilmədi. İstifadəçi adı artıq mövcud ola bilər.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <UserRow item={item} />}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 6 }}>
            <Button
              title={formOpen ? "Bağla" : "Yeni üzv"}
              variant={formOpen ? "ghost" : "primary"}
              icon={!formOpen ? <Ionicons name="person-add" size={16} color={t.color.textOnAccent} /> : null}
              onPress={() => setFormOpen((v) => !v)}
            />
            {formOpen ? (
              <Card style={{ marginTop: 12, gap: 10 }}>
                <Input label="Ad" value={firstName} onChangeText={setFirstName} />
                <Input label="Soyad" value={lastName} onChangeText={setLastName} />
                <Input label="İstifadəçi adı" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <Input label="Şifrə" value={password} onChangeText={setPassword} secureTextEntry />
                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color={t.color.danger} />
                    <Text style={[t.typography.caption, { color: t.color.danger, flex: 1 }]}>{error}</Text>
                  </View>
                ) : null}
                <Button title="Üzv yarat" onPress={create} loading={creating} />
              </Card>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
});
