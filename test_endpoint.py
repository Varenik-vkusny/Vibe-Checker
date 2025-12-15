import asyncio
import aiohttp

async def test():
    async with aiohttp.ClientSession() as session:
        async with session.post("http://localhost:8000/place/search_candidates", json={"query": "test"}) as resp:
            print(f"Status: {resp.status}")
            print(f"Response: {await resp.text()}")

asyncio.run(test())
