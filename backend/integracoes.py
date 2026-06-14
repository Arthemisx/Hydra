import os
import requests

# Configuração da API de clima (OpenWeatherMap)
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Configuração do OpenRouter
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct")


def get_weather_by_coords(lat: float, lon: float):
    """
    Busca dados de clima (temperatura e umidade) usando coordenadas geográficas
    """
    if not OPENWEATHER_API_KEY:
        print("Aviso: OPENWEATHER_API_KEY não configurada, usando valores padrão")
        # Fallback: valores padrão razoáveis
        return {
            "temperature": 25.0,  # Temperatura ambiente típica
            "humidity": 60,      # Umidade ambiente típica
            "description": "Clima padrão"
        }

    try:
        params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric",  # Temperatura em Celsius
            "lang": "pt_br"
        }
        response = requests.get(OPENWEATHER_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        return {
            "temperature": round(data["main"]["temp"], 1),
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"].capitalize()
        }
    except Exception as e:
        print(f"Erro ao buscar clima: {str(e)}, usando valores padrão")
        # Fallback em caso de erro na API
        return {
            "temperature": 25.0,
            "humidity": 60,
            "description": "Clima padrão"
        }


def analyze_session(session_data: dict):
    """
    Analisa dados da sessão — usa API do OpenRouter se disponível, caso contrário retorna análise padrão
    """
    print("Iniciando análise da sessão...")
    
    # Tenta usar a API do OpenRouter
    if OPENROUTER_API_KEY:
        try:
            payload = {
                "model": OPENROUTER_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": f"""
Você é um nutricionista esportivo e fisiologista especializado em hidratação de atletas.
Responda em português com até 300 palavras.

Analise os dados da sessão abaixo e retorne:
1. Avaliação da hidratação (baseada na variação de peso, taxa de sudorese)
2. Recomendações para próximas sessões (considerando temperatura/umidade)
3. Observações sobre sintomas gastrointestinais (se houver)
4. Dicas baseadas na percepção de esforço (RPE)

Dados da sessão:
{session_data}

Responda apenas com o texto da análise, sem formatação extra.
                        """.strip()
                    }
                ],
                "temperature": 0.7
            }

            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com",
                "X-Title": "Hydra - Acompanhamento de Hidratação"
            }

            print(f"Enviando requisição para OpenRouter (modelo: {OPENROUTER_MODEL})...")
            response = requests.post(OPENROUTER_BASE_URL, json=payload, headers=headers, timeout=15)
            
            if response.ok:
                data = response.json()
                analysis = data["choices"][0]["message"]["content"].strip()
                print("Análise da API obtida com sucesso!")
                return analysis
            else:
                print(f"API retornou erro: {response.status_code}")
                
        except Exception as e:
            print(f"Erro na API: {str(e)}")
    
    # Fallback: análise padrão baseada nos dados
    print("Usando análise padrão...")
    
    # Extrai dados relevantes
    pre_mass = session_data.get("pre_mass_kg", 0)
    post_mass = session_data.get("post_mass_kg", 0)
    sweat_rate = session_data.get("sweat_rate_lh", 0)
    temp = session_data.get("temperature_c", 25)
    humidity = session_data.get("humidity_pct", 60)
    pre_rpe = session_data.get("perceived_intensity")
    post_rpe = session_data.get("perceived_intensity_post")
    
    weight_change = pre_mass - post_mass if pre_mass and post_mass else 0
    weight_change_pct = (weight_change / pre_mass * 100) if pre_mass > 0 else 0
    
    # Cria análise personalizada
    parts = []
    
    # Análise de hidratação
    if weight_change_pct > 2:
        parts.append(f"⚠️ Desidratação significativa detectada! Houve perda de {weight_change_pct:.1f}% do peso corporal ({weight_change:.1f}kg).")
    elif weight_change_pct > 1:
        parts.append(f"📊 Perda moderada de peso ({weight_change_pct:.1f}%). Aumente a ingestão hídrica na próxima sessão.")
    elif weight_change_pct > 0:
        parts.append(f"✅ Hidratação adequada! A perda de {weight_change_pct:.1f}% está dentro dos limites recomendados.")
    else:
        parts.append(f"ℹ️ Sem perda de peso (ou ganho de peso). Verifique a ingestão hídrica.")
    
    if sweat_rate > 0:
        parts.append(f"💧 Taxa de sudorese: {sweat_rate:.1f} L/h.")
    
    # Recomendações baseadas em clima
    if temp and temp > 28:
        parts.append(f"🌡️ Temperatura elevada ({temp:.0f}°C). Aumente a ingestão hídrica em 20-30%.")
    if humidity and humidity > 70:
        parts.append(f"💦 Alta umidade ({humidity:.0f}%). A sudorese pode ser menos eficiente.")
    
    # RPE
    if post_rpe:
        if post_rpe >= 8:
            parts.append(f"🏋️ Esforço elevado (RPE {post_rpe}/10). Garanta boa recuperação e hidratação pós-treino.")
        elif post_rpe <= 4:
            parts.append(f"🏃 Esforço leve a moderado (RPE {post_rpe}/10).")
    
    # Sintomas GI
    gi_data = session_data.get("gi_responses")
    if gi_data:
        parts.append(f"🩺 Sintomas gastrointestinais registrados. Verifique a dieta e hidratação pré-exercício.")
    
    # Recomendações finais
    parts.append(f"💡 Recomendações para a próxima sessão: Inicie hidratado, beba líquidos durante o exercício, e repeseja adequadamente no pós-treino.")
    
    return "\n\n".join(parts)


def chat_with_ai(message: str, session_data: dict, chat_history: list = None):
    """
    Função de chat interativo com a IA, mantendo o contexto da sessão
    """
    print("Iniciando chat com IA...")
    
    if chat_history is None:
        chat_history = []
    
    # Tenta usar a API do OpenRouter
    if OPENROUTER_API_KEY:
        try:
            # Constrói o contexto da sessão
            system_prompt = f"""
Você é um nutricionista esportivo e fisiologista especializado em hidratação de atletas.
Responda em português de forma clara e concisa (máximo 200 palavras por resposta).

Contexto da sessão do atleta:
{session_data}

Use esses dados para responder perguntas específicas sobre hidratação, desempenho, recuperação e recomendações.
Seja útil e prático nas suas respostas.
            """.strip()
            
            # Monta as mensagens com histórico
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Adiciona histórico do chat
            for msg in chat_history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            
            # Adiciona a mensagem atual
            messages.append({"role": "user", "content": message})
            
            payload = {
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "temperature": 0.7
            }

            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com",
                "X-Title": "Hydra - Chat de Hidratação"
            }

            print(f"Enviando requisição para OpenRouter (modelo: {OPENROUTER_MODEL})...")
            response = requests.post(OPENROUTER_BASE_URL, json=payload, headers=headers, timeout=15)
            
            if response.ok:
                data = response.json()
                reply = data["choices"][0]["message"]["content"].strip()
                print("Resposta da API obtida com sucesso!")
                return reply
            else:
                print(f"API retornou erro: {response.status_code}")
                
        except Exception as e:
            print(f"Erro na API: {str(e)}")
    
    # Fallback: respostas simples baseadas em palavras-chave
    print("Usando respostas padrão...")
    
    message_lower = message.lower()
    
    if "hidrata" in message_lower or "água" in message_lower:
        pre_mass = session_data.get("pre_mass_kg", 0)
        post_mass = session_data.get("post_mass_kg", 0)
        weight_change = pre_mass - post_mass if pre_mass and post_mass else 0
        weight_change_pct = (weight_change / pre_mass * 100) if pre_mass > 0 else 0
        
        if weight_change_pct > 2:
            return f"Baseado nos dados, houve uma perda de {weight_change_pct:.1f}% do peso corporal. Recomendo aumentar a ingestão hídrica em 20-30% na próxima sessão, especialmente se a temperatura estiver elevada."
        elif weight_change_pct > 1:
            return f"A perda de {weight_change_pct:.1f}% do peso é moderada. Tente beber 150-200ml a cada 15-20 minutos durante o exercício."
        else:
            return "Sua hidratação parece adequada! Continue mantendo o ritmo de ingestão hídrica atual."
    
    elif "sudore" in message_lower or "suor" in message_lower:
        sweat_rate = session_data.get("sweat_rate_lh", 0)
        if sweat_rate > 1.5:
            return f"Sua taxa de sudorese é alta ({sweat_rate:.1f} L/h). Isso indica que você precisa repor líquidos frequentemente. Considere bebidas com eletrólitos para sessões longas."
        elif sweat_rate > 1.0:
            return f"Taxa de sudorese moderada ({sweat_rate:.1f} L/h). Mantenha a hidratação regular durante o exercício."
        else:
            return "Taxa de sudorese normal. Continue com sua estratégia de hidratação atual."
    
    elif "recupera" in message_lower or "pós" in message_lower:
        return "Para recuperação ideal: beba 150% do peso perdido nas primeiras 2 horas pós-treino, inclua eletrólitos se a sessão foi longa ou intensa, e consuma carboidratos dentro de 30 minutos."
    
    elif "recomenda" in message_lower or "dica" in message_lower or "próxima" in message_lower:
        temp = session_data.get("temperature_c", 25)
        humidity = session_data.get("humidity_pct", 60)
        return f"Para a próxima sessão: inicie já hidratado, beba antes de sentir sede, ajuste a ingestão conforme o clima (atual: {temp:.0f}°C, {humidity:.0f}% umidade), e repeseja após o treino."
    
    else:
        return "Posso ajudar com perguntas sobre hidratação, taxa de sudorese, recuperação pós-treino e recomendações para suas próximas sessões. O que você gostaria de saber?"
