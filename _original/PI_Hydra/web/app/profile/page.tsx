"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "with-sidebar" : ""}`}>
        <div className="welcome">
          <h2>Perfil</h2>
        </div>

        <div className="card">
          <h3 className="card-title">Informacoes</h3>
          <div className="form-group">
            <label>Nome</label>
            <p>{user.name}</p>
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <p>{user.email}</p>
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <p>
              <span className={`badge badge-${user.role === "team" ? "caution" : "normal"}`}>
                {user.role === "team" ? "Equipe / Nutricionista" : "Atleta"}
              </span>
            </p>
          </div>
          {user.sport && (
            <div className="form-group">
              <label>Modalidade</label>
              <p>{user.sport}</p>
            </div>
          )}
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          Sair da conta
        </button>
      </main>
    </>
  );
}
