from pydantic import BaseModel
from typing import List


class DashboardStats(BaseModel):
    db_status: bool
    last_backup: str
    total_users: int
    active_tasks: int


class ChartPoint(BaseModel):
    name: str
    value: int


class DashboardData(BaseModel):
    stats: DashboardStats
    chart_data: List[ChartPoint]
