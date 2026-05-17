def calculate_oee(uptime_seconds: int, downtime_seconds: int, produced_parts: int, rejected_parts: int, speed: float) -> dict:
    total_time = uptime_seconds + downtime_seconds
    if total_time == 0:
        return {"availability": 0.0, "performance": 0.0, "quality": 0.0, "oee": 0.0}

    availability = uptime_seconds / total_time
    total_parts = produced_parts + rejected_parts
    if uptime_seconds > 0 and speed > 0:
        performance = (total_parts / uptime_seconds) / speed
    else:
        performance = 0.0
        
    performance = min(1.0, performance) 

    if total_parts > 0:
        quality = produced_parts / total_parts
    else:
        quality = 0.0

    oee = availability * performance * quality

    return {
        "availability": round(availability * 100, 2),
        "performance": round(performance * 100, 2),
        "quality": round(quality * 100, 2),
        "oee": round(oee * 100, 2)
    }
