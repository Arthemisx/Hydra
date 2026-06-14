import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

import { register } from "@/biblioteca/auth";
import { loginStyles as styles } from "@/estilos/login.styles";
import { useFeedback } from "@/componentes/ProvedorFeedback";
import { BannerStatus } from "@/componentes/BannerStatus";

type RoleOption = "athlete" | "team" | "nutritionist";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RoleOption>("athlete");
  const [sport, setSport] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const { showSuccess, showError } = useFeedback();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setFieldError("Preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("As senhas nao coincidem.");
      return;
    }
    setFieldError("");
    setLoading(true);
    try {
      await register(name, email, password, role, sport || undefined);
      showSuccess("Conta criada com sucesso!");
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha no cadastro";
      setFieldError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { maxWidth: 480 }]}>
          <Text style={styles.title}>Hydra</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nome:</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail:</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha:</Text>
            <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar senha:</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tipo de usuário:</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleOption, role === "athlete" && styles.roleOptionOn]}
                onPress={() => setRole("athlete")}
              >
                <Text style={[styles.roleText, role === "athlete" && styles.roleTextOn]}>Atleta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "team" && styles.roleOptionOn]}
                onPress={() => setRole("team")}
              >
                <Text style={[styles.roleText, role === "team" && styles.roleTextOn]}>Treinador</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === "nutritionist" && styles.roleOptionOn]}
                onPress={() => setRole("nutritionist")}
              >
                <Text style={[styles.roleText, role === "nutritionist" && styles.roleTextOn]}>Nutricionista</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Esporte (opcional):</Text>
            <TextInput style={styles.input} value={sport} onChangeText={setSport} />
          </View>

          {fieldError ? <BannerStatus message={fieldError} variant="error" /> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Ja tem conta?{" "}
          <Text style={styles.footerLink} onPress={() => router.back()}>
            Entrar
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
