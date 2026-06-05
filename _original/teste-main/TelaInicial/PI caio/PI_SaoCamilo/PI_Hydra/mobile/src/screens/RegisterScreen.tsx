import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { colors } from "../lib/theme";
import { register } from "../lib/auth";

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("athlete");
  const [sport, setSport] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erro", "Preencha todos os campos obrigatorios");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Erro", "As senhas nao coincidem");
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role, sport: sport || undefined });
      navigation.replace("Home");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hydra</Text>
        <Text style={styles.subtitle}>Crie sua conta</Text>

        <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Confirmar senha" secureTextEntry value={confirm} onChangeText={setConfirm} />

        <Text style={styles.label}>Tipo de usuario:</Text>
        <View style={styles.roleRow}>
          {[
            { key: "athlete", label: "Atleta" },
            { key: "team", label: "Nutricionista" },
          ].map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
              onPress={() => setRole(r.key)}
            >
              <Text style={[styles.roleBtnText, role === r.key && styles.roleBtnTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {role === "athlete" && (
          <TextInput style={styles.input} placeholder="Modalidade (ex: Corrida)" value={sport} onChangeText={setSport} />
        )}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? "Cadastrando..." : "Cadastrar"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>
            Ja tem conta? <Text style={styles.linkBold}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.gray50, justifyContent: "center", padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 25, alignItems: "center", elevation: 4 },
  title: { fontSize: 32, fontWeight: "700", color: colors.redPrimary, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: 20 },
  input: { width: "100%", borderWidth: 1, borderColor: colors.gray300, borderRadius: 6, padding: 12, fontSize: 16, marginBottom: 12 },
  label: { alignSelf: "flex-start", fontWeight: "600", color: colors.gray700, marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 12, width: "100%" },
  roleBtn: { flex: 1, borderWidth: 2, borderColor: colors.gray300, borderRadius: 6, padding: 10, alignItems: "center" },
  roleBtnActive: { borderColor: colors.redPrimary, backgroundColor: "rgba(196,30,58,0.08)" },
  roleBtnText: { fontSize: 14, color: colors.gray700 },
  roleBtnTextActive: { color: colors.redPrimary, fontWeight: "600" },
  btn: { backgroundColor: colors.redPrimary, borderRadius: 6, padding: 14, width: "100%", alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  link: { marginTop: 20, color: colors.gray500, fontSize: 14 },
  linkBold: { color: colors.redPrimary, fontWeight: "600" },
});
