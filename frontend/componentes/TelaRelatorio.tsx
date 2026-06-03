import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CoachAthleteSummary } from "@/biblioteca/constants";
import { useFeedback } from "@/componentes/ProvedorFeedback";

type Props = {
  athleteName: string;
  apiBaseUrl: string;
  userRole: "athlete" | "team";
  athletes: CoachAthleteSummary[];
  onSelectAthlete: (athlete: CoachAthleteSummary) => void;
};

// Mock teams for filter
const TEAMS = ["Equipe A", "Equipe B", "Equipe C", "Todas as equipes"];

// Mock athletes with team data
const MOCK_ATHLETES: (CoachAthleteSummary & {
  team: string;
  status: "Ativo" | "Inativo";
})[] = [
  {
    name: "Ana Souza",
    lastEntryDate: null,
    totalEntries: 0,
    lastEntry: null,
    team: "Equipe A",
    status: "Ativo",
  },
  {
    name: "Carlos Silva",
    lastEntryDate: "12/05/2026",
    totalEntries: 16,
    lastEntry: null,
    team: "Equipe A",
    status: "Ativo",
  },
  {
    name: "Juliana Lima",
    lastEntryDate: "10/05/2026",
    totalEntries: 8,
    lastEntry: null,
    team: "Equipe B",
    status: "Ativo",
  },
  {
    name: "Pedro Santos",
    lastEntryDate: "11/05/2026",
    totalEntries: 21,
    lastEntry: null,
    team: "Equipe B",
    status: "Ativo",
  },
  {
    name: "Mariana Costa",
    lastEntryDate: "01/05/2026",
    totalEntries: 5,
    lastEntry: null,
    team: "Equipe C",
    status: "Inativo",
  },
  {
    name: "Gi Test",
    lastEntryDate: null,
    totalEntries: 0,
    lastEntry: null,
    team: "Equipe C",
    status: "Ativo",
  },
];

export function TelaRelatorio({
  userRole,
  apiBaseUrl,
}: Props) {
  const { showSuccess } = useFeedback();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("Todas as equipes");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentAthlete, setCurrentAthlete] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [reportFormat, setReportFormat] = useState<"PDF" | "Excel">("PDF");

  // Period options (UI label → backend code)
  const PERIOD_OPTIONS = [
    { label: "Última semana", code: "weekly" },
    { label: "Último mês", code: "monthly" },
    { label: "Últimos três meses", code: "3months" },
    { label: "Últimos 6 meses", code: "6months" },
    { label: "Último ano", code: "yearly" },
  ];

  // Filter athletes
  const filteredAthletes = MOCK_ATHLETES.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = selectedTeam === "Todas as equipes" || athlete.team === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  const handleGenerateReport = (athleteName: string) => {
    setCurrentAthlete(athleteName);
    setSelectedPeriod("");
    setReportFormat("PDF");
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    if (!currentAthlete || !selectedPeriod) {
      showSuccess("Por favor, selecione um período!");
      return;
    }
    
    const periodObj = PERIOD_OPTIONS.find(p => p.label === selectedPeriod);
    if (!periodObj) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteName: currentAthlete,
          period: periodObj.code,
          format: reportFormat === "PDF" ? "pdf" : "spreadsheet",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showSuccess(errorData.error || "Erro ao gerar relatório!");
        return;
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_${currentAthlete}_${periodObj.code}.${reportFormat === "PDF" ? "pdf" : "csv"}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Relatório para ${currentAthlete} gerado com sucesso!`);
      setShowReportModal(false);
    } catch (err) {
      showSuccess("Erro ao conectar ao servidor!");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Relatórios</Text>
        <Text style={styles.pageSubtitle}>
          Selecione o atleta para visualizar ou gerar o relatório.
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#FFF0F0" }]}>
            <Ionicons name="people-outline" size={28} color="#D04044" />
          </View>
          <Text style={[styles.statNumber, { color: "#D04044" }]}>6</Text>
          <Text style={styles.statLabel}>Atletas cadastrados</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#FFF9E6" }]}>
            <Ionicons name="document-text-outline" size={28} color="#F5A623" />
          </View>
          <Text style={[styles.statNumber, { color: "#F5A623" }]}>50</Text>
          <Text style={styles.statLabel}>Sessões registradas</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#F0FDF4" }]}>
            <Ionicons name="bar-chart-outline" size={28} color="#22C55E" />
          </View>
          <Text style={[styles.statNumber, { color: "#22C55E" }]}>8</Text>
          <Text style={styles.statLabel}>Relatórios gerados</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#7F7F7F"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar atleta..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={styles.selectedTeamText}>Equipe: {selectedTeam}</Text>
        </View>

        {/* Team Filter */}
        <View style={styles.filterDropdown}>
          <Pressable
            style={styles.dropdownContainer}
            onPress={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
          >
            <Text style={styles.filterLabel}>Equipe</Text>
            <Ionicons
              name={isTeamDropdownOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color="#7F7F7F"
            />
          </Pressable>
        </View>
      </View>

      {/* Athletes Grid */}
      <View style={styles.athletesGrid}>
        {filteredAthletes.map((athlete) => (
          <View key={athlete.name} style={styles.athleteCard}>
            <View style={styles.athleteHeader}>
              <View style={styles.athleteAvatar}>
                <Ionicons name="person-outline" size={32} color="#D04044" />
              </View>
              <View style={styles.athleteHeaderText}>
                <Text style={styles.athleteName}>{athlete.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    athlete.status === "Ativo"
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      athlete.status === "Ativo"
                        ? styles.statusTextActive
                        : styles.statusTextInactive,
                    ]}
                  >
                    {athlete.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.athleteStats}>
              <View style={styles.athleteStatRow}>
                <Ionicons name="document-text-outline" size={18} color="#7F7F7F" />
                <Text style={styles.athleteStatText}>
                  Sessões registradas:{" "}
                  <Text
                    style={
                      athlete.totalEntries > 10
                        ? styles.athleteStatHighlight
                        : undefined
                    }
                  >
                    {athlete.totalEntries}
                  </Text>
                </Text>
              </View>

              <View style={styles.athleteStatRow}>
                <Ionicons name="calendar-outline" size={18} color="#7F7F7F" />
                <Text style={styles.athleteStatText}>
                  Última atualização: {athlete.lastEntryDate || "—"}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.generateButton}
              onPress={() => handleGenerateReport(athlete.name)}
            >
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Gerar Relatório</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Team Dropdown Modal */}
      <Modal
        visible={isTeamDropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsTeamDropdownOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsTeamDropdownOpen(false)}>
          <View style={styles.dropdownModalContent}>
            <Pressable style={styles.dropdownModalBackdrop} onPress={() => setIsTeamDropdownOpen(false)} />
            <View style={styles.dropdownModalList}>
              {TEAMS.map((team) => (
                <Pressable
                  key={team}
                  style={[
                    styles.dropdownModalOption,
                    selectedTeam === team && styles.dropdownModalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTeam(team);
                    setIsTeamDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownModalOptionText,
                      selectedTeam === team && styles.dropdownModalOptionTextSelected,
                    ]}
                  >
                    {team}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Report Generation Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Gerar Relatório - {currentAthlete}
              </Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowReportModal(false)}
              >
                <Ionicons name="close" size={24} color="#7F7F7F" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {/* Period Filters */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Período</Text>
                <View style={styles.periodOptions}>
                  {PERIOD_OPTIONS.map((period) => (
                    <Pressable
                      key={period.label}
                      style={[
                        styles.periodOption,
                        selectedPeriod === period.label && styles.periodOptionSelected,
                      ]}
                      onPress={() => setSelectedPeriod(period.label)}
                    >
                      <Text
                        style={[
                          styles.periodOptionText,
                          selectedPeriod === period.label && styles.periodOptionTextSelected,
                        ]}
                      >
                        {period.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Format Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Formato</Text>
                <View style={styles.formatOptions}>
                  <Pressable
                    style={[
                      styles.formatOption,
                      reportFormat === "PDF" && styles.formatOptionSelected,
                    ]}
                    onPress={() => setReportFormat("PDF")}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={reportFormat === "PDF" ? "#FFFFFF" : "#7F7F7F"}
                    />
                    <Text
                      style={[
                        styles.formatOptionText,
                        reportFormat === "PDF" && styles.formatOptionTextSelected,
                      ]}
                    >
                      PDF
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.formatOption,
                      reportFormat === "Excel" && styles.formatOptionSelected,
                    ]}
                    onPress={() => setReportFormat("Excel")}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={20}
                      color={reportFormat === "Excel" ? "#FFFFFF" : "#7F7F7F"}
                    />
                    <Text
                      style={[
                        styles.formatOptionText,
                        reportFormat === "Excel" && styles.formatOptionTextSelected,
                      ]}
                    >
                      Excel
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmReport}
              >
                <Text style={styles.modalButtonConfirmText}>Gerar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingLeft: 44,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "#F5F7FA",
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#7F7F7F",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 14,
    color: "#7F7F7F",
    marginTop: 2,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
    alignItems: "flex-start",
    position: "relative",
    zIndex: 50,
  },
  searchContainer: {
    flex: 1,
    minWidth: 200,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingLeft: 44,
    paddingRight: 14,
    fontSize: 14,
    height: 42,
  },
  selectedTeamText: {
    marginTop: 8,
    fontSize: 12,
    color: "#7F7F7F",
  },
  filterDropdown: {
    flex: 1,
    minWidth: 180,
    position: "relative",
    zIndex: 100,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 42,
  },
  dropdownText: {
    fontSize: 14,
    color: "#1F1F1F",
  },
  dropdownOptions: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownOptionSelected: {
    backgroundColor: "#FFF0F0",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#1F1F1F",
  },
  dropdownOptionTextSelected: {
    color: "#D04044",
    fontWeight: "600",
  },
  athletesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  athleteCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  athleteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  athleteAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  athleteHeaderText: {
    flex: 1,
  },
  athleteName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: "#E0F7E9",
  },
  statusBadgeInactive: {
    backgroundColor: "#F5F5F5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#22C55E",
  },
  statusTextInactive: {
    color: "#7F7F7F",
  },
  athleteStats: {
    gap: 10,
    marginBottom: 16,
  },
  athleteStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  athleteStatText: {
    fontSize: 14,
    color: "#4F4F4F",
  },
  athleteStatHighlight: {
    color: "#D04044",
    fontWeight: "700",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D04044",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1F1F",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 24,
  },
  modalSection: {
    gap: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1F1F",
  },
  periodOptions: {
    flexDirection: "column",
    gap: 8,
  },
  periodOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
  },
  periodOptionSelected: {
    backgroundColor: "#FFF0F0",
    borderColor: "#D04044",
  },
  periodOptionText: {
    fontSize: 14,
    color: "#4F4F4F",
  },
  periodOptionTextSelected: {
    color: "#D04044",
    fontWeight: "600",
  },
  formatOptions: {
    flexDirection: "row",
    gap: 12,
  },
  formatOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
  },
  formatOptionSelected: {
    backgroundColor: "#D04044",
    borderColor: "#D04044",
  },
  formatOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F7F7F",
  },
  formatOptionTextSelected: {
    color: "#FFFFFF",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F5F5F5",
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F7F7F",
  },
  modalButtonConfirm: {
    backgroundColor: "#D04044",
  },
  modalButtonConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  dropdownModalContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdownModalBackdrop: {
    flex: 1,
  },
  dropdownModalList: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownModalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  dropdownModalOptionSelected: {
    backgroundColor: "#FFF0F0",
  },
  dropdownModalOptionText: {
    fontSize: 14,
    color: "#1F1F1F",
  },
  dropdownModalOptionTextSelected: {
    color: "#D04044",
    fontWeight: "600",
  },
});
