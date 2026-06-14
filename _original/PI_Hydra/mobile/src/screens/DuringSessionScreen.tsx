import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { colors } from "../lib/theme";
import { apiJson } from "../lib/api";

const FLUID_PRESETS = [
  { icon: "💧", label: "Squeeze", volume: 150, source: "squeeze_bottle" },
  { icon: "🥤", label: "Copo", volume: 200, source: "cup" },
  { icon: "🧴", label: "Garrafa", volume: 500, source: "bottle" },
];

export default function DuringSessionScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [fluidTotal, setFluidTotal] = useState(0);
  const [actualDuration, setActualDuration] = useState("");
  const [urineVolume, setUrineVolume] = useState("");
  const [loading, setLoading] = useState(false);

  const loadFluid = async () => {
    const events = await apiJson<Array<{ volume_ml: number }>>(
      `/sessions/${sessionId}/fluid`
    );
    setFluidTotal(events.reduce((sum, e) => sum + e.volume_ml, 0));
  };

  useEffect(() => {
    loadFluid();
  }, []);

  const addFluid = async (volume: number, source: string) => {
    await apiJson(`/sessions/${sessionId}/fluid`, {
      method: "POST",
      body: JSON.stringify({ volume_ml: volume, source }),
    });
    loadFluid();
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await apiJson(`/sessions/${sessionId}/during`, {
        method: "PATCH",
        body: JSON.stringify({
          actual_duration_min: actualDuration ? parseInt(actualDuration) : null,
          urine_volume_ml: urineVolume ? parseFloat(urineVolume) : 0,
        }),
      });
      navigation.navigate("PostSession", { sessionId });
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Durante a Sessao</Text>
      <Text style={styles.sub}>Registre a ingestao de fluidos</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Registrar fluido</Text>
        <View style={styles.fluidRow}>
          {FLUID_PRESETS.map((p) => (
            <TouchableOpacity
              key={p.source}
              style={styles.fluidBtn}
              onPress={() => addFluid(p.volume, p.source)}
            >
              <Text style={styles.fluidIcon}>{p.icon}</Text>
              <Text style={styles.fluidLabel}>{p.label}</Text>
              <Text style={styles.fluidVolume}>{p.volume} mL</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total ingerido</Text>
          <Text style={styles.totalValue}>{fluidTotal} mL</Text>
        </View>

        <Text style={styles.label}>Duracao real (min)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Ex: 55"
          value={actualDuration}
          onChangeText={setActualDuration}
        />

        <Text style={styles.label}>Volume urinario (mL)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Apenas quando aplicavel"
          value={urineVolume}
          onChangeText={setUrineVolume}
        />
        <Text style={styles.helper}>** Apenas quando aplicavel</Text>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Salvando..." : "Salvar e Continuar"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900, marginTop: 10 },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: 16 },
  card: { backgroundColor: colors.white, borderRadius: 8, padding: 16, elevation: 1 },
  label: { fontSize: 14, fontWeight: "600", color: colors.gray700, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.gray300, borderRadius: 6, padding: 10, fontSize: 16 },
  helper: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  fluidRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  fluidBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  fluidIcon: { fontSize: 24 },
  fluidLabel: { fontSize: 12, color: colors.gray700, marginTop: 2 },
  fluidVolume: { fontSize: 14, fontWeight: "700", color: colors.redPrimary },
  totalBox: {
    backgroundColor: colors.gray50,
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  totalLabel: { fontSize: 12, color: colors.gray500 },
  totalValue: { fontSize: 22, fontWeight: "700", color: colors.redPrimary },
  btn: { backgroundColor: colors.redPrimary, borderRadius: 6, padding: 14, alignItems: "center", marginTop: 20 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});
