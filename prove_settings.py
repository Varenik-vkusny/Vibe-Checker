import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

async def main():
    async with aiohttp.ClientSession() as session:
        # 1. Login/Register
        email = "proof_user@example.com"
        pwd = "password"
        # Register (might fail if exists, ignore)
        await session.post(f"{BASE_URL}/users", json={"email": email, "password": pwd, "first_name": "P", "last_name": "U"})
        # Token
        async with session.post(f"{BASE_URL}/users/token", data={"username": email, "password": pwd}) as resp:
            token = (await resp.json())["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

        # 2. SEARCH: "McDonalds"
        print(">>> SEARCH 1: 'McDonalds' (No Restrictions)")
        async with session.post(f"{BASE_URL}/place/pro_analyze", json={
            "query": "McDonalds", "lat": 40.7128, "lon": -74.0060, "radius": 2000
        }, headers=headers) as resp:
            data = await resp.json()
            recs = data.get("recommendations", [])
            mc_count = sum(1 for p in recs if "mcdonald" in p['name'].lower())
            print(f"Found {mc_count} McDonalds locations.")
            if mc_count == 0:
                print("CRITICAL: Could not find McDonalds initially. Test invalid.")
                return

        # 3. SEARCH: "McDonalds" with Restriction "McDonalds"
        print("\n>>> SEARCH 2: 'McDonalds' (With Restriction: 'mcdonald')")
        async with session.post(f"{BASE_URL}/place/pro_analyze", json={
            "query": "McDonalds", "lat": 40.7128, "lon": -74.0060, "radius": 2000,
            "restrictions": ["mcdonald"]
        }, headers=headers) as resp:
            data = await resp.json()
            recs = data.get("recommendations", [])
            for p in recs:
                 print(f"  Result: {p['name']}")
            
            mc_count_restricted = sum(1 for p in recs if "mcdonald" in p['name'].lower())
            print(f"Found {mc_count_restricted} McDonalds locations.")
            
            if mc_count_restricted == 0:
                print("SUCCESS: Restriction worked! All McDonalds filtered out.")
            else:
                print("FAILURE: McDonalds still appeared.")

        # 4. Check Sliders Effect (Log Only)
        print("\n>>> CHECK: Sliders Param Injection")
        # We can't easy prove the reranker output change deterministically without a complex setup, 
        # but we can confirm the server accepts the params.
        async with session.post(f"{BASE_URL}/place/pro_analyze", json={
            "query": "Bar", "lat": 40.7128, "lon": -74.0060, 
            "acoustics": 10,  # Quiet
            "lighting": 10    # Dim
        }, headers=headers) as resp:
            print(f"Slider Request Status: {resp.status}")

if __name__ == "__main__":
    asyncio.run(main())
