import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

// Importa o expo-location apenas se não for web
let Location: any = null;
if (Platform.OS !== "web") {
  Location = require("expo-location");
}

import { Ionicons } from "@expo/vector-icons";
import { apiPath, readJsonOrText, resolveApiBaseUrl, getWeather, analyzeSession, chatWithAI } from "@/biblioteca/api";
import { getCurrentUser, logout, validateAuth, User } from "@/biblioteca/auth";
import { fetchWithAuth } from "@/biblioteca/apiAuth";
import { getCurrentSession, clearCurrentSession, sessionApiJson, saveCurrentSession } from "@/biblioteca/sessionApi";
import { CoachAthleteSummary, INITIAL_FORM, SYMPTOMS, URINE_COLORS } from "@/biblioteca/constants";
import { ABOUT_PARAGRAPHS, HELP_PARAGRAPHS } from "@/biblioteca/infoContent";
import { TelaInfo } from "@/componentes/TelaInfo";
import { styles } from "@/estilos/index.styles";
import { TelaRelatorio } from "@/componentes/TelaRelatorio";
import { urineColors } from "@/biblioteca/theme";
import { useFeedback } from "@/componentes/ProvedorFeedback";
import { BannerStatus } from "@/componentes/BannerStatus";
import { BlocoGiSessao } from "@/componentes/BlocoGiSessao";
import { IndicadorFaseSessao } from "@/componentes/IndicadorFaseSessao";
import {
  GiSurveyResponses,
  INITIAL_GI_SURVEY,
  validateGiPhase,
} from "@/biblioteca/giQuestionnaire";
import {
  BORG_CR10_SCALE,
  getBorgLabel,
  getBorgDescription,
  isRpeInOptimalZone,
} from "@/biblioteca/borgScale";

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
    "coach-athlete-detail" | "coach-report" | "weather" | "coach-teams" | "coach-team-detail"
  >("home");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  // Modal states
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [showDeleteAthleteModal, setShowDeleteAthleteModal] = useState(false);
  // New athlete form
  const [newAthlete, setNewAthlete] = useState({ name: "", email: "", sport: "" });
  // Selected athlete for delete
  const [selectedAthleteForDelete, setSelectedAthleteForDelete] = useState<string | null>(null);
  // Mock teams for now
  const TEAMS = [
    { 
      name: "Equipe A", 
      sport: "Atletismo", 
      icon: "walk", 
      athleteCount: 12, 
      pendingPlans: 3 
    },
    { 
      name: "Equipe B", 
      sport: "Ciclismo", 
      icon: "bicycle", 
      athleteCount: 10, 
      pendingPlans: 2 
    },
    { 
      name: "Equipe C", 
      sport: "Natação", 
      icon: "water", 
      athleteCount: 14, 
      pendingPlans: 1 
    }
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [coachAthletes, setCoachAthletes] = useState<CoachAthleteSummary[]>([
    { name: "Ana Souza", lastEntryDate: null, totalSessions: 0 },
    { name: "Carlos Silva", lastEntryDate: "12/05/2026", totalSessions: 16 },
    { name: "Juliana Lima", lastEntryDate: "10/05/2026", totalSessions: 8 },
    { name: "Pedro Santos", lastEntryDate: "11/05/2026", totalSessions: 21 },
    { name: "Mariana Costa", lastEntryDate: "01/05/2026", totalSessions: 5 },
    { name: "Lucas Oliveira", lastEntryDate: "09/05/2026", totalSessions: 12 },
  ]);
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
  const [fatigue, setFatigue] = useState("5");
  const [giSurvey, setGiSurvey] = useState<GiSurveyResponses>({ ...INITIAL_GI_SURVEY });
  const [preRpe, setPreRpe] = useState<number | null>(null);
  const [postRpe, setPostRpe] = useState<number | null>(null);
  const [saltySweat, setSaltySweat] = useState(false);
  const [saltMarks, setSaltMarks] = useState(false);
  const [cramps, setCramps] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [athleteSessions, setAthleteSessions] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveJustSucceeded, setSaveJustSucceeded] = useState(false);
  const { showSuccess, showError, showInfo } = useFeedback();
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<{ temperature: number; humidity: number; description: string } | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    const currentUser = await validateAuth();
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
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSaveJustSucceeded(false);
  };

  const getCurrentLocationAndWeather = async (forHomeScreen: boolean = false) => {
    setWeatherLoading(true);
    try {
      let coords = null;

      if (Platform.OS === "web") {
        // Geolocalização nativa para web
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } else {
        // Geolocalização do Expo para dispositivos móveis
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showError("Permissão de localização negada.");
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        };
      }

      const weather = await getWeather(coords.latitude, coords.longitude);

      if (weather) {
        if (forHomeScreen) {
          setCurrentWeather(weather);
        } else {
          setTemperature(String(weather.temperature));
          setHumidity(String(weather.humidity));
          showSuccess(`Clima carregado: ${weather.description}`);
        }
      } else {
        showError("Não foi possível carregar os dados de clima.");
      }
    } catch (e) {
      showError("Erro ao buscar localização ou clima.");
      console.error(e);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!form.athleteName.trim()) errors.athleteName = "Informe o nome do atleta.";
    if (!form.waterIntakeMl) errors.waterIntakeMl = "Campo obrigatorio.";
    if (!form.weightBeforeKg) errors.weightBeforeKg = "Campo obrigatorio.";
    if (!form.weightAfterKg) errors.weightAfterKg = "Campo obrigatorio.";
    if (!form.clothing.trim()) errors.clothing = "Campo obrigatorio.";
    if (!form.urineColor) errors.urineColor = "Selecione a cor da urina.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showError("Preencha os campos destacados antes de salvar.");
      return;
    }

    if (urineVolumeMl <= 0) {
      setFormErrors({ weightAfterKg: "Peso depois deve ser menor que o peso antes." });
      showError("O peso antes precisa ser maior que o peso depois.");
      return;
    }

    const waterIntakeMl = parseNumber(form.waterIntakeMl);
    const weightBeforeKg = parseNumber(form.weightBeforeKg);
    const weightAfterKg = parseNumber(form.weightAfterKg);

    if (Number.isNaN(waterIntakeMl) || Number.isNaN(weightBeforeKg) || Number.isNaN(weightAfterKg)) {
      showError("Revise os campos numericos.");
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setSaveJustSucceeded(false);
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
        showError(
          (body && typeof body === "object" && "error" in body && (body as { error?: string }).error) ||
            extra ||
            "Nao foi possivel salvar agora.",
        );
        return;
      }

      showSuccess("Registro salvo com sucesso!");
      setSaveJustSucceeded(true);
      setForm({
        ...INITIAL_FORM,
        entryDate: new Date().toISOString().slice(0, 10),
        athleteName: user?.role === "athlete" ? user.name : "",
      });
    } catch {
      showError(`Sem conexao com a API em ${apiBaseUrl}. Verifique se o backend esta rodando.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadCoachAthletes = useCallback(async () => {
    setCoachLoading(true);
    setCoachError("");
    try {
      const response = await fetchWithAuth("/api/athletes");
      const data = await readJsonOrText(response);
      if (!response.ok) {
        const extra =
          data && typeof data === "object" && "_nonJsonBody" in data
            ? String((data as { _nonJsonBody: string })._nonJsonBody)
            : "";
        const msg =
          (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) ||
          extra ||
          "Nao foi possivel carregar os atletas.";
        setCoachError(msg);
        showError(msg);
        return;
      }
      const athletesArray = Array.isArray(data) ? data : [];
      const mappedAthletes: CoachAthleteSummary[] = athletesArray.map((athlete: Record<string, unknown>) => ({
        id: typeof athlete.id === "number" ? athlete.id : undefined,
        name: String(athlete.name || "Atleta"),
        lastEntryDate:
          (athlete.lastSessionDate as string | null) ||
          (athlete.lastEntryDate as string | null) ||
          null,
        totalEntries:
          (athlete.totalSessions as number) ||
          (athlete.totalEntries as number) ||
          0,
        lastEntry: (athlete.lastEntry as CoachAthleteSummary["lastEntry"]) || null,
      }));
      setCoachAthletes(mappedAthletes);
      if (mappedAthletes.length > 0) {
        showInfo(`${mappedAthletes.length} atleta(s) carregado(s).`);
      }
    } catch {
      const hint =
        Platform.OS === "web"
          ? "Confirme se o backend Flask esta rodando (porta 5000) e se nada bloqueou o processo."
          : "Confirme se o backend esta rodando, se o aparelho alcanca esse endereco na rede (firewall/porta 5000).";
      const msg = `Erro de conexao com a API em ${apiBaseUrl}. ${hint}`;
      setCoachError(msg);
      showError(msg);
    } finally {
      setCoachLoading(false);
    }
  }, [apiBaseUrl, showError, showInfo]);

  const loadAthleteDetails = async (athlete: CoachAthleteSummary) => {
    setSelectedAthlete(athlete);
    setCoachLoading(true);
    setCoachError("");
    try {
      if (!athlete.id) {
        showError("Atleta sem identificador. Recarregue a lista.");
        return;
      }
      const response = await fetchWithAuth(`/api/athletes/${athlete.id}/history`);
      const data = await readJsonOrText(response);
      if (!response.ok) {
        const extra =
          data && typeof data === "object" && "_nonJsonBody" in data
            ? String((data as { _nonJsonBody: string })._nonJsonBody)
            : "";
        const msg =
          (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) ||
          extra ||
          "Nao foi possivel carregar os dados do atleta.";
        setCoachError(msg);
        showError(msg);
        return;
      }
      const sessions =
        data && typeof data === "object" && "sessions" in data
          ? (data as { sessions: unknown[] }).sessions
          : [];
      setAthleteSessions(sessions);
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
      // Auto-load weather when athlete logs in
      getCurrentLocationAndWeather(true);
    }
  }, [user]);

  const resetTrainingSession = () => {
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
    setFatigue("5");
    setSaltySweat(false);
    setSaltMarks(false);
    setCramps(false);
    setPreRpe(null);
    setPostRpe(null);
    setCurrentSessionId(null);
    setSessionResult(null);
    setGiSurvey({ ...INITIAL_GI_SURVEY });
  };

  const updateGiSurvey = (
    phase: "pre" | "during" | "post",
    field: string,
    value: any,
  ) => {
    setGiSurvey((prev) => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value,
      },
    }));
  };

  const updateGiSeverity = (
    phase: "pre" | "during" | "post",
    field: string,
    symptom: string,
    severity: number,
  ) => {
    setGiSurvey((prev) => {
      const current = (prev[phase][field] as Record<string, number>) || {};
      return {
        ...prev,
        [phase]: {
          ...prev[phase],
          [field]: { ...current, [symptom]: severity },
        },
      };
    });
  };

  const handlePreSessionSubmit = async () => {
    if (!preMass) {
      showError("Peso pre-sessao e obrigatorio.");
      return;
    }
    if (!giSurvey.pre.context) {
      showError("Selecione o tipo de sessão (Treino / Competição / Ambos).");
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
          perceived_intensity: preRpe,
          urine_color: urineColor,
          gi_responses: { pre: giSurvey.pre },
        }),
      });
      setCurrentSessionId(session.id);
      await saveCurrentSession(session.id);
      showSuccess("Pre-sessao salva! Continue registrando fluidos.");
      setActiveScreen("during-session");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Ocorreu um erro");
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
      showSuccess(`+${volume} mL registrado`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Nao foi possivel registrar o fluido.");
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
      showInfo("Dados da sessao registrados.");
      setActiveScreen("post-session");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSessionLoading(false);
    }
  };

  const handlePostSessionSubmit = async () => {
    if (!postMass) {
      showError("Peso pos-sessao e obrigatorio.");
      return;
    }
    const giError = validateGiPhase("post", giSurvey);
    if (giError) {
      showError(giError);
      return;
    }
    if (!currentSessionId) return;
    setSessionLoading(true);
    setAiLoading(true);
    try {
      await sessionApiJson(`/sessions/${currentSessionId}/post`, {
        method: "PATCH",
        body: JSON.stringify({
          post_mass_kg: parseFloat(postMass),
          soaked_clothing: soaked,
          fatigue_level: parseInt(fatigue),
          perceived_intensity_post: postRpe,
          gi_responses: giSurvey,
        }),
      });
      try {
        await sessionApiJson("/gi-competition-surveys", {
          method: "POST",
          body: JSON.stringify({ responses: giSurvey }),
        });
      } catch {
        /* questionario salvo na sessao mesmo se endpoint separado falhar */
      }
      const result = await sessionApiJson(`/sessions/${currentSessionId}`);
      setSessionResult(result);
      const analysis = await analyzeSession(result);
      setAiAnalysis(analysis);
      await clearCurrentSession();
      showSuccess("Sessao finalizada! Veja os resultados abaixo.");
      setActiveScreen("result");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setSessionLoading(false);
      setAiLoading(false);
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
    <SafeAreaView style={[styles.safeArea, user?.role === "team" && { backgroundColor: "#ffffff" }]}>
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
          <Ionicons name="arrow-forward" size={26} color="#444444" style={styles.sidebarOpenIcon} />
        </Pressable>
      ) : null}

      {activeScreen === "report" ? (
        <TelaRelatorio 
          athleteName={user?.name || form.athleteName} 
          apiBaseUrl={apiBaseUrl}
          userRole={user?.role === "team" ? "team" : "athlete"}
          athletes={coachAthletes}
          onSelectAthlete={(athlete) => updateField("athleteName", athlete.name)}
        />
      ) : activeScreen === "about" ? (
        <TelaInfo title="Sobre" paragraphs={ABOUT_PARAGRAPHS} />
      ) : activeScreen === "help" ? (
        <TelaInfo title="Ajuda" paragraphs={HELP_PARAGRAPHS} />
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
                    style={[styles.input, formErrors.athleteName && styles.inputError]}
                    value={form.athleteName}
                    onChangeText={(value) => updateField("athleteName", value)}
                    editable={user?.role === "team"}
                  />
                  {formErrors.athleteName ? <Text style={styles.fieldError}>{formErrors.athleteName}</Text> : null}
                </View>
                <View style={styles.fieldCard}>
                  <Text style={styles.cardTitle}>Agua ingerida (mL*)</Text>
                  <TextInput
                    style={[styles.input, formErrors.waterIntakeMl && styles.inputError]}
                    keyboardType="decimal-pad"
                    value={form.waterIntakeMl}
                    onChangeText={(value) => updateField("waterIntakeMl", value)}
                  />
                  {formErrors.waterIntakeMl ? <Text style={styles.fieldError}>{formErrors.waterIntakeMl}</Text> : null}
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

            {saveJustSucceeded ? (
              <View style={styles.saveSuccessBanner}>
                <Text style={styles.saveSuccessText}>Registro salvo com sucesso!</Text>
              </View>
            ) : null}

            <View style={styles.footer}>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.button,
                  isSubmitting && styles.buttonDisabled,
                  pressed && !isSubmitting && styles.buttonPressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : activeScreen === "coach-athlete-detail" ? (
        <ScrollView contentContainerStyle={styles.coachContainer}>
          <View style={styles.coachTopBar}>
            <Pressable style={[styles.button, { backgroundColor: "#e8e8e8" }]} onPress={() => setActiveScreen("coach-team-detail")}>
              <Text style={[styles.buttonText, { color: "#1f1f1f" }]}>Voltar</Text>
            </Pressable>
          </View>

          <Text style={styles.coachTitle}>{selectedAthlete?.name}</Text>
          <Text style={styles.coachSectionTitle}>Sessões Registradas</Text>

          {coachLoading ? <BannerStatus message="Carregando sessoes..." variant="loading" /> : null}
          {coachError ? <BannerStatus message={coachError} variant="error" /> : null}
          {!coachLoading && !coachError && athleteSessions.length === 0 ? (
            <Text style={styles.coachEmpty}>Nenhuma sessão registrada para este atleta.</Text>
          ) : null}

          <View style={{ flexDirection: "column", gap: 10 }}>
            {athleteSessions.map((session: Record<string, unknown>, index) => {
              const formatGiData = (phase: string, data: any) => {
                if (!data || !data.context) return null;
                
                const phaseLabel = phase === "pre" ? "Pré-sessão" : phase === "during" ? "Durante" : "Pós-sessão";
                const symptoms: string[] = [];
                
                if (data.context === "treino" || data.context === "ambos") {
                  const field = phase === "pre" ? "before_training" : phase === "during" ? "during_training" : "after_training";
                  if (data[field] === "sim") {
                    symptoms.push(`✅ Treino: Sim`);
                    const severityField = phase === "pre" ? "severity_before_training" : phase === "during" ? "severity_during_training" : "severity_after_training";
                    if (data[severityField]) {
                      const avgSeverity = Object.values(data[severityField]).reduce((a: number, b: number) => a + b, 0) / Object.keys(data[severityField]).length;
                      symptoms.push(`Gravidade média: ${avgSeverity.toFixed(1)}/10`);
                    }
                  } else if (data[field] === "nao") {
                    symptoms.push(`❌ Treino: Não`);
                  }
                }
                
                if (data.context === "competicao" || data.context === "ambos") {
                  const field = phase === "pre" ? "before_competition" : phase === "during" ? "during_competition" : "after_competition";
                  if (data[field] === "sim") {
                    symptoms.push(`✅ Competição: Sim`);
                    const severityField = phase === "pre" ? "severity_before_competition" : phase === "during" ? "severity_during_competition" : "severity_after_competition";
                    if (data[severityField]) {
                      const avgSeverity = Object.values(data[severityField]).reduce((a: number, b: number) => a + b, 0) / Object.keys(data[severityField]).length;
                      symptoms.push(`Gravidade média: ${avgSeverity.toFixed(1)}/10`);
                    }
                  } else if (data[field] === "nao") {
                    symptoms.push(`❌ Competição: Não`);
                  }
                }
                
                if (symptoms.length === 0) return null;
                
                return (
                  <Text key={phase} style={styles.coachCardText}>
                    {phaseLabel}: {symptoms.join(", ")}
                  </Text>
                );
              };
              
              return (
                <View key={String(session.id ?? index)} style={styles.coachCard}>
                  <Text style={styles.coachCardHeader}>
                    Sessão #{String(session.id ?? index + 1)} — {String(session.status ?? "—")}
                  </Text>
                  <Text style={styles.coachCardMuted}>
                    {session.created_at
                      ? new Date(String(session.created_at)).toLocaleString("pt-BR")
                      : "—"}
                  </Text>
                  <Text style={styles.coachCardText}>
                    Peso pré: {session.pre_mass_kg != null ? `${session.pre_mass_kg} kg` : "—"}
                  </Text>
                  <Text style={styles.coachCardText}>
                    Peso pós: {session.post_mass_kg != null ? `${session.post_mass_kg} kg` : "—"}
                  </Text>
                  <Text style={styles.coachCardText}>
                    Fluidos: {session.fluid_intake_ml != null ? `${session.fluid_intake_ml} mL` : "—"}
                  </Text>
                  <Text style={styles.coachCardText}>
                    Duração: {session.actual_duration_min != null ? `${session.actual_duration_min} min` : "—"}
                  </Text>
                  {session.sweat_rate_lh != null ? (
                    <Text style={styles.coachCardText}>Taxa de suor: {String(session.sweat_rate_lh)} L/h</Text>
                  ) : null}
                  {session.alert_level ? (
                    <Text style={[styles.coachCardText, { color: "#c41e3a", fontWeight: "700" }]}>
                      Alerta: {String(session.alert_level)}
                    </Text>
                  ) : null}

                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.coachCardText, { fontWeight: "700" }]}>Esforço Percebido:</Text>
                    {session.perceived_intensity != null ? (
                      <Text style={styles.coachCardText}>• Pré-sessão esperado: {session.perceived_intensity}/10</Text>
                    ) : null}
                    {session.perceived_intensity_post != null ? (
                      <Text style={styles.coachCardText}>• Pós-sessão real: {session.perceived_intensity_post}/10</Text>
                    ) : null}
                  </View>
                  
                  {session.gi_responses ? (
                    <>
                      <Text style={[styles.coachCardText, { fontWeight: "700", marginTop: 8 }]}>
                        Sintomas GI:
                      </Text>
                      {formatGiData("pre", (session.gi_responses as any).pre)}
                      {formatGiData("during", (session.gi_responses as any).during)}
                      {formatGiData("post", (session.gi_responses as any).post)}
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : activeScreen === "pre-session" ? (
        <ScrollView contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingLeft: 48,
          paddingTop: 24,
          paddingBottom: 40,
        }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: '#fff5f5',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Ionicons name="water" size={24} color="#d04044" />
              </View>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f1f1f' }}>Pré-sessão</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Hidrate-se e informe seus dados gastrointestinais antes do exercício.</Text>
              </View>
            </View>
          </View>

          {/* Phase Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 4,
            marginBottom: 24,
          }}>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: '#d04044',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="stopwatch" size={18} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Pré-sessão</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="fitness" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Durante</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="analytics" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Pós-sessão</Text>
            </Pressable>
          </View>

          {/* Hydration Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="water" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Hidratação</Text>
            </View>

            {/* Weight Input */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Peso antes de urinar (kg) (obrigatório)</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="scale" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 72.5"
                  value={preMass}
                  onChangeText={setPreMass}
                  underlineColorAndroid="transparent"
                />
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>kg</Text>
              </View>
            </View>

            {/* Sport Input */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Modalidade</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="walk" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  placeholder="Ex: Corrida"
                  value={sport}
                  onChangeText={setSport}
                  underlineColorAndroid="transparent"
                />
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
              </View>
            </View>


            {/* Expected Duration */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Duração prevista (min)</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="time-outline" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  keyboardType="number-pad"
                  placeholder="Ex: 60"
                  value={expectedDuration}
                  onChangeText={setExpectedDuration}
                  underlineColorAndroid="transparent"
                />
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>min</Text>
              </View>
            </View>

            {/* Urine Color */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Cor da urina</Text>
                <Ionicons name="help-circle-outline" size={18} color="#9ca3af" />
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {urineColors.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      {
                        flex: 1,
                        minWidth: 70,
                        height: 72,
                        borderRadius: 12,
                        borderWidth: 3,
                        borderColor: 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 8,
                        backgroundColor: c.color,
                      },
                      urineColor === c.value && {
                        borderColor: "#d04044",
                        shadowColor: '#d04044',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      },
                    ]}
                    onPress={() => setUrineColor(c.value)}
                  >
                    {urineColor === c.value && (
                      <View style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#d04044',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: urineColor === c.value ? '#fff' : '#1f1f1f', marginTop: 'auto' }}>{c.value}</Text>
                    <Text style={{ fontSize: 11, color: urineColor === c.value ? '#fff' : '#4b5563', textAlign: 'center', marginTop: 4 }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Session Type Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="calendar" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Tipo de Sessão <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>(obrigatório)</Text></Text>
            </View>

            <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151', marginBottom: 12 }}>Esta sessão é:</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { value: "treino", label: "Treino" },
                { value: "competicao", label: "Competição" },
                { value: "ambos", label: "Ambos" }
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => updateGiSurvey("pre", "context", opt.value)}
                  style={[
                    {
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      backgroundColor: '#fff',
                      alignItems: 'center',
                    },
                    giSurvey.pre.context === opt.value && {
                      borderColor: '#d04044',
                      backgroundColor: '#fff5f5',
                    }
                  ]}
                >
                  <Text style={[
                    { fontSize: 16, fontWeight: '600', color: '#1f1f1f' },
                    giSurvey.pre.context === opt.value && { color: '#d04044' }
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={() => setActiveScreen("home")}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>Voltar</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 2,
                backgroundColor: "#d04044",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#d04044',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
              onPress={handlePreSessionSubmit}
              disabled={sessionLoading}
            >
              {sessionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Salvar e Continuar</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : activeScreen === "during-session" ? (
        <ScrollView contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingLeft: 48,
          paddingTop: 24,
          paddingBottom: 40,
        }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: '#fff5f5',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Ionicons name="fitness" size={24} color="#d04044" />
              </View>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f1f1f' }}>Durante a Sessão</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Registre fluidos e sintomas gastrointestinais durante o exercício.</Text>
              </View>
            </View>
          </View>

          {/* Phase Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 4,
            marginBottom: 24,
          }}>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="stopwatch" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Pré-sessão</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: '#d04044',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="fitness" size={18} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Durante</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="analytics" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Pós-sessão</Text>
            </Pressable>
          </View>

          {/* Hydration Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="water" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Hidratação</Text>
            </View>

            {/* Fluid Presets */}
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 }}>Registrar fluido</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {FLUID_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.source}
                  style={{
                    flex: 1,
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                    backgroundColor: "#fff",
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => addFluid(p.volume, p.source)}
                >
                  <Text style={{ fontSize: 32 }}>{p.icon}</Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontWeight: '500' }}>{p.label}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#d04044", marginTop: 4 }}>{p.volume} mL</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Total Fluid */}
            <View style={{
              backgroundColor: "#fff5f5",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 2,
              borderColor: '#fee2e2',
            }}>
              <Text style={{ fontSize: 14, color: "#6b7280", fontWeight: '500' }}>Total ingerido</Text>
              <Text style={{ fontSize: 36, fontWeight: "800", color: "#d04044", marginTop: 4 }}>{fluidTotal} mL</Text>
            </View>

            {/* Actual Duration */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Duração real (min)</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="time-outline" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  keyboardType="number-pad"
                  placeholder="Ex: 55"
                  value={actualDuration}
                  onChangeText={setActualDuration}
                  underlineColorAndroid="transparent"
                />
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>min</Text>
              </View>
            </View>

            {/* Urine Volume */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Volume urinário (mL)</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="water-outline" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  keyboardType="number-pad"
                  placeholder="Apenas quando aplicável"
                  value={urineVolume}
                  onChangeText={setUrineVolume}
                  underlineColorAndroid="transparent"
                />
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>mL</Text>
              </View>
              <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, fontStyle: 'italic' }}>** Apenas quando aplicável</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={() => setActiveScreen("pre-session")}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>Voltar</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 2,
                backgroundColor: "#d04044",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#d04044',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
              onPress={handleDuringSessionContinue}
              disabled={sessionLoading}
            >
              {sessionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Salvar e Continuar</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : activeScreen === "post-session" ? (
        <ScrollView contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingLeft: 48,
          paddingTop: 24,
          paddingBottom: 40,
        }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: '#fff5f5',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Ionicons name="analytics" size={24} color="#d04044" />
              </View>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1f1f1f' }}>Pós-sessão</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Hidratação e sintomas gastrointestinais após o exercício.</Text>
              </View>
            </View>
          </View>

          {/* Phase Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 4,
            marginBottom: 24,
          }}>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="stopwatch" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Pré-sessão</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="fitness" size={18} color="#6b7280" />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Durante</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: '#d04044',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="analytics" size={18} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Pós-sessão</Text>
            </Pressable>
          </View>

          {/* Hydration Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="water" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Hidratação</Text>
            </View>

            {/* Post Weight */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Peso depois de urinar (kg) *</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="scale" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 71.8"
                  value={postMass}
                  onChangeText={setPostMass}
                  underlineColorAndroid="transparent"
                />
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>kg</Text>
              </View>
            </View>

            {/* Soaked Clothing Switch */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Roupas muito encharcadas</Text>
                <Switch
                  value={soaked}
                  onValueChange={setSoaked}
                  trackColor={{ true: "#d04044", false: "#d1d5db" }}
                  thumbColor="#fff"
                  style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                />
              </View>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 8, fontStyle: 'italic' }}>Roupas encharcadas podem gerar erro na pesagem</Text>
            </View>

            {/* Fatigue Level */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Nível de fadiga: {fatigue}/10</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <Ionicons name="pulse" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#1f1f1f' }}
                  keyboardType="number-pad"
                  placeholder="0-10"
                  value={fatigue}
                  onChangeText={setFatigue}
                  underlineColorAndroid="transparent"
                />
                <Text style={{ fontSize: 14, color: '#9ca3af', fontWeight: '500' }}>/10</Text>
              </View>
            </View>
          </View>

          {/* RPE Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="heart" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Esforço Percebido (RPE - Escala Borg CR10)</Text>
            </View>

            <Text style={{ fontSize: 15, fontWeight: '500', color: '#374151', marginBottom: 16 }}>Qual foi sua percepção real de esforço durante a sessão?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {BORG_CR10_SCALE.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    {
                      minWidth: 80,
                      height: 90,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "#e5e7eb",
                      backgroundColor: "#fff",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 8,
                    },
                    postRpe === option.value && {
                      borderColor: "#d04044",
                      backgroundColor: "#fff5f5",
                      shadowColor: '#d04044',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => setPostRpe(option.value)}
                >
                  <Text style={[
                    { fontSize: 22, fontWeight: "bold", color: "#1f1f1f" },
                    postRpe === option.value && { color: "#d04044" }
                  ]}>
                    {option.value}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#6b7280", textAlign: "center", marginTop: 6, lineHeight: 14 }}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Symptoms Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="medkit" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Sintomas</Text>
            </View>

            {/* Salty Sweat */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Sentiu suor salgado?</Text>
              <Switch
                value={saltySweat}
                onValueChange={setSaltySweat}
                trackColor={{ true: "#d04044", false: "#d1d5db" }}
                thumbColor="#fff"
              />
            </View>

            {/* Salt Marks */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Percebeu marcas de sal na roupa?</Text>
              <Switch
                value={saltMarks}
                onValueChange={setSaltMarks}
                trackColor={{ true: "#d04044", false: "#d1d5db" }}
                thumbColor="#fff"
              />
            </View>

            {/* Cramps */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>Sentiu câimbra?</Text>
              <Switch
                value={cramps}
                onValueChange={setCramps}
                trackColor={{ true: "#d04044", false: "#d1d5db" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* GI Symptoms Card */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d04044' }}>
              <Ionicons name="restaurant" size={24} color="#d04044" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f1f1f' }}>Sintomas Gastrointestinais (SGI)</Text>
            </View>
            <BlocoGiSessao
              phase="post"
              data={giSurvey}
              onChange={updateGiSurvey}
              onSeverityChange={updateGiSeverity}
            />
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
              }}
              onPress={() => setActiveScreen("during-session")}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>Voltar</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 2,
                backgroundColor: "#d04044",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#d04044',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
              onPress={handlePostSessionSubmit}
              disabled={sessionLoading}
            >
              {sessionLoading ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 10 }}>Calculando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Finalizar e Ver Resultados</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : activeScreen === "result" && sessionResult ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentCard}>
            <View style={styles.topBar}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Text style={styles.title}>Resultado</Text>
                <Text style={{ fontSize: 16, color: "#7f7f7f" }}>
                  {new Date(sessionResult.created_at).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {sessionResult.sport || "Sessao"}
              </Text>
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
              <Text style={{ fontSize: 14, color: "#1f1f1f", marginBottom: 4 }}>Peso pré: {sessionResult.pre_mass_kg} kg</Text>
              <Text style={{ fontSize: 14, color: "#1f1f1f", marginBottom: 4 }}>Peso pós: {sessionResult.post_mass_kg} kg</Text>
              
              {sessionResult.perceived_intensity != null && (
                <Text style={{ fontSize: 14, color: "#1f1f1f", marginBottom: 4 }}>
                  Esforço esperado (pré): {sessionResult.perceived_intensity}/10
                </Text>
              )}
              {sessionResult.perceived_intensity_post != null && (
                <Text style={{ fontSize: 14, color: "#1f1f1f", marginBottom: 4 }}>
                  Esforço real (pós): {sessionResult.perceived_intensity_post}/10
                </Text>
              )}
              
              {sessionResult.soaked_clothing && (
                <Text style={{ fontSize: 14, color: "#856404", marginBottom: 4 }}>
                  ⚠ Roupas encharcadas registradas
                </Text>
              )}
            </View>

            <View style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
              marginTop: 16,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1f1f1f",
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
              }}>
                <Ionicons name="bulb-outline" size={20} color="#d04044" style={{ marginRight: 8 }} />
                Análise Inteligente
              </Text>
              {aiLoading ? (
                <View style={{ alignItems: "center", padding: 24 }}>
                  <ActivityIndicator size="large" color="#d04044" />
                  <Text style={{ marginTop: 12, color: "#7f7f7f" }}>Gerando análise personalizada...</Text>
                </View>
              ) : (
                <Text style={{ fontSize: 16, lineHeight: 28, color: "#1f1f1f" }}>
                  {aiAnalysis || "A análise da sessão estará disponível em breve."}
                </Text>
              )}
            </View>

            <View style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
              marginTop: 16,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1f1f1f",
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
              }}>
                <Ionicons name="chatbubbles-outline" size={20} color="#d04044" style={{ marginRight: 8 }} />
                Chat com IA
              </Text>
              
              <View style={{ maxHeight: 300, marginBottom: 12 }}>
                <ScrollView style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, maxHeight: 200 }}>
                  {chatMessages.length === 0 ? (
                    <Text style={{ fontSize: 14, color: "#7f7f7f", fontStyle: "italic" }}>
                      Faça perguntas sobre sua sessão de hidratação!
                    </Text>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <View key={index} style={{
                        backgroundColor: msg.role === "user" ? "#d04044" : "#fff",
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8,
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                      }}>
                        <Text style={{ fontSize: 14, color: msg.role === "user" ? "#fff" : "#1f1f1f" }}>
                          {msg.content}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
              
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: "#1f1f1f",
                  }}
                  placeholder="Digite sua pergunta..."
                  placeholderTextColor="#7f7f7f"
                  value={chatInput}
                  onChangeText={setChatInput}
                  editable={!chatLoading}
                />
                <Pressable
                  style={{
                    backgroundColor: "#d04044",
                    borderRadius: 8,
                    padding: 12,
                    opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                  }}
                  onPress={async () => {
                    if (!chatInput.trim() || chatLoading) return;
                    
                    const userMessage = chatInput.trim();
                    setChatInput("");
                    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
                    setChatLoading(true);
                    
                    try {
                      const reply = await chatWithAI(userMessage, sessionResult, chatMessages);
                      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
                    } catch (error) {
                      setChatMessages(prev => [...prev, { role: "assistant", content: "Erro ao obter resposta. Tente novamente." }]);
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  disabled={chatLoading || !chatInput.trim()}
                >
                  {chatLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable 
                style={[styles.button, { backgroundColor: "#e8e8e8" }]} 
                onPress={() => {
                  setActiveScreen("home");
                  setChatMessages([]);
                  setChatInput("");
                }}
              >
                <Text style={[styles.buttonText, { color: "#1f1f1f" }]}>Voltar ao inicio</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : user?.role === "team" ? (
        activeScreen === "coach-teams" || activeScreen === "home" ? (
          <ScrollView contentContainerStyle={styles.coachContainer}>
            <View style={styles.coachTopBar}>
            </View>
            <Text style={styles.coachTitle}>Bem vindo(a), {user?.name}!</Text>
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#1f1f1f',
                marginBottom: 4,
                paddingLeft: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#d04044',
              }}>
                Selecione uma Equipe
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#7f7f7f',
                paddingLeft: 16,
              }}>
                Clique em uma das opções abaixo para ver os atletas e detalhes da equipe.
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              {TEAMS.map((team) => (
                <View 
                  key={team.name} 
                  style={{
                    flex: 1,
                    minWidth: 280,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 12,
                    elevation: 4,
                    borderWidth: 1,
                    borderColor: '#e8e8e8',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <View style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: '#fff5f5',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Ionicons 
                        name={team.icon as any} 
                        size={52} 
                        color="#d04044" 
                      />
                    </View>
                    <View>
                      <Text style={{
                        fontSize: 22,
                        fontWeight: '700',
                        color: '#1f1f1f',
                        marginBottom: 4,
                      }}>
                        {team.name}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#d04044',
                      }}>
                        {team.sport}
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 8, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="people-outline" size={18} color="#7f7f7f" />
                      <Text style={{ fontSize: 14, color: '#4f4f4f' }}>
                        {team.athleteCount} {team.athleteCount === 1 ? 'atleta cadastrado' : 'atletas cadastrados'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="document-text-outline" size={18} color="#7f7f7f" />
                      <Text style={{ fontSize: 14, color: '#4f4f4f' }}>
                        {team.pendingPlans} {team.pendingPlans === 1 ? 'plano pendente' : 'planos pendentes'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={{
                      backgroundColor: '#d04044',
                      borderRadius: 8,
                      paddingVertical: 14,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                    onPress={() => {
                      setSelectedTeam(team.name);
                      setActiveScreen("coach-team-detail");
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#fff',
                    }}>
                      Ver Atletas
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : activeScreen === "coach-team-detail" ? (
          <ScrollView contentContainerStyle={styles.coachContainer}>
            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Pressable
                  style={{ padding: 8 }}
                  onPress={() => setActiveScreen("home")}
                >
                  <Ionicons name="arrow-back" size={20} color="#1f1f1f" />
                </Pressable>
                <Text style={{ fontSize: 14, color: '#7f7f7f' }}>Início</Text>
                <Text style={{ fontSize: 14, color: '#7f7f7f' }}>›</Text>
                <Text style={{ fontSize: 14, color: '#7f7f7f' }}>Equipes</Text>
                <Text style={{ fontSize: 14, color: '#7f7f7f' }}>›</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#d04044' }}>{selectedTeam}</Text>
              </View>
              <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: '#1f1f1f',
                marginBottom: 4,
              }}>
                {selectedTeam}
              </Text>
            </View>

            {/* Section Title + Buttons */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}>
              <View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#1f1f1f',
                  marginBottom: 4,
                }}>
                  Atletas da equipe
                </Text>
                <Text style={{ fontSize: 14, color: '#7f7f7f' }}>
                  Gerencie os atletas da equipe.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#fff',
                    borderWidth: 2,
                    borderColor: '#d04044',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                  }}
                  onPress={() => setShowAddAthleteModal(true)}
                >
                  <Ionicons name="add" size={18} color="#d04044" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#d04044' }}>
                    Adicionar Atleta
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#d04044',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                  }}
                  onPress={() => setShowDeleteAthleteModal(true)}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    Excluir Atleta
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Search */}
            <View style={{
              position: 'relative',
              marginBottom: 20,
              maxWidth: 320,
            }}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#7f7f7f"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: 12,
                }}
              />
              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: '#f5f5f5',
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingLeft: 44,
                  paddingRight: 14,
                  fontSize: 14,
                }}
                placeholder="Buscar atleta..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Table */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              overflow: 'hidden',
            }}>
              {/* Table Header */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#f9f9f9',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e5e5',
              }}>
                <Text style={{
                  flex: 2,
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#4f4f4f',
                }}>
                  Nome do Atleta
                </Text>
                <Text style={{
                  flex: 1.5,
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#4f4f4f',
                  textAlign: 'center',
                }}>
                  Sessões Registradas
                </Text>
                <Text style={{
                  flex: 1.5,
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#4f4f4f',
                  textAlign: 'center',
                }}>
                  Última Sessão
                </Text>
                <Text style={{
                  flex: 1.5,
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#4f4f4f',
                  textAlign: 'right',
                }}>
                  Ações
                </Text>
              </View>

              {/* Table Rows */}
              {coachAthletes
                .filter(athlete => 
                  athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((athlete, index) => (
                <View
                  key={athlete.name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: index < coachAthletes.length - 1 ? 1 : 0,
                    borderBottomColor: '#f0f0f0',
                  }}
                >
                  <View style={{
                    flex: 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <Ionicons name="person-outline" size={20} color="#d04044" />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#1f1f1f',
                    }}>
                      {athlete.name}
                    </Text>
                  </View>

                  <Text style={{
                    flex: 1.5,
                    fontSize: 14,
                    color: '#4f4f4f',
                    textAlign: 'center',
                  }}>
                    {athlete.totalEntries}
                  </Text>

                  <Text style={{
                    flex: 1.5,
                    fontSize: 14,
                    color: '#4f4f4f',
                    textAlign: 'center',
                  }}>
                    {athlete.lastEntryDate || '-'}
                  </Text>

                  <View style={{
                    flex: 1.5,
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 8,
                  }}>
                    <Pressable
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#e0e0e0',
                        borderRadius: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                      }}
                      onPress={() => loadAthleteDetails(athlete)}
                    >
                      <Ionicons name="eye-outline" size={16} color="#7f7f7f" />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#4f4f4f' }}>
                        Detalhes
                      </Text>
                    </Pressable>
                    <Pressable
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#fff5f5',
                        borderWidth: 1,
                        borderColor: '#d04044',
                        borderRadius: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                      }}
                      onPress={() => {
                        setSelectedAthleteForDelete(athlete.name);
                        setShowDeleteAthleteModal(true);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#d04044" />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#d04044' }}>
                        Excluir
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Footer */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: '#e5e5e5',
              }}>
                <Text style={{ fontSize: 13, color: '#7f7f7f' }}>
                  Mostrando 1 a {coachAthletes.length} de {coachAthletes.length} atletas
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: '#f5f5f5',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="chevron-back" size={16} color="#7f7f7f" />
                  </Pressable>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    backgroundColor: '#d04044',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>1</Text>
                  </View>
                  <Pressable
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: '#f5f5f5',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#7f7f7f" />
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null
      ) : activeScreen === "weather" && currentWeather ? (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            paddingHorizontal: 12,
            paddingLeft: 44,
            paddingTop: 10,
            paddingBottom: 28,
            maxWidth: 900,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Pressable style={{ padding: 8 }} onPress={() => setActiveScreen("home")}>
              <Ionicons name="arrow-back" size={24} color="#1f1f1f" />
            </Pressable>
          </View>
          <View
            style={{
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 32,
              alignItems: "center",
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name="cloud-outline" size={80} color="#d04044" style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 64, fontWeight: "700", color: "#1f1f1f", marginBottom: 4 }}>
              {currentWeather.temperature}°C
            </Text>
            <Text style={{ fontSize: 20, color: "#7f7f7f", marginBottom: 24, textTransform: "capitalize" }}>
              {currentWeather.description}
            </Text>
            <View style={{ flexDirection: "row", gap: 48, marginBottom: 32 }}>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="water-outline" size={32} color="#3b82f6" />
                <Text style={{ fontSize: 18, color: "#1f1f1f", marginTop: 4 }}>
                  {currentWeather.humidity}%
                </Text>
                <Text style={{ fontSize: 12, color: "#7f7f7f" }}>Umidade</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "#d04044",
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 12,
                width: "100%",
                maxWidth: 320,
                alignItems: "center",
              }}
              onPress={() => {
                setTemperature(String(currentWeather.temperature));
                setHumidity(String(currentWeather.humidity));
                resetTrainingSession();
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
                Iniciar Nova Sessão
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            paddingHorizontal: 16,
            paddingLeft: 48,
            paddingTop: 24,
            paddingBottom: 24,
            maxWidth: 900,
            width: "100%",
            alignSelf: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: "100%",
              alignItems: "center",
            }}
          >
            {/* Runner Icon at the top */}
            <View style={{
              marginBottom: 16,
            }}>
              <Ionicons name="walk" size={72} color="#d04044" />
            </View>

            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: "#1f1f1f",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Bem vindo(a), {user?.name}!
            </Text>
            
            {/* Weather Widget */}
            {weatherLoading ? (
              <View style={{
                width: "100%",
                maxWidth: 340,
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
                marginBottom: 20,
              }}>
                <ActivityIndicator size="large" color="#d04044" />
                <Text style={{ marginTop: 12, color: "#7f7f7f", fontSize: 14 }}>Carregando clima...</Text>
              </View>
            ) : currentWeather ? (
              <View style={{
                width: "100%",
                maxWidth: 340,
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 28,
                alignItems: "center",
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}>
                {/* Sun behind cloud icon */}
                <View style={{ position: 'relative', marginBottom: 16 }}>
                  <Ionicons name="sunny" size={60} color="#fbbf24" style={{ position: 'absolute', top: -8, right: -16, opacity: 0.8 }} />
                  <Ionicons name="cloud-outline" size={72} color="#60a5fa" />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 24, marginBottom: 12, width: "100%", justifyContent: "center" }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 40, fontWeight: "700", color: "#1f1f1f" }}>
                      {currentWeather.temperature}°C
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: "500" }}>Temperatura</Text>
                  </View>
                  <View style={{ width: 2, height: 52, backgroundColor: "#e5e7eb", borderRadius: 2 }} />
                  <View style={{ alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Ionicons name="water-outline" size={24} color="#3b82f6" />
                      <Text style={{ fontSize: 32, fontWeight: "700", color: "#1f1f1f" }}>
                        {currentWeather.humidity}%
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "500" }}>Umidade</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 16, color: "#4b5563", textTransform: "capitalize", fontWeight: "500" }}>
                  {currentWeather.description}
                </Text>
              </View>
            ) : null}

            {/* Nova Sessão Button with icons */}
            <TouchableOpacity
              style={{
                backgroundColor: "#d04044",
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 14,
                width: "100%",
                maxWidth: 300,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                shadowColor: '#d04044',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
              onPress={() => {
                if (currentWeather) {
                  setTemperature(String(currentWeather.temperature));
                  setHumidity(String(currentWeather.humidity));
                }
                resetTrainingSession();
                setActiveScreen("pre-session");
              }}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                Nova Sessão
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}


      {/* Add Athlete Modal */}
      {showAddAthleteModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1f1f1f',
              marginBottom: 16,
            }}>
              Adicionar Atleta
            </Text>
            <View style={{ gap: 12, marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f1f1f' }}>Nome:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#bdbdbd',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                }}
                placeholder="Nome do atleta"
                value={newAthlete.name}
                onChangeText={(text) => setNewAthlete(prev => ({ ...prev, name: text }))}
              />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f1f1f' }}>Email:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#bdbdbd',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                }}
                placeholder="Email do atleta"
                keyboardType="email-address"
                value={newAthlete.email}
                onChangeText={(text) => setNewAthlete(prev => ({ ...prev, email: text }))}
              />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f1f1f' }}>Modalidade:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#bdbdbd',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                }}
                placeholder="Modalidade do atleta"
                value={newAthlete.sport}
                onChangeText={(text) => setNewAthlete(prev => ({ ...prev, sport: text }))}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: '#e8e8e8',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowAddAthleteModal(false);
                  setNewAthlete({ name: "", email: "", sport: "" });
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f1f1f' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: '#d04044',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (newAthlete.name.trim()) {
                    showSuccess(`Atleta ${newAthlete.name} adicionado com sucesso!`);
                    setShowAddAthleteModal(false);
                    setNewAthlete({ name: "", email: "", sport: "" });
                  }
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Adicionar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Delete Athlete Modal */}
      {showDeleteAthleteModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            width: '90%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1f1f1f',
              marginBottom: 16,
            }}>
              Excluir Atleta
            </Text>
            <View style={{ gap: 10, marginBottom: 20, maxHeight: 300, overflow: 'scroll' }}>
              {coachAthletes.map((athlete) => (
                <Pressable
                  key={athlete.name}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: selectedAthleteForDelete === athlete.name ? '#fff5f5' : '#f5f5f5',
                    borderWidth: 1,
                    borderColor: selectedAthleteForDelete === athlete.name ? '#d04044' : '#e0e0e0',
                  }}
                  onPress={() => setSelectedAthleteForDelete(athlete.name)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f1f1f' }}>{athlete.name}</Text>
                  {selectedAthleteForDelete === athlete.name && (
                    <Ionicons name="checkmark-circle" size={20} color="#d04044" />
                  )}
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: '#e8e8e8',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowDeleteAthleteModal(false);
                  setSelectedAthleteForDelete(null);
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f1f1f' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: '#c41e3a',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (selectedAthleteForDelete) {
                    showError(`Atleta ${selectedAthleteForDelete} removido (simulado)`);
                    setShowDeleteAthleteModal(false);
                    setSelectedAthleteForDelete(null);
                  }
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
