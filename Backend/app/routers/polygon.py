# polygon.py
from fastapi import APIRouter
import math
from pydantic import BaseModel
from typing import List

router = APIRouter()

class Point(BaseModel):
    lat: float
    lon: float

class PolygonInput(BaseModel):
    points: List[Point]

@router.post("/calculate-polygon-metrics")
async def calculate_polygon_metrics(polygon: PolygonInput):
    try:
        points = polygon.points
        if len(points) < 3:
            return {"error": "At least 3 points required"}

        # คำนวณพื้นที่ (ใช้สูตร shoelace จาก script.js)
        area = 0
        for i in range(len(points)):
            j = (i + 1) % len(points)
            area += points[i].lat * points[j].lon
            area -= points[j].lat * points[i].lon
        area = abs(area) / 2
        meters_per_degree = 111000
        area_m2 = area * meters_per_degree * meters_per_degree * math.cos(points[0].lat * math.pi / 180)

        # คำนวณเส้นรอบวง
        perimeter = 0
        for i in range(len(points)):
            j = (i + 1) % len(points)
            R = 6371000  # Earth's radius
            lat1 = points[i].lat * math.pi / 180
            lat2 = points[j].lat * math.pi / 180
            delta_lat = (points[j].lat - points[i].lat) * math.pi / 180
            delta_lon = (points[j].lon - points[i].lon) * math.pi / 180
            a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            perimeter += R * c

        # คำนวณจุดศูนย์กลาง
        lat_sum = sum(p.lat for p in points) / len(points)
        lon_sum = sum(p.lon for p in points) / len(points)

        return {
            "area": f"{area_m2:.2f} sq meters ({area_m2 / 1600:.2f} rai)",
            "perimeter": f"{perimeter:.2f} meters",
            "center": f"{lat_sum:.6f}, {lon_sum:.6f}"
        }
    except Exception as e:
        return {"error": str(e)}