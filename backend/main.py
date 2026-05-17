from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import asyncio
import json
import models
from services.simulator import simulator_instance

app = FastAPI()

def init_db():
    if len(models.db_lines) == 0:
        models.db_lines.extend([
            models.Line(id=1, name="Linha A"),
            models.Line(id=2, name="Linha B"),
            models.Line(id=3, name="Linha C")
        ])
        
        models.db_machines.extend([
            models.Machine(id=1, name="Extrusora 01", status="PRODUZINDO", speed=2.0, line_id=1, produced_parts=0, rejected_parts=0, uptime_seconds=0, downtime_seconds=0, operator="João Silva"),
            models.Machine(id=2, name="Injetora 02", status="PARADA", speed=1.5, line_id=1, produced_parts=0, rejected_parts=0, uptime_seconds=0, downtime_seconds=0, operator="Maria Santos"),
            models.Machine(id=3, name="Embaladora 01", status="PRODUZINDO", speed=3.0, line_id=2, produced_parts=0, rejected_parts=0, uptime_seconds=0, downtime_seconds=0, operator="Carlos Cunha"),
            models.Machine(id=4, name="Misturador 03", status="MANUTENÇÃO", speed=0.5, line_id=2, produced_parts=0, rejected_parts=0, uptime_seconds=0, downtime_seconds=0, operator="Ana Costa"),
            models.Machine(id=5, name="Prensa 05", status="PRODUZINDO", speed=1.0, line_id=3, produced_parts=0, rejected_parts=0, uptime_seconds=0, downtime_seconds=0, operator="Pedro Lima"),
            models.Machine(id=6, name="Solda 02", status="SETUP", speed=1.2, line_id=3, produced_parts=0, rejected_parts=0, uptime_seconds=0, downtime_seconds=0, operator="Lucas Mendes"),
        ])

@app.on_event("startup")
async def startup_event():
    init_db()
    asyncio.create_task(simulator_instance.run())

@app.get("/")
@app.head("/")
async def read_root():
    return HTMLResponse("FactoryFlow WebSocket Server is Running!")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue = asyncio.Queue()
    simulator_instance.add_listener(queue)
    try:
        while True:
            message = await queue.get()
            await websocket.send_json(message)
    except WebSocketDisconnect:
        pass
    finally:
        simulator_instance.remove_listener(queue)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8050))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
