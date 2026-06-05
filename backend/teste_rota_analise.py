import requests
import json

# URL do backend local
BASE_URL = "http://127.0.0.1:5000"

# Dados de teste para análise
dados_sessao = {
    "athlete_name": "Carlos Silva",
    "pre_mass_kg": 70.5,
    "post_mass_kg": 69.8,
    "fluid_intake_ml": 500,
    "actual_duration_min": 60,
    "urine_volume_ml": 100,
    "sweat_rate_lh": 1.2,
    "mass_variation_pct": -1.0,
    "hydration_balance_ml": -200,
    "recommended_intake_ml_h": 800,
    "temperature_c": 28,
    "humidity_pct": 70,
    "expected_duration_min": 60,
    "urine_color": 3,
    "sport": "Corrida",
    "soaked_clothing": True,
    "fatigue_level": 7,
    "perceived_intensity": 7,
    "perceived_intensity_post": 8,
    "alert_level": "caution",
    "gi_responses": {
        "pre": {"context": "both", "before_training": "yes", "before_competition": "no"},
        "during": {"context": "training", "during_training": "mild"},
        "post": {"context": "both", "after_training": "no", "after_competition": "yes"}
    }
}

print("=== Testando rota de análise de sessão ===\n")
print("Enviando dados para análise...")

try:
    response = requests.post(
        f"{BASE_URL}/api/analyze-session",
        json=dados_sessao,
        timeout=30
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.ok:
        resultado = response.json()
        print("\n=== Análise Inteligente ===\n")
        print(resultado["analysis"])
    else:
        print(f"\nErro: {response.text}")
        
except Exception as e:
    print(f"\nErro de conexão: {str(e)}")
