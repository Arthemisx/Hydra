import { StyleSheet, Text, View } from "react-native";

type Variant = "error" | "success" | "info" | "loading";

const VARIANTS: Record<Variant, { bg: string; border: string; text: string }> = {
  error: { bg: "#ffebee", border: "#c41e3a", text: "#9b1b30" },
  success: { bg: "#e8f5e9", border: "#28a745", text: "#1b5e20" },
  info: { bg: "#fff8e1", border: "#ffc107", text: "#6d4c00" },
  loading: { bg: "#f0f0f0", border: "#bdbdbd", text: "#444" },
};

type Props = {
  message: string;
  variant?: Variant;
};

export function StatusBanner({ message, variant = "info" }: Props) {
  const v = VARIANTS[variant];
  return (
    <View style={[styles.banner, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
