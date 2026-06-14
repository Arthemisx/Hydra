import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AFTER_COMPETITION_TIMING,
  AFTER_TRAINING_TIMING,
  BEFORE_COMPETITION_TIMING,
  BEFORE_TRAINING_TIMING,
  DURING_COMPETITION_TIMING,
  DURING_TRAINING_TIMING,
  GI_SURVEY_PHASES,
  GI_SYMPTOMS,
  GiSurveyResponses,
  GiSurveyStep,
  INITIAL_GI_SURVEY,
  Q13_OPTIONS,
  SEVERITY_LEGEND,
  getGiStepPhase,
  getGiStepTitle,
  getNextGiStep,
  getPrevGiStep,
} from "@/biblioteca/giQuestionnaire";
import { sessionApiJson } from "@/biblioteca/sessionApi";
import { styles } from "@/estilos/index.styles";

type Props = {
  onCancel: () => void;
  onSuccess: () => void;
  onSessionExpired?: () => void;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
};

function PhaseIndicator({ currentStep }: { currentStep: GiSurveyStep }) {
  const currentPhase = getGiStepPhase(currentStep);
  const phaseOrder = GI_SURVEY_PHASES.map((p) => p.key);
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return (
    <View style={styles.giPhaseRow}>
      {GI_SURVEY_PHASES.map((phase, index) => {
        const isActive = phase.key === currentPhase;
        const isDone = index < currentIndex;
        return (
          <View
            key={phase.key}
            style={[
              styles.giPhasePill,
              isActive && styles.giPhasePillActive,
              isDone && styles.giPhasePillDone,
            ]}
          >
            <Text
              style={[
                styles.giPhaseText,
                isActive && styles.giPhaseTextActive,
                isDone && styles.giPhaseTextDone,
              ]}
            >
              {isDone ? "✓ " : ""}
              {phase.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "sim" | "nao" | null;
  onChange: (v: "sim" | "nao") => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsWrap}>
        {(["sim", "nao"] as const).map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.option, value === opt && styles.optionSelected]}
          >
            <Text style={[styles.optionText, value === opt && styles.optionTextSelected]}>
              {opt === "sim" ? "Sim" : "Nao"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TimingQuestion({
  label,
  options,
  value,
  hours,
  onChange,
  onHoursChange,
  hoursLabel,
}: {
  label: string;
  options: string[];
  value: string | null;
  hours: string | null;
  onChange: (v: string) => void;
  onHoursChange: (v: string) => void;
  hoursLabel?: string;
}) {
  const needsHours =
    value &&
    (value.includes("Horas") ||
      value.includes("horario") ||
      value.includes("selecionar horario") ||
      value.includes("Selecionar horario"));

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsWrap}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.option, value === opt && styles.optionSelected]}
          >
            <Text style={[styles.optionText, value === opt && styles.optionTextSelected]}>{opt}</Text>
          </Pressable>
        ))}
      </View>
      {needsHours ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>{hoursLabel || "Horas"}</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Ex: 2"
            value={hours || ""}
            onChangeText={onHoursChange}
          />
        </View>
      ) : null}
    </View>
  );
}

function SeverityGrid({
  label,
  values,
  onChange,
}: {
  label: string;
  values: Record<string, number>;
  onChange: (symptom: string, severity: number) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.helperText}>{SEVERITY_LEGEND}</Text>
      {GI_SYMPTOMS.map((symptom) => (
        <View key={symptom} style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 13, color: "#1f1f1f", marginBottom: 4 }}>{symptom}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <Pressable
                  key={n}
                  onPress={() => onChange(symptom, n)}
                  style={[
                    {
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: "#bdbdbd",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#fff",
                    },
                    (values[symptom] ?? 0) === n && {
                      backgroundColor: "#d04044",
                      borderColor: "#d04044",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: (values[symptom] ?? 0) === n ? "#fff" : "#1f1f1f",
                    }}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

function validateStep(step: GiSurveyStep, data: GiSurveyResponses): string | null {
  switch (step) {
    case "q12":
      return data.q12_has_symptoms ? null : "Selecione Sim ou Nao.";
    case "q13":
      return data.q13_frequency ? null : "Selecione uma opcao.";
    case "q14":
      return data.q14_before_training ? null : "Selecione Sim ou Nao.";
    case "q15":
      return data.q15_before_training_timing ? null : "Selecione o momento mais comum.";
    case "q17":
      return data.q17_during_training ? null : "Selecione Sim ou Nao.";
    case "q18":
      return data.q18_during_training_timing ? null : "Selecione o horario mais comum.";
    case "q20":
      return data.q20_after_training ? null : "Selecione Sim ou Nao.";
    case "q21":
      return data.q21_after_training_timing ? null : "Selecione o horario mais comum.";
    case "q23":
      return data.q23_before_competition ? null : "Selecione Sim ou Nao.";
    case "q24":
      return data.q24_before_competition_timing ? null : "Selecione o horario mais comum.";
    case "q26":
      return data.q26_during_competition ? null : "Selecione Sim ou Nao.";
    case "q27":
      return data.q27_during_competition_timing ? null : "Selecione o momento mais comum.";
    case "q29":
      return data.q29_after_competition ? null : "Selecione Sim ou Nao.";
    case "q30":
      return data.q30_after_competition_timing ? null : "Selecione o horario mais comum.";
    default:
      return null;
  }
}

export function FormularioSgiCompeticao({
  onCancel,
  onSuccess,
  onSessionExpired,
  showError,
  showSuccess,
}: Props) {
  const [step, setStep] = useState<GiSurveyStep>("intro");
  const [data, setData] = useState<GiSurveyResponses>({ ...INITIAL_GI_SURVEY });
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof GiSurveyResponses>(key: K, value: GiSurveyResponses[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSeverity = (
    key: keyof GiSurveyResponses,
    symptom: string,
    severity: number,
  ) => {
    setData((prev) => {
      const current = (prev[key] as Record<string, number>) || {};
      return { ...prev, [key]: { ...current, [symptom]: severity } };
    });
  };

  const handleNext = async () => {
    if (step === "intro") {
      setStep("q12");
      return;
    }

    const error = validateStep(step, data);
    if (error) {
      showError(error);
      return;
    }

    const next = getNextGiStep(step, data);
    if (next === "submit") {
      setSubmitting(true);
      try {
        await sessionApiJson("/gi-competition-surveys", {
          method: "POST",
          body: JSON.stringify({ responses: data }),
        });
        showSuccess("Questionario de competicao salvo com sucesso!");
        onSuccess();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Nao foi possivel salvar o questionario.";
        if (
          msg.includes("login") ||
          msg.includes("Token") ||
          msg.includes("Sessao expirada")
        ) {
          onSessionExpired?.();
        }
        showError(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStep(next);
  };

  const handleBack = () => {
    const prev = getPrevGiStep(step, data);
    if (prev) setStep(prev);
    else onCancel();
  };

  const renderStep = () => {
    switch (step) {
      case "intro":
        return (
          <View style={styles.giIntroBox}>
            <Text style={[styles.helperText, { lineHeight: 20 }]}>
              Antes, durante ou depois de exercicios alguns atletas apresentam sintomas
              gastrointestinais, como arrotos, nauseas, inchaco abdominal, diarreia, etc. As perguntas a
              seguir estão relacionadas aos sintomas gastrointestinais e a gravidade dos sintomas
              experimentados antes, durante ou depois do treinamento e/ou competição.
            </Text>
          </View>
        );
      case "q12":
        return (
          <YesNoQuestion
            label="Q12. Você apresenta sintomas gastrointestinais (por exemplo, arrotos, nauseas, inchaco abdominal, diarreia etc.) antes, durante ou depois do treinamento e/ou competição?"
            value={data.q12_has_symptoms}
            onChange={(v) => update("q12_has_symptoms", v)}
          />
        );
      case "q13":
        return (
          <View>
            <Text style={styles.label}>
              Q13. Quando voce apresenta sintomas gastrointestinais com mais frequencia?
            </Text>
            <View style={styles.optionsWrap}>
              {Q13_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => update("q13_frequency", opt.value)}
                  style={[styles.option, data.q13_frequency === opt.value && styles.optionSelected]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      data.q13_frequency === opt.value && styles.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case "q14":
        return (
          <YesNoQuestion
            label="Q14. Voce sente sintomas gastrointestinais ANTES do treino?"
            value={data.q14_before_training}
            onChange={(v) => update("q14_before_training", v)}
          />
        );
      case "q15":
        return (
          <TimingQuestion
            label="Q15. Quando os seus sintomas gastrointestinais comecam ANTES do treino? Selecione o momento mais comum."
            options={BEFORE_TRAINING_TIMING}
            value={data.q15_before_training_timing}
            hours={data.q15_before_training_hours}
            onChange={(v) => update("q15_before_training_timing", v)}
            onHoursChange={(v) => update("q15_before_training_hours", v)}
            hoursLabel="Horas antes do inicio do treino"
          />
        );
      case "q16":
        return (
          <SeverityGrid
            label="Q16. Gravidade dos sintomas gastrointestinais ANTES do treino."
            values={data.q16_severity_before_training}
            onChange={(s, n) => updateSeverity("q16_severity_before_training", s, n)}
          />
        );
      case "q17":
        return (
          <YesNoQuestion
            label="Q17. Voce sente sintomas gastrointestinais DURANTE o treinamento?"
            value={data.q17_during_training}
            onChange={(v) => update("q17_during_training", v)}
          />
        );
      case "q18":
        return (
          <TimingQuestion
            label="Q18. DURANTE o treinamento, quando seus sintomas gastrointestinais costumam comecar?"
            options={DURING_TRAINING_TIMING}
            value={data.q18_during_training_timing}
            hours={data.q18_during_training_hours}
            onChange={(v) => update("q18_during_training_timing", v)}
            onHoursChange={(v) => update("q18_during_training_hours", v)}
            hoursLabel="Horas durante o treino"
          />
        );
      case "q19":
        return (
          <SeverityGrid
            label="Q19. Gravidade dos sintomas gastrointestinais DURANTE o treinamento."
            values={data.q19_severity_during_training}
            onChange={(s, n) => updateSeverity("q19_severity_during_training", s, n)}
          />
        );
      case "q20":
        return (
          <YesNoQuestion
            label="Q20. Você sente sintomas gastrointestinais APOS o treinamento?"
            value={data.q20_after_training}
            onChange={(v) => update("q20_after_training", v)}
          />
        );
      case "q21":
        return (
          <TimingQuestion
            label="Q21. APÓS o treino, quando seus sintomas gastrointestinais costumam começar?"
            options={AFTER_TRAINING_TIMING}
            value={data.q21_after_training_timing}
            hours={data.q21_after_training_hours}
            onChange={(v) => update("q21_after_training_timing", v)}
            onHoursChange={(v) => update("q21_after_training_hours", v)}
            hoursLabel="Horas apos o termino do exercicio"
          />
        );
      case "q22":
        return (
          <SeverityGrid
            label="Q22. Gravidade dos sintomas gastrointestinais APÓS o treinamento."
            values={data.q22_severity_after_training}
            onChange={(s, n) => updateSeverity("q22_severity_after_training", s, n)}
          />
        );
      case "q23":
        return (
          <YesNoQuestion
            label="Q23. Você sente sintomas gastrointestinais ANTES das competições?"
            value={data.q23_before_competition}
            onChange={(v) => update("q23_before_competition", v)}
          />
        );
      case "q24":
        return (
          <TimingQuestion
            label="Q24. ANTES das competições, quando seus sintomas gastrointestinais costumam começar?"
            options={BEFORE_COMPETITION_TIMING}
            value={data.q24_before_competition_timing}
            hours={data.q24_before_competition_hours}
            onChange={(v) => update("q24_before_competition_timing", v)}
            onHoursChange={(v) => update("q24_before_competition_hours", v)}
            hoursLabel="Horas antes do inicio da prova/exercicio"
          />
        );
      case "q25":
        return (
          <SeverityGrid
            label="Q25. Gravidade dos sintomas gastrointestinais ANTES das competições."
            values={data.q25_severity_before_competition}
            onChange={(s, n) => updateSeverity("q25_severity_before_competition", s, n)}
          />
        );
      case "q26":
        return (
          <YesNoQuestion
            label="Q26. Você sente sintomas gastrointestinais DURANTE as competições?"
            value={data.q26_during_competition}
            onChange={(v) => update("q26_during_competition", v)}
          />
        );
      case "q27":
        return (
          <TimingQuestion
            label="Q27. DURANTE as competições, quando seus sintomas gastrointestinais geralmente começam?"
            options={DURING_COMPETITION_TIMING}
            value={data.q27_during_competition_timing}
            hours={data.q27_during_competition_hours}
            onChange={(v) => update("q27_during_competition_timing", v)}
            onHoursChange={(v) => update("q27_during_competition_hours", v)}
            hoursLabel="Horas durante a competicao"
          />
        );
      case "q28":
        return (
          <SeverityGrid
            label="Q28. Gravidade dos sintomas gastrointestinais DURANTE as competições."
            values={data.q28_severity_during_competition}
            onChange={(s, n) => updateSeverity("q28_severity_during_competition", s, n)}
          />
        );
      case "q29":
        return (
          <YesNoQuestion
            label="Q29. Você sente sintomas gastrointestinais APÓS as competições?"
            value={data.q29_after_competition}
            onChange={(v) => update("q29_after_competition", v)}
          />
        );
      case "q30":
        return (
          <TimingQuestion
            label="Q30. APÓS as competições, quando seus sintomas gastrointestinais geralmente começam?"
            options={AFTER_COMPETITION_TIMING}
            value={data.q30_after_competition_timing}
            hours={data.q30_after_competition_hours}
            onChange={(v) => update("q30_after_competition_timing", v)}
            onHoursChange={(v) => update("q30_after_competition_hours", v)}
            hoursLabel="Horas apos o termino da prova/exercicio"
          />
        );
      case "q31":
        return (
          <SeverityGrid
            label="Q31. Gravidade dos sintomas gastrointestinais APÓS as competições."
            values={data.q31_severity_after_competition}
            onChange={(s, n) => updateSeverity("q31_severity_after_competition", s, n)}
          />
        );
      default:
        return null;
    }
  };

  const nextLabel =
    step === "intro"
      ? "Iniciar questionario"
      : getNextGiStep(step, data) === "submit"
        ? submitting
          ? "Salvando..."
          : "Finalizar"
        : "Salvar e Continuar";

  const stepTitle = step === "intro" ? "Sintomas Gastrointestinais Associados ao Exercicio" : getGiStepTitle(step);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.contentCard}>
        <View style={styles.topBar}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Nova Sessão de Competição</Text>
            <Text style={styles.subtitle}>Preencha o questionario de sintomas gastrointestinais (SGI)</Text>
          </View>
        </View>

        <PhaseIndicator currentStep={step} />

        <View style={styles.fieldCard}>
          <Text style={styles.cardTitle}>{stepTitle}</Text>
          {renderStep()}

          <View style={styles.giFooterRow}>
            <Pressable
              onPress={handleBack}
              disabled={submitting}
              style={styles.giSecondaryButton}
            >
              <Text style={[styles.buttonText, { color: "#1f1f1f" }]}>
                {step === "intro" ? "Cancelar" : "Voltar"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              disabled={submitting}
              style={[styles.button, styles.giPrimaryButton, submitting && styles.buttonDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{nextLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
