from pydantic import BaseModel
from typing import List


class DashboardStats(BaseModel):
    db_status: bool
    last_backup: str
    total_users: int
    active_tasks: int


class ChartPoint(BaseModel):
    name: str  # Название месяца (Jan, Feb...)
    value: int  # Значение (Quality или Rating)


class DashboardData(BaseModel):
    stats: DashboardStats
    chart_data: List[ChartPoint]
