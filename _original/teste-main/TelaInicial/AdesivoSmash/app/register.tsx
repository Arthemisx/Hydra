import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { register } from "../lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"athlete" | "team">("athlete");
  const [sport, setSport] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role, sport || undefined);
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Hydra</Text>
          <Text style={styles.subtitle}>Crie sua conta</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={styles.roleContainer}>
            <Text style={styles.label}>Tipo de usuário:</Text>
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, role === "athlete" && styles.roleOptionSelected]}
                onPress={() => setRole("athlete")}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    role === "athlete" && styles.roleOptionTextSelected,
                  ]}
                >
                  Atleta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "team" && styles.roleOptionSelected]}
                onPress={() => setRole("team")}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    role === "team" && styles.roleOptionTextSelected,
                  ]}
                >
                  Treinador
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Esporte (opcional)"
            value={sport}
            onChangeText={setSport}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>
              Já tem conta? <Text style={styles.linkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 30,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#e53935",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: "#424242",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  roleContainer: {
    width: "100%",
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: "row",
    gap: 12,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  roleOptionSelected: {
    borderColor: "#e53935",
    backgroundColor: "#ffebee",
  },
  roleOptionText: {
    color: "#757575",
    fontSize: 16,
  },
  roleOptionTextSelected: {
    color: "#e53935",
    fontWeight: "600",
  },
  btn: {
    backgroundColor: "#e53935",
    borderRadius: 6,
    padding: 14,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    marginTop: 20,
    color: "#757575",
    fontSize: 14,
  },
  linkBold: {
    color: "#e53935",
    fontWeight: "600",
  },
});
