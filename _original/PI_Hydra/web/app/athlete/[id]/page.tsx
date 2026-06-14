"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/api";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface Athlete {
  id: number;
  name: string;
  email: string;
  sport: string | null;
}

interface Session {
  id: number;
  status: string;
  sport: string | null;
  created_at: string;
  mass_variation_pct: number | null;
  sweat_rate_lh: number | null;
  alert_level: string | null;
}

export default function AthleteHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!user || !params.id) return;

    apiJson<{ athlete: Athlete; sessions: Session[] }>(
      `/athletes/${params.id}/history`
    ).then((data) => {
      setAthlete(data.athlete);
      setSessions(data.sessions);
    });
  }, [user, authLoading, router, params.id]);

  if (authLoading || !user || !athlete) return null;

  const doneSessions = sessions.filter((s) => s.status === "done");
  const avgVariation =
    doneSessions.length > 0
      ? doneSessions.reduce((sum, s) => sum + (s.mass_variation_pct || 0), 0) / doneSessions.length
      : 0;
  const avgSweatRate =
    doneSessions.length > 0
      ? doneSessions.reduce((sum, s) => sum + (s.sweat_rate_lh || 0), 0) / doneSessions.length
      : 0;

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "with-sidebar" : ""}`}>
        <div className="welcome">
          <h2>{athlete.name}</h2>
          <p>{athlete.email} — {athlete.sport || "Sem modalidade"}</p>
        </div>

        {/* Resumo */}
        {doneSessions.length > 0 && (
          <div className="card">
            <h3 className="card-title">Resumo</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{doneSessions.length}</div>
                <div className="stat-label">Sessões concluidas</div>
              </div>
              <div className={`stat-card ${avgVariation > 2 ? "danger" : avgVariation > 1 ? "caution" : "normal"}`}>
                <div className="stat-value">
                  {avgVariation.toFixed(1)}<span className="stat-unit"> %</span>
                </div>
                <div className="stat-label">Variação média</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {avgSweatRate.toFixed(2)}<span className="stat-unit"> L/h</span>
                </div>
                <div className="stat-label">Taxa sudorese média</div>
              </div>
            </div>
          </div>
        )}

        {/* Historico */}
        <div className="card">
          <h3 className="card-title">Histórico de Sessões</h3>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma sessão registrada para este atleta.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Modalidade</th>
                    <th>Status</th>
                    <th>Variação %</th>
                    <th>Taxa Sudorese</th>
                    <th>Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} onClick={() => router.push(`/session/${s.id}`)}>
                      <td>{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                      <td>{s.sport || "—"}</td>
                      <td>
                        <span className={`badge badge-${s.status}`}>
                          {s.status === "done" ? "Concluida" : s.status}
                        </span>
                      </td>
                      <td>
                        {s.mass_variation_pct !== null
                          ? `${s.mass_variation_pct.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td>
                        {s.sweat_rate_lh !== null
                          ? `${s.sweat_rate_lh.toFixed(2)} L/h`
                          : "—"}
                      </td>
                      <td>
                        {s.alert_level ? (
                          <span className={`badge badge-${s.alert_level}`}>
                            {s.alert_level === "normal"
                              ? "Normal"
                              : s.alert_level === "caution"
                              ? "Atencao"
                              : "Perigo"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
