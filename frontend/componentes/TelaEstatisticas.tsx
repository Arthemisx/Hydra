import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView, Pressable, Modal, TouchableOpacity } from "react-native";
import { fetchWithAuth } from "@/biblioteca/apiAuth";
import { resolveApiBaseUrl } from "@/biblioteca/api";
import { GraficoBarras } from "./GraficoBarras";
import { Ionicons } from "@expo/vector-icons";

interface DailyStat {
  date: string;
  sessions: number;
  water_ml: number;
}

interface StatisticsData {
  period_days: number;
  total_sessions: number;
  daily_stats: DailyStat[];
}

const PERIOD_OPTIONS = [
  { label: "Última semana", days: 7 },
  { label: "Último mês", days: 30 },
  { label: "Últimos 3 meses", days: 90 },
  { label: "Últimos 6 meses", days: 180 },
];

export function TelaEstatisticas() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<StatisticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]); // Última semana por padrão
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const apiBaseUrl = resolveApiBaseUrl();

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/sessions/statistics?days=${selectedPeriod.days}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas");
      }
      const result = await response.json();
      setData(result);
      setError("");
    } catch (e) {
      setError("Não foi possível carregar as estatísticas.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando estatísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return null;
  }

  const sessionsData = data.daily_stats.slice(0, 7).reverse().map((stat) => ({
    label: formatDate(stat.date),
    value: stat.sessions,
    color: "#10b981",
  }));

  const waterData = data.daily_stats.slice(0, 7).reverse().map((stat) => ({
    label: formatDate(stat.date),
    value: Math.round(stat.water_ml),
    color: "#3b82f6",
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estatísticas de Treinos</Text>
          <Text style={styles.headerSubtitle}>Últimos {data.period_days} dias</Text>
        </View>

        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>Período:</Text>
          <Pressable
            style={styles.periodButton}
            onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
          >
            <Text style={styles.periodButtonText}>{selectedPeriod.label}</Text>
            <Ionicons
              name={showPeriodDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6b7280"
            />
          </Pressable>
        </View>

        <Modal
          visible={showPeriodDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPeriodDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPeriodDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecione o período</Text>
              {PERIOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.days}
                  style={[
                    styles.modalOption,
                    selectedPeriod.days === option.days && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedPeriod(option);
                    setShowPeriodDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedPeriod.days === option.days && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data.total_sessions}</Text>
            <Text style={styles.summaryLabel}>Sessões Totais</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{data.daily_stats.length}</Text>
            <Text style={styles.summaryLabel}>Dias de Treino</Text>
          </View>
        </View>

        <GraficoBarras
          data={sessionsData}
          title="Sessões por Dia"
          unit=""
        />

        <GraficoBarras
          data={waterData}
          title="Água Ingerida por Dia (mL)"
          unit="mL"
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Informações</Text>
          <Text style={styles.infoText}>
            • Os gráficos mostram os dados dos últimos 7 dias
          </Text>
          <Text style={styles.infoText}>
            • Sessões: quantidade de treinos realizados por dia
          </Text>
          <Text style={styles.infoText}>
            • Água: total de líquido ingerido durante os treinos
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginRight: 8,
  },
  periodButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
  },
  periodButtonText: {
    fontSize: 14,
    color: "#374151",
    marginRight: 8,
  },
  periodDropdown: {
    position: "absolute",
    top: 40,
    left: 70,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
  },
  periodOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  periodOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  periodOptionText: {
    fontSize: 14,
    color: "#374151",
  },
  periodOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  modalOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#3b82f6",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
});
