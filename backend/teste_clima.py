import sys
from pathlib import Path

log_file = Path(__file__).parent / "teste_clima_log.txt"
with open(log_file, "w", encoding="utf-8") as log:
    sys.stdout = log
    sys.stderr = log
    
    print("Teste API OpenWeatherMap")
    print("=" * 40)
    
    # Verifica se o config.py está carregando o .env
    from config import Config
    import os
    
    print(f"OPENWEATHER_API_KEY (os.environ): {os.environ.get('OPENWEATHER_API_KEY', 'NÃO ENCONTRADA')}")
    
    # Adiciona o diretório backend ao caminho
    sys.path.insert(0, str(Path(__file__).parent))
    
    # Importa a função
    from integracoes import get_weather_by_coords
    
    # Testa com coordenadas de São Paulo
    lat, lon = -23.5505, -46.6333
    resultado = get_weather_by_coords(lat, lon)
    
    if resultado:
        print("\n✅ Sucesso!")
        print(f"Temperatura: {resultado['temperature']}°C")
        print(f"Umidade: {resultado['humidity']}%")
        print(f"Descrição: {resultado['description']}")
    else:
        print("\n❌ Falha")

print(f"Log salvo em {log_file}")
