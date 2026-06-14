import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export type FeedbackType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: FeedbackType;
};

type FeedbackContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const TOAST_DURATION_MS = 3200;

const TYPE_STYLES: Record<FeedbackType, { bg: string; border: string; icon: string }> = {
  success: { bg: "#e8f5e9", border: "#28a745", icon: "✓" },
  error: { bg: "#ffebee", border: "#c41e3a", icon: "!" },
  info: { bg: "#e3f2fd", border: "#1976d2", icon: "i" },
};

function Toast({ item, onHide }: { item: ToastItem; onHide: (id: number) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide(item.id));
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [item.id, onHide, opacity, translateY]);

  const palette = TYPE_STYLES[item.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.toastIcon, { backgroundColor: palette.border }]}>
        <Text style={styles.toastIconText}>{palette.icon}</Text>
      </View>
      <Text style={styles.toastMessage}>{item.message}</Text>
    </Animated.View>
  );
}

export function ProvedorFeedback({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const hide = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: FeedbackType) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);

    if (Platform.OS !== "web") {
      if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, []);

  const value: FeedbackContextValue = {
    showSuccess: (m) => show(m, "success"),
    showError: (m) => show(m, "error"),
    showInfo: (m) => show(m, "info"),
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onHide={hide} />
        ))}
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback deve ser usado dentro de ProvedorFeedback");
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "web" ? 12 : 48,
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 480,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  toastIconText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    lineHeight: 20,
  },
});
