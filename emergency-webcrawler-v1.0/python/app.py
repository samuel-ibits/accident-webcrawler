import requests
from bs4 import BeautifulSoup

# Function to print the page structure for inspection
def print_page_structure(url):
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        print(soup.prettify())
    else:
        print(f"Failed to fetch the webpage. Status code: {response.status_code}")

# Function to perform login and return a session
def login(username, password, login_url):
    session = requests.Session()
    
    login_payload = {
        'username': username,
        'password': password,
        # Add any other required form fields
    }
    
    # Perform the login
    session.post(login_url, data=login_payload)
    
    return session

# Function to scrape the website after login
def scrape_authenticated_website(session, url, time_selector, venue_selector, description_selector):
    response = session.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        time = soup.select_one(time_selector).text if time_selector else "Selector not provided"
        venue = soup.select_one(venue_selector).text if venue_selector else "Selector not provided"
        description = soup.select_one(description_selector).text if description_selector else "Selector not provided"

        return {
            'time': time,
            'venue': venue,
            'description': description
        }
    else:
        print(f"Failed to fetch the webpage. Status code: {response.status_code}")
        return None

# Example usage
url = "https://www.google.com"
login_url = url  # Update with the actual login URL
username = "your_username"
password = "your_password"

# Print the page structure for inspection
print_page_structure(url)

# Prompt user to enter selectors
time_selector = input("Enter selector for time (or press Enter if not available): ").strip()
venue_selector = input("Enter selector for venue (or press Enter if not available): ").strip()
description_selector = input("Enter selector for description (or press Enter if not available): ").strip()

# Perform login
session = login(username, password, login_url)

# Scrape website after login based on provided selectors
incident_details = scrape_authenticated_website(session, url, time_selector, venue_selector, description_selector)

if incident_details:
    print("\nIncident Details:")
    print("Time:", incident_details['time'])
    print("Venue:", incident_details['venue'])
    print("Description:", incident_details['description'])
