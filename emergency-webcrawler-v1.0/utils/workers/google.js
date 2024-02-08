// utils/worker.js
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const puppeteer = require("puppeteer");
const MongoClient = require("mongodb").MongoClient;

async function runPuppeteerTask(formData) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Puppeteer task logic to scrape data
  // Replace the following with your specific Puppeteer logic
  await page.goto("https://example.com");
  const title = await page.title();

  // Store data in MongoDB
  const client = new MongoClient("mongodb://localhost:27017", {
    useNewUrlParser: true,
  });
  await client.connect();

  const db = client.db("your_database_name");
  const collection = db.collection("your_collection_name");
  await collection.insertOne({ title, formData });

  await browser.close();
  await client.close();

  // Send a message to the main thread
  parentPort.postMessage("Puppeteer task completed successfully");
}

// Check if the script is run in the main thread
if (isMainThread) {


  module.exports = function initiateSearchBarWorker(formData) {
    const worker = new Worker(__filename, { workerData: formData });

    // Handle events or messages from the worker if needed
    worker.on("message", (message) => {
      console.log("Worker thread sent a message:", message);
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
  };
} else {
  // If it's not the main thread, run the Puppeteer task
  runPuppeteerTask(workerData);
}
