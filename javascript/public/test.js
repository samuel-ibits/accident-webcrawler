if (searchBase === "vanguard") {
  const userAgent = randomUseragent.getRandom();
  const generateSearchUrl = (query, page) =>
    page
      ? `https://thecurrent.pk/page/${page}/?s=${query}`
      : `https://thecurrent.pk/?s=${query}`;

  const scrapePage = async (pageNumber) => {
    const searchUrl = generateSearchUrl(query, pageNumber);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(userAgent);
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(randomDelay());

    const html = await page.content();
    const $ = cheerio.load(html);

    const accidentReports = $(".jeg_post.jeg_pl_md_2.format-standard");

    let reports = [];

    accidentReports.each((index, element) => {
      const accidentType = $(element).find(".jeg_post_title").text();
      const date = $(element).find(".jeg_meta_date").text();
      const details = $(element).find(".jeg_post_excerpt p").text();

      if (isDateInRange(date, startDate, endDate)) {
        reports.push({ accidentType, date, details, location: "Nigeria" });
      }
    });

    // Before closing the browser, check if there is a next page
    const nextPageSelector = "a.page_nav.next";
    const nextPageExists = (await page.$(nextPageSelector)) !== null;

    await browser.close();

    return {
      reports,
      hasNextPage: nextPageExists,
    };
  };

  const scrapeAllPages = async () => {
    let allReports = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const { reports, hasNextPage } = await scrapePage(currentPage);
      allReports = [...allReports, ...reports];
      currentPage++;
      hasMorePages = hasNextPage;
    }

    return allReports;
  };

  // IIFE (Immediately Invoked Function Expression) to use await at the top level
  (async () => {
    try {
      const reports = await scrapeAllPages();
      console.log(reports);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  })();
}
