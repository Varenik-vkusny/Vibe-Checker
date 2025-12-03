from .repo import PlaceTagRepo


class PlaceTagService:

    def __init__(self, place_tag_repo: PlaceTagRepo):
        self.place_tag_repo = place_tag_repo

    async def create_tag_link_if_not_exists(self, place_id: int, tag_id: int):

        link_db = await self.place_tag_repo.find_one(place_id=place_id, tag_id=tag_id)
        if not link_db:
            await self.place_tag_repo.add(place_id=place_id, tag_id=tag_id)
