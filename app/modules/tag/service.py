from .repo import TagRepo


class TagService:

    def __init__(self, tag_repo: TagRepo):
        self.tag_repo = tag_repo

    async def create_tag_if_not_exists(self, tag_name: str):

        tag = await self.tag_repo.find_one(name=tag_name)

        if not tag:
            tag = await self.tag_repo.add(name=tag_name)

        return tag
