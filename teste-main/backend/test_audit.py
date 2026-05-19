"""
Auditoria completa do backend NutriEsportiva.
Testa calculations.py, auth, sessoes e reports.
Roda com SQLite em memoria (sem precisar de PostgreSQL).
"""
import os
import json

# Força SQLite em memoria para testes
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app import create_app
from models import db, User
import bcrypt

app = create_app()
client = app.test_client()

PASS = "\033[92m PASS\033[0m"
FAIL = "\033[91m FAIL\033[0m"
errors = []


def check(name, condition, detail=""):
    if condition:
        print(f"  {PASS} {name}")
    else:
        print(f"  {FAIL} {name} — {detail}")
        errors.append(name)


# ══════════════════════════════════════════════════════════
# 1. CALCULATIONS.PY — Funções puras
# ══════════════════════════════════════════════════════════
print("\n══ 1. CALCULATIONS.PY ══")

from calculations import calculate_session

# Cenario 1: atleta perde 1kg em 1h, bebeu 500ml
r = calculate_session(
    pre_mass_kg=70.0,
    post_mass_kg=69.5,
    fluid_intake_ml=500,
    urine_volume_ml=0,
    duration_min=60,
)
check("Perda ajustada = 1.0 kg", r["adjusted_loss_kg"] == 1.0,
      f"got {r['adjusted_loss_kg']}")
check("Taxa sudorese = 1.0 L/h", r["sweat_rate_lh"] == 1.0,
      f"got {r['sweat_rate_lh']}")
check("Variacao % = 1.43%", r["mass_variation_pct"] == 1.43,
      f"got {r['mass_variation_pct']}")
check("Balanco = -500 mL", r["hydration_balance_ml"] == -500.0,
      f"got {r['hydration_balance_ml']}")
check("Recomendacao = 800 mL/h", r["recommended_intake_ml_h"] == 800.0,
      f"got {r['recommended_intake_ml_h']}")
check("Alerta = caution (>1%)", r["alert_level"] == "caution",
      f"got {r['alert_level']}")

# Cenario 2: desidratacao severa (>2%)
r2 = calculate_session(
    pre_mass_kg=65.0,
    post_mass_kg=63.0,
    fluid_intake_ml=200,
    urine_volume_ml=100,
    duration_min=90,
)
expected_loss = (65.0 - 63.0) + 0.2 - 0.1  # 2.1 kg
check("Cenario severo: perda = 2.1 kg", r2["adjusted_loss_kg"] == 2.1,
      f"got {r2['adjusted_loss_kg']}")
check("Cenario severo: alerta = danger", r2["alert_level"] == "danger",
      f"got {r2['alert_level']}")

# Cenario 3: bem hidratado
r3 = calculate_session(
    pre_mass_kg=80.0,
    post_mass_kg=79.8,
    fluid_intake_ml=1000,
    urine_volume_ml=200,
    duration_min=60,
)
expected_loss3 = (80.0 - 79.8) + 1.0 - 0.2  # 1.0 kg
check("Cenario normal: perda = 1.0 kg", r3["adjusted_loss_kg"] == 1.0,
      f"got {r3['adjusted_loss_kg']}")
check("Cenario normal: variacao = 1.25%", r3["mass_variation_pct"] == 1.25,
      f"got {r3['mass_variation_pct']}")

# Cenario 4: duracao zero (edge case)
r4 = calculate_session(
    pre_mass_kg=70.0,
    post_mass_kg=70.0,
    fluid_intake_ml=0,
    urine_volume_ml=0,
    duration_min=0,
)
check("Duracao 0: nao divide por zero", r4["sweat_rate_lh"] == 0.0,
      f"got {r4['sweat_rate_lh']}")

# Cenario 5: massa zero (edge case)
r5 = calculate_session(
    pre_mass_kg=0,
    post_mass_kg=0,
    fluid_intake_ml=0,
    urine_volume_ml=0,
    duration_min=60,
)
check("Massa 0: nao divide por zero", r5["mass_variation_pct"] == 0,
      f"got {r5['mass_variation_pct']}")


# ══════════════════════════════════════════════════════════
# 2. AUTH — Register, Login, JWT
# ══════════════════════════════════════════════════════════
print("\n══ 2. AUTH ══")

# Register atleta
resp = client.post("/api/auth/register", json={
    "name": "Teste Atleta",
    "email": "teste@test.com",
    "password": "123456",
    "role": "athlete",
    "sport": "Corrida",
})
check("Register atleta: status 201", resp.status_code == 201,
      f"got {resp.status_code}")
data = resp.get_json()
check("Register retorna token", "token" in data, f"keys: {list(data.keys())}")
check("Register retorna user", data.get("user", {}).get("role") == "athlete")
athlete_token = data.get("token")

# Register equipe
resp = client.post("/api/auth/register", json={
    "name": "Teste Equipe",
    "email": "equipe@test.com",
    "password": "123456",
    "role": "team",
})
check("Register equipe: status 201", resp.status_code == 201)
team_token = resp.get_json().get("token")

# Register duplicado
resp = client.post("/api/auth/register", json={
    "name": "Dup",
    "email": "teste@test.com",
    "password": "123",
    "role": "athlete",
})
check("Register duplicado: status 409", resp.status_code == 409,
      f"got {resp.status_code}")

# Register sem campos
resp = client.post("/api/auth/register", json={"name": "Faltou"})
check("Register incompleto: status 400", resp.status_code == 400,
      f"got {resp.status_code}")

# Register role invalida
resp = client.post("/api/auth/register", json={
    "name": "X", "email": "x@x.com", "password": "123", "role": "admin"
})
check("Register role invalida: status 400", resp.status_code == 400,
      f"got {resp.status_code}")

# Login OK
resp = client.post("/api/auth/login", json={
    "email": "teste@test.com",
    "password": "123456",
})
check("Login OK: status 200", resp.status_code == 200, f"got {resp.status_code}")
check("Login retorna token", "token" in resp.get_json())

# Login senha errada
resp = client.post("/api/auth/login", json={
    "email": "teste@test.com",
    "password": "errada",
})
check("Login senha errada: status 401", resp.status_code == 401,
      f"got {resp.status_code}")

# Login email inexistente
resp = client.post("/api/auth/login", json={
    "email": "naoexiste@x.com",
    "password": "123",
})
check("Login email inexistente: status 401", resp.status_code == 401,
      f"got {resp.status_code}")

# /me com token valido
resp = client.get("/api/auth/me", headers={
    "Authorization": f"Bearer {athlete_token}"
})
check("/me com token: status 200", resp.status_code == 200)
check("/me retorna email correto", resp.get_json().get("email") == "teste@test.com")

# /me sem token
resp = client.get("/api/auth/me")
check("/me sem token: status 401", resp.status_code == 401,
      f"got {resp.status_code}")

# /me com token invalido
resp = client.get("/api/auth/me", headers={"Authorization": "Bearer tokenfalso"})
check("/me token invalido: status 401", resp.status_code == 401,
      f"got {resp.status_code}")


# ══════════════════════════════════════════════════════════
# 3. SESSOES — Fluxo completo pre → during → post
# ══════════════════════════════════════════════════════════
print("\n══ 3. SESSOES ══")

headers_ath = {"Authorization": f"Bearer {athlete_token}"}
headers_team = {"Authorization": f"Bearer {team_token}"}

# Criar sessao (pre)
resp = client.post("/api/sessions", json={
    "pre_mass_kg": 72.5,
    "temperature_c": 32.0,
    "humidity_pct": 65.0,
    "sport": "Corrida",
    "expected_duration_min": 60,
    "perceived_intensity": "high",
    "urine_color": 3,
    "thirst_level": 4,
    "symptoms_pre": "nenhum",
    "recent_hydration": "500ml agua 1h antes",
}, headers=headers_ath)
check("Criar sessao: status 201", resp.status_code == 201, f"got {resp.status_code}")
session_data = resp.get_json()
session_id = session_data.get("id")
check("Sessao status = pre", session_data.get("status") == "pre")
check("Pre mass = 72.5", session_data.get("pre_mass_kg") == 72.5)

# Registrar eventos de fluido
for vol, src in [(200, "squeeze_bottle"), (150, "cup"), (500, "bottle")]:
    resp = client.post(f"/api/sessions/{session_id}/fluid", json={
        "volume_ml": vol,
        "source": src,
    }, headers=headers_ath)
    check(f"Fluid event {src} ({vol}ml): status 201", resp.status_code == 201,
          f"got {resp.status_code}")

# Listar eventos de fluido
resp = client.get(f"/api/sessions/{session_id}/fluid", headers=headers_ath)
check("Listar fluidos: 3 eventos", len(resp.get_json()) == 3,
      f"got {len(resp.get_json())}")
total = sum(e["volume_ml"] for e in resp.get_json())
check("Total fluidos = 850 mL", total == 850, f"got {total}")

# PATCH during
resp = client.patch(f"/api/sessions/{session_id}/during", json={
    "actual_duration_min": 55,
    "urine_volume_ml": 100,
}, headers=headers_ath)
check("PATCH during: status 200", resp.status_code == 200, f"got {resp.status_code}")
check("Status = during", resp.get_json().get("status") == "during")
check("Fluid intake atualizado = 850", resp.get_json().get("fluid_intake_ml") == 850,
      f"got {resp.get_json().get('fluid_intake_ml')}")

# PATCH post (dispara calculo)
resp = client.patch(f"/api/sessions/{session_id}/post", json={
    "post_mass_kg": 71.8,
    "soaked_clothing": True,
    "gi_symptoms": "leve nausea",
    "fatigue_level": 6,
}, headers=headers_ath)
check("PATCH post: status 200", resp.status_code == 200, f"got {resp.status_code}")
result = resp.get_json()
check("Status = done", result.get("status") == "done")
check("adjusted_loss_kg calculado", result.get("adjusted_loss_kg") is not None,
      f"got {result.get('adjusted_loss_kg')}")
check("sweat_rate_lh calculado", result.get("sweat_rate_lh") is not None,
      f"got {result.get('sweat_rate_lh')}")
check("alert_level calculado", result.get("alert_level") is not None,
      f"got {result.get('alert_level')}")

# Verificar calculo manualmente
# pre=72.5, post=71.8, fluid=850ml=0.85kg, urine=100ml=0.1kg, dur=55min
# adjusted = (72.5-71.8) + 0.85 - 0.1 = 1.45
# sweat_rate = 1.45 / (55/60) = 1.582 L/h
# variation = 1.45/72.5*100 = 2.0%
check("adjusted_loss = 1.45", result.get("adjusted_loss_kg") == 1.45,
      f"got {result.get('adjusted_loss_kg')}")
check("sweat_rate ~= 1.582", abs(result.get("sweat_rate_lh", 0) - 1.582) < 0.001,
      f"got {result.get('sweat_rate_lh')}")
check("variation = 2.0%", result.get("mass_variation_pct") == 2.0,
      f"got {result.get('mass_variation_pct')}")

# GET sessao por ID
resp = client.get(f"/api/sessions/{session_id}", headers=headers_ath)
check("GET sessao por ID: status 200", resp.status_code == 200)
check("Dados completos retornados", resp.get_json().get("adjusted_loss_kg") == 1.45)

# Listar sessoes do atleta
resp = client.get("/api/sessions", headers=headers_ath)
check("Listar sessoes atleta: >= 1", len(resp.get_json()) >= 1,
      f"got {len(resp.get_json())}")


# ══════════════════════════════════════════════════════════
# 4. REPORTS — Atletas e Histórico (role team)
# ══════════════════════════════════════════════════════════
print("\n══ 4. REPORTS ══")

# Listar atletas como equipe
resp = client.get("/api/athletes", headers=headers_team)
check("Listar atletas (team): status 200", resp.status_code == 200)
check("Pelo menos 1 atleta", len(resp.get_json()) >= 1,
      f"got {len(resp.get_json())}")

# Listar atletas como atleta (proibido)
resp = client.get("/api/athletes", headers=headers_ath)
check("Listar atletas (athlete): status 403", resp.status_code == 403,
      f"got {resp.status_code}")

# Historico do atleta (como equipe)
athlete_id = None
with app.app_context():
    u = User.query.filter_by(email="teste@test.com").first()
    athlete_id = u.id

resp = client.get(f"/api/athletes/{athlete_id}/history", headers=headers_team)
check("Historico atleta (team): status 200", resp.status_code == 200)
hist = resp.get_json()
check("Historico tem athlete + sessions", "athlete" in hist and "sessions" in hist)
check("Historico tem >= 1 sessao", len(hist.get("sessions", [])) >= 1,
      f"got {len(hist.get('sessions', []))}")

# Historico como atleta (proibido)
resp = client.get(f"/api/athletes/{athlete_id}/history", headers=headers_ath)
check("Historico (athlete): status 403", resp.status_code == 403,
      f"got {resp.status_code}")


# ══════════════════════════════════════════════════════════
# 5. EDGE CASES
# ══════════════════════════════════════════════════════════
print("\n══ 5. EDGE CASES ══")

# Sessao inexistente
resp = client.get("/api/sessions/99999", headers=headers_ath)
check("Sessao inexistente: status 404", resp.status_code == 404,
      f"got {resp.status_code}")

# Fluid event em sessao inexistente
resp = client.post("/api/sessions/99999/fluid", json={
    "volume_ml": 100
}, headers=headers_ath)
check("Fluid em sessao inexistente: status 404", resp.status_code == 404,
      f"got {resp.status_code}")

# Equipe ve sessoes de todos
resp = client.get("/api/sessions", headers=headers_team)
check("Team ve todas sessoes: status 200", resp.status_code == 200)

# Criar segunda sessao para testar listagem
resp = client.post("/api/sessions", json={
    "pre_mass_kg": 68.0,
    "sport": "Natacao",
    "expected_duration_min": 45,
}, headers=headers_ath)
check("Segunda sessao criada: 201", resp.status_code == 201)

resp = client.get("/api/sessions", headers=headers_ath)
check("Atleta ve 2 sessoes", len(resp.get_json()) == 2,
      f"got {len(resp.get_json())}")


# ══════════════════════════════════════════════════════════
# RESULTADO
# ══════════════════════════════════════════════════════════
print("\n" + "=" * 50)
total_tests = len(errors) + sum(1 for line in [] if True)  # placeholder
if errors:
    print(f"\033[91m{len(errors)} TESTE(S) FALHARAM:\033[0m")
    for e in errors:
        print(f"  ✗ {e}")
else:
    print(f"\033[92mTODOS OS TESTES PASSARAM!\033[0m")
print("=" * 50)
