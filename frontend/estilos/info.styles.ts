import { StyleSheet } from "react-native";

export const infoStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingLeft: 44,
    paddingTop: 16,
    paddingBottom: 32,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  logo: {
    width: 400,
    height: 160,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#d04044",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 48,
    borderWidth: 1,
    borderColor: "#f1f3f6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 28,
    color: "#333",
    marginBottom: 20,
  },
});
