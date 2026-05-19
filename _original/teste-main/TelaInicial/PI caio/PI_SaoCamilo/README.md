# Hydra — NutriEsportiva

Aplicativo de avaliacao da taxa de sudorese e suporte a hidratacao de atletas.

**Projeto Interdisciplinar — Sao Camilo / Ciencias da Computacao**

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Flask (Python) + SQLite/PostgreSQL |
| Web | Next.js (TypeScript) |
| Mobile | React Native (Expo) |
| Auth | JWT com roles (atleta / equipe) |

## Como rodar (jeito rapido)

```bash
git clone https://github.com/GitKiraz/PI_SaoCamilo.git
cd PI_SaoCamilo/NutriEsportiva
./start.sh
```

Isso sobe o backend (porta 5000) e o web (porta 3000) automaticamente.

Acesse: **http://localhost:3000**

## Como rodar (passo a passo)

### 1. Backend

```bash
cd NutriEsportiva/backend
pip install -r requirements.txt
python app.py
```

O Flask sobe em http://localhost:5000 usando SQLite (arquivo `hydra.db`).

Para criar usuarios demo:

```bash
python seed.py
```

Usuarios demo:
- **Equipe:** maria@saocamilo.br / team123
- **Atleta:** carlos@email.com / atleta123
- **Atleta:** ana@email.com / atleta123

### 2. Web

```bash
cd NutriEsportiva/web
npm install
npm run dev
```

Acesse http://localhost:3000

### 3. Mobile

```bash
cd NutriEsportiva/mobile
npm install
npx expo start
```

Escaneie o QR code com o app Expo Go no celular.

**Nota:** No mobile, edite `src/lib/api.ts` e troque o IP para o IP da sua maquina na rede local.

## Como rodar com Dev Container (VS Code)

1. Instale Docker Desktop + extensao "Dev Containers" no VS Code
2. Abra a pasta do projeto no VS Code
3. Clique em "Reopen in Container" (ou F1 > Dev Containers: Reopen in Container)
4. O container ja instala Python, Node, e todas as dependencias automaticamente
5. Rode `cd NutriEsportiva && ./start.sh`

## Como rodar com Docker Compose (producao)

```bash
cd NutriEsportiva
docker-compose up --build
```

Sobe: PostgreSQL (5432) + Flask (5000) + Next.js (3000)

## Estrutura do projeto

```
NutriEsportiva/
├── start.sh                 <- Sobe tudo com 1 comando
├── docker-compose.yml       <- Para deploy com PostgreSQL
├── backend/
│   ├── app.py               <- Entry point Flask
│   ├── models.py            <- 3 tabelas (users, sessions, fluid_events)
│   ├── auth.py              <- Login, registro, JWT
│   ├── calculations.py      <- Motor de calculo (taxa sudorese, alertas)
│   ├── routes_session.py    <- CRUD de sessoes
│   ├── routes_reports.py    <- Relatorios e historico
│   ├── seed.py              <- Dados demo
│   └── test_audit.py        <- 50 testes automatizados
├── web/
│   ├── app/                 <- Paginas Next.js (login, dashboard, sessao, etc)
│   ├── components/          <- Header, Sidebar, UrineColorPicker, FluidButtons
│   └── lib/                 <- API wrapper, AuthContext
└── mobile/
    ├── App.tsx              <- Entry point Expo
    └── src/
        ├── screens/         <- 7 telas (Login, Home, Pre, During, Post, Result, History)
        ├── components/
        └── lib/             <- API, auth, offline queue
```

## API Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /api/auth/register | Criar usuario |
| POST | /api/auth/login | Login (retorna JWT) |
| GET | /api/auth/me | Perfil do usuario logado |
| POST | /api/sessions | Criar sessao (dados pre) |
| GET | /api/sessions | Listar sessoes |
| GET | /api/sessions/:id | Detalhe da sessao |
| PATCH | /api/sessions/:id/during | Dados durante a sessao |
| PATCH | /api/sessions/:id/post | Dados pos (dispara calculo) |
| POST | /api/sessions/:id/fluid | Registrar ingestao de fluido |
| GET | /api/athletes | Listar atletas (equipe) |
| GET | /api/athletes/:id/history | Historico do atleta (equipe) |

## Rodar os testes

```bash
cd NutriEsportiva/backend
python test_audit.py
```

50 testes cobrindo: calculos, auth, sessoes, relatorios e edge cases.
