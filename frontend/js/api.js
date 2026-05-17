const API_BASE = "http://localhost:8000/api";

async function fetchLines() {
    try {
        const response = await fetch(`${API_BASE}/lines`);
        return await response.json();
    } catch (e) {
        console.error("Erro ao buscar linhas:", e);
        return [];
    }
}

async function fetchMachines() {
    try {
        const response = await fetch(`${API_BASE}/machines`);
        return await response.json();
    } catch (e) {
        console.error("Erro ao buscar maquinas:", e);
        return [];
    }
}
