import os
import sys
from pathlib import Path

# Adiciona o diretório do backend ao caminho do Python
sys.path.insert(0, str(Path(__file__).parent))

# Carrega as variáveis de ambiente do arquivo .env
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    print(f"Carregando variáveis de {env_path}")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

# Importa a função de análise
from integracoes import analyze_session

# Testa com dados simples
dados_teste = {
    "athlete_name": "Teste Atleta",
    "pre_mass_kg": 70.5,
    "post_mass_kg": 69.8,
    "fluid_intake_ml": 500,
    "actual_duration_min": 60,
    "sweat_rate_lh": 1.2,
    "temperature_c": 25,
    "humidity_pct": 60,
    "perceived_intensity": 7,
    "perceived_intensity_post": 8,
    "alert_level": "normal"
}

print("\n=== Testando integração com OpenRouter ===")
print("\nChave API configurada?", "Sim" if os.environ.get("OPENROUTER_API_KEY") else "Não")

if os.environ.get("OPENROUTER_API_KEY"):
    print("\nGerando análise...")
    resultado = analyze_session(dados_teste)
    print("\n=== Análise Gerada ===")
    print(resultado)
else:
    print("\nErro: OPENROUTER_API_KEY não encontrada no arquivo .env!")
