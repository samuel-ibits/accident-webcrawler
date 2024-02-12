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
const port = 3001;

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
      maxPages = parseInt(pageInfoText.split(" ").pop()) || maxPages; // Use the default if not found

      let accidentReports = $(".jeg_post.jeg_pl_md_2.format-standard");

      // Check if there are more pages of results
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

          const newAccidentReports = $(".jeg_post.jeg_pl_md_2.format-standard");
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
      console.log("Searching Punchng for", query);

      // Initialize array to hold the accident reports
      let reports = [];

      // Start scraping from page 1
      let pageNumber = 1;

      // Launch puppeteer browser
      const browser = await puppeteer.launch({ headless: true });
      console.log("Browser launched");

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
      const maxPageInfo = $(".pagination").find(".page-item:last-child").prev();
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

      // Close the browser when done
      await browser.close();

      console.log("Browser closed");

      // Return the array of reports
      return reports;
    } else if (searchBase === "daily") {
      // Function to generate search URL for a given page
      const generateSearchUrl = (query, page) =>
        `https://dailytrust.com/search/#gsc.tab=0&gsc.q=${encodeURIComponent(
          query
        )}&gsc.sort=&gsc.page=${page}`;

      // Fetch the HTML content from the URL
      const url = `https://dailytrust.com/search/#gsc.tab=0&gsc.q=${encodeURIComponent(
        query
      )}&gsc.sort=`;
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
        // Launch a headless Puppeteer browser and create a new page
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Set a random user agent to simulate human-like behavior
        const userAgent = randomUseragent.getRandom();
        await page.setUserAgent(userAgent);

        // Increase navigation timeout to avoid timeouts on slow pages
        await page.goto(url, { timeout: 120000 });

        // Wait for some time to simulate human-like behavior
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

        // Close the Puppeteer browser
        browser.close();

        // Return the extracted reports from the current page
        return reports;
      });

      // Wait for all promises to resolve and flatten the results into a single array
      return Promise.all(promises).then((results) => {
        return results.flat();
      });
    } else if (searchBase === "guyana") {
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
        }

        console.log("Scraping complete. Closing browser.");
      } catch (error) {
        console.error(`Error: ${error.message}`);
      } finally {
        await browser.close();
      }

      return reports;
    } else if (searchBase === "ewn") {
      const generateSearchUrl = (query, pageNumber) =>
        `https://ewn.co.za/searchresultspage?searchTerm=${query}&type=All&sortBy=Relevance&pagenumber=${pageNumber}&perPage=18`;

      console.log("generateSearchUrl function defined");

      let reports = [];
      console.log("reports array initialized");

      let pageNumber = 1;
      console.log("pageNumber variable initialized with value 1");

      const browser = await puppeteer.launch({ headless: true });
      console.log("Browser launched successfully");

      try {
        console.log("Starting while loop");
        while (true) {
          console.log(`Page number: ${pageNumber}`);
          const searchUrl = generateSearchUrl(query, pageNumber);
          console.log(`Fetching data from: ${searchUrl}`);

          const page = await browser.newPage();
          console.log("New page created");

          const userAgent = randomUseragent.getRandom();
          await page.setUserAgent(userAgent);
          console.log("User agent set");

          await page.goto(searchUrl, { timeout: 120000 });
          console.log("Page loaded successfully");

          await page.waitForTimeout(randomDelay());
          const html = await page.content();
          await page.close();
          console.log("Page content extracted successfully");

          const $ = cheerio.load(html);
          const accidentReports = $(".article-short");
          console.log(`${accidentReports.length} accident reports found`);

          accidentReports.each(async (index, element) => {
            console.log(`Processing accident report ${index + 1}`);
            // Extract the accident details and add them to the 'reports' array
            const titleElement = $(element).find(".article-short h4");
            const linkElement = $(element).find(".article-short a");
            const link = linkElement.attr("href");
            const accidentType = titleElement.text();
            const dateElement = $(element).find(".byline abbr");
            const rawDate = dateElement.attr("title");

            console.log(`accidentType: ${accidentType}`);
            console.log(`link: ${link}`);

            // Convert the raw date to a human-readable format
            const date = new Date(rawDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });

            console.log(`date: ${date}`);

            // Extract details by opening the link
            const details = await getDetailsFromLink(link);

            console.log(`details: ${details}`);

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

              console.log(`Added report ${index + 1} to 'reports' array`);
            }
          });

          // Check if there is a next page
          const nextPageLink = $(".pagination.right li.arrow a:eq(1)");

          if (!nextPageLink.length) {
            console.log("No more pages. Exiting");
            break;
          }

          // Increment the page number for the next iteration
          pageNumber++;
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
    
      let reports = [];
    
      while (true) {
        // Wait for the results to load
        const resultsSelector = ".results .result-set a.result";
        await page.waitForSelector(resultsSelector, {
          timeout: 120000,
          visible: true,
        });
    
        // Fetch the results from the specified HTML structure
        const newReports = await page.evaluate(
          (isDateInRangeString, startDate, endDate, resultsSelector) => {
            const isDateInRange = new Function("return " + isDateInRangeString)();
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
    
        reports.push(...newReports);
    
        // Click the "More" button
        const moreButton = await page.$('a[rel="2"]');
        if (moreButton) {
          await moreButton.click();
        } else {
          break; // No more "More" button found, exit the loop
        }
      }
    
      // Close the browser
      await browser.close();
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
              reports.push({
                accidentType,
                date: linkedDate, // Use date fetched from the linked page
                details,
                location: "Nigeria",
                link: `https://www.arrivealive.mobi${link}`,
                currentPage,
              });
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
            return nextPageButton ? nextPageButton.getAttribute("data-page") : null;
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
