import requests
import json

# First, register a new user to get a token
register_url = "http://127.0.0.1:8000/users/"
register_data = {
    "email": "testuser@example.com",
    "password": "testpassword",
    "first_name": "Test",
    "last_name": "User",
}
try:
    register_response = requests.post(register_url, json=register_data)
    print(f"Register response: {register_response.status_code}")
except requests.exceptions.ConnectionError as e:
    print(f"Connection error: {e}")
    print("Please make sure the application is running.")
    exit()


# Then, get a token for the new user
token_url = "http://127.0.0.1:8000/users/token"
token_data = {"username": "testuser@example.com", "password": "testpassword"}
token_response = requests.post(token_url, data=token_data)
token = token_response.json()["access_token"]
print(f"Token response: {token_response.status_code}")


# Now, call the analyze endpoint with the token and the URL
analyze_url = "http://127.0.0.1:8000/place/analyze"
headers = {"Authorization": f"Bearer {token}"}
analyze_data = {
    "url": "https://www.google.com/maps/place/Line+Brew+Astana/@51.1627719,71.4111845,893m/data=!3m1!1e3!4m17!1m10!3m9!1s0x424586d22471a869:0x4bddf93815267428!2z0JPQvtGB0YLQuNC90LjRhtCwINCQ0LvRgtGL0L0g0J7RgNC00LA!5m2!4m1!1i2!8m2!3d51.1620027!4d71.424337!16s%2Fg%2F1vs5v7zw!3m5!1s0x424586d097cbeff7:0x84bb0fdfcd0a550d!8m2!3d51.163646!4d71.416014!16s%2Fg%2F1tdytx__?entry=ttu&g_ep=EgoyMDI1MTIwNy4wIKXMDSoASAFQAw%3D%3D",
    "limit": 10,
}
analyze_response = requests.post(analyze_url, headers=headers, json=analyze_data)
print(f"Analyze response status code: {analyze_response.status_code}")
print(
    f"Analyze response body: {json.dumps(analyze_response.json(), indent=2, ensure_ascii=False)}"
)
