import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { colors, urineColors } from "../lib/theme";
import { apiJson } from "../lib/api";

export default function PreSessionScreen({ navigation }: any) {
  const [preMass, setPreMass] = useState("");
  const [sport, setSport] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [urineColor, setUrineColor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!preMass) {
      Alert.alert("Erro", "Peso pre-sessao e obrigatorio");
      return;
    }
    setLoading(true);
    try {
      const session = await apiJson<{ id: number }>("/sessions", {
        method: "POST",
        body: JSON.stringify({
          pre_mass_kg: parseFloat(preMass),
          sport: sport || null,
          temperature_c: temperature ? parseFloat(temperature) : null,
          humidity_pct: humidity ? parseFloat(humidity) : null,
          expected_duration_min: expectedDuration ? parseInt(expectedDuration) : null,
          perceived_intensity: "moderate",
          urine_color: urineColor,
        }),
      });
      navigation.navigate("DuringSession", { sessionId: session.id });
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pre-sessao</Text>
      <Text style={styles.sub}>Preencha os dados antes do treino</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Peso antes de urinar (kg) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Ex: 72.5"
          value={preMass}
          onChangeText={setPreMass}
        />

        <Text style={styles.label}>Modalidade</Text>
        <TextInput style={styles.input} placeholder="Ex: Corrida" value={sport} onChangeText={setSport} />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Temp (°C)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="28" value={temperature} onChangeText={setTemperature} />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Umidade (%)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" placeholder="65" value={humidity} onChangeText={setHumidity} />
          </View>
        </View>

        <Text style={styles.label}>Duracao prevista (min)</Text>
        <TextInput style={styles.input} keyboardType="number-pad" placeholder="60" value={expectedDuration} onChangeText={setExpectedDuration} />

        <Text style={styles.label}>Cor da urina</Text>
        <View style={styles.urineRow}>
          {urineColors.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.urineTube,
                { backgroundColor: c },
                urineColor === i + 1 && styles.urineSelected,
              ]}
              onPress={() => setUrineColor(i + 1)}
            >
              <Text style={styles.urineLabel}>{i + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
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
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  urineRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  urineTube: { width: 36, height: 50, borderRadius: 4, borderWidth: 2, borderColor: "transparent", justifyContent: "flex-end", alignItems: "center", paddingBottom: 2 },
  urineSelected: { borderColor: colors.redPrimary, transform: [{ scale: 1.1 }] },
  urineLabel: { fontSize: 10, color: colors.gray700 },
  btn: { backgroundColor: colors.redPrimary, borderRadius: 6, padding: 14, alignItems: "center", marginTop: 20 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});
