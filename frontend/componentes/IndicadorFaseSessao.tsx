import { Text, View } from "react-native";

import { styles } from "@/estilos/index.styles";

const PHASES = [
  { key: "pre", label: "Pre-sessao" },
  { key: "during", label: "Durante" },
  { key: "post", label: "Pos-sessao" },
] as const;

type SessionPhase = (typeof PHASES)[number]["key"];

type Props = {
  current: SessionPhase;
};

export function IndicadorFaseSessao({ current }: Props) {
  const currentIndex = PHASES.findIndex((p) => p.key === current);

  return (
    <View style={styles.giPhaseRow}>
      {PHASES.map((phase, index) => {
        const isActive = phase.key === current;
        const isDone = index < currentIndex;
        return (
          <View
            key={phase.key}
            style={[
              styles.giPhasePill,
              isActive && styles.giPhasePillActive,
              isDone && styles.giPhasePillDone,
            ]}
          >
            <Text
              style={[
                styles.giPhaseText,
                isActive && styles.giPhaseTextActive,
                isDone && styles.giPhaseTextDone,
              ]}
            >
              {isDone ? "✓ " : ""}
              {phase.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
