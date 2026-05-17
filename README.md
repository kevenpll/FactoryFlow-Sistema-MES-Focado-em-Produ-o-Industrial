# FactoryFlow — Sistema MES Focado em Produção Industrial 🏭📊

**FactoryFlow** é um sistema **MES (Manufacturing Execution System)** moderno e responsivo, desenvolvido para monitoramento, controle e auditoria de processos produtivos industriais em tempo real.

---

## 📸 Demonstração Visual

| 1. Painel de Operação (Dashboard) | 2. Histórico de Eventos (Logs) |
| :---: | :---: |
| ![Painel](assets/dashboard.png) | ![Logs](assets/logs.png) |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, Vanilla CSS3 (Design Glassmorphism Cyber-Teal, responsivo com micro-animações), JavaScript Puro (ES6) para manipulação de DOM e WebSocket API, e **Chart.js** para gráficos dinâmicos de produção e OEE.
- **Backend (Python 3.10+)**: Desenvolvido com **Asyncio** e **Websockets** (sem dependências externas pesadas) para comunicação em tempo real de altíssima latência e portabilidade total.
- **Cálculo de OEE**: Motor matemático nativo que calcula dinamicamente a *Disponibilidade, Performance e Qualidade* de cada máquina segundo a segundo.
- **Simulador Integrado**: Emulador físico industrial que gera desvios de processo, paradas, falhas operacionais, setups e geração de peças boas/rejeitos em tempo real.

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Iniciar o Backend (WebSocket)
No terminal, dentro do diretório do projeto:
```bash
cd backend
pip install websockets
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
Após o deploy do backend, atualize a URL pública gerada no arquivo `frontend/js/app.js`:
```javascript
// Substitua o endereço do localhost pela sua URL pública em produção:
const wsUrl = "wss://seu-backend.onrender.com/ws";
```

---

## 🎓 Conclusão
O **FactoryFlow** demonstra competências sólidas em **Desenvolvimento Real-Time (WebSockets)**, **Simulações Orientadas a Eventos (Asyncio)**, **Cálculos Industriais (OEE)** e **UX/UI futurista premium de alta performance**.

Sinta-se à vontade para utilizar o código e destacá-lo no seu portfólio de engenharia de software! 🚀
