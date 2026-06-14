import { useMemo, useState, useEffect } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, useWindowDimensions, View, StyleSheet } from "react-native";

import {
  generateReport,
  LongitudinalReport,
  ReportFormat,
  ReportPeriod,
} from "@/lib/reportApi";
import { reportStyles } from "./report.styles";
import { CoachAthleteSummary } from "./constants";

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
});

export function ReportScreen({ athleteName, apiBaseUrl, athletes, onSelectAthlete }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<LongitudinalReport | null>(null);
  const [selectedAthleteForReport, setSelectedAthleteForReport] = useState<CoachAthleteSummary | null>(null);

  useEffect(() => {
    setSelectedAthleteForReport(null);
    setPanel(null);
  }, []);

  const colsStyle = useMemo(() => (isWide ? reportStyles.twoCols : reportStyles.twoColsStack), [isWide]);

  const handleGenerate = async () => {
    if (!selectedAthleteForReport) {
      Alert.alert("Atleta", "Selecione um atleta da lista antes de gerar o relatorio.");
      return;
    }

    setLoading(true);
    setPanel(null);
    try {
      const result = await generateReport(apiBaseUrl, selectedAthleteForReport.name, period, format);
      if (result.kind === "longitudinal") {
        setPanel(result.data);
      } else {
        Alert.alert("Relatorio", `Arquivo gerado: ${result.filename}`);
      }
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Nao foi possivel gerar o relatorio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={reportStyles.screen} contentContainerStyle={reportStyles.scrollContent}>
      <Text style={reportStyles.pageTitle}>Relatorio</Text>

      {!selectedAthleteForReport ? (
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
                  }}
                >
                  <Text style={styles.athleteName}>{athlete.name}</Text>
                  <Text style={styles.athleteInfo}>
                    Última atualização: {last?.entryDate || athlete.lastEntryDate || "—"}
                  </Text>
                  <Text style={styles.athleteInfo}>
                    Total de registros: {athlete.totalEntries}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : (
        <View>
          <View style={reportStyles.panel}>
            <Text style={reportStyles.panelTitle}>Atleta selecionado</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#d04044" }}>
              {selectedAthleteForReport.name}
            </Text>
            <Pressable
              style={{ marginTop: 12, padding: 8, backgroundColor: "#e8e8e8", borderRadius: 8, alignSelf: "flex-start" }}
              onPress={() => setSelectedAthleteForReport(null)}
            >
              <Text style={{ color: "#1f1f1f", fontWeight: "600" }}>Trocar atleta</Text>
            </Pressable>
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
            <Pressable
              onPress={handleGenerate}
              disabled={loading}
              style={[reportStyles.generateBtn, loading && reportStyles.generateBtnDisabled]}
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
            Registros: {panel.summary.entryCount}
            {panel.summary.avgWaterIntakeMl != null
              ? ` | Media agua: ${panel.summary.avgWaterIntakeMl} mL`
              : ""}
            {panel.summary.avgWeightAfterKg != null ? ` | Media peso (depois): ${panel.summary.avgWeightAfterKg} kg` : ""}
          </Text>
          {panel.entries.map((row) => (
            <View key={row.id} style={reportStyles.panelRow}>
              <Text style={reportStyles.panelRowText}>
                {row.entryDate} — Agua {row.waterIntakeMl} mL | Peso {row.weightBeforeKg}→{row.weightAfterKg} kg | Urina{" "}
                {row.urineVolumeMl} mL | {row.urineColor}
                {row.symptoms ? ` | ${row.symptoms}` : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
