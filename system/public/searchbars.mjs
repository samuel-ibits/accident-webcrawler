//All imports

import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import path from "path"; // Import the 'path' module to work with file paths


import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import randomUseragent from "random-useragent";
import axios from "axios";
import cheerio from "cheerio";
import tough from "tough-cookie";
import axiosRateLimit from "axios-rate-limit";
import { randomDelay } from "random-delay";
import { Console } from "console";






//send results back to repoary sorage
async function sendToApi(data) {
  const apiUrl = "http://localhost:3000/fetch";
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({data}),
  };

  try {
    const response = await fetch(apiUrl, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Handle successful response if needed
  } catch (error) {
    console.error("Error while sending data to API:", error);
    // Handle the error appropriately (e.g., log, retry, or propagate)
  }
}
async function setupPage(browser, searchUrl, timeout = 120000) {
  console.log("backgroud started")
  const page = await browser.newPage();
  const userAgent = randomUseragent.getRandom();

  await page.setUserAgent(userAgent);
  await page.goto(searchUrl, { timeout });

  // Wait for some time to simulate human-like behavior
  await page.waitForTimeout(randomDelay());

  return page;
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


async function scrapeDataForSearchBase(searchBase, page, startDate, endDate) {
  // Specific scraping logic for each search base

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
       await page.goto(searchUrl, { timeout: 4000000 });

       // Wait for some time to simulate human-like behavior
       await page.waitForTimeout(randomDelay());

       // Input the user's search query and wait for the results to load
       await page.type(
         'input[type="text"][placeholder="Search SowetanLIVE"]',
         query
       );
       await page.keyboard.press("Enter");
       await page.waitForNavigation({ waitUntil: "domcontentloaded" });

       // Wait for some time to simulate human-like behavior
       await page.waitForTimeout(randomDelay());

       const html = await page.content();
       const $ = cheerio.load(html);

       const accidentReports = $(".result");

       let reports = [];

       accidentReports.each((index, element) => {
         const titleElement = $(element).find("h2");
         const linkElement = $(element).find("a.result");
         const link = linkElement.attr("href");
         const accidentType = titleElement.text().trim();
         const dateElement = $(element).find(".date-stamp");
         const rawDate = dateElement.text();

         // Convert the raw date to a human-readable format
         const date = parseSowetanLiveDate(rawDate);

         // Extract details
         const detailsElement = $(element).find("p");
         const details = detailsElement.text().trim();

         // Check if the report's date is within the specified range
         if (isDateInRange(date, startDate, endDate)) {
           // Add 'location: South Africa' property for reports from 'sowetanlive' search base
           reports.push({
             accidentType,
             date,
             details,
             location: "South Africa",
             link: `https://www.sowetanlive.co.za${link}`, // Adjust the link format
           });
         }
       });

       await browser.close();

       return reports;
     } else {
       return [];
     }
   } catch (error) {
     console.error("Error:", error.message);
     return [];
   }

}




async function runPuppeteerTask(formdata) {
    const {searchBase, query, startDate, endDate} = formdata;


  puppeteer.use(StealthPlugin());

  // Set up cookies and user-agent for Axios
  const cookieJar = new tough.CookieJar();

  const http = axiosRateLimit(axios.create(), {
    maxRequests: 1,
    perMilliseconds: 1000,
  });

  const baseUrls = {
    vanguard: "https://thecurrent.pk/?s=",
    punch: "https://punchng.com/?s=",
    // ... other search bases
  };

  try {
    const searchUrl = baseUrls[searchBase] + query;
    const browser = await puppeteer.launch({ headless: true });

    const page = await setupPage(browser, searchUrl);

    const reports = await scrapeDataForSearchBase(
      searchBase,
      page,
      startDate,
      endDate
    );

    await browser.close();
    
    //send scraped data to apis

    await sendToApi(reports);
    return reports;

  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }

  // Send a message to the main thread
  parentPort.postMessage("Puppeteer task completed successfully");
}





export default async function initiateSearchBarWorker(formData) {
  console.log('worker initiated');
  if (isMainThread) {
    console.log('worker main', formData);

    // Construct the absolute path to the worker script file
    const workerScriptPath = path.join(__dirname, 'searchbars.mjs');

    console.log(wor)
    // Create the worker using the correct file path
    const worker = new Worker(workerScriptPath, { workerData: formData });

      
  
      console.log('what is worker', worker)
      // Handle events or messages from the worker if needed
      worker.on("message", (message) => {
        console.log("Worker thread sent a message:", message.data);
      });

      // Handle errors in the worker thread
      worker.on("error", (error) => {
        console.error("Error in worker thread:", error);
      });

      // Listen for the worker thread to exit
      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Worker thread exited with code ${code}`);
        }
      });
    } else {
        console.log('worker puppeteer')

      runPuppeteerTask(workerData);
    }
}




