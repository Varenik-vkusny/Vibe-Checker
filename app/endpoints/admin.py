from fastapi import APIRouter, Depends, Query
from typing import List
from ..modules.admin.service import AdminService
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from ..dependencies import get_db
from ..modules.user.models import User, UserRole
from ..modules.user.schemas import UserOut
from ..modules.user.repo import UserRepo
from fastapi import HTTPException
from ..modules.parsing.models import ParsingRequest, TaskStatus
from ..modules.admin.schemas import DashboardData, DashboardStats, ChartPoint
from datetime import datetime

router = APIRouter()


@router.get("/logs", response_model=List[str])
async def read_logs(limit: int = Query(50, ge=1, le=1000)):

    return await AdminService.get_system_logs(lines_count=limit)


@router.get("/logs/download")
async def download_logs():

    return AdminService.get_log_file_download()


@router.delete("/logs/clear")
async def clear_logs():

    return await AdminService.clear_logs_cache()


@router.get("/users", response_model=List[UserOut])
async def get_all_users(db: AsyncSession = Depends(get_db)):

    repo = UserRepo(db)

    return await repo.get_all_users_with_order()


@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: int, role: UserRole, db: AsyncSession = Depends(get_db)
):

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    await db.commit()
    await db.refresh(user)
    return {"status": "success", "new_role": role}


@router.get("/stats", response_model=DashboardData)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):

    try:
        await db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        db_healthy = False

    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0

    try:
        tasks_result = await db.execute(
            select(func.count(ParsingRequest.id)).where(
                ParsingRequest.status == TaskStatus.PROCESSING
            )
        )
        active_tasks = tasks_result.scalar() or 0
    except Exception:
        active_tasks = 0

    chart_mock = [
        ChartPoint(name="Jan", value=2000),
        ChartPoint(name="Feb", value=2100),
        ChartPoint(name="Mar", value=3500),
        ChartPoint(name="Apr", value=3200),
        ChartPoint(name="May", value=4100),
        ChartPoint(name="Jun", value=3800),
        ChartPoint(name="Jul", value=5200),
        ChartPoint(name="Aug", value=5800),
        ChartPoint(name="Sep", value=6100),
        ChartPoint(name="Oct", value=6500),
        ChartPoint(name="Nov", value=7200),
        ChartPoint(name="Dec", value=8500),
    ]

    return DashboardData(
        stats=DashboardStats(
            db_status=db_healthy,
            last_backup=datetime.now().strftime("%H:%M Today"),
            total_users=total_users,
            active_tasks=active_tasks,
        ),
        chart_data=chart_mock,
    )
