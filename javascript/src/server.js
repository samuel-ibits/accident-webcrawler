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
const mongoose = require("mongoose");

puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.json());


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
      let searchUrl = `https://www.vanguardngr.com/?s=${query}&custom_search=1`;
      let pageNumber = 1;
     
      console.log(`Starting scraping from page: ${pageNumber}`);
     
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();
     
      await page.setUserAgent(userAgent);
     
      // Increase navigation timeout
      await page.goto(searchUrl, { timeout: 60000 });
     
      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());
     
      let reports = [];
     
      try {
         while (true) {
            console.log(`Scraping page: ${pageNumber}`);
     
            const html = await page.content();
            const $ = cheerio.load(html);
     
            // Extract the maximum number of pages from the page info
            const pageInfoText = $(".pagination-wrapper .pagination__numbers .page-numbers").last().text();
            const maxPages = parseInt(pageInfoText) || 1; // Use 1 if not found
     
            let accidentReports = $("article.entry-list-large");
     
            accidentReports.each((index, element) => {
              const accidentType = $(element).find(".entry-title a").text();
              const date = $(element).find(".entry-date").text().trim();
              const details = $(element).find(".entry-excerpt p").text();
     
              // Check if the report's date is within the specified range
              if (isDateInRange(date, startDate, endDate)) {
                // Add 'location: Nigeria' property for reports from 'vanguard' search base
                reports.push({ accidentType, date, details, location: "Nigeria" });
              }
            });
     
            // Check if there are more pages
            const nextPageButton = $(".pagination-wrapper .pagination__next a");
            if (nextPageButton.length === 0 || pageNumber >= maxPages) {
              console.log(`Finished scraping. Total reports found: ${reports.length}`);
              break;
            }
     
            // Navigate to the next page
            pageNumber++;
            searchUrl = `https://www.vanguardngr.com/page/${pageNumber}/?s=${query}&custom_search=1`;
            console.log(`Navigating to page: ${pageNumber}`);
            await page.goto(searchUrl, { timeout: 60000 });
            await page.waitForTimeout(randomDelay());
         }
      } catch (error) {
         console.error(`An error occurred during scraping: ${error.message}`);
         console.log(`Returning ${reports.length} reports scrapped so far.`);
      } finally {
         await browser.close();
      }
     
      if (reports.length === 0) {
         console.log("No results found.");
         return "No results found.";
      }
     
      console.log(`Returning ${reports.length} reports.`);
      return reports;
     }
     
     
     
    
   else if (searchBase === "thecurrent") {
      let searchUrl = `https://thecurrent.pk/?s=${query}`;
      let pageNumber = 1;

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

      // Extract the maximum number of pages from the page info
      const pageInfoText = $(
        ".jeg_navigation.jeg_pagination .page_info"
      ).text();
      const maxPages = parseInt(pageInfoText.split(" ").pop()) || 1; // Use 1 if not found

      let accidentReports = $(".jeg_post.jeg_pl_md_2.format-standard");

      // Check if there are more pages of results
      if (maxPages > 1) {
        const nextPageButton = $(
          ".jeg_navigation.jeg_pagination a.page_nav.next"
        );

        if (nextPageButton.length > 0) {
          pageNumber++;

          // Keep fetching results from the next pages
          while (pageNumber <= maxPages) {
            searchUrl = `https://thecurrent.pk/page/${pageNumber}/?s=${query}`;

            await page.goto(searchUrl, { timeout: 60000 });
            await page.waitForTimeout(randomDelay());

            const html = await page.content();
            const $ = cheerio.load(html);

            const newAccidentReports = $(
              ".jeg_post.jeg_pl_md_2.format-standard"
            );
            accidentReports = accidentReports.add(newAccidentReports);

            // Check if there are more pages
            const nextPageButton = $(
              ".jeg_navigation.jeg_pagination a.page_nav.next"
            );
            if (nextPageButton.length === 0) {
              break;
            }

            pageNumber++;
          }
        }
      }

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

      if (reports.length === 0) {
        return "No results found.";
      }

      return reports;
    }
    
    else if (searchBase === "punch") {
      console.log("Searching Punchng for", query);

      // Initialize array to hold the accident reports
      let reports = [];

      // Start scraping from page 1
      let pageNumber = 1;

      // Launch puppeteer browser
      const browser = await puppeteer.launch({ headless: true });
      console.log("Browser launched");

      try {
        // Open a new page
        const page = await browser.newPage();
        console.log("Page created");

        // Get a random user agent to simulate different browsers
        const userAgent = randomUseragent.getRandom();

        // Set the user agent
        await page.setUserAgent(userAgent);
        console.log("User agent set");

        // Initialize search URL
        const searchUrl = `https://punchng.com/?s=${query}`;

        // Visit the search page
        await page.goto(searchUrl, { timeout: 120000 });
        console.log("Search page loaded");

        // Wait for a random delay
        await page.waitForTimeout(randomDelay());

        // Get the HTML content
        let html = await page.content();

        // Load the HTML content using cheerio
        let $ = cheerio.load(html);

        // Extract the maximum page number from the pagination
        const maxPageInfo = $(".pagination")
          .find(".page-item:last-child")
          .prev();
        const maxPage = parseInt(maxPageInfo.text());
        console.log("Max page:", maxPage);

        // Start scraping the pages
        do {
          if (pageNumber > 1) {
            // Visit the next page
            await page.goto(
              `https://punchng.com/page/${pageNumber}/?s=${query}`,
              { timeout: 900000 }
            ); // Increased timeout to 5 minutes
            console.log(`Page ${pageNumber} loaded`);

            // Wait for the specific article element to be present on the page
            await page.waitForXPath("//article");

            // Update the HTML content for the new page
            html = await page.content();

            // Load the new HTML content using cheerio
            $ = cheerio.load(html);
          }

          $("article").each((index, element) => {
            // Iterate over each article on the current page
            const postContent = $(element).find(".post-content");

            // Extract the accident type
            const accidentType = postContent.find(".post-title a").text();

            // Extract the article link
            const link = postContent.find(".post-title a").attr("href");

            // Extract the raw date and convert it to a JavaScript Date object
            const rawDate = postContent.find(".post-date").text().trim();

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

            // Extract the details of the accident
            const details = postContent.find(".post-excerpt").text().trim();

            // Check if the date is within the specified range
            if (isDateInRange(date, startDate, endDate)) {
              // Push the extracted information into the reports array
              reports.push({
                accidentType,
                date,
                details,
                location: "Nigeria",
                link,
              });
            }
          });

          // Increment the page number
          pageNumber++;
        } while (pageNumber <= maxPage); // Continue until the last page is reached

        console.log("All pages scraped");
      } catch (error) {
        console.error(`Error: ${error.message}`);
      } finally {
        // Close the browser when done or if there's an error
        await browser.close();
        console.log("Browser closed");
      }

      // Display the number of results fetched so far
      console.log("Number of results fetched so far:", reports.length);

      // Return the array of reports
      return reports;
    } 
    
    else if (searchBase === "daily") {
      // Function to generate search URL for a given page
      const generateSearchUrl = (query, page) =>
        `https://dailytrust.com/search/#gsc.tab=0&gsc.q=${encodeURIComponent(
          query
        )}&gsc.sort=&gsc.page=${page}`;

      // Fetch the HTML content from the URL
      const url = generateSearchUrl(query, 1);
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(url, { timeout: 120000 });
      const html = await page.content();
      // Extract page count from the HTML
      const $ = cheerio.load(html);
      const cursorElement = $(".gsc-cursor");
      const pageElements = cursorElement.find(".gsc-cursor-page");

      // Construct an array of URLs for all pages to be fetched
      const urls = [];
      const pageCount = pageElements.length;
      for (let i = 1; i <= pageCount; i++) {
        urls.push(generateSearchUrl(query, i));
      }

      // Fetch all pages of search results in parallel using Promise.all()
      const promises = urls.map(async (url) => {
        // Navigate to the new URL using the existing page instance
        await page.goto(url, { timeout: 120000 });
        await page.waitForTimeout(randomDelay());

        // Load the HTML content of the page
        const html = await page.content();

        // Parse the HTML using cheerio
        const $ = cheerio.load(html);

        // Extract accident reports from the page
        const accidentReports = $(".gsc-webResult.gsc-result");

        // Initialize an empty array to store the reports
        let reports = [];

        // Iterate over each accident report and extract relevant information
        accidentReports.each((index, element) => {
          // Extract the accident type and link from the title element
          const titleElement = $(element).find(".gs-title a");
          const link = titleElement.attr("href");
          const accidentType = titleElement.text();

          // Extract the snippet element
          const snippetElement = $(element).find(".gs-snippet");

          // Extract the date using a regular expression
          const dateMatch = snippetElement
            .text()
            .match(/(\d{1,2} [a-zA-Z]+ \d{4})/);
          const date = dateMatch ? dateMatch[0] : null;

          // Extract the details after the <b>...</b> and remove the date
          const details = snippetElement
            .contents()
            .filter((_, el) => el.nodeType === 3)
            .text()
            .replace(date, "")
            .trim();

          // Check if the report's date is within the specified range
          if (isDateInRange(date, startDate, endDate)) {
            // Add the report to the reports array, including 'location: Nigeria'
            reports.push({
              accidentType,
              date,
              details,
              location: "Nigeria",
              link,
            });
          }
        });

        // Return the extracted reports from the current page
        return reports;
      });

      // Wait for all promises to resolve and flatten the results into a single array
      const allReports = await Promise.all(promises).then((results) => {
        return results.flat();
      });

      // Close the Puppeteer browser after fetching all pages
      await browser.close();

      if (allReports.length === 0) {
        return "No results found.";
      }

      return allReports;
    } 
    
    else if (searchBase === "guyana") {
      const generateSearchUrl = (query, pageNumber) =>
         `https://guyanatimesgy.com/page/${pageNumber}/?s=${query}`;
     
      // Initialize an empty array to store the reports
      let reports = [];
     
      // Start from page 1
      let pageNumber = 1;
     
      const browser = await puppeteer.launch({ headless: true });
     
      try {
         // Open the first page to extract the last page number
         const firstPageUrl = generateSearchUrl(query, pageNumber);
         const firstPage = await browser.newPage();
         await firstPage.goto(firstPageUrl, { timeout: 60000 });
         const firstPageContent = await firstPage.content();
         const $firstPage = cheerio.load(firstPageContent);
     
         // Extract the last page number from the pagination element
         const lastPageElement = $firstPage(".page-nav .last");
         const lastPageNumber = parseInt(lastPageElement.text(), 10);
     
         console.log(`Total pages: ${lastPageNumber}`);
     
         await firstPage.close();
     
         // Loop through all pages
         while (pageNumber <= lastPageNumber) {
           // Generate the search URL for the current page
           const searchUrl = generateSearchUrl(query, pageNumber);
           console.log(`Fetching data from: ${searchUrl}`);
     
           // Initialize a new Puppeteer page for each iteration of the loop
           const page = await browser.newPage();
     
           const userAgent = randomUseragent.getRandom();
           await page.setUserAgent(userAgent);
     
           try {
             await page.goto(searchUrl, { timeout: 60000 });
             console.log("Page loaded successfully.");
     
             await page.waitForTimeout(randomDelay());
             const html = await page.content();
             await page.close();
             console.log("Page content extracted successfully.");
     
             // Parse the HTML and extract the accident reports
             const $ = cheerio.load(html);
             const accidentReports = $(
               ".td_module_16.td_module_wrap.td-animation-stack"
             );
     
             accidentReports.each((index, element) => {
               // Move the 'date' declaration outside the loop
               let date;
     
               // Extract the accident details and add them to the 'reports' array
               const titleElement = $(element).find(".entry-title a");
               const link = titleElement.attr("href");
               const accidentType = titleElement.text();
               const dateElement = $(element).find(".td-post-date time");
               const rawDate = dateElement.attr("datetime");
     
               // Convert the raw date to a human-readable format
               date = new Date(rawDate).toLocaleDateString("en-US", {
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
     
             // Increment the page number for the next iteration
             pageNumber++;
           } catch (error) {
             console.error(`Error on page ${pageNumber}: ${error.message}`);
             // Close the page in case of error
             await page.close();
             // Break the loop to prevent further processing
             break;
           }
         }
     
         console.log("Scraping complete. Closing browser.");
      } catch (error) {
         console.error(`Error: ${error.message}`);
      } finally {
         await browser.close();
      }
     
      return reports;
     }
     
    
    else if (searchBase === "ewn") {
      const searchUrl = "https://www.ewn.co.za/search";

      console.log("Search URL defined");

      let reports = [];
      console.log("Reports array initialized");

      const browser = await puppeteer.launch({ headless: true });
      console.log("Browser launched successfully");

      let detailsPage; // Declare detailsPage outside the try block

      try {
        const page = await browser.newPage();
        console.log("New page created");

        const userAgent = randomUseragent.getRandom();
        await page.setUserAgent(userAgent);
        console.log("User agent set");

        const pageUrl = `${searchUrl}?page=1`; // Assuming the results are on the first page
        console.log(`Fetching data from: ${pageUrl}`);

        await page.goto(pageUrl, {
          waitUntil: "networkidle0",
          timeout: 120000,
        });
        console.log("Page loaded successfully");

        // Input the search query and wait for a few seconds before fetching results
        const searchInputSelector =
          ".flex-1.border-none.bg-surface-03.text-sm.font-medium.text-content-primary.outline-none";
        await page.type(searchInputSelector, query);
        console.log("Search query entered");

        // Adding a delay of 30 seconds (adjust as needed)
        await page.waitForTimeout(30000);

        console.log("Fetching results...");

        const resultsSelector =
          "article.grid.col-span-2.grid-cols-12.transition-colors";
        await page.waitForSelector(resultsSelector, { timeout: 120000 });
        console.log("Results loaded successfully");

        const html = await page.content();
        const $ = cheerio.load(html);

        const accidentReports = $(resultsSelector);
        console.log(`${accidentReports.length} accident reports found`);

        // Iterate over each report on the page
        for (let index = 0; index < accidentReports.length; index++) {
          // Extract and process details for each report
          const accidentType = $(accidentReports[index])
            .find("h3 a")
            .text()
            .trim();
          const detailsUrl = $(accidentReports[index])
            .find("h3 a")
            .attr("href");
          const link = "https://www.ewn.co.za/" + detailsUrl;

          // Open the link and extract the date and details
          try {
            detailsPage = await browser.newPage();
            await detailsPage.goto(link, {
              waitUntil: "networkidle0",
              timeout: 60000,
            });

            const dateHTML = await detailsPage.evaluate(() => {
              const dateSpan = document.querySelector(
                'div[data-v-369ee20f=""] > span:nth-child(2)'
              );
              const dateText = dateSpan ? dateSpan.textContent.trim() : "";
              const indexOfPipe = dateText.indexOf("|");

              // Check if pipe symbol exists in the date text
              if (indexOfPipe !== -1) {
                // Extract only the portion before the pipe symbol
                return dateText.slice(0, indexOfPipe).trim();
              }

              // If no pipe symbol is found, return the original date text
              return dateText;
            });

            const detailsHTML = await detailsPage.evaluate(
              () =>
                document.querySelector('article[data-v-369ee20f=""]').innerHTML
            );

            const date = dateHTML.trim();
            const details = cheerio
              .load(detailsHTML)("p:first-child")
              .text()
              .trim();

            if (isDateInRange(date, startDate, endDate)) {
              // Add 'location: Nigeria' property for reports from 'vanguard' search base
               // Push the extracted information into the reports array
            reports.push({
              accidentType,
              date,
              details,
              location: "South Africa", // Adjusted location based on the website
              link,
            });
            }

            console.log(`Report ${index + 1} processed and added to the array`);
          } catch (err) {
            console.error(`Error processing report ${index + 1}: ${err}`);
          } finally {
            // Close the details page to avoid potential memory leaks
            if (detailsPage) {
              await detailsPage.close();
            }
          }
        }

        console.log("Scraping complete. Closing browser");
      } catch (error) {
        console.error(`Error: ${error.message}`);
      } finally {
        await browser.close();
        console.log("Browser closed");
      }

      console.log("Returning 'reports' array");
      return reports;
    }

    else if (searchBase === "sowetanlive") {
      console.log("Searching on SowetanLIVE...");
    
      const searchUrl = "https://www.sowetanlive.co.za/";
      const maxRetries = 3;
      let currentRetry = 0;
    
      let reports = [];
    
      while (currentRetry < maxRetries) {
        const browser = await puppeteer.launch({ headless: true });
        console.log("Browser launched");
    
        try {
          const page = await browser.newPage();
          console.log("New page created");
    
          const userAgent = randomUseragent.getRandom();
          console.log("Using user agent:", userAgent);
    
          await page.setUserAgent(userAgent);
          console.log("User agent set");
    
          try {
            // Navigate to the search page
            await page.goto(searchUrl, { timeout: 1300000, waitUntil: "networkidle0" });
            console.log("Navigated to search page");
    
            // Wait for the search icon to be present
            await page.waitForSelector('#nav-search');
    
            // Click the search icon to make the search input visible
            await page.click('#nav-search a');
            console.log("Clicked search icon");
    
            // Wait for the search input to be visible
            await page.waitForSelector('.field input[type="text"][placeholder="Search SowetanLIVE"]');
    
            // Wait for some time to simulate human-like behavior
            await page.waitForTimeout(randomDelay());
            console.log("Simulated human-like delay");
    
            // Find the search input within the div with class "field"
            const searchInputSelector = '.field input[type="text"][placeholder="Search SowetanLIVE"]';
            await page.type(searchInputSelector, query);
            console.log("Typed query into search input");
            await page.keyboard.press("Enter");
            console.log("Pressed Enter to submit search");
    
            while (true) {
              console.log("--- Starting new page of results ---");
              // Wait for the results to load
              const resultsSelector = ".results .result-set a.result";
              await page.waitForSelector(resultsSelector, {
                timeout: 120000,
                visible: true,
              });
              console.log("Results loaded");
    
              // Fetch the results from the specified HTML structure
              const newReports = await page.evaluate(
                (isDateInRangeString, startDate, endDate, resultsSelector) => {
                  const isDateInRange = new Function(
                    "return " + isDateInRangeString
                  )();
                  const newReports = [];
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
                      newReports.push({
                        accidentType,
                        date,
                        details,
                        location: "South Africa",
                        link: `https://www.sowetanlive.co.za${link}`,
                      });
                    }
                  });
                  return newReports;
                },
                isDateInRange.toString(),
                startDate,
                endDate,
                resultsSelector
              );
              console.log("Fetched", newReports.length, "new reports");
              reports.push(...newReports);
    
              // Dynamically find the next "More" button based on its current `rel` value
              let nextButton;
              let relValue = 1; // Start with the initial rel value
    
              while ((nextButton = await page.$('a[rel="' + (relValue + 1) + '"]'))) {
                console.log("Clicking 'More' button with rel=", relValue + 1);
                await nextButton.click();
                relValue++;
    
                // Wait for the results to load after clicking "More"
                const resultsSelector = ".results .result-set a.result";
                await page.waitForSelector(resultsSelector, {
                  timeout: 120000,
                  visible: true,
                });
                console.log("Results loaded after clicking 'More'");
    
                // Fetch the new results from the specified HTML structure
                const newReports = await page.evaluate(
                  (isDateInRangeString, startDate, endDate, resultsSelector) => {
                    const isDateInRange = new Function(
                      "return " + isDateInRangeString
                    )();
                    const newReports = [];
                    const resultElements = document.querySelectorAll(resultsSelector);
                    resultElements.forEach((element) => {
                      const link = element.getAttribute("href");
                      const accidentType =
                        element.querySelector("h2")?.textContent?.trim() || "";
                      const rawDate =
                        element.querySelector(".date-stamp")?.textContent?.trim() ||
                        "";
                      const details =
                        element.querySelector("p")?.textContent?.trim() || "";
    
                      const date = reverseTimeDifference(rawDate);
    
                      if (isDateInRange(date, startDate, endDate)) {
                        newReports.push({
                          accidentType,
                          date,
                          details,
                          location: "South Africa",
                          link: `https://www.sowetanlive.co.za${link}`,
                        });
                      }
                    });
                    return newReports;
                  },
                  isDateInRange.toString(),
                  startDate,
                  endDate,
                  resultsSelector
                );
                console.log(
                  "Fetched",
                  newReports.length,
                  "new reports after clicking 'More'"
                );
                reports.push(...newReports);
              }
    
              // If no more "More" buttons are found, exit the loop
              if (!nextButton) {
                console.log("No more 'More' buttons found");
                break;
              }
            }
    
            // Close the browser
            await browser.close();
            return reports;
          } catch (error) {
            console.error(`Error during SowetanLIVE search: ${error.message}`);
            currentRetry++;
          }
        } finally {
          // Make sure to close the browser in case of errors
          if (browser) {
            await browser.close();
          }
        }
      }
    
      console.error(`Max retries (${maxRetries}) reached. Unable to perform SowetanLIVE search.`);
      return reports;
    }
    
    else if (searchBase === "alive") {
      const generateSearchUrl = (query) =>
        `https://www.arrivealive.mobi/search?q=${encodeURIComponent(query)}`;

      const browser = await puppeteer.launch({ headless: true });
      console.log("Browser launched successfully.");
      const page = await browser.newPage();
      console.log("New page created.");
      const userAgent = randomUseragent.getRandom();

      await page.setUserAgent(userAgent);
      console.log(`User agent set to: ${userAgent}`);

      // Increase navigation timeout
      await page.setDefaultNavigationTimeout(300000); // 5 minutes timeout

      let reports = [];
      let currentPage = 1;

      console.log(`Navigating to the search page...`);
      const searchUrl = generateSearchUrl(query);
      await page.goto(searchUrl);
      console.log(`Navigated to the search page.`);

      while (true) {
        // Wait for some time to simulate human-like behavior
        console.log("Waiting for a moment...");
        await page.waitForTimeout(randomDelay());

        const html = await page.content();
        const $ = cheerio.load(html);

        const accidentReports = $(".list-group-item");
        console.log(
          `Found ${accidentReports.length} accident reports on the current page.`
        );

        for (const element of accidentReports) {
          const titleElement = $(element).find("h4 a");
          const link = titleElement.attr("href");
          const accidentType = titleElement.text();
          const bylineElement = $(element).find(".byline");

          // Extract details from the first <p> element
          const detailsElement = $(element).find("p").first();
          let details = detailsElement.text().trim();

          // Extract the date after the first <b>...</b>
          const dateMatch = detailsElement
            .find(".byline")
            .text()
            .match(/(\w{3} \d{1,2}, \d{4})/);

          const date = dateMatch ? dateMatch[0] : null;

          // Check if the report's date is within the specified range
          if (isDateInRange(date, startDate, endDate)) {
            // Remove the date and dots from details
            if (date) {
              details = details.replace(date, "").replace("...", "").trim();
            }

            // Open the linked page to fetch the date
            try {
              const linkedPage = await browser.newPage();
              await linkedPage.goto(`https://www.arrivealive.mobi${link}`);
              const linkedDate = await linkedPage.$eval(
                ".byline",
                (element) => element.textContent.trim().split(" - ")[0]
              );
              await linkedPage.close();

              // Add 'location: Nigeria' property for reports from 'daily' search base
           


              if (isDateInRange(date, startDate, endDate)) {
                // Add 'location: Nigeria' property for reports from 'vanguard' search base
                reports.push({
                  accidentType,
                  date: linkedDate, // Use date fetched from the linked page
                  details,
                  location: "Nigeria",
                  link: `https://www.arrivealive.mobi${link}`,
                  currentPage,
                });
              }
            } catch (error) {
              console.error("Error fetching date:", error);
            }
          }
        }

        // Check if there's a 'Next' button on the page
        const nextPageButton = await page.$("a.pull-right");

        if (nextPageButton) {
          console.log(`Navigating to the next page...`);

          // Get the current page number
          const currentPageNumber = await page.evaluate(() => {
            const nextPageButton = document.querySelector("a.pull-right");
            return nextPageButton
              ? nextPageButton.getAttribute("data-page")
              : null;
          });

          // Click the "Next" button
          await nextPageButton.click();

          try {
            // Wait for the page number to change with a longer timeout
            await page.waitForFunction(
              (oldPageNumber) => {
                const nextPageButton = document.querySelector("a.pull-right");
                const newPageNumber = nextPageButton
                  ? nextPageButton.getAttribute("data-page")
                  : null;
                return newPageNumber && newPageNumber !== oldPageNumber;
              },
              { timeout: 120000 },
              currentPageNumber
            ); // 2 minutes timeout
          } catch (error) {
            console.log("Timeout reached. Returning scraped reports so far.");
            break; // Break out of the loop when timeout is reached
          }

          console.log(`Navigated to next page.`);
          currentPage++;
        } else {
          console.log("No more pages to scrape.");
          break;
        }
      }

      console.log("Browser closed.");
      await browser.close();

      return reports;
    } 
    
    else if (searchBase === "africanews") {
      const searchUrl = `https://www.africanews.com/search/${encodeURIComponent(query)}`;
     
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      const userAgent = randomUseragent.getRandom();
     
      await page.setUserAgent(userAgent);
     
      // Navigate to the search page
      await page.goto(searchUrl, { timeout: 120000 });
     
      // Wait for some time to simulate human-like behavior
      await page.waitForTimeout(randomDelay());
     
      // Function to extract data from each article
      const extractData = async () => {
         const data = await page.evaluate((startDate, endDate) => {
           const articles = document.querySelectorAll(".teaser.news");
           const extractedData = [];
     
           // Define the isDateInRange function directly within the scope
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
     
           articles.forEach((article) => {
             const linkElement = article.querySelector("h2.teaser__title.u-mt0 a");
             const link = linkElement ? linkElement.getAttribute("href") : null;
             const accidentType = linkElement ? linkElement.textContent : null;
     
             const descriptionElement = article.querySelector("p.teaser__description a");
             const details = descriptionElement ? descriptionElement.textContent.trim() : null;
     
             const dateElement = article.querySelector("time.article__date");
             const dateString = dateElement.getAttribute("datetime"); // Get the original date string
     
             // Convert the date string to the desired format "January 9, 2023"
             const options = { month: "long", day: "numeric", year: "numeric" }; // Customize format if needed
             const formatter = new Intl.DateTimeFormat("en-US", options);
             const date = formatter.format(new Date(dateString));
     
             // Check if the report's date is within the specified range
             if (isDateInRange(date, startDate, endDate)) {
               extractedData.push({
                 link: link ? `https://www.africanews.com${link}` : null,
                 accidentType,
                 details,
                 date,
                 location: "Location",
               });
             }
           });
     
           return extractedData;
         }, startDate, endDate); // Pass startDate and endDate as arguments
     
         return data;
      };
      // Extract data from the current page
      const reports = await extractData();
     
      // Close the browser
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