# Projeto Hydra - Instruções de Execução

## Estrutura do Projeto

- **Backend**: `TelaInicial/PI caio/PI_SaoCamilo/PI_Hydra/backend/`
- **Frontend**: `TelaInicial/AdesivoSmash/`

## Passos para Executar

### 1. Backend

1. Navegue até a pasta do backend:
   ```bash
   cd "TelaInicial/PI caio/PI_SaoCamilo/PI_Hydra/backend"
   ```

2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

3. Inicie o servidor:
   ```bash
   python app.py
   ```
   O backend estará rodando em `http://localhost:5000`

### 2. Frontend

1. Navegue até a pasta do frontend:
   ```bash
   cd "TelaInicial/AdesivoSmash"
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o app:
   ```bash
   npm start
   ```

## Funcionalidades

- **Login/Cadastro**: Acesse com e-mail e senha, ou crie uma nova conta (Atleta ou Treinador)
- **Tela Inicial (Home)**: Tela principal com botão "Nova Sessão" para atletas
- **Sessão**: Fluxo em 3 etapas:
  - **Pré-sessão**: Peso, modalidade, temperatura, umidade, duração prevista, cor da urina
  - **Durante a sessão**: Registrar ingestão de fluidos (squeeze/copo/garrafa), duração real, volume urinário
  - **Pós-sessão**: Peso, roupas encharcadas, sintomas GI, nível de fadiga
- **Registro Diário**: Formulário antigo para registro diário de hidratação
- **Parte do Treinador**: Visualize dados dos atletas
- **Relatórios**: Gere relatórios em 3 formatos:
  - **PDF**: Arquivo .pdf com os dados
  - **Planilha**: Arquivo .csv (planilha)
  - **Painel longitudinal**: Visualização direta no app com resumo e detalhes
- **Sobre/Ajuda**: Informações adicionais


