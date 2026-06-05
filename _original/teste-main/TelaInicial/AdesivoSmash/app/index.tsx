import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";

import { setaSidebar } from "@/assets/appImages";
import { apiPath, readJsonOrText, resolveApiBaseUrl } from "@/lib/api";
import { getCurrentUser, logout, User } from "@/lib/auth";
import { getCurrentSession, clearCurrentSession, sessionApiJson, saveCurrentSession } from "@/lib/sessionApi";
import { CoachAthleteSummary, INITIAL_FORM, SYMPTOMS, URINE_COLORS } from "./constants";
import { ABOUT_PARAGRAPHS, HELP_PARAGRAPHS } from "./infoContent";
import { InfoScreen } from "./InfoScreen";
import { styles } from "./index.styles";
import { ReportScreen } from "./ReportScreen";
import { urineColors } from "@/lib/theme";

const FLUID_PRESETS = [
  { icon: "💧", label: "Squeeze", volume: 150, source: "squeeze_bottle" },
  { icon: "🥤", label: "Copo", volume: 200, source: "cup" },
  { icon: "🧴", label: "Garrafa", volume: 500, source: "bottle" },
];

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function Index() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<
    "home" | "athlete" | "coach" | "report" | "about" | "help" |
    "pre-session" | "during-session" | "post-session" | "result" |
    "coach-athlete-detail" | "coach-report"
  >("home");
  const [coachAthletes, setCoachAthletes] = useState<CoachAthleteSummary[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const isMedium = width >= 760;

  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [preMass, setPreMass] = useState("");
  const [sport, setSport] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [urineColor, setUrineColor] = useState<number | null>(null);
  const [fluidTotal, setFluidTotal] = useState(0);
  const [actualDuration, setActualDuration] = useState("");
  const [urineVolume, setUrineVolume] = useState("");
  const [postMass, setPostMass] = useState("");
  const [soaked, setSoaked] = useState(false);
  const [giSymptoms, setGiSymptoms] = useState("");
  const [fatigue, setFatigue] = useState("5");
  const [saltySweat, setSaltySweat] = useState(false);
  const [saltMarks, setSaltMarks] = useState(false);
  const [cramps, setCramps] = useState(false);
  const [showCookies, setShowCookies] = useState(true);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [athleteSessions, setAthleteSessions] = useState<any[]>([]);

  const checkAuth = useCallback(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      setUser(currentUser);
      if (currentUser.role === "athlete") {
        setForm((prev) => ({ ...prev, athleteName: currentUser.name }));
      }
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
    await clearCurrentSession();
    setActiveScreen("home");
    router.replace("/login");
  };



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
    if (!form.athleteName) {
      Alert.alert("Campo obrigatório", "Nome do atleta é obrigatério.");
      return;
    }
    if (!form.waterIntakeMl || !form.weightBeforeKg || !form.weightAfterKg || !form.clothing || !form.urineColor) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos antes de salvar.");
      return;
    }

    if (urineVolumeMl <= 0) {
      Alert.alert("Pesos inválidos", "O peso antes precisa ser maior que o peso depois.");
      return;
    }

    const waterIntakeMl = parseNumber(form.waterIntakeMl);
    const weightBeforeKg = parseNumber(form.weightBeforeKg);
    const weightAfterKg = parseNumber(form.weightAfterKg);

    if (Number.isNaN(waterIntakeMl) || Number.isNaN(weightBeforeKg) || Number.isNaN(weightAfterKg)) {
      Alert.alert("Némeros invalidos", "Revise os campos númericos.");
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
            "Não foi possível salvar agora.",
        );
        return;
      }

      Alert.alert("Sucesso", "Registro salvo com sucesso.");
      setForm({
        ...INITIAL_FORM,
        entryDate: new Date().toISOString().slice(0, 10),
        athleteName: user?.role === "athlete" ? user.name : "",
      });
    } catch {
      Alert.alert(
        "Sem conexão com a API",
        `Verifique se o Flask esta rodando em ${apiBaseUrl} e se o MySQL está ativo.`,
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
          data && typeof data === "object" && "_nonJsonBody" in body
            ? String((data as { _nonJsonBody: string })._nonJsonBody)
            : "";
        setCoachError(
          (data && typeof body === "object" && "error" in data && (data as { error?: string }).error) ||
            extra ||
            "Não foi possível carregar os atletas.",
        );
        return;
      }
      const athletesArray = Array.isArray(data) ? data : [];
      const mappedAthletes = athletesArray.map((athlete: any) => ({
        name: athlete.name || athlete.athleteName || "Atleta",
        lastEntryDate: athlete.lastEntryDate || null,
        totalEntries: athlete.totalEntries || 0,
        lastEntry: athlete.lastEntry || null
      }));
      setCoachAthletes(mappedAthletes);
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

  const loadAthleteDetails = async (athlete: CoachAthleteSummary) => {
    setSelectedAthlete(athlete);
    setCoachLoading(true);
    setCoachError("");
    try {
      const response = await fetch(apiPath(apiBaseUrl, `/api/athlete/${encodeURIComponent(athlete.name)}/entries`));
      const data = await readJsonOrText(response);
      if (!response.ok) {
        const extra =
          data && typeof data === "object" && "_nonJsonBody" in body
            ? String((data as { _nonJsonBody: string })._nonJsonBody)
            : "";
        setCoachError(
          (data && typeof body === "object" && "error" in data && (data as { error?: string }).error) ||
            extra ||
            "Nao foi possivel carregar os dados do atleta.",
        );
        return;
      }
      setAthleteSessions(Array.isArray(data) ? data : []);
      setActiveScreen("coach-athlete-detail");
    } catch {
      const hint =
        Platform.OS === "web"
          ? "Confirme se o backend Flask esta rodando (porta 5000) e se nada bloqueou o processo."
          : "Confirme se o backend esta rodando, se o aparelho alcanca esse endereco na rede (firewall/porta 5000).";
      setCoachError(`Erro de conexao com a API em ${apiBaseUrl}. ${hint}`);
    } finally {
      setCoachLoading(false);
    }
  };

  useEffect(() => {
    if ((activeScreen === "home" || activeScreen === "report") && user?.role === "team") {
      loadCoachAthletes();
    }
  }, [activeScreen, loadCoachAthletes, user]);

  useEffect(() => {
    if (user?.role === "athlete") {
      setForm((prev) => ({ ...prev, athleteName: user.name }));
    }
  }, [user]);

  const handlePreSessionSubmit = async () => {
    if (!preMass) {
      Alert.alert("Erro", "Peso pre-sessao e obrigatorio");
      return;
    }
    setSessionLoading(true);
    try {
      const session = await sessionApiJson<{ id: number }>("/sessions", {
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
      setCurrentSessionId(session.id);
      await saveCurrentSession(session.id);
      setActiveScreen("during-session");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Ocorreu um erro");
    } finally {
      setSessionLoading(false);
    }
  };

  const loadFluid = async () => {
    if (!currentSessionId) return;
    try {
      const events = await sessionApiJson<Array<{ volume_ml: number }>>(
        `/sessions/${currentSessionId}/fluid`
      );
      setFluidTotal(events.reduce((sum, e) => sum + e.volume_ml, 0));
    } catch (err) {
      console.error("Error loading fluid:", err);
    }
  };

  useEffect(() => {
    if (activeScreen === "during-session") {
      loadFluid();
    }
  }, [activeScreen, currentSessionId]);

  const addFluid = async (volume: number, source: string) => {
    if (!currentSessionId) return;
    try {
      await sessionApiJson(`/sessions/${currentSessionId}/fluid`, {
        method: "POST",
        body: JSON.stringify({ volume_ml: volume, source }),
      });
      loadFluid();
    } catch (err) {
      console.error("Error adding fluid:", err);
    }
  };

  const handleDuringSessionContinue = async () => {
    if (!currentSessionId) return;
    setSessionLoading(true);
    try {
      await sessionApiJson(`/sessions/${currentSessionId}/during`, {
        method: "PATCH",
        body: JSON.stringify({
          actual_duration_min: actualDuration ? parseInt(actualDuration) : null,
          urine_volume_ml: urineVolume ? parseFloat(urineVolume) : 0,
        }),
      });
      setActiveScreen("post-session");
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setSessionLoading(false);
    }
  };

  const handlePostSessionSubmit = async () => {
    if (!postMass) {
      Alert.alert("Erro", "Peso pos-sessao e obrigatorio");
      return;
    }
    if (!currentSessionId) return;
    setSessionLoading(true);
    try {
      await sessionApiJson(`/sessions/${currentSessionId}/post`, {
        method: "PATCH",
        body: JSON.stringify({
          post_mass_kg: parseFloat(postMass),
          soaked_clothing: soaked,
          gi_symptoms: giSymptoms || null,
          fatigue_level: parseInt(fatigue),
        }),
      });
      const result = await sessionApiJson(`/sessions/${currentSessionId}`);
      setSessionResult(result);
      await clearCurrentSession();
      setActiveScreen("result");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Ocorreu um erro");
    } finally {
      setSessionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#e53935" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isMenuOpen ? (
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarBrand}>
              <Text style={styles.sidebarBrandText}>CENTRO UNIVERSITARIO SAO CAMILO</Text>
              {user && (
                <Text style={styles.sidebarUserText}>
                  {user.name} ({user.role === "athlete" ? "Atleta" : "Treinador"})
                </Text>
              )}
            </View>

            <Pressable style={styles.sidebarItem} onPress={() => { setActiveScreen("home"); setIsMenuOpen(false); }}>
              <Text style={styles.sidebarItemText}>Tela Inicial</Text>
            </Pressable>
            {user?.role === "athlete" && (
              <Pressable
                style={styles.sidebarItem}
                onPress={() => {
                  setActiveScreen("athlete");
                  setIsMenuOpen(false);
                }}
              >
                <Text style={styles.sidebarItemText}>Registro Diario</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.sidebarItem}
              onPress={() => {
                setActiveScreen("report");
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.sidebarItemText}>Relatorio</Text>
            </Pressable>
            <Pressable
              style={styles.sidebarItem}
              onPress={() => {
                setActiveScreen("about");
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.sidebarItemText}>Sobre</Text>
            </Pressable>
            <Pressable
              style={styles.sidebarItem}
              onPress={() => {
                setActiveScreen("help");
                setIsMenuOpen(false);
              }}
            >
              <Text style={styles.sidebarItemText}>Ajuda</Text>
            </Pressable>
            <Pressable style={styles.sidebarItem} onPress={handleLogout}>
              <Text style={styles.sidebarItemText}>Sair</Text>
            </Pressable>
          </View>
          <Pressable style={styles.sidebarBackdrop} onPress={() => setIsMenuOpen(false)} />
        </View>
      ) : null}

      {!isMenuOpen ? (
        <Pressable
          style={styles.sidebarOpenHandle}
          onPress={() => setIsMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <Image source={setaSidebar} style={styles.sidebarOpenArrow} />
        </Pressable>
      ) : null}

      {activeScreen === "report" ? (
        <ReportScreen 
          athleteName={form.athleteName} 
          apiBaseUrl={apiBaseUrl}
          athletes={coachAthletes}
          onSelectAthlete={(athlete) => updateField("athleteName", athlete.name)}
        />
      ) : activeScreen === "about" ? (
        <InfoScreen title="Sobre" paragraphs={ABOUT_PARAGRAPHS} />
      ) : activeScreen === "help" ? (
        <InfoScreen title="Ajuda" paragraphs={HELP_PARAGRAPHS} />
      ) : activeScreen === "athlete" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Bem vindo(a)!</Text>
                <Text style={styles.subtitle}>Registro diario.</Text>
              </View>

              <View style={styles.topRightArea}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>Data</Text>
                  <TextInput style={styles.input} value={form.entryDate} onChangeText={(value) => updateField("entryDate", value)} />
                </View>
              </View>
            </View>

            <View style={[styles.formGrid, isWide ? styles.cols3 : isMedium ? styles.cols2 : styles.cols1]}>
              <View style={styles.formColumn}>
                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Atleta</Text>
                  <Text style={styles.label}>Nome do atleta</Text>
                  <TextInput
                    style={styles.input}
                    value={form.athleteName}
                    onChangeText={(value) => updateField("athleteName", value)}
                    editable={user?.role === "team"}
                  />
                </View>
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
              <Pressable onPress={handleSubmit} disabled={isSubmitting} style={[styles.button, isSubmitting && styles.buttonDisabled]}>
                <Text style={styles.buttonText}>{isSubmitting ? "Salvando..." : "Salvar"}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : activeScreen === "coach-athlete-detail" ? (
        <ScrollView contentContainerStyle={styles.coachContainer}>
          <View style={styles.coachTopBar}>
            <Pressable style={styles.button} onPress={() => setActiveScreen("home")}>
              <Text style={styles.buttonText}>Voltar</Text>
            </Pressable>
          </View>

          <Text style={styles.coachTitle}>{selectedAthlete?.name}</Text>
          <Text style={styles.coachSectionTitle}>Sessões Registradas</Text>

          {coachLoading ? <ActivityIndicator style={styles.coachSpinner} /> : null}
          {coachError ? <Text style={styles.coachError}>{coachError}</Text> : null}
          {!coachLoading && !coachError && athleteSessions.length === 0 ? (
            <Text style={styles.coachEmpty}>Nenhuma sessão registrada para este atleta.</Text>
          ) : null}

          <View style={styles.coachCardsRow}>
            {athleteSessions.map((session, index) => (
              <View key={index} style={styles.coachCard}>
                <Text style={styles.coachCardHeader}>{session.entryDate}</Text>
                <Text style={styles.coachCardText}>Água ingerida: {session.waterIntakeMl} mL</Text>
                <Text style={styles.coachCardText}>Peso antes: {session.weightBeforeKg} kg</Text>
                <Text style={styles.coachCardText}>Peso depois: {session.weightAfterKg} kg</Text>
                <Text style={styles.coachCardText}>Volume urinário: {session.urineVolumeMl} mL</Text>
                <Text style={styles.coachCardText}>Cor da urina: {session.urineColor}</Text>
                <Text style={styles.coachCardText}>Vestimentas: {session.clothing}</Text>
                <Text style={styles.coachCardText}>Sintomas: {session.symptoms}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : activeScreen === "pre-session" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Pre-sessao</Text>
                <Text style={styles.subtitle}>Preencha os dados antes do treino</Text>
              </View>
            </View>

            <View style={styles.fieldCard}>
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

              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Temp (°C)</Text>
                  <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="28" value={temperature} onChangeText={setTemperature} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Umidade (%)</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" placeholder="65" value={humidity} onChangeText={setHumidity} />
                </View>
              </View>

              <Text style={styles.label}>Duracao prevista (min)</Text>
              <TextInput style={styles.input} keyboardType="number-pad" placeholder="60" value={expectedDuration} onChangeText={setExpectedDuration} />

              <Text style={styles.label}>Cor da urina</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                {urineColors.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      { width: 36, height: 50, borderRadius: 4, borderWidth: 2, borderColor: "transparent", justifyContent: "flex-end", alignItems: "center", paddingBottom: 2 },
                      { backgroundColor: c },
                      urineColor === i + 1 && { borderColor: "#d04044", transform: [{ scale: 1.1 }] },
                    ]}
                    onPress={() => setUrineColor(i + 1)}
                  >
                    <Text style={{ fontSize: 10, color: "#7f7f7f" }}>{i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.footer}>
                <Pressable onPress={handlePreSessionSubmit} disabled={sessionLoading} style={[styles.button, sessionLoading && styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>{sessionLoading ? "Salvando..." : "Salvar e Continuar"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : activeScreen === "during-session" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Durante a Sessao</Text>
                <Text style={styles.subtitle}>Registre a ingestao de fluidos</Text>
              </View>
            </View>

            <View style={styles.fieldCard}>
              <Text style={styles.label}>Registrar fluido</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {FLUID_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.source}
                    style={{
                      flex: 1,
                      borderWidth: 2,
                      borderColor: "#bdbdbd",
                      borderRadius: 8,
                      padding: 12,
                      alignItems: "center",
                    }}
                    onPress={() => addFluid(p.volume, p.source)}
                  >
                    <Text style={{ fontSize: 24 }}>{p.icon}</Text>
                    <Text style={{ fontSize: 12, color: "#7f7f7f", marginTop: 2 }}>{p.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#d04044" }}>{p.volume} mL</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{
                backgroundColor: "#e8e8e8",
                borderRadius: 6,
                padding: 12,
                alignItems: "center",
                marginTop: 12,
              }}>
                <Text style={{ fontSize: 12, color: "#7f7f7f" }}>Total ingerido</Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: "#d04044" }}>{fluidTotal} mL</Text>
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
              <Text style={{ fontSize: 12, color: "#7f7f7f", marginTop: 2 }}>** Apenas quando aplicavel</Text>

              <View style={styles.footer}>
                <Pressable onPress={handleDuringSessionContinue} disabled={sessionLoading} style={[styles.button, sessionLoading && styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>{sessionLoading ? "Salvando..." : "Salvar e Continuar"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : activeScreen === "post-session" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Pos-sessao</Text>
                <Text style={styles.subtitle}>Dados apos o treino</Text>
              </View>
            </View>

            <View style={styles.fieldCard}>
              <Text style={styles.label}>Peso depois de urinar (kg) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="Ex: 71.8"
                value={postMass}
                onChangeText={setPostMass}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <Text style={styles.label}>Roupas muito encharcadas</Text>
                <Switch
                  value={soaked}
                  onValueChange={setSoaked}
                  trackColor={{ true: "#d04044" }}
                  thumbColor="#fff"
                />
              </View>
              <Text style={{ fontSize: 12, color: "#7f7f7f", marginTop: 2 }}>Roupas encharcadas podem gerar erro na pesagem</Text>

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

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <Text style={styles.label}>Sentiu suor salgado?</Text>
                <Switch
                  value={saltySweat}
                  onValueChange={setSaltySweat}
                  trackColor={{ true: "#d04044" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <Text style={styles.label}>Percebeu marcas de sal na roupa?</Text>
                <Switch
                  value={saltMarks}
                  onValueChange={setSaltMarks}
                  trackColor={{ true: "#d04044" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <Text style={styles.label}>Sentiu caibra?</Text>
                <Switch
                  value={cramps}
                  onValueChange={setCramps}
                  trackColor={{ true: "#d04044" }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.footer}>
                <Pressable onPress={handlePostSessionSubmit} disabled={sessionLoading} style={[styles.button, sessionLoading && styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>{sessionLoading ? "Calculando..." : "Finalizar e Ver Resultados"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : activeScreen === "result" && sessionResult ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Resultado</Text>
                <Text style={styles.subtitle}>
                  {sessionResult.sport || "Sessao"} — {new Date(sessionResult.created_at).toLocaleDateString("pt-BR")}
                </Text>
              </View>
            </View>

            {(() => {
              const alertConfig: Record<string, { text: string; bg: string; color: string }> = {
                danger: { text: "Desidratacao severa! Perda acima de 2%.", bg: "#FDE8E8", color: "#d04044" },
                caution: { text: "Atencao! Perda entre 1-2%. Aumente a ingestao.", bg: "#FFF3CD", color: "#856404" },
                normal: { text: "Hidratacao adequada. Continue assim!", bg: "#D4EDDA", color: "#155724" },
              };
              const alert = sessionResult.alert_level ? alertConfig[sessionResult.alert_level] : null;
              return alert ? (
                <View style={{ borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: alert.bg }}>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: alert.color }}>{alert.text}</Text>
                </View>
              ) : null;
            })()}

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[
                { value: sessionResult.adjusted_loss_kg?.toFixed(2), unit: "kg", label: "Perda Ajustada" },
                { value: sessionResult.sweat_rate_lh?.toFixed(2), unit: "L/h", label: "Taxa Sudorese" },
                { value: sessionResult.mass_variation_pct?.toFixed(1), unit: "%", label: "Variacao Massa" },
                { value: sessionResult.hydration_balance_ml?.toFixed(0), unit: "mL", label: "Balanco Hidrico" },
                { value: sessionResult.recommended_intake_ml_h?.toFixed(0), unit: "mL/h", label: "Recomendacao" },
                { value: sessionResult.fluid_intake_ml?.toFixed(0), unit: "mL", label: "Total Ingerido" },
              ].map((stat, i) => (
                <View key={i} style={{
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  padding: 12,
                  width: "48%",
                  borderLeftWidth: 4,
                  borderLeftColor: "#d04044",
                  alignItems: "center",
                }}>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#1f1f1f" }}>{stat.value}</Text>
                  <Text style={{ fontSize: 13, color: "#7f7f7f" }}>{stat.unit}</Text>
                  <Text style={{ fontSize: 11, color: "#7f7f7f", marginTop: 4 }}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.fieldCard}>
              <Text style={styles.cardTitle}>Dados Coletados</Text>
              <Text style={{ fontSize: 14, color: "#1f1f1f", marginBottom: 4 }}>Peso pre: {sessionResult.pre_mass_kg} kg</Text>
              <Text style={{ fontSize: 14, color: "#1f1f1f", marginBottom: 4 }}>Peso pos: {sessionResult.post_mass_kg} kg</Text>
              {sessionResult.soaked_clothing && (
                <Text style={{ fontSize: 14, color: "#856404", marginBottom: 4 }}>
                  ⚠ Roupas encharcadas registradas
                </Text>
              )}
            </View>

            <View style={styles.footer}>
              <Pressable style={[styles.button, { backgroundColor: "#e8e8e8" }]} onPress={() => setActiveScreen("home")}>
                <Text style={[styles.buttonText, { color: "#1f1f1f" }]}>Voltar ao inicio</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : user?.role === "team" ? (
        <ScrollView contentContainerStyle={styles.coachContainer}>
          <View style={styles.coachTopBar}>
          </View>

          <Text style={styles.coachTitle}>Bem vindo(a), {user?.name}!</Text>
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
                <Pressable 
                  key={athlete.name} 
                  style={styles.coachCard}
                  onPress={() => loadAthleteDetails(athlete)}
                >
                  <Text style={styles.coachCardHeader}>{athlete.name}</Text>
                  <Text style={styles.coachCardMuted}>
                    Última atualização: {last?.entryDate || athlete.lastEntryDate || "—"}
                  </Text>
                  <Text style={styles.coachCardText}>Idade: —</Text>
                  <Text style={styles.coachCardText}>
                    Peso Atual: {last ? `${last.weightAfterKg} kg` : "—"}
                  </Text>
                  <Text style={styles.coachCardText}>Quantidade de água</Text>
                  <Text style={styles.coachCardText}>ingerida até o</Text>
                  <Text style={styles.coachCardText}>momento: {last ? `${last.waterIntakeMl} ml` : "—"}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.coachFooter}>
            <Pressable style={styles.button} onPress={loadCoachAthletes} disabled={coachLoading}>
              <Text style={styles.buttonText}>{coachLoading ? "Atualizando..." : "Atualizar Lista"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            paddingHorizontal: 12,
            paddingLeft: 80,
            paddingTop: 10,
            paddingBottom: 28,
            maxWidth: 900,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "#e8e8e8",
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#b0b0b0",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: "#1f1f1f",
                marginBottom: 8,
              }}
            >
              Bem vindo(a), {user?.name}!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#7f7f7f",
                marginBottom: 32,
              }}
            >
              Inicie uma nova sessao de treino
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: "#d04044",
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 12,
                zIndex: 9999,
              }}
              onPress={() => {
                setPreMass("");
                setSport("");
                setTemperature("");
                setHumidity("");
                setExpectedDuration("");
                setUrineColor(null);
                setFluidTotal(0);
                setActualDuration("");
                setUrineVolume("");
                setPostMass("");
                setSoaked(false);
                setGiSymptoms("");
                setFatigue("5");
                setSaltySweat(false);
                setSaltMarks(false);
                setCramps(false);
                setCurrentSessionId(null);
                setSessionResult(null);
                setActiveScreen("pre-session");
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                Nova Sessão
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {showCookies && (
        <View style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          width: 280,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          zIndex: 1000,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f1f1f', marginBottom: 8 }}>
            🍪 Cookies
          </Text>
          <Text style={{ fontSize: 12, color: '#7f7f7f', marginBottom: 12 }}>
            Este site usa cookies para melhorar sua experiencia.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#e8e8e8',
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setShowCookies(false)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1f1f1f' }}>
                Recusar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#d04044',
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setShowCookies(false)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
                Aceitar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
