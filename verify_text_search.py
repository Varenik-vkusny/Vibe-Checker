import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

async def main():
    async with aiohttp.ClientSession() as session:
        # 1. Login
        email = "text_search_test@example.com"
        pwd = "password"
        # Register
        await session.post(f"{BASE_URL}/users", json={"email": email, "password": pwd, "first_name": "T", "last_name": "S"})
        async with session.post(f"{BASE_URL}/users/token", data={"username": email, "password": pwd}) as resp:
            token = (await resp.json())["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

        # 2. Add a unique favorite for this user (to test Library Search)
        # We need a valid place ID. Let's use "ChIJ..." (real Google ID) or create one via analyze?
        # Let's search for "Coffee", pick first result, analyze it (to save it), then favorite it.
        
        print("--- Setup: Analyzing 'Starbucks' to create a place ---")
        # Use pro_analyze to find a place
        async with session.post(f"{BASE_URL}/place/pro_analyze", json={"query": "Starbucks NYC", "lat": 40.7, "lon": -74.0}, headers=headers) as resp:
            data = await resp.json()
            if not data.get("recommendations"):
                print("Setup Failed: No Starbucks found.")
                return
            
            first_place = data["recommendations"][0]
            place_id = first_place["place_id"]
            name = first_place["name"]
            print(f"Found: {name} ({place_id})")

        # Now Favorite it (we need database ID, usually pro_analyze returns internal ID too if saved? 
        # Actually pro_mode/main.py puts external place_id in response.
        # But `FavoritesService` uses toggle_favorite which internally finds by google_place_id. 
        # So using google_place_id is fine.
        
        print("--- Setup: Favoriting ---")
        async with session.post(f"{BASE_URL}/favorites/{place_id}", headers=headers) as resp:
            print(f"Favorite Status: {resp.status}")

        # 3. Test Search Logic
        target_query = name.split()[0] # Search for first word of name
        print(f"\n--- Test 1: Search '{target_query}' (Should find in Library) ---")
        async with session.post(f"{BASE_URL}/place/search_candidates", json={"query": target_query}, headers=headers) as resp:
            data = await resp.json()
            candidates = data.get("candidates", [])
            found_library = False
            for c in candidates:
                print(f"  > {c['name']} [{c.get('source')}]")
                if c.get("source") == "library" and target_query.lower() in c["name"].lower():
                    found_library = True
            
            if found_library:
                print("SUCCESS: Found in Library.")
            else:
                print("FAIL: Did not find in Library.")

        print("\n--- Test 2: Search 'Eiffel Tower' (Should find new via Google) ---")
        # Use a very famous place that works without location
        async with session.post(f"{BASE_URL}/place/search_candidates", json={"query": "Eiffel Tower"}, headers=headers) as resp:
            print(f"Status: {resp.status}")
            if resp.status != 200:
                print(await resp.text())
            data = await resp.json()
            candidates = data.get("candidates", [])
            found_google = False
            for c in candidates:
                print(f"  > {c['name']} [{c.get('source')}]")
                if c.get("source") == "google":
                    found_google = True
            
            if found_google:
                print("SUCCESS: Found via Google.")
            else:
                print("FAIL: Did not find via Google (Candidates empty?).")

if __name__ == "__main__":
    asyncio.run(main())
