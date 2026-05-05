import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { apiPath, readJsonOrText, resolveApiBaseUrl } from "@/lib/api";
import { CoachAthleteSummary, INITIAL_FORM, SYMPTOMS, URINE_COLORS } from "./constants";
import { styles } from "./index.styles";

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function Index() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<"athlete" | "coach">("athlete");
  const [coachAthletes, setCoachAthletes] = useState<CoachAthleteSummary[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const isMedium = width >= 760;

  const urineVolumeMl = useMemo(() => {
    const before = parseNumber(form.weightBeforeKg);
    const after = parseNumber(form.weightAfterKg);
    if (Number.isNaN(before) || Number.isNaN(after) || before <= 0 || after <= 0 || before <= after) {
      return 0;
    }
    return Number(((before - after) * 1000).toFixed(1));
  }, [form.weightBeforeKg, form.weightAfterKg]);

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.waterIntakeMl || !form.weightBeforeKg || !form.weightAfterKg || !form.clothing || !form.urineColor) {
      Alert.alert("Campos obrigatorios", "Preencha todos os campos antes de salvar.");
      return;
    }

    if (urineVolumeMl <= 0) {
      Alert.alert("Pesos invalidos", "O peso antes precisa ser maior que o peso depois.");
      return;
    }

    const waterIntakeMl = parseNumber(form.waterIntakeMl);
    const weightBeforeKg = parseNumber(form.weightBeforeKg);
    const weightAfterKg = parseNumber(form.weightAfterKg);

    if (Number.isNaN(waterIntakeMl) || Number.isNaN(weightBeforeKg) || Number.isNaN(weightAfterKg)) {
      Alert.alert("Numeros invalidos", "Revise os campos numericos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiPath(apiBaseUrl, "/api/entries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteName: form.athleteName,
          entryDate: form.entryDate,
          waterIntakeMl,
          weightBeforeKg,
          weightAfterKg,
          urineVolumeMl,
          clothing: form.clothing.trim(),
          urineColor: form.urineColor,
          symptoms: form.symptoms,
        }),
      });

      const body = await readJsonOrText(response);
      if (!response.ok) {
        const extra =
          body && typeof body === "object" && "_nonJsonBody" in body
            ? String((body as { _nonJsonBody: string })._nonJsonBody)
            : "";
        Alert.alert(
          "Erro ao salvar",
          (body && typeof body === "object" && "error" in body && (body as { error?: string }).error) ||
            extra ||
            "Nao foi possivel salvar agora.",
        );
        return;
      }

      Alert.alert("Sucesso", "Registro salvo com sucesso.");
      setForm({ ...INITIAL_FORM, entryDate: new Date().toISOString().slice(0, 10) });
    } catch {
      Alert.alert(
        "Sem conexao com a API",
        `Verifique se o Flask esta rodando em ${apiBaseUrl} e se o MySQL esta ativo.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadCoachAthletes = useCallback(async () => {
    setCoachLoading(true);
    setCoachError("");
    try {
      const response = await fetch(apiPath(apiBaseUrl, "/api/coach/athletes"));
      const data = await readJsonOrText(response);
      if (!response.ok) {
        const extra =
          data && typeof data === "object" && "_nonJsonBody" in data
            ? String((data as { _nonJsonBody: string })._nonJsonBody)
            : "";
        setCoachError(
          (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) ||
            extra ||
            "Nao foi possivel carregar os atletas.",
        );
        return;
      }
      setCoachAthletes(Array.isArray(data) ? data : []);
    } catch {
      const hint =
        Platform.OS === "web"
          ? "Confirme se o backend Flask esta rodando (porta 5000) e se nada bloqueou o processo."
          : "Confirme se o backend esta rodando, se o aparelho alcanca esse endereco na rede (firewall/porta 5000).";
      setCoachError(`Erro de conexao com a API em ${apiBaseUrl}. ${hint}`);
    } finally {
      setCoachLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (activeScreen !== "coach") return;
    loadCoachAthletes();
  }, [activeScreen, loadCoachAthletes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {isMenuOpen ? (
        <View style={styles.sidebarOverlay}>
          <Pressable style={styles.sidebarBackdrop} onPress={() => setIsMenuOpen(false)} />
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}>
              <View style={styles.sidebarLogoMark}>
                <Text style={styles.sidebarLogoMarkText}>*</Text>
              </View>
              <Text style={styles.sidebarBrandText}>CENTRO UNIVERSITARIO SAO CAMILO</Text>
            </View>

            <Pressable style={styles.sidebarItem} onPress={() => setIsMenuOpen(false)}>
              <Text style={styles.sidebarItemText}>Perfil</Text>
            </Pressable>
            <Pressable
              style={styles.sidebarItem}
              onPress={() => {
                setActiveScreen("athlete");
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.sidebarItemText}>Tela Inicial</Text>
            </Pressable>
            <Pressable
              style={styles.sidebarItem}
              onPress={() => {
                setActiveScreen("coach");
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.sidebarItemText}>Parte do treinador</Text>
            </Pressable>
            <Pressable style={styles.sidebarItem} onPress={() => setIsMenuOpen(false)}>
              <Text style={styles.sidebarItemText}>Relatorio</Text>
            </Pressable>
            <Pressable style={styles.sidebarItem} onPress={() => setIsMenuOpen(false)}>
              <Text style={styles.sidebarItemText}>Sobre</Text>
            </Pressable>
            <Pressable style={styles.sidebarItem} onPress={() => setIsMenuOpen(false)}>
              <Text style={styles.sidebarItemText}>Ajuda</Text>
            </Pressable>
            <Pressable style={styles.sidebarItem} onPress={() => setIsMenuOpen(false)}>
              <Text style={styles.sidebarItemText}>Sair</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {activeScreen === "athlete" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={styles.titleBlock}>
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>Logo Sao Camilo</Text>
                </View>
                <Text style={styles.title}>Bem vindo(a)!</Text>
                <Text style={styles.subtitle}>Registro diario.</Text>
              </View>

              <View style={styles.topRightArea}>
                <Pressable style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
                  <Text style={styles.menuButtonText}>☰</Text>
                </Pressable>
                <View style={styles.dateField}>
                  <Text style={styles.label}>Data</Text>
                  <TextInput style={styles.input} value={form.entryDate} onChangeText={(value) => updateField("entryDate", value)} />
                </View>
              </View>
            </View>

            <View style={[styles.formGrid, isWide ? styles.cols3 : isMedium ? styles.cols2 : styles.cols1]}>
              <View style={styles.formColumn}>
                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Agua ingerida (mL*)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={form.waterIntakeMl}
                    onChangeText={(value) => updateField("waterIntakeMl", value)}
                  />
                  <Text style={styles.helperText}>*Um litro equivale a 1000 ml.</Text>
                </View>

                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Peso</Text>
                  <Text style={styles.label}>Antes de urinar (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={form.weightBeforeKg}
                    onChangeText={(value) => updateField("weightBeforeKg", value)}
                  />
                  <Text style={styles.label}>Depois de urinar (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    value={form.weightAfterKg}
                    onChangeText={(value) => updateField("weightAfterKg", value)}
                  />
                </View>

                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Vestimentas</Text>
                  <Text style={styles.label}>Que roupas voce usava durante a pesagem?</Text>
                  <TextInput style={styles.input} value={form.clothing} onChangeText={(value) => updateField("clothing", value)} />
                </View>
              </View>

              <View style={styles.formColumn}>
                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Urina</Text>
                  <Text style={styles.label}>Qual a cor de sua urina?</Text>
                  <View style={styles.optionsWrap}>
                    {URINE_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        onPress={() => updateField("urineColor", color)}
                        style={[styles.option, form.urineColor === color && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, form.urineColor === color && styles.optionTextSelected]}>{color}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.volumeBox}>
                    <Text style={styles.volumeLabel}>Volume urinario (mL)</Text>
                    <Text style={styles.volumeValue}>{urineVolumeMl > 0 ? `${urineVolumeMl}` : "-"}</Text>
                  </View>
                  <Text style={styles.helperText}>** Apenas quando aplicavel.</Text>
                </View>
              </View>

              <View style={styles.formColumn}>
                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Sintomas</Text>
                  <Text style={styles.label}>Sentiu algum sintoma de desidratacao durante o dia?</Text>
                  <View style={styles.optionsWrap}>
                    {SYMPTOMS.map((symptom) => (
                      <Pressable
                        key={symptom}
                        onPress={() => updateField("symptoms", symptom)}
                        style={[styles.option, form.symptoms === symptom && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, form.symptoms === symptom && styles.optionTextSelected]}>{symptom}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.athleteField}>
                <Text style={styles.label}>Atleta</Text>
                <TextInput style={styles.input} value={form.athleteName} onChangeText={(value) => updateField("athleteName", value)} />
              </View>
              <Pressable onPress={handleSubmit} disabled={isSubmitting} style={[styles.button, isSubmitting && styles.buttonDisabled]}>
                <Text style={styles.buttonText}>{isSubmitting ? "Salvando..." : "Salvar"}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.coachContainer}>
          <View style={styles.coachTopBar}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>Logo Sao Camilo</Text>
            </View>
            <Pressable style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
              <Text style={styles.menuButtonText}>☰</Text>
            </Pressable>
          </View>

          <Text style={styles.coachTitle}>Bem vindo(a)!</Text>
          <Text style={styles.coachSectionTitle}>Atletas</Text>

          {coachLoading ? <ActivityIndicator style={styles.coachSpinner} /> : null}
          {coachError ? <Text style={styles.coachError}>{coachError}</Text> : null}
          {!coachLoading && !coachError && coachAthletes.length === 0 ? (
            <Text style={styles.coachEmpty}>Nenhum registro salvo ainda. Peça para o atleta enviar o formulario primeiro.</Text>
          ) : null}

          <View style={styles.coachCardsRow}>
            {coachAthletes.map((athlete) => {
              const last = athlete.lastEntry;
              return (
                <View key={athlete.name} style={styles.coachCard}>
                  <Text style={styles.coachCardHeader}>{athlete.name}</Text>
                  <Text style={styles.coachCardMuted}>
                    Ultimo registro: {last?.entryDate || athlete.lastEntryDate || "—"}
                  </Text>
                  <Text style={styles.coachCardText}>Idade: —</Text>
                  <Text style={styles.coachCardText}>
                    Peso Atual: {last ? `${last.weightAfterKg} kg` : "—"}
                  </Text>
                  <Text style={styles.coachCardText}>Quantidade de agua</Text>
                  <Text style={styles.coachCardText}>ingerida ate o</Text>
                  <Text style={styles.coachCardText}>momento: {last ? `${last.waterIntakeMl} ml` : "—"}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.coachFooter}>
            <Pressable style={styles.button} onPress={loadCoachAthletes} disabled={coachLoading}>
              <Text style={styles.buttonText}>{coachLoading ? "Atualizando..." : "Salvar"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
