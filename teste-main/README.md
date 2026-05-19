# Projeto Hydra — Monitoramento de Hidratação

Aplicativo para registro diário e sessões de hidratação de atletas (São Camilo).

## Origem dos módulos

| Parte | Origem |
|-------|--------|
| **Backend + banco** | PI caio (`PI_Hydra`) — SQLite, auth JWT, sessões |
| **Login / cadastro** | `Hydra-login-cadastro` (visual tela-login) |
| **Relatório, sobre, ajuda, registro diário** | `TelaInicial/AdesivoSmash` |
| **Sessões (pré / durante / pós)** | Lógica TelaInicial + visual PI caio |

## Estrutura

```
teste-main/
├── backend/     # API Flask PI_Hydra (hydra.db)
├── frontend/    # App Expo unificado
├── setup.cmd    # Instalação (Windows)
└── run.cmd      # Executar app + API
```

## Como executar

### 1. Setup (primeira vez)

**Opção A — duplo clique ou CMD (recomendado no Windows):**

```cmd
cd teste-main
setup.cmd
```

**Opção B — PowerShell** (se der erro de política de execução, use a opção A ou rode antes):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd teste-main
.\setup.ps1
```

### 2. Executar

```cmd
run.cmd
```

ou, no PowerShell (com política liberada):

```powershell
.\run.ps1
```

- **Backend:** http://localhost:5000  
- **App:** escaneie o QR code do Expo (porta 8083)

### Usuários de demonstração (após o seed)

| Perfil   | E-mail               | Senha     |
|----------|----------------------|-----------|
| Equipe   | maria@saocamilo.br   | team123   |
| Atleta   | carlos@email.com     | atleta123 |
| Atleta   | ana@email.com        | atleta123 |

## Funcionalidades

- **Login / Cadastro** — Atleta ou Treinador
- **Tela inicial** — Nova sessão (pré / durante / pós) e registro diário
- **Treinador** — Lista de atletas e histórico
- **Relatórios** — PDF, planilha CSV ou painel longitudinal
- **Sobre / Ajuda** — Informações do app

## Banco de dados

Por padrão o backend usa **SQLite** (`backend/hydra.db`). Para MySQL ou PostgreSQL, configure `DATABASE_URL` em `backend/.env`.

## Desenvolvimento manual

**Backend:**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

**Frontend:**

```powershell
cd frontend
npm start
```

Defina `EXPO_PUBLIC_API_BASE_URL` em `frontend/.env` se o dispositivo não alcançar `localhost` (use o IP da máquina na rede).
