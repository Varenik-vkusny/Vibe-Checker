from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from .repo import FavoritesRepo
from .models import Favorite
from ..interactions.models import UserInteraction
from ..place.models import Place

from ..place_tag.models import PlaceTag

class FavoritesService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = FavoritesRepo(db)

    async def toggle_favorite(self, user_id: int, place_id: str | int):
        # Check if place exists
        if isinstance(place_id, int) or (isinstance(place_id, str) and place_id.isdigit()):
            stmt = select(Place).where(Place.id == int(place_id))
        else:
            stmt = select(Place).where(Place.google_place_id == place_id)
            
        result = await self.db.execute(stmt)
        place = result.scalar_one_or_none()

        if not place:
            return None # Or raise error
            
        real_id = place.id

        existing = await self.repo.find_one(user_id=user_id, place_id=real_id)
        if existing:
            await self.repo.delete(user_id=user_id, place_id=real_id)
            await self.db.commit()
            return {"status": "removed"}
        else:
            await self.repo.add(user_id=user_id, place_id=real_id)
            await self.db.commit()
            return {"status": "added"}

    async def get_bookmarks(self, user_id: int):
        # Get favorites
        favorites = await self.repo.get_favorites_by_user(user_id)
        
        # Get visited interactions
        stmt = (
            select(UserInteraction)
            .where(UserInteraction.user_id == user_id, UserInteraction.is_visited == True)
            .options(
                selectinload(UserInteraction.place)
                .selectinload(Place.tags)
                .selectinload(PlaceTag.tag)
            )
        )
        result = await self.db.execute(stmt)
        visited = result.scalars().all()

        # Combine and format
        # We need to return a list of places with a status
        # If a place is both, what takes precedence? 
        # Usually "Visited" implies you've been there, so maybe that?
        # But "Favorites" is explicit save.
        # Let's return all unique places and mark their status.
        
        bookmarks_map = {}

        for fav in favorites:
            place = fav.place
            bookmarks_map[place.id] = {
                "id": place.id,
                "google_place_id": place.google_place_id,
                "name": place.name,
                "category": "Place", # Placeholder, maybe derive from tags?
                "image": place.photos[0] if place.photos else None,
                "rating": place.google_rating,
                "price": "$$", # Placeholder
                "distance": "N/A", # Placeholder
                "tags": [t.tag.name for t in place.tags] if place.tags else [],
                "status": "to_go"
            }

        for vis in visited:
            place = vis.place
            if place.id in bookmarks_map:
                bookmarks_map[place.id]["status"] = "visited" # Override or handle dual status?
            else:
                bookmarks_map[place.id] = {
                    "id": place.id,
                    "google_place_id": place.google_place_id,
                    "name": place.name,
                    "category": "Place",
                    "image": place.photos[0] if place.photos else None,
                    "rating": place.google_rating,
                    "price": "$$",
                    "distance": "N/A",
                    "tags": [t.tag.name for t in place.tags] if place.tags else [],
                    "status": "visited"
                }
        
        return list(bookmarks_map.values())

    async def search_favorites(self, user_id: int, query: str):
        """Search favorites by name (case-insensitive substring)."""
        favorites = await self.get_bookmarks(user_id)
        query = query.lower().strip()
        
        matches = []
        for fav in favorites:
            if query in fav["name"].lower():
                # Add source tag
                fav["source"] = "library"
                matches.append(fav)
        
        return matches
