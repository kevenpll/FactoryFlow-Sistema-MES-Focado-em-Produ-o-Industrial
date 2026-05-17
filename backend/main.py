import asyncio
import json
import websockets
import websockets.http11
import models
from services.simulator import simulator_instance

# Monkey-patch para suportar requisições HTTP HEAD/OPTIONS/POST de Health Check (como as do Render)
# que por padrão quebram o parser interno de handshake do websockets.
original_request_parse = websockets.http11.Request.parse

@classmethod
def patched_request_parse(cls, read_line):
    def wrapped_read_line(*args, **kwargs):
        gen = read_line(*args, **kwargs)
        line = yield from gen
        if line.startswith(b"HEAD "):
            line = b"GET " + line[5:]
        elif line.startswith(b"OPTIONS "):
            line = b"GET " + line[8:]
        elif line.startswith(b"POST "):
            line = b"GET " + line[5:]
        return line
    return original_request_parse(wrapped_read_line)

websockets.http11.Request.parse = patched_request_parse

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

async def ws_handler(websocket, path="/ws"):
    queue = asyncio.Queue()
    simulator_instance.add_listener(queue)
    try:
        while True:
            message = await queue.get()
            await websocket.send(json.dumps(message))
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        simulator_instance.remove_listener(queue)

async def process_request(path, request_headers):
    if "Upgrade" not in request_headers:
        return (websockets.http.HTTPStatus.OK, [("Content-Type", "text/plain")], b"FactoryFlow WebSocket Server is Running!\n")
    return None

async def main():
    init_db()
    
    asyncio.create_task(simulator_instance.run())
    
    import os
    port = int(os.environ.get("PORT", 8050))
    
    print("Iniciando FactoryFlow...")
    async with websockets.serve(ws_handler, "0.0.0.0", port, process_request=process_request):
        print(f"Servidor WebSocket rodando na porta {port}")
        print("Você pode abrir o frontend/index.html no navegador agora!")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
