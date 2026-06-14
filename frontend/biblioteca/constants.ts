export const URINE_COLORS = [
  "Transparente",
  "Amarelo claro",
  "Amarelo escuro",
  "Alaranjada",
  "Escura",
];

export const SYMPTOMS = ["Nenhum", "Sede intensa", "Tontura", "Dor de cabeca", "Caibra", "Nausea"];

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const today = getLocalDateString();

export const INITIAL_FORM = {
  athleteName: "",
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
  id?: number;
  name: string;
  lastEntryDate: string | null;
  totalEntries: number;
  lastEntry: CoachLastEntry | null;
};
