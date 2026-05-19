"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/api";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface SessionData {
  id: number;
  status: string;
  created_at: string;
  sport: string | null;
  pre_mass_kg: number | null;
  post_mass_kg: number | null;
  temperature_c: number | null;
  humidity_pct: number | null;
  expected_duration_min: number | null;
  actual_duration_min: number | null;
  perceived_intensity: string | null;
  urine_color: number | null;
  thirst_level: number | null;
  fluid_intake_ml: number;
  urine_volume_ml: number;
  soaked_clothing: boolean;
  gi_symptoms: string | null;
  fatigue_level: number | null;
  adjusted_loss_kg: number | null;
  sweat_rate_lh: number | null;
  mass_variation_pct: number | null;
  hydration_balance_ml: number | null;
  recommended_intake_ml_h: number | null;
  alert_level: string | null;
  athlete: { id: number; name: string; sport: string | null } | null;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!user || !params.id) return;

    apiJson<SessionData>(`/sessions/${params.id}`).then(setSession);
  }, [user, authLoading, router, params.id]);

  if (authLoading || !user || !session) return null;

  const alertMessages: Record<string, { text: string; class: string }> = {
    danger: {
      text: "Desidratacao severa! Perda acima de 2% da massa corporal. Revise a estrategia de hidratacao.",
      class: "alert-danger",
    },
    caution: {
      text: "Atencao! Perda entre 1-2% da massa corporal. Considere aumentar a ingestao de fluidos.",
      class: "alert-caution",
    },
    normal: {
      text: "Hidratacao adequada. Continue com a estrategia atual.",
      class: "alert-normal",
    },
  };

  const intensityLabels: Record<string, string> = {
    low: "Leve",
    moderate: "Moderada",
    high: "Alta",
    very_high: "Muito alta",
  };

  const alert = session.alert_level ? alertMessages[session.alert_level] : null;

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "with-sidebar" : ""}`}>
        <div className="welcome">
          <h2>Resultado da Sessao</h2>
          <p>
            {session.athlete?.name} — {session.sport || "Sem modalidade"} —{" "}
            {new Date(session.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Alert banner */}
        {alert && session.status === "done" && (
          <div className={`alert ${alert.class}`}>{alert.text}</div>
        )}

        {/* Calculated results */}
        {session.status === "done" && (
          <div className="card">
            <h3 className="card-title">Indicadores Calculados</h3>
            <div className="stats-grid">
              <div className={`stat-card ${session.alert_level || ""}`}>
                <div className="stat-value">
                  {session.adjusted_loss_kg?.toFixed(2)}
                  <span className="stat-unit"> kg</span>
                </div>
                <div className="stat-label">Perda Ajustada</div>
              </div>
              <div className={`stat-card ${session.alert_level || ""}`}>
                <div className="stat-value">
                  {session.sweat_rate_lh?.toFixed(2)}
                  <span className="stat-unit"> L/h</span>
                </div>
                <div className="stat-label">Taxa de Sudorese</div>
              </div>
              <div className={`stat-card ${session.alert_level || ""}`}>
                <div className="stat-value">
                  {session.mass_variation_pct?.toFixed(1)}
                  <span className="stat-unit"> %</span>
                </div>
                <div className="stat-label">Variacao de Massa</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {session.hydration_balance_ml?.toFixed(0)}
                  <span className="stat-unit"> mL</span>
                </div>
                <div className="stat-label">Balanco Hidrico</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {session.recommended_intake_ml_h?.toFixed(0)}
                  <span className="stat-unit"> mL/h</span>
                </div>
                <div className="stat-label">Recomendacao</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {session.fluid_intake_ml?.toFixed(0)}
                  <span className="stat-unit"> mL</span>
                </div>
                <div className="stat-label">Total Ingerido</div>
              </div>
            </div>
          </div>
        )}

        {/* Collected data summary */}
        <div className="card">
          <h3 className="card-title">Dados Coletados</h3>
          <div className="form-row">
            <div>
              <p><strong>Peso pre:</strong> {session.pre_mass_kg} kg</p>
              <p><strong>Peso pos:</strong> {session.post_mass_kg || "—"} kg</p>
              <p><strong>Temperatura:</strong> {session.temperature_c || "—"} °C</p>
              <p><strong>Umidade:</strong> {session.humidity_pct || "—"} %</p>
            </div>
            <div>
              <p><strong>Duracao:</strong> {session.actual_duration_min || session.expected_duration_min || "—"} min</p>
              <p><strong>Intensidade:</strong> {session.perceived_intensity ? intensityLabels[session.perceived_intensity] || session.perceived_intensity : "—"}</p>
              <p><strong>Cor da urina:</strong> {session.urine_color || "—"}</p>
              <p><strong>Sede:</strong> {session.thirst_level !== null ? `${session.thirst_level}/10` : "—"}</p>
            </div>
          </div>
          {session.soaked_clothing && (
            <p style={{ marginTop: "0.5rem", color: "var(--yellow-caution)" }}>
              ⚠ Roupas encharcadas registradas — possivel erro na pesagem
            </p>
          )}
        </div>

        <div className="btn-group">
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>
            Voltar ao painel
          </button>
        </div>
      </main>
    </>
  );
}
