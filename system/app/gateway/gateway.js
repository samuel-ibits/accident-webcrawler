import { exec } from "child_process";
// import initiateSearchBarWorker from "../../libs/searchbars.mjs";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import path from "path"; // Import the 'path' module to work with file paths



export async function initiateSearchBarWorker(formData) {
  console.log('worker initiated');
  if (isMainThread) {
    console.log('worker main', formData);

    // Create the worker using the correct file path
    const worker = new Worker("./libs/searchbars.mjs", { workerData: formData });

      
    worker.postMessage(100000);
      // console.log('what is worker', worker)

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



export default class Gateways {
  constructor() {}

  async google(request) {
    //get the data
    const { emergencyType, fromDate, toDate, specialParameters, searchBase, categoryid } =
      await request;

    const text =
      "new request" +
      emergencyType +
      specialParameters +
      "from:" +
      fromDate +
      "to:" +
      toDate;
    const translatedTextPromise = new Promise((resolve, reject) => {
      exec(
        `cd crawlers/python && python -m venv scrape_venv && scrape_venv/Scripts/activate && python -m pip install -r requirments.txt && python google.py"${text}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error:${error}`);
            reject(error);
          }
          resolve(stdout);
        }
      );
    });
    const translatedText = await translatedTextPromise;

    return translatedText;
  }

  async twitter(request) {
    //get the data
    const { emergencyType, fromDate, toDate, specialParameters, searchBase, categoryid } =
      await request;

    const text =
      "new request" +
      emergencyType +
      specialParameters +
      "from:" +
      fromDate +
      "to:" +
      toDate;
    const translatedTextPromise = new Promise((resolve, reject) => {
      exec(
        `cd crawlers/python && python -m venv scrape_venv && scrape_venv/Scripts/activate && python -m pip install -r requirments.txt && python google.py"${text}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error:${error}`);
            reject(error);
          }
          resolve(stdout);
        }
      );
    });
    const translatedText = await translatedTextPromise;

    return translatedText;
  }

  async searchBar(request) {
   
    //get the data
    const { emergencyType, fromDate, toDate, specialParameters, searchBase, categoryid } =
    await request;
console.log("cat on gateway", categoryid)
  
      await initiateSearchBarWorker({
       emergencyType,
       fromDate,
       toDate,
       specialParameters,
       searchBase,
       categoryid
     });

    return;
  }






  async test(request) {
    console.log({ message: "got to gateway sucessfully", data: request });
    return request;
  }
}
