const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");
const axios = require("axios");
const cheerio = require("cheerio");
const tough = require("tough-cookie");
const rateLimit = require("axios-rate-limit");
const { randomDelay } = require("random-delay");

puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});

// Set up cookies and user-agent for Axios
const cookieJar = new tough.CookieJar();

const http = rateLimit(axios.create(), {
  maxRequests: 1,
  perMilliseconds: 1000,
});

async function searchAndScrape(searchBase, query, startDate, endDate) {
  try {
    let searchUrl = "";

    if (searchBase === "vanguard") {
      searchUrl = `https://thecurrent.pk/?s=${query}`;

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();

      await page.setUserAgent(userAgent);

      // Increase navigation timeout
      await page.goto(searchUrl, { timeout: 60000 });

      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());

      const html = await page.content();
      const $ = cheerio.load(html);

      const accidentReports = $(".jeg_post.jeg_pl_md_2.format-standard");

      let reports = [];

      accidentReports.each((index, element) => {
        const accidentType = $(element).find(".jeg_post_title").text();
        const date = $(element).find(".jeg_meta_date").text();
        const details = $(element).find(".jeg_post_excerpt p").text();

        // Check if the report's date is within the specified range
        if (isDateInRange(date, startDate, endDate)) {
          // Add 'location: Nigeria' property for reports from 'vanguard' search base
          reports.push({ accidentType, date, details, location: "Nigeria" });
        }
      });

      await browser.close();

      return reports;
    } else if (searchBase === "punch") {
      searchUrl = `https://punchng.com/?s=${query}`;

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();

      await page.setUserAgent(userAgent);

      // Increase navigation timeout
      await page.goto(searchUrl, { timeout: 120000 });

      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());

      const html = await page.content();
      const $ = cheerio.load(html);

      const accidentReports = $("article");

      let reports = [];

      accidentReports.each((index, element) => {
        const postContent = $(element).find(".post-content");
        const link = postContent.find(".post-title a").attr("href");
        const accidentType = postContent.find(".post-title a").text();
        const date = postContent.find(".post-date").text();
        const details = postContent.find(".post-excerpt").text();

        // Check if the report's date is within the specified range
        if (isDateInRange(date, startDate, endDate)) {
          // Add 'location: Nigeria' property for reports from 'punch' search base
          reports.push({
            accidentType,
            date,
            details,
            location: "Nigeria",
            link,
          });
        }
      });

      await browser.close();

      return reports;
    }
    else if (searchBase === "daily") {
      const generateSearchUrl = (query) => `https://dailytrust.com/search/#gsc.tab=0&gsc.q=${encodeURIComponent(query)}&gsc.sort=`;
    
      const searchUrl = generateSearchUrl(query);
    
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();
    
      await page.setUserAgent(userAgent);
    
      // Increase navigation timeout
      await page.goto(searchUrl, { timeout: 120000 });
    
      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());
    
      const html = await page.content();
      const $ = cheerio.load(html);
    
      const accidentReports = $(".gsc-webResult.gsc-result");
    
      let reports = [];
    
      accidentReports.each((index, element) => {
        const titleElement = $(element).find(".gs-title a");
        const link = titleElement.attr("href");
        const accidentType = titleElement.text();
        const snippetElement = $(element).find(".gs-snippet");
    
        // Extract the date using a regular expression
        const dateMatch = snippetElement.text().match(/(\d{1,2} [a-zA-Z]+ \d{4})/);
        const date = dateMatch ? dateMatch[0] : null;
    
        // Extract details after the <b>...</b> and remove the date
        const details = snippetElement.contents().filter((_, el) => el.nodeType === 3).text().replace(date, '').trim();
    
        // Check if the report's date is within the specified range
        if (isDateInRange(date, startDate, endDate)) {
          // Add 'location: Nigeria' property for reports from 'daily' search base
          reports.push({
            accidentType,
            date,
            details,
            location: "Nigeria",
            link,
          });
        }
      });
    
      await browser.close();
    
      return reports;
    }
    else if (searchBase === "guyana") {
      const generateSearchUrl = (query) => `https://guyanatimesgy.com/?s=${query}`;
    
      const searchUrl = generateSearchUrl(query);
    
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();
    
      await page.setUserAgent(userAgent);
    
      // Increase navigation timeout
      await page.goto(searchUrl, { timeout: 120000 });
    
      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());
    
      const html = await page.content();
      const $ = cheerio.load(html);
    
      const accidentReports = $(".td_module_16.td_module_wrap.td-animation-stack");
    
      let reports = [];
    
      accidentReports.each((index, element) => {
        const titleElement = $(element).find(".entry-title a");
        const link = titleElement.attr("href");
        const accidentType = titleElement.text();
        const dateElement = $(element).find(".td-post-date time");
        const rawDate = dateElement.attr("datetime");
    
        // Convert the raw date to a human-readable format
        const date = new Date(rawDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
        // Extract details
        const details = $(element).find(".td-excerpt").text().trim();
    
        // Check if the report's date is within the specified range
        if (isDateInRange(date, startDate, endDate)) {
          // Add 'location: Guyana' property for reports from 'guyana' search base
          reports.push({
            accidentType,
            date,
            details,
            location: "Guyana",
            link,
          });
        }
      });
    
      await browser.close();
    
      return reports;
    }
    
    
    
    
     else {
      return [];
    }
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
}

function isDateInRange(reportDate, startDate, endDate) {
  const reportDateTime = new Date(reportDate);
  const startDateTime = startDate ? new Date(startDate) : null;
  const endDateTime = endDate ? new Date(endDate) : null;

  // Check if the report's date is within the specified range
  return (
    (!startDateTime || reportDateTime >= startDateTime) &&
    (!endDateTime || reportDateTime <= endDateTime)
  );
}

app.get("/search", async (req, res) => {
  const searchBase = req.query.searchBase;
  const searchQuery = req.query.query;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const reports = await searchAndScrape(
    searchBase,
    searchQuery,
    startDate,
    endDate
  );

  res.json(reports);
});
