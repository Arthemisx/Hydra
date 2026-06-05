export const URINE_COLORS = [
  "Transparente",
  "Amarelo claro",
  "Amarelo escuro",
  "Alaranjada",
  "Escura",
];

export const SYMPTOMS = ["Nenhum", "Sede intensa", "Tontura", "Dor de cabeca", "Câimbra", "Naúsea"];

export const today = new Date().toISOString().slice(0, 10);

export const INITIAL_FORM = {
  athleteName: "Atleta",
  entryDate: today,
  waterIntakeMl: "",
  weightBeforeKg: "",
  weightAfterKg: "",
  clothing: "",
  urineColor: "",
  symptoms: "Nenhum",
};

export type CoachLastEntry = {
  entryDate: string;
  waterIntakeMl: number;
  weightBeforeKg: number;
  weightAfterKg: number;
  urineVolumeMl: number;
  urineColor: string;
  symptoms: string;
};

export type CoachAthleteSummary = {
  name: string;
  lastEntryDate: string | null;
  totalEntries: number;
  lastEntry: CoachLastEntry | null;
};
