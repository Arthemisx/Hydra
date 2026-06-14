import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { colors } from "../lib/theme";
import { apiJson } from "../lib/api";

export default function PostSessionScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [postMass, setPostMass] = useState("");
  const [soaked, setSoaked] = useState(false);
  const [giSymptoms, setGiSymptoms] = useState("");
  const [fatigue, setFatigue] = useState("5");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!postMass) {
      Alert.alert("Erro", "Peso pós-sessão é obrigatório");
      return;
    }
    setLoading(true);
    try {
      await apiJson(`/sessions/${sessionId}/post`, {
        method: "PATCH",
        body: JSON.stringify({
          post_mass_kg: parseFloat(postMass),
          soaked_clothing: soaked,
          gi_symptoms: giSymptoms || null,
          fatigue_level: parseInt(fatigue),
        }),
      });
      navigation.navigate("Result", { sessionId });
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pós-sessão</Text>
      <Text style={styles.sub}>Dados após o treino</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Peso depois de urinar (kg) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Ex: 71.8"
          value={postMass}
          onChangeText={setPostMass}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Roupas muito encharcadas</Text>
          <Switch
            value={soaked}
            onValueChange={setSoaked}
            trackColor={{ true: colors.redPrimary }}
            thumbColor={colors.white}
          />
        </View>
        <Text style={styles.helper}>Roupas encharcadas podem gerar erro na pesagem</Text>

        <Text style={styles.label}>Sintomas gastrointestinais</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: nausea leve"
          value={giSymptoms}
          onChangeText={setGiSymptoms}
        />

        <Text style={styles.label}>Nivel de fadiga: {fatigue}/10</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="0-10"
          value={fatigue}
          onChangeText={setFatigue}
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Calculando..." : "Finalizar e Ver Resultados"}
          </Text>
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
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  btn: { backgroundColor: colors.redPrimary, borderRadius: 6, padding: 14, alignItems: "center", marginTop: 20 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});
