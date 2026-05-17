function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

Chart.defaults.color = '#cbd5e1';
Chart.defaults.font.family = 'Outfit';

let prodChart, oeeChart, uptimeDowntimeChart = null;
let lastFactoryData = null;
let machineHistory = {};
let activeMachineId = null;

function initCharts() {
    const ctxProd = document.getElementById('productionChart').getContext('2d');
    prodChart = new Chart(ctxProd, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Produção Total',
                data: [],
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: { y: { beginAtZero: false } },
            plugins: { legend: { display: false } }
        }
    });

    const ctxOee = document.getElementById('oeeChart').getContext('2d');
    oeeChart = new Chart(ctxOee, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Eficiência por Linha (%)',
                data: [],
                backgroundColor: function(context) {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, '#8b5cf6'); // Violeta
                    gradient.addColorStop(1, '#0ea5e9'); // Ciano
                    return gradient;
                },
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function getStatusClass(status) {
    return status.toLowerCase().replace('ç', 'c').replace('ã', 'a').replace('ê', 'e');
}

function createMachineCard(m) {
    return `
        <div class="machine-card" id="machine-${m.id}" data-status="${m.status}">
            <div class="machine-header">
                <div class="machine-name">${m.name}</div>
                <div class="status-badge ${getStatusClass(m.status)}">${m.status}</div>
            </div>
            <div class="machine-stats">
                <div class="stat-box">
                    <span class="stat-label">Produzido</span>
                    <span class="stat-val" id="m-${m.id}-prod">${m.produced_parts}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Rejeitos</span>
                    <span class="stat-val text-danger" id="m-${m.id}-rej">${m.rejected_parts}</span>
                </div>
            </div>
            <div class="oee-info mt-2">
                <div class="oee-text">
                    <span>OEE</span>
                    <span id="m-${m.id}-oee-val">${m.oee ? m.oee.oee : 0}%</span>
                </div>
                <div class="oee-bar-container">
                    <div class="oee-bar" id="m-${m.id}-oee-bar" style="width: ${m.oee ? m.oee.oee : 0}%"></div>
                </div>
            </div>
        </div>
    `;
}

function createLineCard(l) {
    let name = l.id == 1 ? "Linha A" : (l.id == 2 ? "Linha B" : "Linha C");
    return `
        <div class="line-card" id="line-${l.id}">
            <h4>${name}</h4>
            <div class="line-stats">
                <span>Produção: <strong id="l-${l.id}-prod">0</strong></span>
                <span>Eficiência: <strong id="l-${l.id}-eff" class="text-primary">0%</strong></span>
            </div>
        </div>
    `;
}

async function initDashboard() {
    initCharts();
    
    // Configurar ações do Modal e Botão de Exportação
    document.getElementById('btn-export').addEventListener('click', exportCSV);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('machine-modal')) {
            closeModal();
        }
    });

    // Navegação por Abas
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remover ativo de todos os botões e abas
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Adicionar ativo no atual
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Limpar Histórico de Eventos
    document.getElementById('btn-clear-logs').addEventListener('click', () => {
        const logContainer = document.getElementById('event-log');
        logContainer.innerHTML = `
            <div class="event-item system">
                <span class="event-time">${new Date().toLocaleTimeString('pt-BR')}</span>
                Histórico de logs limpo pelo usuário.
            </div>
        `;
    });

    // Filtrar Eventos
    document.getElementById('log-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#event-log .event-item');
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Event Delegation para clique no Machine Card
    document.getElementById('machines-container').addEventListener('click', (e) => {
        const card = e.target.closest('.machine-card');
        if (card) {
            const mId = parseInt(card.id.replace('machine-', ''));
            openMachineModal(mId);
        }
    });

    let wsUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = `ws://${window.location.hostname}:8050/ws`;
    } else {
        wsUrl = `wss://factoryflow-mes.onrender.com/ws`;
    }
    const ws = new WebSocket(wsUrl);
    
    let chartTime = 0;
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'factory_update') {
            lastFactoryData = data;
            updateDashboard(data);
            updateCharts(data, chartTime++);
            
            // Se houver um modal ativo, atualizar os dados dele ao vivo
            if (activeMachineId !== null) {
                const activeMachine = data.machines.find(m => m.id === activeMachineId);
                if (activeMachine) {
                    updateModalData(activeMachine);
                }
            }
        }
    };
    
    ws.onclose = () => {
        console.log("WebSocket desconectado. Tentando reconectar...");
        setTimeout(initDashboard, 3000);
    };
}

function updateDashboard(data) {
    const machinesContainer = document.getElementById('machines-container');
    const linesContainer = document.getElementById('lines-container');
    
    let totalProd = 0;
    let totalRej = 0;
    let totalOEE = 0;
    let activeMachines = 0;
    
    data.machines.forEach(m => {
        // Detectar mudança de status para os Logs
        const prevStatus = machineHistory[m.id];
        if (prevStatus !== undefined && prevStatus !== m.status) {
            logEvent(m.name, m.status);
        }
        machineHistory[m.id] = m.status;

        let card = document.getElementById(`machine-${m.id}`);
        if (!card) {
            machinesContainer.insertAdjacentHTML('beforeend', createMachineCard(m));
            card = document.getElementById(`machine-${m.id}`);
        } else {
            if(card.getAttribute('data-status') !== m.status) {
                card.setAttribute('data-status', m.status);
                const badge = card.querySelector('.status-badge');
                badge.className = `status-badge ${getStatusClass(m.status)}`;
                badge.innerText = m.status;
            }
            
            document.getElementById(`m-${m.id}-prod`).innerText = m.produced_parts;
            document.getElementById(`m-${m.id}-rej`).innerText = m.rejected_parts;
            
            if(m.oee) {
                document.getElementById(`m-${m.id}-oee-val`).innerText = `${m.oee.oee}%`;
                document.getElementById(`m-${m.id}-oee-bar`).style.width = `${m.oee.oee}%`;
                
                const bar = document.getElementById(`m-${m.id}-oee-bar`);
                if(m.oee.oee > 80) bar.style.backgroundColor = 'var(--success)';
                else if (m.oee.oee > 50) bar.style.backgroundColor = 'var(--warning)';
                else bar.style.backgroundColor = 'var(--danger)';
            }
        }
        
        totalProd += m.produced_parts;
        totalRej += m.rejected_parts;
        if(m.oee) totalOEE += m.oee.oee;
        if (m.status === 'PRODUZINDO') activeMachines++;
    });
    
    data.lines.forEach(l => {
        let card = document.getElementById(`line-${l.id}`);
        if (!card) {
            linesContainer.insertAdjacentHTML('beforeend', createLineCard(l));
        } else {
            document.getElementById(`l-${l.id}-prod`).innerText = l.produced;
            document.getElementById(`l-${l.id}-eff`).innerText = `${l.efficiency}%`;
        }
    });
    
    document.getElementById('kpi-total-prod').innerText = totalProd;
    document.getElementById('kpi-total-rej').innerText = totalRej;
    document.getElementById('kpi-active-machines').innerText = `${activeMachines}/${data.machines.length}`;
    
    const avgOee = data.machines.length > 0 ? (totalOEE / data.machines.length).toFixed(1) : 0;
    document.getElementById('kpi-oee').innerText = `${avgOee}%`;
}

function updateCharts(data, timeIndex) {
    if(timeIndex % 2 !== 0) return;
    
    const now = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    
    let totalProd = data.machines.reduce((acc, m) => acc + m.produced_parts, 0);
    
    if (prodChart.data.labels.length > 20) {
        prodChart.data.labels.shift();
        prodChart.data.datasets[0].data.shift();
    }
    
    prodChart.data.labels.push(now);
    prodChart.data.datasets[0].data.push(totalProd);
    prodChart.update();
    
    oeeChart.data.labels = data.lines.map(l => l.id == 1 ? "Linha A" : (l.id == 2 ? "Linha B" : "Linha C"));
    oeeChart.data.datasets[0].data = data.lines.map(l => l.efficiency);
    oeeChart.update();
}

/* HISTÓRICO DE LOGS */
function logEvent(machineName, status) {
    const logContainer = document.getElementById('event-log');
    if (!logContainer) return;
    
    const time = new Date().toLocaleTimeString('pt-BR');
    const eventClass = getStatusClass(status);
    let statusText = status;
    
    if (status === 'PRODUZINDO') statusText = 'voltou a produzir';
    else if (status === 'FALHA') statusText = 'entrou em falha operacional';
    else if (status === 'MANUTENÇÃO') statusText = 'entrou em manutenção';
    else if (status === 'SETUP') statusText = 'entrou em processo de setup';
    else if (status === 'PARADA') statusText = 'foi paralisada';

    const logItem = `
        <div class="event-item ${eventClass}">
            <span class="event-time">${time}</span>
            <strong>${machineName}</strong> ${statusText}
        </div>
    `;
    
    logContainer.insertAdjacentHTML('beforeend', logItem);
    
    // Limitar a 100 logs para evitar consumo de memória no DOM
    while (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.firstChild);
    }
    
    // Auto-scroll para acompanhar em tempo real
    logContainer.scrollTop = logContainer.scrollHeight;
}

/* EXPORTAR RELATÓRIO EM CSV */
function exportCSV() {
    if (!lastFactoryData) {
        alert("Aguardando recebimento de dados para exportação...");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Garante acentuação correta no Excel
    csvContent += "Nome da Máquina;Linha;Status Atual;Produzido (Pçs);Rejeitos (Pçs);OEE (%);Disponibilidade (%);Performance (%);Qualidade (%)\n";
    
    lastFactoryData.machines.forEach(m => {
        const lineName = m.line_id === 1 ? "Linha A" : (m.line_id === 2 ? "Linha B" : "Linha C");
        const oee = m.oee ? m.oee.oee : 0;
        const disp = m.oee ? m.oee.availability : 0;
        const perf = m.oee ? m.oee.performance : 0;
        const qual = m.oee ? m.oee.quality : 0;
        
        csvContent += `${m.name};${lineName};${m.status};${m.produced_parts};${m.rejected_parts};${oee}%;${disp}%;${perf}%;${qual}%\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FactoryFlow_Relatorio_Parada_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* MODAL DE DETALHES DA MÁQUINA */
function openMachineModal(mId) {
    if (!lastFactoryData) return;
    const m = lastFactoryData.machines.find(mac => mac.id === mId);
    if (!m) return;
    
    activeMachineId = mId;
    document.getElementById('machine-modal').classList.add('active');
    
    updateModalData(m);
}

function updateModalData(m) {
    document.getElementById('modal-machine-name').innerText = `Monitoramento em Tempo Real - ${m.name}`;
    document.getElementById('modal-operator').innerText = m.operator || "Nenhum operador alocado";
    document.getElementById('modal-speed').innerText = `${m.speed} peças por segundo`;
    document.getElementById('modal-status').innerText = m.status;
    document.getElementById('modal-status').className = `meta-value text-${getStatusClass(m.status)}`;
    
    const uptime = m.uptime_seconds || 0;
    const downtime = m.downtime_seconds || 0;
    
    if (!uptimeDowntimeChart) {
        const ctx = document.getElementById('uptimeDowntimeChart').getContext('2d');
        uptimeDowntimeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Operação (s)', 'Parada (s)'],
                datasets: [{
                    data: [uptime, downtime],
                    backgroundColor: ['#10b981', '#f43f5e'],
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            font: { family: 'Outfit' }
                        }
                    }
                }
            }
        });
    } else {
        uptimeDowntimeChart.data.datasets[0].data = [uptime, downtime];
        uptimeDowntimeChart.update();
    }
}

function closeModal() {
    document.getElementById('machine-modal').classList.remove('active');
    activeMachineId = null;
    if (uptimeDowntimeChart) {
        uptimeDowntimeChart.destroy();
        uptimeDowntimeChart = null;
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);
