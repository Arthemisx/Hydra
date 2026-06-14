"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/api";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface Session {
  id: number;
  athlete_id: number;
  status: string;
  sport: string | null;
  created_at: string;
  mass_variation_pct: number | null;
  alert_level: string | null;
  athlete: { id: number; name: string; sport: string | null } | null;
}

interface Athlete {
  id: number;
  name: string;
  email: string;
  sport: string | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!user) return;

    apiJson<Session[]>("/sessions").then(setSessions);
    if (user.role === "team") {
      apiJson<Athlete[]>("/athletes").then(setAthletes);
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  const statusLabel: Record<string, string> = {
    pre: "Pré-sessão",
    during: "Em andamento",
    post: "Pós-sessão",
    done: "Concluida",
  };

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "with-sidebar" : ""}`}>
        <div className="welcome">
          <h2>Bem vindo(a), {user.name}!</h2>
          <p>{user.role === "team" ? "Painel da equipe" : "Registro diario"}</p>
        </div>

        {/* Team view: lista de atletas */}
        {user.role === "team" && athletes.length > 0 && (
          <div className="card">
            <h3 className="card-title">Atletas</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Modalidade</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((a) => (
                    <tr key={a.id} onClick={() => router.push(`/athlete/${a.id}`)}>
                      <td>{a.name}</td>
                      <td>{a.email}</td>
                      <td>{a.sport || "—"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/athlete/${a.id}`);
                          }}
                        >
                          Ver historico
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nova sessao button (atleta) */}
        {user.role === "athlete" && (
          <div style={{ marginBottom: "1rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/session/new")}
            >
              + Nova Sessao
            </button>
          </div>
        )}

        {/* Sessoes recentes */}
        <div className="card">
          <h3 className="card-title">
            {user.role === "team" ? "Sessoes Recentes (todos)" : "Minhas Sessoes"}
          </h3>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma sessao registrada ainda.</p>
              {user.role === "athlete" && (
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/session/new")}
                >
                  Criar primeira sessao
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {user.role === "team" && <th>Atleta</th>}
                    <th>Data</th>
                    <th>Modalidade</th>
                    <th>Status</th>
                    <th>Variacao %</th>
                    <th>Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} onClick={() => router.push(`/session/${s.id}`)}>
                      {user.role === "team" && (
                        <td>{s.athlete?.name || "—"}</td>
                      )}
                      <td>{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                      <td>{s.sport || "—"}</td>
                      <td>
                        <span className={`badge badge-${s.status}`}>
                          {statusLabel[s.status] || s.status}
                        </span>
                      </td>
                      <td>
                        {s.mass_variation_pct !== null
                          ? `${s.mass_variation_pct.toFixed(1)}%`
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
      </main>
    </>
  );
}
