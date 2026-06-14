import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import {
  AFTER_COMPETITION_TIMING,
  AFTER_TRAINING_TIMING,
  BEFORE_COMPETITION_TIMING,
  BEFORE_TRAINING_TIMING,
  CONTEXT_OPTIONS,
  DURING_COMPETITION_TIMING,
  DURING_TRAINING_TIMING,
  GI_SYMPTOMS,
  GiSurveyResponses,
  PhaseGiData,
  SEVERITY_LEGEND,
  includesCompetition,
  includesTraining,
} from "@/biblioteca/giQuestionnaire";
import { styles } from "@/estilos/index.styles";

type Phase = "pre" | "during" | "post";

type Props = {
  phase: Phase;
  data: GiSurveyResponses;
  onChange: (phase: Phase, field: keyof PhaseGiData, value: any) => void;
  onSeverityChange: (phase: Phase, field: keyof PhaseGiData, symptom: string, severity: number) => void;
};

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
    <View style={{ marginTop: 8 }}>
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
    <View style={{ marginTop: 8 }}>
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
  // Split symptoms into two columns
  const mid = Math.ceil(GI_SYMPTOMS.length / 2);
  const column1 = GI_SYMPTOMS.slice(0, mid);
  const column2 = GI_SYMPTOMS.slice(mid);

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.helperText}>{SEVERITY_LEGEND}</Text>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flex: 1 }}>
          {column1.map((symptom) => (
            <View key={symptom} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 15, color: "#1f1f1f", marginBottom: 6, fontWeight: "500" }}>{symptom}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => onChange(symptom, n)}
                      style={[
                        {
                          width: 36,
                          height: 36,
                          borderRadius: 8,
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
                          fontSize: 14,
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
        <View style={{ flex: 1 }}>
          {column2.map((symptom) => (
            <View key={symptom} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 15, color: "#1f1f1f", marginBottom: 6, fontWeight: "500" }}>{symptom}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => onChange(symptom, n)}
                      style={[
                        {
                          width: 36,
                          height: 36,
                          borderRadius: 8,
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
                          fontSize: 14,
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
      </View>
    </View>
  );
}

export function BlocoGiSessao({ phase, data, onChange, onSeverityChange }: Props) {
  const phaseData = data[phase];

  const phaseLabel = {
    pre: "antes da sessao",
    during: "durante a sessao",
    post: "apos a sessao"
  }[phase];

  // Para fase pós-sessão, simplificar: só perguntar se sentiu sintomas e quando começaram
  if (phase === "post") {
    return (
      <View>
        <Text style={[styles.helperText, { marginBottom: 4, lineHeight: 18 }]}>
          Sintomas gastrointestinais {phaseLabel}
        </Text>

        <YesNoQuestion
          label="Você sentiu sintomas gastrointestinais após o exercício?"
          value={phaseData.after_training as "sim" | "nao" | null}
          onChange={(v) => {
            onChange(phase, "after_training" as keyof PhaseGiData, v);
          }}
        />

        {phaseData.after_training === "sim" ? (
          <>
            <TimingQuestion
              label="Quando os sintomas começaram após o exercício?"
              options={AFTER_TRAINING_TIMING}
              value={phaseData.after_training_timing}
              hours={phaseData.after_training_hours}
              onChange={(v) => onChange(phase, "after_training_timing" as keyof PhaseGiData, v)}
              onHoursChange={(v) => onChange(phase, "after_training_hours" as keyof PhaseGiData, v)}
              hoursLabel="Horas após o término do exercício"
            />
            <SeverityGrid
              label="Gravidade dos sintomas após o exercício"
              values={phaseData.severity_after_training}
              onChange={(s, n) => onSeverityChange(phase, "severity_after_training" as keyof PhaseGiData, s, n)}
            />
          </>
        ) : null}
      </View>
    );
  }

  const getTimingQuestions = () => {
    if (phase === "pre") {
      return {
        training: {
          question: "Você sentiu sintomas gastrointestinais antes do treino?",
          field: "before_training",
          timingField: "before_training_timing",
          hoursField: "before_training_hours",
          severityField: "severity_before_training",
          timingOptions: BEFORE_TRAINING_TIMING,
          timingLabel: "Quando os sintomas começaram antes do treino?",
          hoursLabel: "Horas antes do inicio do treino",
          severityLabel: "Gravidade dos sintomas antes do treino"
        },
        competition: {
          question: "Você sentiu sintomas gastrointestinais antes das competições?",
          field: "before_competition",
          timingField: "before_competition_timing",
          hoursField: "before_competition_hours",
          severityField: "severity_before_competition",
          timingOptions: BEFORE_COMPETITION_TIMING,
          timingLabel: "Quando os sintomas começaram antes das competições?",
          hoursLabel: "Horas antes do inicio da prova",
          severityLabel: "Gravidade dos sintomas antes das competições"
        }
      };
    } else if (phase === "during") {
      return {
        training: {
          question: "Você sentiu sintomas gastrointestinais durante o treino?",
          field: "during_training",
          timingField: "during_training_timing",
          hoursField: "during_training_hours",
          severityField: "severity_during_training",
          timingOptions: DURING_TRAINING_TIMING,
          timingLabel: "Quando os sintomas começaram durante o treino?",
          hoursLabel: "Horas durante o treino",
          severityLabel: "Gravidade dos sintomas durante o treino"
        },
        competition: {
          question: "Você sentiu sintomas gastrointestinais durante as competições?",
          field: "during_competition",
          timingField: "during_competition_timing",
          hoursField: "during_competition_hours",
          severityField: "severity_during_competition",
          timingOptions: DURING_COMPETITION_TIMING,
          timingLabel: "Quando os sintomas começaram durante as competições?",
          hoursLabel: "Horas durante a competição",
          severityLabel: "Gravidade dos sintomas durante as competições"
        }
      };
    } else {
      return {
        training: {
          question: "Você sentiu sintomas gastrointestinais após o treino?",
          field: "after_training",
          timingField: "after_training_timing",
          hoursField: "after_training_hours",
          severityField: "severity_after_training",
          timingOptions: AFTER_TRAINING_TIMING,
          timingLabel: "Quando os sintomas comecaram após o treino?",
          hoursLabel: "Horas após o termino do exercicio",
          severityLabel: "Gravidade dos sintomas após o treino"
        },
        competition: {
          question: "Você sentiu sintomas gastrointestinais após competições?",
          field: "after_competition",
          timingField: "after_competition_timing",
          hoursField: "after_competition_hours",
          severityField: "severity_after_competition",
          timingOptions: AFTER_COMPETITION_TIMING,
          timingLabel: "Quando os sintomas comecaram apos as competicoes?",
          hoursLabel: "Horas apos o termino da prova",
          severityLabel: "Gravidade dos sintomas após as competições"
        }
      };
    }
  };

  const questions = getTimingQuestions();

  return (
    <View>
      <Text style={[styles.helperText, { marginBottom: 4, lineHeight: 18 }]}>
        Sintomas gastrointestinais {phaseLabel}
      </Text>

      <View style={{ marginTop: 8 }}>
        <Text style={styles.label}>Em qual contexto?</Text>
        <View style={styles.optionsWrap}>
          {CONTEXT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onChange(phase, "context", opt.value)}
              style={[styles.option, phaseData.context === opt.value && styles.optionSelected]}
            >
              <Text
                style={[
                  styles.optionText,
                  phaseData.context === opt.value && styles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {phaseData.context ? (
        <>
          {includesTraining(phaseData.context) ? (
            <>
              <YesNoQuestion
                label={questions.training.question}
                value={phaseData[questions.training.field as keyof PhaseGiData] as "sim" | "nao" | null}
                onChange={(v) => onChange(phase, questions.training.field as keyof PhaseGiData, v)}
              />
              {phaseData[questions.training.field as keyof PhaseGiData] === "sim" ? (
                <>
                  <TimingQuestion
                    label={questions.training.timingLabel}
                    options={questions.training.timingOptions}
                    value={phaseData[questions.training.timingField as keyof PhaseGiData] as string | null}
                    hours={phaseData[questions.training.hoursField as keyof PhaseGiData] as string | null}
                    onChange={(v) => onChange(phase, questions.training.timingField as keyof PhaseGiData, v)}
                    onHoursChange={(v) => onChange(phase, questions.training.hoursField as keyof PhaseGiData, v)}
                    hoursLabel={questions.training.hoursLabel}
                  />
                  <SeverityGrid
                    label={questions.training.severityLabel}
                    values={phaseData[questions.training.severityField as keyof PhaseGiData] as Record<string, number>}
                    onChange={(s, n) => onSeverityChange(phase, questions.training.severityField as keyof PhaseGiData, s, n)}
                  />
                </>
              ) : null}
            </>
          ) : null}

          {includesCompetition(phaseData.context) ? (
            <>
              <YesNoQuestion
                label={questions.competition.question}
                value={phaseData[questions.competition.field as keyof PhaseGiData] as "sim" | "nao" | null}
                onChange={(v) => onChange(phase, questions.competition.field as keyof PhaseGiData, v)}
              />
              {phaseData[questions.competition.field as keyof PhaseGiData] === "sim" ? (
                <>
                  <TimingQuestion
                    label={questions.competition.timingLabel}
                    options={questions.competition.timingOptions}
                    value={phaseData[questions.competition.timingField as keyof PhaseGiData] as string | null}
                    hours={phaseData[questions.competition.hoursField as keyof PhaseGiData] as string | null}
                    onChange={(v) => onChange(phase, questions.competition.timingField as keyof PhaseGiData, v)}
                    onHoursChange={(v) => onChange(phase, questions.competition.hoursField as keyof PhaseGiData, v)}
                    hoursLabel={questions.competition.hoursLabel}
                  />
                  <SeverityGrid
                    label={questions.competition.severityLabel}
                    values={phaseData[questions.competition.severityField as keyof PhaseGiData] as Record<string, number>}
                    onChange={(s, n) => onSeverityChange(phase, questions.competition.severityField as keyof PhaseGiData, s, n)}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
