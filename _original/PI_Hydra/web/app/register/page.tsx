"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("athlete");
  const [sport, setSport] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role, sport: sport || undefined });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Hydra</h1>
        <p className="subtitle">Crie sua conta</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome:</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="form-group">
            <label>E-mail:</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha:</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar senha:</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de usuário:</label>
            <div className="role-selector">
              <div className="role-option">
                <input
                  type="radio"
                  id="role-athlete"
                  name="role"
                  value="athlete"
                  checked={role === "athlete"}
                  onChange={(e) => setRole(e.target.value)}
                />
                <label htmlFor="role-athlete">Atleta</label>
              </div>
              <div className="role-option">
                <input
                  type="radio"
                  id="role-team"
                  name="role"
                  value="team"
                  checked={role === "team"}
                  onChange={(e) => setRole(e.target.value)}
                />
                <label htmlFor="role-team">Nutricionista</label>
              </div>
            </div>
          </div>

          {role === "athlete" && (
            <div className="form-group">
              <label>Modalidade esportiva:</label>
              <input
                type="text"
                className="form-input"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                placeholder="Ex: Corrida, Natação, Futebol"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
