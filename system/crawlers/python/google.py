import os
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

def get_env_variable(variable_name):
    value = os.getenv(variable_name)
    if value is None:
        raise ValueError(f"Environment variable '{variable_name}' not set.")
    return value

def google_search(query, api_key, cx):
    base_url = "https://www.googleapis.com/customsearch/v1"

    params = {
        'q': query,
        'key': api_key,
        'cx': cx,
        
    }

    response = requests.get(base_url, params=params)
    print(response)

    print("Response status code:", response.status_code)
    try:
        response_json = response.json()
        print("Response JSON:", response_json)

        if response.status_code == 200:
            results = response_json.get('items', [])
            return results
        else:
            print(f"Failed to fetch Google search results. Status code: {response.status_code}")
            return None

    except ValueError as e:
        print(f"Error decoding JSON: {e}")
        return None

# Example usage
query_selector = input("Query (or press Enter if not available): ").strip()

query = query_selector
api_key = get_env_variable("google_api_key")
cx = get_env_variable("google_search_id")

search_results = google_search(query, api_key, cx)

if search_results:
    print("\nGoogle Search Results:")
    for i, result in enumerate(search_results, start=1):
        print(f"{i}. {result['title']}")
        print(f"   {result['link']}")
        print(f"   {result['snippet']}\n")
