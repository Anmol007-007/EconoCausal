from __future__ import annotations
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.user import UserDB

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        email: str,
        hashed_password: str,
        full_name: str = "",
        role: str = "viewer",
        api_key_hash: Optional[str] = None,
    ) -> UserDB:
        user = UserDB(
            email=email.lower().strip(),
            hashed_password=hashed_password,
            full_name=full_name,
            role=role,
            api_key_hash=api_key_hash,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_email(self, email: str) -> Optional[UserDB]:
        query = select(UserDB).where(UserDB.email == email.lower().strip())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_id(self, user_id: str) -> Optional[UserDB]:
        query = select(UserDB).where(UserDB.id == user_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_api_key_hash(self, key_hash: str) -> Optional[UserDB]:
        query = select(UserDB).where(UserDB.api_key_hash == key_hash)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def update_api_key_hash(self, user_id: str, key_hash: Optional[str]) -> Optional[UserDB]:
        user = await self.get_by_id(user_id)
        if user:
            user.api_key_hash = key_hash
            await self.session.commit()
            await self.session.refresh(user)
        return user

    async def list_all(self, limit: int = 50, offset: int = 0) -> List[UserDB]:
        query = select(UserDB).offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

