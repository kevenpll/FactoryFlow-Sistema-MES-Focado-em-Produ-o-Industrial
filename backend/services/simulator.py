import asyncio
import random
import models
from services.oee import calculate_oee

class Simulator:
    def __init__(self):
        self.active = False
        self.listeners = []

    def add_listener(self, queue: asyncio.Queue):
        self.listeners.append(queue)

    def remove_listener(self, queue: asyncio.Queue):
        if queue in self.listeners:
            self.listeners.remove(queue)

    async def broadcast(self, message: dict):
        for queue in self.listeners:
            await queue.put(message)

    async def run(self):
        self.active = True
        while self.active:
            machines = models.db_machines
            factory_update = {"type": "factory_update", "machines": [], "lines": []}
            
            line_stats = {}
            
            for machine in machines:
                if machine.status == "PRODUZINDO":
                    if random.random() < 0.05:
                        machine.status = "FALHA"
                    elif random.random() < 0.02:
                        machine.status = "MANUTENÇÃO"
                    else:
                        machine.uptime_seconds += 1
                        if random.random() < 0.95:
                            machine.produced_parts += int(machine.speed)
                        else:
                            machine.rejected_parts += int(machine.speed)
                elif machine.status == "FALHA":
                    machine.downtime_seconds += 1
                    if random.random() < 0.2:
                        machine.status = "PRODUZINDO"
                elif machine.status == "MANUTENÇÃO":
                    machine.downtime_seconds += 1
                    if random.random() < 0.1:
                        machine.status = "PRODUZINDO"
                elif machine.status == "PARADA":
                    machine.downtime_seconds += 1
                    if random.random() < 0.1:
                        machine.status = "PRODUZINDO"
                elif machine.status == "SETUP":
                    machine.downtime_seconds += 1
                    if random.random() < 0.3:
                        machine.status = "PRODUZINDO"

                oee_data = calculate_oee(machine.uptime_seconds, machine.downtime_seconds, 
                                         machine.produced_parts, machine.rejected_parts, machine.speed)
                                         
                m_data = {
                    "id": machine.id,
                    "name": machine.name,
                    "line_id": machine.line_id,
                    "status": machine.status,
                    "produced_parts": machine.produced_parts,
                    "rejected_parts": machine.rejected_parts,
                    "operator": machine.operator,
                    "speed": machine.speed,
                    "uptime_seconds": machine.uptime_seconds,
                    "downtime_seconds": machine.downtime_seconds,
                    "oee": oee_data
                }
                factory_update["machines"].append(m_data)
                
                if machine.line_id not in line_stats:
                    line_stats[machine.line_id] = {"produced": 0, "rejected": 0, "machines_count": 0, "producing_count": 0}
                    
                line_stats[machine.line_id]["produced"] += machine.produced_parts
                line_stats[machine.line_id]["rejected"] += machine.rejected_parts
                line_stats[machine.line_id]["machines_count"] += 1
                if machine.status == "PRODUZINDO":
                    line_stats[machine.line_id]["producing_count"] += 1
            
            for lid, stats in line_stats.items():
                factory_update["lines"].append({
                    "id": lid,
                    "produced": stats["produced"],
                    "efficiency": round((stats["producing_count"] / stats["machines_count"]) * 100 if stats["machines_count"] > 0 else 0, 2)
                })

            await self.broadcast(factory_update)
            await asyncio.sleep(1)

simulator_instance = Simulator()
