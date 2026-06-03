import sys
from pathlib import Path
import requests

log_file = Path(__file__).parent / "teste_endpoint_log.txt"
with open(log_file, "w", encoding="utf-8") as log:
    sys.stdout = log
    sys.stderr = log
    
    print("Testando endpoint /api/weather")
    print("=" * 40)
    
    try:
        response = requests.get(
            "http://127.0.0.1:5000/api/weather",
            params={"lat": -23.5505, "lon": -46.6333},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print("✅ Sucesso!")
            print(f"Dados: {data}")
        else:
            print(f"❌ Erro: {response.text}")
    except Exception as e:
        print(f"❌ Erro na requisição: {str(e)}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")

print(f"Log salvo em {log_file}")
