from .repo import PlaceRepo


class PlaceService:

    def __init__(self, place_repo: PlaceRepo):
        self.place_repo = place_repo

    async def find_place_with_info(self, url: str):

        return await self.place_repo.get_place_by_url_with_full_info(url=url)

    async def create_new_place(
        self,
        source_url: str,
        name: str,
        google_rating: float,
        latitude: float,
        longitude: float,
    ):

        new_place = await self.place_repo.add(
            source_url=source_url,
            name=name,
            google_rating=google_rating,
            latitude=latitude,
            longitude=longitude,
        )

        return new_place
