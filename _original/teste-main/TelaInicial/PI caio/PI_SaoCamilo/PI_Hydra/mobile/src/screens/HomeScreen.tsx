import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../lib/theme";
import { getUser, logout, User } from "../lib/auth";
import { apiJson } from "../lib/api";

interface Session {
  id: number;
  status: string;
  sport: string | null;
  created_at: string;
  mass_variation_pct: number | null;
  alert_level: string | null;
}

export default function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      getUser().then(setUser);
      apiJson<Session[]>("/sessions").then(setSessions).catch(() => {});
    }, [])
  );

  const handleLogout = async () => {
    await logout();
    navigation.replace("Login");
  };

  const alertColor = (level: string | null) => {
    if (level === "danger") return colors.redDanger;
    if (level === "caution") return colors.yellowCaution;
    if (level === "normal") return colors.greenOk;
    return colors.gray300;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hydra</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcome}>Bem vindo(a), {user?.name}!</Text>
        <Text style={styles.sub}>Registro diario</Text>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate("PreSession")}
        >
          <Text style={styles.newBtnText}>+ Nova Sessao</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Minhas Sessoes</Text>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>Nenhuma sessao registrada ainda.</Text>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() =>
                  item.status === "done"
                    ? navigation.navigate("Result", { sessionId: item.id })
                    : null
                }
              >
                <View style={styles.sessionRow}>
                  <View>
                    <Text style={styles.sessionSport}>
                      {item.sport || "Sem modalidade"}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    {item.mass_variation_pct !== null && (
                      <Text
                        style={[
                          styles.sessionVariation,
                          { color: alertColor(item.alert_level) },
                        ]}
                      >
                        {item.mass_variation_pct.toFixed(1)}%
                      </Text>
                    )}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            item.status === "done" ? "#D4EDDA" : "#FFF3CD",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {item.status === "done" ? "Concluida" : item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 3,
    borderBottomColor: colors.redPrimary,
    padding: 15,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: colors.redPrimary, letterSpacing: 1 },
  logoutText: { color: colors.gray500, fontSize: 14 },
  content: { flex: 1, padding: 16 },
  welcome: { fontSize: 20, fontWeight: "600", color: colors.gray900 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: 16 },
  newBtn: {
    backgroundColor: colors.redPrimary,
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  newBtnText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.redPrimary, marginBottom: 10 },
  empty: { color: colors.gray500, textAlign: "center", marginTop: 20 },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
  },
  sessionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionSport: { fontSize: 15, fontWeight: "600", color: colors.gray900 },
  sessionDate: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  sessionRight: { alignItems: "flex-end" },
  sessionVariation: { fontSize: 18, fontWeight: "700" },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: "600" },
});
