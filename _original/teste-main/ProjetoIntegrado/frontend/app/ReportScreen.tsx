import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

import {
  generateReport,
  LongitudinalReport,
  ReportFormat,
  ReportPeriod,
} from "@/lib/reportApi";
import { reportStyles } from "./report.styles";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "daily", label: "Diário" },
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

export function ReportScreen({ athleteName, apiBaseUrl }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<LongitudinalReport | null>(null);

  const colsStyle = useMemo(() => (isWide ? reportStyles.twoCols : reportStyles.twoColsStack), [isWide]);

  const handleGenerate = async () => {
    const name = athleteName.trim();
    if (!name) {
      Alert.alert("Atleta", "Preencha o nome do atleta na Tela Inicial antes de gerar o relatório.");
      return;
    }

    setLoading(true);
    setPanel(null);
    try {
      const result = await generateReport(apiBaseUrl, name, period, format);
      if (result.kind === "longitudinal") {
        setPanel(result.data);
      } else {
        Alert.alert("Relatório", `Arquivo gerado: ${result.filename}`);
      }
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível gerar o relatório.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={reportStyles.screen} contentContainerStyle={reportStyles.scrollContent}>
      <Text style={reportStyles.pageTitle}>Relatorio</Text>

      <View style={colsStyle}>
        <View style={reportStyles.panel}>
          <Text style={reportStyles.panelTitle}>Selecione o período de tempo</Text>
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
            <Text style={reportStyles.generateBtnText}>Gerar relatório</Text>
          )}
        </Pressable>
      </View>

      {panel ? (
        <View>
          <Text style={reportStyles.panelSectionTitle}>Painel longitudinal</Text>
          <Text style={reportStyles.panelSummary}>
            {panel.athleteName} — {panel.periodLabel} ({panel.dateFrom} a {panel.dateTo})
            {"\n"}
            Registros: {panel.summary.entryCount}
            {panel.summary.avgWaterIntakeMl != null
              ? ` | Média água: ${panel.summary.avgWaterIntakeMl} mL`
              : ""}
            {panel.summary.avgWeightAfterKg != null ? ` | Média peso (depois): ${panel.summary.avgWeightAfterKg} kg` : ""}
          </Text>
          {panel.entries.map((row) => (
            <View key={row.id} style={reportStyles.panelRow}>
              <Text style={reportStyles.panelRowText}>
                {row.entryDate} — Água {row.waterIntakeMl} mL | Peso {row.weightBeforeKg}→{row.weightAfterKg} kg | Urina{" "}
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
