import pandas as pd
from ntscraper import Nitter

scraper = Nitter(0)

query = input("Enter the search query: ")
number = int(input("Enter the number of tweets: "))

tweets = scraper.get_tweets(query, mode='term', number=number)

final_tweets = []

for x in tweets['tweets']:
    data = [x['link'], x['text'], x['date']]
    final_tweets.append(data)

dat = pd.DataFrame(final_tweets, columns=['twitter_link', 'text', 'date'])
print(dat)
