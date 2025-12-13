from sqlalchemy.ext.asyncio import AsyncSession
from .models import UserLog, ActionType


async def log_user_action(
    db: AsyncSession, user_id: int, action_type: ActionType, payload: dict
):
    try:
        new_log = UserLog(user_id=user_id, action_type=action_type, payload=payload)
        db.add(new_log)
        await db.commit()
    except Exception as e:
        print(f"Failed to log user action: {e}")
