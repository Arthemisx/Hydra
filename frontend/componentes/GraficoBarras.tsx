import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface GraficoBarrasProps {
  data: BarData[];
  title?: string;
  unit?: string;
}

const { width } = Dimensions.get("window");

export function GraficoBarras({ data, title, unit = "" }: GraficoBarrasProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, (width - 80) / data.length - 10);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 200;
          return (
            <View key={index} style={styles.barWrapper}>
              <Text style={styles.barValue}>
                {item.value}{unit}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(height, 4),
                    width: barWidth,
                    backgroundColor: item.color || "#3b82f6",
                  },
                ]}
              />
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 280,
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    borderRadius: 4,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
  },
});
