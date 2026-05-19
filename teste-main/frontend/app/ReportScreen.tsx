import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View, StyleSheet } from "react-native";

import {
  generateReport,
  LongitudinalReport,
  ReportFormat,
  ReportPeriod,
} from "@/lib/reportApi";
import { reportStyles } from "./report.styles";
import { CoachAthleteSummary } from "./constants";
import { useFeedback } from "@/components/FeedbackProvider";
import { StatusBanner } from "@/components/StatusBanner";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "daily", label: "Diario" },
  { key: "weekly", label: "Semanal" },
  { key: "monthly", label: "Mensal" },
];

const FORMATS: { key: ReportFormat; label: string }[] = [
  { key: "pdf", label: "PDF" },
  { key: "spreadsheet", label: "Planilha" },
  { key: "longitudinal", label: "Painel longitudinal" },
];

type Props = {
  athleteName: string;
  apiBaseUrl: string;
  userRole: "athlete" | "team";
  athletes: CoachAthleteSummary[];
  onSelectAthlete: (athlete: CoachAthleteSummary) => void;
};

function CheckRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={reportStyles.checkRow} onPress={onPress}>
      <View style={[reportStyles.checkBox, selected && reportStyles.checkBoxOn]}>
        {selected ? <Text style={reportStyles.checkMark}>✓</Text> : null}
      </View>
      <Text style={reportStyles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  athleteCard: {
    borderWidth: 2,
    borderColor: "#d04044",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
  },
  athleteName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 8,
  },
  athleteInfo: {
    fontSize: 14,
    color: "#7f7f7f",
    marginBottom: 4,
  },
  athleteBanner: {
    backgroundColor: "#fff8e1",
    borderColor: "#ffc107",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  athleteBannerText: {
    fontSize: 14,
    color: "#6d4c00",
    lineHeight: 20,
  },
});

export function ReportScreen({ athleteName, apiBaseUrl, userRole, athletes, onSelectAthlete }: Props) {
  const isAthlete = userRole === "athlete";
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<LongitudinalReport | null>(null);
  const [selectedAthleteForReport, setSelectedAthleteForReport] = useState<CoachAthleteSummary | null>(null);
  const { showSuccess, showError, showInfo } = useFeedback();

  useEffect(() => {
    if (isAthlete && athleteName) {
      setSelectedAthleteForReport({
        name: athleteName,
        lastEntryDate: null,
        totalEntries: 0,
        lastEntry: null,
      });
    } else {
      setSelectedAthleteForReport(null);
    }
    setPanel(null);
  }, [isAthlete, athleteName]);

  const colsStyle = useMemo(() => (isWide ? reportStyles.twoCols : reportStyles.twoColsStack), [isWide]);

  const reportTargetName = selectedAthleteForReport?.name || athleteName;

  const handleGenerate = async () => {
    if (!reportTargetName) {
      showError(isAthlete ? "Nome do atleta nao encontrado." : "Selecione um atleta da lista.");
      return;
    }

    setLoading(true);
    setPanel(null);
    showInfo("Gerando relatorio...");
    try {
      const result = await generateReport(
        apiBaseUrl,
        reportTargetName,
        period,
        format,
        isAthlete ? "sessions" : "auto",
      );
      if (result.kind === "longitudinal") {
        setPanel(result.data);
        const count =
          result.data.reportType === "sessions"
            ? result.data.summary.sessionCount ?? 0
            : result.data.summary.entryCount ?? 0;
        if (count === 0) {
          showError("Nenhuma sessao ou registro encontrado no periodo.");
        } else {
          showSuccess("Painel longitudinal pronto!");
        }
      } else {
        showSuccess(`Arquivo gerado: ${result.filename}`);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Nao foi possivel gerar o relatorio.");
    } finally {
      setLoading(false);
    }
  };

  const showCoachPicker = !isAthlete && !selectedAthleteForReport;

  return (
    <ScrollView style={reportStyles.screen} contentContainerStyle={reportStyles.scrollContent}>
      <Text style={reportStyles.pageTitle}>{isAthlete ? "Meu relatorio" : "Relatorio"}</Text>

      {isAthlete ? (
        <View style={styles.athleteBanner}>
          <Text style={styles.athleteBannerText}>
            Relatorios das suas sessoes de hidratacao ({athleteName}). Escolha o periodo e o formato abaixo.
          </Text>
        </View>
      ) : null}

      {showCoachPicker ? (
        <View>
          <Text style={reportStyles.panelTitle}>Selecione o atleta</Text>
          {athletes.length === 0 ? (
            <Text style={{ color: "#7f7f7f", marginTop: 16 }}>Nenhum atleta encontrado.</Text>
          ) : (
            athletes.map((athlete) => {
              const last = athlete.lastEntry;
              return (
                <Pressable
                  key={athlete.name}
                  style={styles.athleteCard}
                  onPress={() => {
                    setSelectedAthleteForReport(athlete);
                    onSelectAthlete(athlete);
                    showInfo(`Atleta ${athlete.name} selecionado.`);
                  }}
                >
                  <Text style={styles.athleteName}>{athlete.name}</Text>
                  <Text style={styles.athleteInfo}>
                    Ultima atualizacao: {last?.entryDate || athlete.lastEntryDate || "—"}
                  </Text>
                  <Text style={styles.athleteInfo}>Sessoes: {athlete.totalEntries}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <View>
          <View style={reportStyles.panel}>
            <Text style={reportStyles.panelTitle}>
              {isAthlete ? "Seus dados" : "Atleta selecionado"}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#d04044" }}>{reportTargetName}</Text>
            {!isAthlete ? (
              <Pressable
                style={{
                  marginTop: 12,
                  padding: 8,
                  backgroundColor: "#e8e8e8",
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
                onPress={() => setSelectedAthleteForReport(null)}
              >
                <Text style={{ color: "#1f1f1f", fontWeight: "600" }}>Trocar atleta</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={colsStyle}>
            <View style={reportStyles.panel}>
              <Text style={reportStyles.panelTitle}>Selecione o periodo de tempo</Text>
              {PERIODS.map((p) => (
                <CheckRow key={p.key} label={p.label} selected={period === p.key} onPress={() => setPeriod(p.key)} />
              ))}
            </View>

            <View style={reportStyles.panel}>
              <Text style={reportStyles.panelTitle}>Escolha o formato</Text>
              {FORMATS.map((f) => (
                <CheckRow key={f.key} label={f.label} selected={format === f.key} onPress={() => setFormat(f.key)} />
              ))}
            </View>
          </View>

          <View style={reportStyles.footer}>
            {loading ? <StatusBanner message="Gerando relatorio, aguarde..." variant="loading" /> : null}

            <Pressable
              onPress={handleGenerate}
              disabled={loading}
              style={({ pressed }) => [
                reportStyles.generateBtn,
                loading && reportStyles.generateBtnDisabled,
                pressed && !loading && { opacity: 0.85 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={reportStyles.generateBtnText}>Gerar relatorio</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {panel ? (
        <View>
          <Text style={reportStyles.panelSectionTitle}>Painel longitudinal</Text>
          <Text style={reportStyles.panelSummary}>
            {panel.athleteName} — {panel.periodLabel} ({panel.dateFrom} a {panel.dateTo})
            {"\n"}
            {panel.reportType === "sessions" ? (
              <>
                Sessoes: {panel.summary.sessionCount ?? 0}
                {panel.summary.avgFluidMl != null ? ` | Media fluidos: ${panel.summary.avgFluidMl} mL` : ""}
                {panel.summary.avgSweatRateLh != null ? ` | Media suor: ${panel.summary.avgSweatRateLh} L/h` : ""}
              </>
            ) : (
              <>
                Registros: {panel.summary.entryCount ?? 0}
                {panel.summary.avgWaterIntakeMl != null
                  ? ` | Media agua: ${panel.summary.avgWaterIntakeMl} mL`
                  : ""}
                {panel.summary.avgWeightAfterKg != null
                  ? ` | Media peso (depois): ${panel.summary.avgWeightAfterKg} kg`
                  : ""}
              </>
            )}
          </Text>
          {panel.reportType === "sessions" && panel.sessions
            ? panel.sessions.map((row) => (
                <View key={row.id} style={reportStyles.panelRow}>
                  <Text style={reportStyles.panelRowText}>
                    {row.entryDate} — {row.status} | Pre {row.preMassKg ?? "—"} kg → Pos {row.postMassKg ?? "—"} kg |
                    Fluidos {row.fluidIntakeMl ?? 0} mL
                    {row.sweatRateLh != null ? ` | Suor ${row.sweatRateLh} L/h` : ""}
                    {row.alertLevel ? ` | ${row.alertLevel}` : ""}
                  </Text>
                </View>
              ))
            : null}
          {panel.entries
            ? panel.entries.map((row) => (
                <View key={row.id} style={reportStyles.panelRow}>
                  <Text style={reportStyles.panelRowText}>
                    {row.entryDate} — Agua {row.waterIntakeMl} mL | Peso {row.weightBeforeKg}→{row.weightAfterKg} kg |
                    Urina {row.urineVolumeMl} mL | {row.urineColor}
                    {row.symptoms ? ` | ${row.symptoms}` : ""}
                  </Text>
                </View>
              ))
            : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
