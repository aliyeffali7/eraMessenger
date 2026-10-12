import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme";

// İnternet olmayanda göstərilir: məlumat lokal keşdəndir.
export default function OfflineBanner({ visible }) {
  const t = useTheme();
  if (!visible) return null;
  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, { backgroundColor: t.color.surfaceAlt }]}>
        <Ionicons name="cloud-offline-outline" size={13} color={t.color.textSecondary} />
        <Text style={[t.typography.caption, { color: t.color.textSecondary }]}>
          Oflayn · yadda saxlanan məlumat göstərilir
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
