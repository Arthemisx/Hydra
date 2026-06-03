import { StyleSheet } from "react-native";

export const infoStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#d9d9d9",
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
    color: "#121212",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 48,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 28,
    color: "#333",
    marginBottom: 20,
  },
});
