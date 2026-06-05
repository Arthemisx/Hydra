export interface BorgScaleEntry {
  value: number;
  label: string;
  description: string;
}

export const BORG_CR10_SCALE: BorgScaleEntry[] = [
  {
    value: 0,
    label: "0",
    description: "Em repouso - nada",
  },
  {
    value: 1,
    label: "1",
    description: "Muito, muito fácil - quase nada",
  },
  {
    value: 2,
    label: "2",
    description: "Um pouco fácil",
  },
  {
    value: 3,
    label: "3",
    description: "Moderado",
  },
  {
    value: 4,
    label: "4",
    description: "Um pouco difícil",
  },
  {
    value: 5,
    label: "5",
    description: "Difícil (pesado)",
  },
  {
    value: 6,
    label: "6",
    description: "Um pouco mais difícil",
  },
  {
    value: 7,
    label: "7",
    description: "Muito difícil",
  },
  {
    value: 8,
    label: "8",
    description: "Muito, muito difícil",
  },
  {
    value: 9,
    label: "9",
    description: "Extremamente difícil",
  },
  {
    value: 10,
    label: "10",
    description: "Máximo - o máximo possível",
  },
];

export function getBorgLabel(value: number): string {
  const entry = BORG_CR10_SCALE.find((e) => e.value === value);
  return entry ? entry.label : value.toString();
}

export function getBorgDescription(value: number): string {
  const entry = BORG_CR10_SCALE.find((e) => e.value === value);
  return entry ? entry.description : "";
}

export function isRpeInOptimalZone(rpe: number, durationMin: number): boolean {
  if (durationMin < 30) {
    return rpe >= 4 && rpe <= 7;
  } else if (durationMin < 60) {
    return rpe >= 3 && rpe <= 6;
  } else {
    return rpe >= 2 && rpe <= 5;
  }
}
