
import sys
from pathlib import Path

# Redireciona stdout e stderr para um arquivo de log
log_file = Path(__file__).parent / "teste_log.txt"
with open(log_file, "w", encoding="utf-8") as f:
    sys.stdout = f
    sys.stderr = f

    print("=== Iniciando teste ===")

    # Adiciona diretório backend ao path
    sys.path.insert(0, str(Path(__file__).parent))

    # Carrega .env
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        print(f"Carregando .env de {env_path}")
        import os
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())

    # Importa e executa teste
    from integracoes import analyze_session

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

    resultado = analyze_session(dados_teste)
    print("\n=== Resultado final ===")
    print(resultado)

print(f"Log salvo em {log_file}")

