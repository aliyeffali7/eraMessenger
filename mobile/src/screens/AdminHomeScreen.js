import { ScrollView, StyleSheet } from "react-native";

import Card from "../components/Card";
import Row from "../components/Row";
import { useTheme } from "../theme";

export default function AdminHomeScreen({ navigation }) {
  const t = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.color.bg }} contentContainerStyle={styles.content}>
      <Card padded={false}>
        <Row
          first
          icon="people"
          title="Üzvləri idarə et"
          hint="Yeni üzv yarat"
          onPress={() => navigation.navigate("AdminUsers")}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
});
