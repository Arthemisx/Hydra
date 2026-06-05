import { StyleSheet } from "react-native";

export const reportStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#d9d9d9",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingLeft: 80,
    paddingTop: 10,
    paddingBottom: 28,
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#121212",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  twoCols: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  twoColsStack: {
    flexDirection: "column",
    gap: 12,
  },
  panel: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#b0b0b0",
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  panelTitle: {
    color: "#e01919",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkBox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: "#555",
    borderRadius: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: {
    backgroundColor: "#d04044",
    borderColor: "#d04044",
  },
  checkMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  checkLabel: {
    fontSize: 15,
    color: "#1f1f1f",
    fontWeight: "500",
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  generateBtn: {
    backgroundColor: "#d04044",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  panelSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  panelSummary: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
  panelRow: {
    borderTopWidth: 1,
    borderTopColor: "#c8c8c8",
    paddingVertical: 8,
  },
  panelRowText: {
    fontSize: 12,
    color: "#222",
    lineHeight: 18,
  },
});
