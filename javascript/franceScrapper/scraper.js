const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFrance24(searchQuery) {
  try {
    const response = await axios.get(`https://www.france24.com/en/search?query=${encodeURIComponent(searchQuery)}`);
    
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      
      // Modify this selector based on the structure of the HTML on the website
      const headlines = $('h2[class="article__title"]');
      
      // Output the headlines to the console
      headlines.each((index, element) => {
        const headlineText = $(element).text().trim();
        console.log(`Headline ${index + 1}: ${headlineText}`);
      });
    } else {
      console.error('Failed to fetch data from France24');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Scraping with a search query
const searchQuery = 'your_search_query_here';
scrapeFrance24(searchQuery);
