import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

print("=== Verificação da Configuração da API OpenRouter ===\n")

# Verifica se a API key está configurada
api_key = os.environ.get("OPENROUTER_API_KEY")
if api_key:
    print(f"✓ OPENROUTER_API_KEY está configurada")
    print(f"  Primeiros 10 caracteres: {api_key[:10]}...")
    print(f"  Tamanho total: {len(api_key)} caracteres")
else:
    print(f"✗ OPENROUTER_API_KEY NÃO está configurada")

# Verifica o modelo
model = os.environ.get("OPENROUTER_MODEL")
if model:
    print(f"✓ OPENROUTER_MODEL está configurado: {model}")
else:
    print(f"✗ OPENROUTER_MODEL NÃO está configurado (usará padrão)")

# Tenta fazer uma requisição de teste
if api_key:
    print("\n=== Testando conexão com a API ===")
    import requests
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com",
        "X-Title": "Hydra - Teste"
    }
    
    payload = {
        "model": model or "meta-llama/llama-3-8b-instruct",
        "messages": [
            {
                "role": "user",
                "content": "Responda apenas com 'OK' em português."
            }
        ],
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        print(f"Status code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"✓ API funcionando corretamente")
            print(f"  Modelo usado: {data.get('model', 'N/A')}")
            print(f"  Provider: {data.get('provider', 'N/A')}")
        else:
            print(f"✗ API retornou erro")
            print(f"  Resposta: {response.text[:200]}")
    except Exception as e:
        print(f"✗ Erro ao conectar: {str(e)}")
