from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Line:
    id: int
    name: str

@dataclass
class Machine:
    id: int
    name: str
    status: str
    speed: float
    produced_parts: int
    rejected_parts: int
    uptime_seconds: int
    downtime_seconds: int
    line_id: int
    operator: Optional[str] = None
    
db_lines: List[Line] = []
db_machines: List[Machine] = []
