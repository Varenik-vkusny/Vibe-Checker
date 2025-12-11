from fastapi import Depends, HTTPException, status
from ..user.models import User, UserRole
from ...dependencies import get_current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:

    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав. Требуется доступ администратора.",
        )
    return current_user
