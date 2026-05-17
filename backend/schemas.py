from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MachineBase(BaseModel):
    name: str
    status: str
    speed: float
    produced_parts: int
    rejected_parts: int
    uptime_seconds: int
    downtime_seconds: int
    operator: Optional[str] = None

class MachineSchema(MachineBase):
    id: int
    line_id: int
    
    class Config:
        orm_mode = True

class LineBase(BaseModel):
    name: str

class LineSchema(LineBase):
    id: int
    machines: List[MachineSchema] = []
    
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    code: str
    product: str
    planned_quantity: int
    produced_quantity: int
    priority: str
    status: str
    deadline: datetime

class OrderSchema(OrderBase):
    id: int
    line_id: int

    class Config:
        orm_mode = True
