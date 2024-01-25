const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");
const axios = require("axios");
const cheerio = require("cheerio");
const tough = require("tough-cookie");
const rateLimit = require("axios-rate-limit");
const { randomDelay } = require("random-delay");
const moment = require("moment");

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
        const rawDate = postContent.find(".post-date").text();
        const details = postContent.find(".post-excerpt").text();
        function reverseTimeDifference(relativeTimeString) {
          const currentDate = new Date();

          const match = relativeTimeString.match(/(\d+)\s+(\w+)\s+ago/);

          if (!match) {
            // Invalid or unsupported format
            return null;
          }

          const [, amount, unit] = match;
          const elapsedMilliseconds = calculateElapsedMilliseconds(
            amount,
            unit
          );

          const absoluteDate = new Date(
            currentDate.getTime() - elapsedMilliseconds
          );

          // Format the absolute date
          const formattedDate = absoluteDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          return formattedDate;
        }
        function calculateElapsedMilliseconds(amount, unit) {
          const unitsInMilliseconds = {
            second: 1000,
            minute: 60 * 1000,
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000, // Assuming a month is 30 days
            year: 365 * 24 * 60 * 60 * 1000, // Assuming a year is 365 days
          };

          // Convert unit to lowercase and remove any trailing 's'
          const normalizedUnit = unit.toLowerCase().replace(/s$/, "");

          return amount * (unitsInMilliseconds[normalizedUnit] || 0);
        }

        const date = reverseTimeDifference(rawDate);

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
    } else if (searchBase === "daily") {
      const generateSearchUrl = (query) =>
        `https://dailytrust.com/search/#gsc.tab=0&gsc.q=${encodeURIComponent(
          query
        )}&gsc.sort=`;

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
        const dateMatch = snippetElement
          .text()
          .match(/(\d{1,2} [a-zA-Z]+ \d{4})/);
        const date = dateMatch ? dateMatch[0] : null;

        // Extract details after the <b>...</b> and remove the date
        const details = snippetElement
          .contents()
          .filter((_, el) => el.nodeType === 3)
          .text()
          .replace(date, "")
          .trim();

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
    } else if (searchBase === "guyana") {
      const generateSearchUrl = (query) =>
        `https://guyanatimesgy.com/?s=${query}`;

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

      const accidentReports = $(
        ".td_module_16.td_module_wrap.td-animation-stack"
      );

      let reports = [];

      accidentReports.each((index, element) => {
        const titleElement = $(element).find(".entry-title a");
        const link = titleElement.attr("href");
        const accidentType = titleElement.text();
        const dateElement = $(element).find(".td-post-date time");
        const rawDate = dateElement.attr("datetime");

        // Convert the raw date to a human-readable format
        const date = new Date(rawDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

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
    } else if (searchBase === "ewn") {
      const generateSearchUrl = (query) =>
        `https://ewn.co.za/SearchResultsPage?searchTerm=${query}`;

      // Update the search URL
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

      const accidentReports = $(".article-short");

      let reports = [];

      // Define a function to extract details from a given link
      const getDetailsFromLink = async (link) => {
        const page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(randomDelay());

        const detailsElement = await page.$(".lead");
        const details = detailsElement
          ? await page.evaluate((el) => el.textContent.trim(), detailsElement)
          : "";

        await page.close();

        return details;
      };

      // Iterate through each accident report
      for (const element of accidentReports) {
        const titleElement = $(element).find(".article-short h4");
        const linkElement = $(element).find(".article-short a");
        const link = linkElement.attr("href");
        const accidentType = titleElement.text();
        const dateElement = $(element).find(".byline abbr");
        const rawDate = dateElement.attr("title");

        // Convert the raw date to a human-readable format
        const date = new Date(rawDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        // Extract details by opening the link
        const details = await getDetailsFromLink(link);

        // Check if the report's date is within the specified range
        if (isDateInRange(date, startDate, endDate)) {
          // Add 'location: South Africa' property for reports from 'ewn' search base
          reports.push({
            accidentType,
            date,
            details,
            location: "South Africa",
            link,
          });
        }
      }

      await browser.close();

      return reports;
    } else if (searchBase === "sowetanlive") {
      const searchUrl = "https://www.sowetanlive.co.za/";

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();

      await page.setUserAgent(userAgent);

      // Navigate to the search page
      await page.goto(searchUrl, { timeout: 120000 });

      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());

      // Find the search input within the div with class "field"
      const searchInputSelector =
        '.field input[type="text"][placeholder="Search SowetanLIVE"]';
      await page.type(searchInputSelector, query);
      await page.keyboard.press("Enter");

      // Wait for the results to load
      const resultsSelector = ".results .result-set a.result";
      await page.waitForSelector(resultsSelector, {
        timeout: 120000,
        visible: true,
      });

      // Fetch the results from the specified HTML structure
      const reports = await page.evaluate(
        (isDateInRangeString, startDate, endDate, resultsSelector) => {
          const isDateInRange = new Function('return ' + isDateInRangeString)();
          const reports = [];
          const resultElements = document.querySelectorAll(resultsSelector);
          resultElements.forEach((element) => {
            const link = element.getAttribute("href");
            const accidentType =
              element.querySelector("h2")?.textContent?.trim() || "";
            const rawDate =
              element.querySelector(".date-stamp")?.textContent?.trim() || "";
            const details =
              element.querySelector("p")?.textContent?.trim() || "";

            function reverseTimeDifference(relativeTimeString) {
              const currentDate = new Date();

              const match = relativeTimeString.match(/(\d+)\s+(\w+)\s+ago/);

              if (!match) {
                // Invalid or unsupported format
                return null;
              }

              const [, amount, unit] = match;
              const elapsedMilliseconds = calculateElapsedMilliseconds(
                amount,
                unit
              );

              const absoluteDate = new Date(
                currentDate.getTime() - elapsedMilliseconds
              );

              // Format the absolute date
              const formattedDate = absoluteDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return formattedDate;
            }
            function calculateElapsedMilliseconds(amount, unit) {
              const unitsInMilliseconds = {
                second: 1000,
                minute: 60 * 1000,
                hour: 60 * 60 * 1000,
                day: 24 * 60 * 60 * 1000,
                week: 7 * 24 * 60 * 60 * 1000,
                month: 30 * 24 * 60 * 60 * 1000, // Assuming a month is 30 days
                year: 365 * 24 * 60 * 60 * 1000, // Assuming a year is 365 days
              };

              // Convert unit to lowercase and remove any trailing 's'
              const normalizedUnit = unit.toLowerCase().replace(/s$/, "");

              return amount * (unitsInMilliseconds[normalizedUnit] || 0);
            }

            const date = reverseTimeDifference(rawDate);

            if (isDateInRange(date, startDate, endDate)) {
              reports.push({
                accidentType,
                date,
                details,
                location: "South Africa",
                link: `https://www.sowetanlive.co.za${link}`,
              });
            }
          });
          return reports;
        },
        isDateInRange.toString(),
        startDate,
        endDate,
        resultsSelector
      );

      // Close the browser
      await browser.close();
      console.log(reports);
      return reports;
    } 
    else if (searchBase === "alive") {
      const generateSearchUrl = (query) =>
        `https://www.arrivealive.mobi/search?q=${encodeURIComponent(query)}`;
    
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
    
      const accidentReports = $(".list-group-item");
    
      let reports = [];
    
      accidentReports.each((index, element) => {
        const titleElement = $(element).find("h4 a");
        const link = titleElement.attr("href");
        const accidentType = titleElement.text();
        const bylineElement = $(element).find(".byline");
    
        // Extract details from the first <p> element
        const detailsElement = $(element).find("p").first();
        let details = detailsElement.text().trim();
    
        // Extract the date after the first <b>...</b>
        const dateMatch = detailsElement.contents().filter(function () {
          return this.nodeType === 3; // Node.TEXT_NODE
        }).text().match(/(\w{3} \d{1,2}, \d{4})/);
    
        const date = dateMatch ? dateMatch[0] : null;
    
        // Check if the report's date is within the specified range
        if (isDateInRange(date, startDate, endDate)) {
          // Remove the date and dots from details
          if (date) {
            details = details.replace(date, "").replace("...", "").trim();
          }
    
          // Add 'location: Nigeria' property for reports from 'daily' search base
          reports.push({
            accidentType,
            date,
            details,
            location: "Nigeria",
            link: `https://www.arrivealive.mobi${link}`,
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
