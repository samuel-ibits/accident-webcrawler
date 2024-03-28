chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
   if (request.action === 'scrapeAllTweets') {
       const tweets = Array.from(document.querySelectorAll('span.css-1qaijid.r-bcqeeo.r-qvutc0.r-poiln3')).map(tweet => {
           const text = tweet.textContent.trim();
           // Adjusted to correctly extract the date from the new structure
           const dateElement = tweet.closest('div[data-testid="User-Name"]').querySelector('a[aria-label] time');
           const date = dateElement ? dateElement.getAttribute('datetime') : 'Date not found';
           return {text, date};
       });

       const results = {
           count: tweets.length,
           texts: tweets.map(tweet => `${tweet.date}: ${tweet.text}`)
       };

       chrome.runtime.sendMessage({ action: 'displayResults', results: results });
   }
});
