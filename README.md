<h1 align="center"> Hydra — Monitoramento de Hidratação - Projeto Integrador Interdiciplinar em parceiria com a São Camilo </h1> 

# Aplicativo para registro diário de sessões de treinamento e hidratação de atletas.

O projeto foi desenvolvido com o objetivo de auxiliar no dia a dia de treinadores, nutricionistas e atletas. Após reuniões com o cliente, foi possivel identificar o problema enfrentado para o controle e supervisão de atletas durante a rotina de treinos. Desse modo, através de reuniões e futuras sprints foi possível discutir a cerca de como produzir um aplicativo multiplataforma que contesse uma interface básica, intuitiva e prática para otimizar o tempo dos usuários, além de ser completa para dar o suporte necessário do inicio ao fim. Nesse sentido, foram realizados diferentes cadastros de acordo com a necessidade de cada usuario (treinador, nutricionista e atleta), junto ao vlibras caso seja necessário e cores marcantes. 

# 🔨 Funcionalidades do projeto

A funcionalidade inserida no site deriva de acordo com a necessidade, no login de treinador é possível adicionar e excluir atletas e gerar relatorios de seus respectivos grupos e atletas. Ao acessar o login do nutricionista é possível acessar seus respectivos times e gerar relatorios. Já no login do atleta apenas é possivel gerar seu próprio relatório, registrar suas sessões, receber feedback de uma Inteligência artificial, além de poder conversar com ela e poder acessar tambem as estatisticas de seus treinos.

As tecnologias utilizadas ao longo do projeto iniciaram-se no Figma, onde foram desenvolvidos protótipos de tela e navegação para que assim o grupo pudesse apresentar ao cliente a ideia inicial e assim ajustar de acordo com as necessidades citadas. Após a aprovação, o grupo iniciou a programação do projeto, dividindo tarefas e as administrando com a ferramenta Trello e realizando Sprints para alinhar objetivos e planejamento. Após isso, a Stack utilizada foram os framework do React e Fask, as Linguagens JavaScript e Python e o banco de dados MySQL a fim de armazenar dados de usuários e registro de sessões.

O aplicativo foi desenvolvido pelo grupo de projeto integrador interdisciplinar mestrado pelo professor Alexander e Rudolf, com seus respectivos membros: Arthemis Nobre, Bianca Borges, Carmen Salido, Caio e Maria Clara Gatti.

# 📁 Acesso ao projeto

O projeto pode ser acessado por qualquer um que clonar todo o repositorio em seu dispositivo e tiver o vs code ou variaveis instalados em seu dispositivo.
# 🛠️ Abrir e rodar o projeto

Para executar o projeto os passos principais são:

1. Clone o repositorio para uma pasta local

2. Abra esse folder em seu VS Code

```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
**Backend:**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

**Frontend:**

```powershell
cd frontend
npm install
npm start
```

## Banco de dados

Por padrão o backend usa **SQLite** (`backend/hydra.db`). Para MySQL ou PostgreSQL, configure `DATABASE_URL` em `backend/.env`.


### Usuários de demonstração (após o seed)

| Perfil   | E-mail               | Senha     |
|----------|----------------------|-----------|
| Equipe   | maria@saocamilo.br   | team123   |
| Atleta   | carlos@email.com     | atleta123 |
| Atleta   | ana@email.com        | atleta123 |


## Ferramentas de auditoria (backend)

```cmd
cd backend
.venv\Scripts\python.exe auditoria.py testar      :: roda os testes
.venv\Scripts\python.exe auditoria.py verificar   :: lista entradas do banco
.venv\Scripts\python.exe auditoria.py datas       :: atualiza datas para hoje
```
