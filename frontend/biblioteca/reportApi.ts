import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

import { apiPath } from "./api";

export type ReportPeriod = "daily" | "weekly" | "monthly";
export type ReportFormat = "pdf" | "spreadsheet" | "longitudinal";

export type LongitudinalEntry = {
  id: number;
  athleteName: string;
  entryDate: string;
  waterIntakeMl: number;
  weightBeforeKg: number;
  weightAfterKg: number;
  urineVolumeMl: number;
  clothing: string;
  urineColor: string;
  symptoms: string;
  createdAt: string;
};

export type LongitudinalSession = {
  id: number;
  entryDate: string;
  status?: string;
  preMassKg?: number | null;
  postMassKg?: number | null;
  fluidIntakeMl?: number;
  actualDurationMin?: number | null;
  sweatRateLh?: number | null;
  alertLevel?: string | null;
  sport?: string | null;
};

export type LongitudinalGiSurvey = {
  id: number;
  entryDate: string;
  hasSymptoms?: string | null;
  frequency?: string | null;
  summary: string;
};

export type LongitudinalReport = {
  athleteName: string;
  period: ReportPeriod;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  reportType?: "sessions" | "daily";
  entries?: LongitudinalEntry[];
  sessions?: LongitudinalSession[];
  giSurveys?: LongitudinalGiSurvey[];
  summary: {
    entryCount?: number;
    sessionCount?: number;
    giSurveyCount?: number;
    avgWaterIntakeMl?: number | null;
    avgWeightAfterKg?: number | null;
    avgFluidMl?: number | null;
    avgSweatRateLh?: number | null;
  };
};

function parseFilenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8 = header.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const plain = header.match(/filename=([^;\n]+)/i);
  if (plain?.[1]) return plain[1].trim().replace(/^"|"$/g, "");
  return fallback;
}

async function saveAndShareFile(bytes: ArrayBuffer, filename: string, mime: string): Promise<void> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = new File(Paths.cache, safeName);
  file.create({ overwrite: true });
  file.write(new Uint8Array(bytes));
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: "Relatorio" });
  } else {
    Alert.alert("Arquivo salvo", file.uri);
  }
}

function downloadOnWeb(bytes: ArrayBuffer, filename: string, mime: string): void {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type GenerateReportResult =
  | { kind: "file"; filename: string }
  | { kind: "longitudinal"; data: LongitudinalReport };

export async function generateReport(
  apiBase: string,
  athleteName: string,
  period: ReportPeriod,
  format: ReportFormat,
  reportSource: "auto" | "sessions" | "daily" = "auto",
): Promise<GenerateReportResult> {
  const res = await fetch(apiPath(apiBase, "/api/reports/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ athleteName, period, format, reportSource }),
  });

  if (format === "longitudinal") {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = data && typeof data === "object" && data && "error" in data ? String((data as { error: string }).error) : "Falha ao gerar painel.";
      throw new Error(err);
    }
    return { kind: "longitudinal", data: data as LongitudinalReport };
  }

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* use raw */
    }
    throw new Error(msg || "Falha ao gerar arquivo.");
  }

  const cd = res.headers.get("Content-Disposition");
  const mime = format === "pdf" ? "application/pdf" : "text/csv";
  const ext = format === "pdf" ? "pdf" : "csv";
  const fallback = `relatorio.${ext}`;
  const filename = parseFilenameFromDisposition(cd, fallback);
  const buf = await res.arrayBuffer();

  if (Platform.OS === "web") {
    downloadOnWeb(buf, filename, mime);
  } else {
    await saveAndShareFile(buf, filename, mime);
  }

  return { kind: "file", filename };
}
