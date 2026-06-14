import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors } from "../lib/theme";
import { apiJson } from "../lib/api";

interface SessionData {
  id: number;
  status: string;
  sport: string | null;
  created_at: string;
  pre_mass_kg: number | null;
  post_mass_kg: number | null;
  fluid_intake_ml: number;
  adjusted_loss_kg: number | null;
  sweat_rate_lh: number | null;
  mass_variation_pct: number | null;
  hydration_balance_ml: number | null;
  recommended_intake_ml_h: number | null;
  alert_level: string | null;
  soaked_clothing: boolean;
}

export default function ResultScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    apiJson<SessionData>(`/sessions/${sessionId}`).then(setSession);
  }, [sessionId]);

  if (!session) return null;

  const alertConfig: Record<string, { text: string; bg: string; color: string }> = {
    danger: { text: "Desidratacao severa! Perda acima de 2%.", bg: "#FDE8E8", color: colors.redDanger },
    caution: { text: "Atencao! Perda entre 1-2%. Aumente a ingestao.", bg: "#FFF3CD", color: "#856404" },
    normal: { text: "Hidratacao adequada. Continue assim!", bg: "#D4EDDA", color: "#155724" },
  };

  const alert = session.alert_level ? alertConfig[session.alert_level] : null;

  const statColor = (level: string | null) => {
    if (level === "danger") return colors.redDanger;
    if (level === "caution") return colors.yellowCaution;
    return colors.greenOk;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resultado</Text>
      <Text style={styles.sub}>
        {session.sport || "Sessao"} — {new Date(session.created_at).toLocaleDateString("pt-BR")}
      </Text>

      {/* Alert */}
      {alert && (
        <View style={[styles.alertBox, { backgroundColor: alert.bg }]}>
          <Text style={[styles.alertText, { color: alert.color }]}>{alert.text}</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.stat, { borderLeftColor: statColor(session.alert_level) }]}>
          <Text style={styles.statValue}>{session.adjusted_loss_kg?.toFixed(2)}</Text>
          <Text style={styles.statUnit}>kg</Text>
          <Text style={styles.statLabel}>Perda Ajustada</Text>
        </View>
        <View style={[styles.stat, { borderLeftColor: statColor(session.alert_level) }]}>
          <Text style={styles.statValue}>{session.sweat_rate_lh?.toFixed(2)}</Text>
          <Text style={styles.statUnit}>L/h</Text>
          <Text style={styles.statLabel}>Taxa Sudorese</Text>
        </View>
        <View style={[styles.stat, { borderLeftColor: statColor(session.alert_level) }]}>
          <Text style={styles.statValue}>{session.mass_variation_pct?.toFixed(1)}</Text>
          <Text style={styles.statUnit}>%</Text>
          <Text style={styles.statLabel}>Variacao Massa</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{session.hydration_balance_ml?.toFixed(0)}</Text>
          <Text style={styles.statUnit}>mL</Text>
          <Text style={styles.statLabel}>Balanco Hidrico</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{session.recommended_intake_ml_h?.toFixed(0)}</Text>
          <Text style={styles.statUnit}>mL/h</Text>
          <Text style={styles.statLabel}>Recomendacao</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{session.fluid_intake_ml?.toFixed(0)}</Text>
          <Text style={styles.statUnit}>mL</Text>
          <Text style={styles.statLabel}>Total Ingerido</Text>
        </View>
      </View>

      {/* Data summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados Coletados</Text>
        <Text style={styles.dataRow}>Peso pre: {session.pre_mass_kg} kg</Text>
        <Text style={styles.dataRow}>Peso pos: {session.post_mass_kg} kg</Text>
        {session.soaked_clothing && (
          <Text style={[styles.dataRow, { color: colors.yellowCaution }]}>
            ⚠ Roupas encharcadas registradas
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.backBtnText}>Voltar ao inicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginTop: 10 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: 16 },
  alertBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  alertText: { fontSize: 14, fontWeight: "500" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  stat: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    width: "48%",
    borderLeftWidth: 4,
    borderLeftColor: colors.redPrimary,
    elevation: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  statUnit: { fontSize: 13, color: colors.gray500 },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: 8, padding: 16, elevation: 1, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.redPrimary, marginBottom: 10 },
  dataRow: { fontSize: 14, color: colors.gray700, marginBottom: 4 },
  backBtn: { backgroundColor: colors.gray200, borderRadius: 6, padding: 14, alignItems: "center", marginBottom: 30 },
  backBtnText: { color: colors.gray700, fontSize: 16, fontWeight: "600" },
});
