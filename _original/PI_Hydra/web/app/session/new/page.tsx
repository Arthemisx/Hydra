"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/api";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UrineColorPicker from "@/components/UrineColorPicker";
import FluidButtons from "@/components/FluidButtons";

export default function NewSessionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1); // 1=pre, 2=during, 3=post
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fluidTotal, setFluidTotal] = useState(0);

  // Pre-session fields
  const [preMass, setPreMass] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [sport, setSport] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [intensity, setIntensity] = useState("moderate");
  const [urineColor, setUrineColor] = useState<number | null>(null);
  const [thirstLevel, setThirstLevel] = useState("5");
  const [symptomsPre, setSymptomsPre] = useState("");
  const [recentHydration, setRecentHydration] = useState("");
  const [clothing, setClothing] = useState("");

  // During fields
  const [actualDuration, setActualDuration] = useState("");
  const [urineVolume, setUrineVolume] = useState("");

  // Post fields
  const [postMass, setPostMass] = useState("");
  const [soakedClothing, setSoakedClothing] = useState(false);
  const [giSymptoms, setGiSymptoms] = useState("");
  const [fatigueLevel, setFatigueLevel] = useState("5");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const loadFluidTotal = async () => {
    if (!sessionId) return;
    const events = await apiJson<Array<{ volume_ml: number }>>(
      `/sessions/${sessionId}/fluid`
    );
    setFluidTotal(events.reduce((sum, e) => sum + e.volume_ml, 0));
  };

  const submitPre = async () => {
    setError("");
    setSubmitting(true);
    try {
      const session = await apiJson<{ id: number }>("/sessions", {
        method: "POST",
        body: JSON.stringify({
          pre_mass_kg: parseFloat(preMass),
          temperature_c: temperature ? parseFloat(temperature) : null,
          humidity_pct: humidity ? parseFloat(humidity) : null,
          sport: sport || null,
          expected_duration_min: expectedDuration ? parseInt(expectedDuration) : null,
          perceived_intensity: intensity,
          urine_color: urineColor,
          thirst_level: parseInt(thirstLevel),
          symptoms_pre: symptomsPre || null,
          recent_hydration: recentHydration || null,
        }),
      });
      setSessionId(session.id);
      setCurrentStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar sessao");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDuring = async () => {
    if (!sessionId) return;
    setError("");
    setSubmitting(true);
    try {
      await apiJson(`/sessions/${sessionId}/during`, {
        method: "PATCH",
        body: JSON.stringify({
          actual_duration_min: actualDuration ? parseInt(actualDuration) : null,
          urine_volume_ml: urineVolume ? parseFloat(urineVolume) : 0,
        }),
      });
      setCurrentStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar dados");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPost = async () => {
    if (!sessionId) return;
    setError("");
    setSubmitting(true);
    try {
      await apiJson(`/sessions/${sessionId}/post`, {
        method: "PATCH",
        body: JSON.stringify({
          post_mass_kg: parseFloat(postMass),
          actual_duration_min: actualDuration ? parseInt(actualDuration) : null,
          soaked_clothing: soakedClothing,
          gi_symptoms: giSymptoms || null,
          fatigue_level: parseInt(fatigueLevel),
        }),
      });
      router.push(`/session/${sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao finalizar sessao");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return null;

  const steps = [
    { num: 1, label: "Pre-sessao" },
    { num: 2, label: "Durante" },
    { num: 3, label: "Pos-sessao" },
  ];

  return (
    <>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} />
      <main className={`main-content ${sidebarOpen ? "with-sidebar" : ""}`}>
        <div className="welcome">
          <h2>Nova Sessao</h2>
          <p>Preencha os dados de cada etapa</p>
        </div>

        {/* Step indicator */}
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div className={`step ${currentStep === s.num ? "active" : currentStep > s.num ? "done" : ""}`}>
                <div className="step-number">
                  {currentStep > s.num ? "✓" : s.num}
                </div>
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* ── STEP 1: Pre-sessao ── */}
        {currentStep === 1 && (
          <div className="card">
            <h3 className="card-title">Dados Pre-sessao</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Peso antes de urinar (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={preMass}
                  onChange={(e) => setPreMass(e.target.value)}
                  placeholder="Ex: 72.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>Modalidade esportiva</label>
                <input
                  type="text"
                  className="form-input"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  placeholder="Ex: Corrida"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="Ex: 28.5"
                />
              </div>
              <div className="form-group">
                <label>Umidade (%)</label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  placeholder="Ex: 65"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duracao prevista (min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={expectedDuration}
                  onChange={(e) => setExpectedDuration(e.target.value)}
                  placeholder="Ex: 60"
                />
              </div>
              <div className="form-group">
                <label>Intensidade percebida</label>
                <select
                  className="form-select"
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                >
                  <option value="low">Leve</option>
                  <option value="moderate">Moderada</option>
                  <option value="high">Alta</option>
                  <option value="very_high">Muito alta</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Cor da urina</label>
              <UrineColorPicker value={urineColor} onChange={setUrineColor} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nivel de sede (0-10)</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={thirstLevel}
                  onChange={(e) => setThirstLevel(e.target.value)}
                  style={{ width: "100%" }}
                />
                <p className="helper">Nivel: {thirstLevel}</p>
              </div>
              <div className="form-group">
                <label>Vestimentas</label>
                <input
                  type="text"
                  className="form-input"
                  value={clothing}
                  onChange={(e) => setClothing(e.target.value)}
                  placeholder="Ex: Shorts e camiseta"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sintomas</label>
              <select
                className="form-select"
                value={symptomsPre}
                onChange={(e) => setSymptomsPre(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="nenhum">Nenhum</option>
                <option value="sede_leve">Sede leve</option>
                <option value="sede_intensa">Sede intensa</option>
                <option value="dor_cabeca">Dor de cabeca</option>
                <option value="tontura">Tontura</option>
                <option value="fadiga">Fadiga</option>
                <option value="caibra">Caibra</option>
              </select>
            </div>

            <div className="form-group">
              <label>Hidratacao recente</label>
              <input
                type="text"
                className="form-input"
                value={recentHydration}
                onChange={(e) => setRecentHydration(e.target.value)}
                placeholder="Ex: 500ml de agua 1h antes"
              />
              <p className="helper">
                *Um litro equivale a 1000 mL. Uma garrafa pet padrao tem em media 500 mL.
              </p>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={submitPre}
              disabled={!preMass || submitting}
            >
              {submitting ? "Salvando..." : "Salvar e Continuar"}
            </button>
          </div>
        )}

        {/* ── STEP 2: Durante ── */}
        {currentStep === 2 && sessionId && (
          <div className="card">
            <h3 className="card-title">Durante a Sessao</h3>

            <div className="form-group">
              <label>Registrar ingestao de fluidos</label>
              <FluidButtons
                sessionId={sessionId}
                totalMl={fluidTotal}
                onAdded={loadFluidTotal}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duracao real (min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(e.target.value)}
                  placeholder="Ex: 55"
                />
              </div>
              <div className="form-group">
                <label>Volume urinario (mL)</label>
                <input
                  type="number"
                  className="form-input"
                  value={urineVolume}
                  onChange={(e) => setUrineVolume(e.target.value)}
                  placeholder="Apenas quando aplicavel"
                />
                <p className="helper">** Apenas quando aplicavel</p>
              </div>
            </div>

            <div className="btn-group">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                Voltar
              </button>
              <button
                className="btn btn-primary"
                onClick={submitDuring}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? "Salvando..." : "Salvar e Continuar"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Pos-sessao ── */}
        {currentStep === 3 && (
          <div className="card">
            <h3 className="card-title">Dados Pos-sessao</h3>

            <div className="form-group">
              <label>Peso depois de urinar (kg) *</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={postMass}
                onChange={(e) => setPostMass(e.target.value)}
                placeholder="Ex: 71.8"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={soakedClothing}
                  onChange={(e) => setSoakedClothing(e.target.checked)}
                  style={{ marginRight: "0.5rem" }}
                />
                Roupas muito encharcadas
              </label>
              <p className="helper">
                Roupas encharcadas podem gerar erro na medida de peso
              </p>
            </div>

            <div className="form-group">
              <label>Sintomas gastrointestinais</label>
              <select
                className="form-select"
                value={giSymptoms}
                onChange={(e) => setGiSymptoms(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="nenhum">Nenhum</option>
                <option value="nausea_leve">Nausea leve</option>
                <option value="nausea_intensa">Nausea intensa</option>
                <option value="dor_abdominal">Dor abdominal</option>
                <option value="diarreia">Diarreia</option>
                <option value="vomito">Vomito</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nivel de fadiga (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={fatigueLevel}
                onChange={(e) => setFatigueLevel(e.target.value)}
                style={{ width: "100%" }}
              />
              <p className="helper">Nivel: {fatigueLevel}</p>
            </div>

            <div className="btn-group">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                Voltar
              </button>
              <button
                className="btn btn-primary"
                onClick={submitPost}
                disabled={!postMass || submitting}
                style={{ flex: 1 }}
              >
                {submitting ? "Calculando..." : "Finalizar e Ver Resultados"}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
