# FactoryFlow — Sistema MES Focado em Produção Industrial 🏭📊

**FactoryFlow** é um sistema **MES (Manufacturing Execution System)** moderno e responsivo, desenvolvido para monitoramento, controle e auditoria de processos produtivos industriais em tempo real.

⚡ **Acesse a Demonstração Online**: [https://factory-flow-mes.vercel.app/](https://factory-flow-mes.vercel.app/)

---

## 📸 Demonstração Visual

| 1. Painel de Operação (Dashboard) | 2. Histórico de Eventos (Logs) |
| :---: | :---: |
| ![Painel](assets/dashboard.png) | ![Logs](assets/logs.png) |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, Vanilla CSS3 (Design Glassmorphism Cyber-Teal, responsivo com micro-animações), JavaScript Puro (ES6) para manipulação de DOM e WebSocket API, e **Chart.js** para gráficos dinâmicos de produção e OEE.
- **Backend (Python 3.10+)**: Desenvolvido com **FastAPI** e **Uvicorn** (produção pronta e leve) para tratamento dinâmico de conexões WebSocket persistentes e compatibilidade de nuvem nativa de alta performance.
- **Cálculo de OEE**: Motor matemático nativo que calcula dinamicamente a *Disponibilidade, Performance e Qualidade* de cada máquina segundo a segundo.
- **Simulador Integrado**: Emulador físico industrial que gera desvios de processo, paradas, falhas operacionais, setups e geração de peças boas/rejeitos em tempo real.

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Iniciar o Backend (FastAPI + Uvicorn)
No terminal, dentro do diretório do projeto:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*O servidor de sockets estará ativo na porta `8050`.*

### 2. Iniciar o Frontend
Em outro terminal:
```bash
cd frontend
python -m http.server 8080
```
*Acesse o dashboard no seu navegador em: [http://localhost:8080](http://localhost:8080)*

---

## 🌐 Guia de Deploy em Produção (Nuvem)

### 1. Frontend (Hospedagem na Vercel)
A **Vercel** é ideal para o frontend estático:
1. Conecte seu repositório GitHub ao painel da Vercel.
2. Importe o projeto e selecione a pasta `/frontend` como **Root Directory** nas configurações.
3. Clique em **Deploy** e pronto!

### 2. Backend (Hospedagem no Render ou Railway)
Por necessitar de conexões persistentes abertas de segundo plano, o backend Python deve rodar em um serviço de execução contínua:
1. Crie um novo *Web Service* (no Render ou Railway) conectando seu repositório.
2. Defina o diretório de execução como `/backend` e o comando de inicialização como `python main.py`.

### 3. Conexão entre os Ambientes
O sistema já está totalmente integrado e pré-configurado no arquivo `app.js` para se comunicar com o backend de produção ativo no Render:
`wss://factoryflow-mes.onrender.com/ws`

---

## 🎓 Conclusão
O **FactoryFlow** demonstra competências sólidas em **Desenvolvimento Real-Time (WebSockets)**, **Simulações Orientadas a Eventos (Asyncio)**, **Cálculos Industriais (OEE)** e **UX/UI futurista premium de alta performance**.

Sinta-se à vontade para utilizar o código e destacá-lo no seu portfólio de engenharia de software! 🚀
