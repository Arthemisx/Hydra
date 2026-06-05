
import os
import requests
from pathlib import Path

print("=== Teste OpenRouter - Passo a Passo ===")

# Passo 1: Verificar e carregar .env
env_path = Path(__file__).parent / ".env"
print(f"\n1. Caminho do .env: {env_path}")
print(f"2. Arquivo .env existe? {env_path.exists()}")

if env_path.exists():
    print(f"\n3. Carregando variáveis do .env:")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            os.environ.setdefault(key, value)
            print(f"   - {key} = {'***' if 'KEY' in key else value}")

# Passo 2: Verificar variáveis de ambiente
print(f"\n4. OPENROUTER_API_KEY: {'***' if os.environ.get('OPENROUTER_API_KEY') else 'NÃO ENCONTRADA'}")
print(f"5. OPENROUTER_MODEL: {os.environ.get('OPENROUTER_MODEL', 'NÃO ENCONTRADO')}")

# Passo 3: Tentar enviar requisição
api_key = os.environ.get("OPENROUTER_API_KEY")
if api_key:
    print("\n6. Enviando requisição para OpenRouter...")
    url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
        "messages": [{"role": "user", "content": "Olá, você está funcionando?"}],
        "temperature": 0.7
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com",
        "X-Title": "Teste"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        print(f"7. Status da resposta: {response.status_code}")
        print(f"8. Conteúdo da resposta: {response.text[:500]}")
    except Exception as e:
        print(f"8. Erro na requisição: {str(e)}")
else:
    print("\n6. Não há chave API para testar requisição.")

print("\n=== Fim do Teste ===")

