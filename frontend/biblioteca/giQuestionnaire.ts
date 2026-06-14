export const GI_SYMPTOMS = [
  "Arroto",
  "Azia",
  "Inchaço (estomago cheio)",
  "Dor de estomago",
  "Ansia de vomito",
  "Regurgitacao",
  "Vomito em jato",
  "Flatulencia",
  "Distensão abdominal inferior",
  "Vontade de defecar",
  "Dor no intestino lado esquerdo",
  "Defecação: Fezes amolecidas",
  "Defecação: Diarreia",
  "Defecação: Fezes com sangue",
  "Nausea",
  "Tontura",
  "Dor abdominal aguda transitoria",
] as const;

export type GiSeverityMap = Record<string, number>;

export type PhaseGiData = {
  has_symptoms: "sim" | "nao" | null;
  context: "treino" | "competicao" | "ambos" | null;
  before_training: "sim" | "nao" | null;
  before_training_timing: string | null;
  before_training_hours: string | null;
  severity_before_training: GiSeverityMap;
  during_training: "sim" | "nao" | null;
  during_training_timing: string | null;
  during_training_hours: string | null;
  severity_during_training: GiSeverityMap;
  after_training: "sim" | "nao" | null;
  after_training_timing: string | null;
  after_training_hours: string | null;
  severity_after_training: GiSeverityMap;
  before_competition: "sim" | "nao" | null;
  before_competition_timing: string | null;
  before_competition_hours: string | null;
  severity_before_competition: GiSeverityMap;
  during_competition: "sim" | "nao" | null;
  during_competition_timing: string | null;
  during_competition_hours: string | null;
  severity_during_competition: GiSeverityMap;
  after_competition: "sim" | "nao" | null;
  after_competition_timing: string | null;
  after_competition_hours: string | null;
  severity_after_competition: GiSeverityMap;
};

export type GiSurveyResponses = {
  pre: PhaseGiData;
  during: PhaseGiData;
  post: PhaseGiData;
};

function createInitialPhaseData(): PhaseGiData {
  return {
    has_symptoms: null,
    context: null,
    before_training: null,
    before_training_timing: null,
    before_training_hours: null,
    severity_before_training: {},
    during_training: null,
    during_training_timing: null,
    during_training_hours: null,
    severity_during_training: {},
    after_training: null,
    after_training_timing: null,
    after_training_hours: null,
    severity_after_training: {},
    before_competition: null,
    before_competition_timing: null,
    before_competition_hours: null,
    severity_before_competition: {},
    during_competition: null,
    during_competition_timing: null,
    during_competition_hours: null,
    severity_during_competition: {},
    after_competition: null,
    after_competition_timing: null,
    after_competition_hours: null,
    severity_after_competition: {},
  };
}

export const INITIAL_GI_SURVEY: GiSurveyResponses = {
  pre: createInitialPhaseData(),
  during: createInitialPhaseData(),
  post: createInitialPhaseData(),
};

export const CONTEXT_OPTIONS = [
  { value: "treino" as const, label: "Treino" },
  { value: "competicao" as const, label: "Competição" },
  { value: "ambos" as const, label: "Treino e Competição" },
];

export const BEFORE_TRAINING_TIMING = [
  "Antes do treino (selecionar horario)",
  "Horas antes do inicio do treino",
  "Nao ha horario consistente antes do inicio do treino",
  "Mais de 12 horas antes do inicio do treino",
];

export const DURING_TRAINING_TIMING = [
  "Durante o treino (selecionar horario)",
  "Horas durante o treino",
  "Efeitos residuais dos sintomas apresentados antes do exercicio",
  "O inicio dos sintomas durante o exercicio nao possui um horario padronizado/consistente",
  "Menos de 30 minutos apos o inicio do exercicio",
  "Cerca de 24 horas apos o inicio do exercicio (quando possuem esta duração)",
];

export const AFTER_TRAINING_TIMING = [
  "Horas apos o termino do exercicio",
  "Efeitos residuais dos sintomas tidos durante o exercicio",
  "O inicio dos sintomas apos o exercicio nao possui um horario padronizado/consistente",
  "Menos de 30 minutos apos o exercicio",
  "Mais de 12 horas apos término do exercicio",
];

export const BEFORE_COMPETITION_TIMING = [
  "Antes das competições (selecionar horário)",
  "Horas antes do inicio da prova/exercicio",
  "Nao ha horario consistente antes do inicio da prova/exercicio",
  "Mais de 12 horas antes do inicio da prova/exercicio",
];

export const DURING_COMPETITION_TIMING = [
  "Durante a competição (selecionar horario)",
  "Horas durante a competicao",
  "Efeitos residuais dos sintomas tidos antes da prova/exercicio",
  "Nao ha horario consistente depois do inicio da prova/exercicio",
  "Mais de 12 horas depois do inicio da prova/exercicio",
];

export const AFTER_COMPETITION_TIMING = [
  "Horas apos o termino da prova/exercicio",
  "Efeitos residuais dos sintomas tidos durante o exercicio",
  "O inicio dos sintomas apos o exercicio nao possui um horario padronizado/consistente",
  "Menos de 30 minutos apos o exercicio",
  "Mais de 12 horas apos termino do exercicio",
];

export const SEVERITY_LEGEND =
  "0 = sem sintomas; 1-4 = leves; 5-9 = graves (interferem no treino); 10 = extremos (justificam interrupcao).";

export function includesTraining(
  context: PhaseGiData["context"],
): boolean {
  return context === "treino" || context === "ambos";
}

export function includesCompetition(
  context: PhaseGiData["context"],
): boolean {
  return context === "competicao" || context === "ambos";
}

export function validateGiPhase(
  phase: "pre" | "during" | "post",
  data: GiSurveyResponses,
): string | null {
  const phaseData = data[phase];

  // Para fase pós-sessão, não exige contexto (simplificado)
  if (phase === "post") {
    const trainingField = "after_training";
    const trainingTiming = "after_training_timing";

    if (!phaseData[trainingField]) return `Responda se teve sintomas após o exercício.`;
    if (phaseData[trainingField] === "sim" && !phaseData[trainingTiming]) {
      return `Selecione quando os sintomas começaram após o exercício.`;
    }

    return null;
  }

  // Para pré e durante, exige contexto
  if (!phaseData.context) return `Selecione o contexto (treino/competicao) para a fase ${phase}.`;

  const getRelevantFields = () => {
    if (phase === "pre") {
      return {
        trainingField: "before_training",
        trainingTiming: "before_training_timing",
        competitionField: "before_competition",
        competitionTiming: "before_competition_timing"
      };
    } else if (phase === "during") {
      return {
        trainingField: "during_training",
        trainingTiming: "during_training_timing",
        competitionField: "during_competition",
        competitionTiming: "during_competition_timing"
      };
    } else {
      return {
        trainingField: "after_training",
        trainingTiming: "after_training_timing",
        competitionField: "after_competition",
        competitionTiming: "after_competition_timing"
      };
    }
  };

  const fields = getRelevantFields();

  if (includesTraining(phaseData.context)) {
    if (!phaseData[fields.trainingField as keyof PhaseGiData]) return `Responda se teve sintomas no treino (fase ${phase}).`;
    if (phaseData[fields.trainingField as keyof PhaseGiData] === "sim" && !phaseData[fields.trainingTiming as keyof PhaseGiData]) {
      return `Selecione o momento mais comum no treino (fase ${phase}).`;
    }
  }

  if (includesCompetition(phaseData.context)) {
    if (!phaseData[fields.competitionField as keyof PhaseGiData]) return `Responda se teve sintomas na competicao (fase ${phase}).`;
    if (phaseData[fields.competitionField as keyof PhaseGiData] === "sim" && !phaseData[fields.competitionTiming as keyof PhaseGiData]) {
      return `Selecione o momento mais comum na competicao (fase ${phase}).`;
    }
  }

  return null;
}
