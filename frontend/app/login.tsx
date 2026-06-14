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

import { login } from "@/biblioteca/auth";
import { loginStyles as styles } from "@/estilos/login.styles";
import { useFeedback } from "@/componentes/ProvedorFeedback";
import { BannerStatus } from "@/componentes/BannerStatus";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const { showSuccess, showError } = useFeedback();

  const handleLogin = async () => {
    if (!email || !password) {
      setFieldError("Preencha e-mail e senha.");
      return;
    }
    setFieldError("");
    setLoading(true);
    try {
      await login(email, password);
      showSuccess("Login realizado!");
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciais inválidas";
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
        <View style={styles.card}>
          <Text style={styles.title}>Hydra</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail:</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha:</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {fieldError ? <BannerStatus message={fieldError} variant="error" /> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Nao tem cadastro?{" "}
          <Text style={styles.footerLink} onPress={() => router.push("/register")}>
            Cadastre-se
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
