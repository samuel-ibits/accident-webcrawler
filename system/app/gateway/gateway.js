import { exec } from "child_process";
import initiateSearchBarWorker from "../../utils/workers/searchbars.js";


export default class Gateways {
  constructor() {}

  async google(request) {
    //get the data
    const { emergencyType, fromDate, toDate, specialParameters, searchBase } =
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
    const { emergencyType, fromDate, toDate, specialParameters, searchBase } =
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
    const { emergencyType, fromDate, toDate, specialParameters, searchBase } =
    await request;

  
      await initiateSearchBarWorker({
       emergencyType,
       fromDate,
       toDate,
       specialParameters,
       searchBase,
     });

    return;
  }






  async test(request) {
    console.log({ message: "got to gateway sucessfully", data: request });
    return request;
  }
}
