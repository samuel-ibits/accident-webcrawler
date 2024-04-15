// pages/docs.js
import React from 'react';

const DocsPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Emergency Web Scraper Documentation</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Dashboard Scraper</h2>
        <p className="mb-4">
          The Dashboard Scraper allows users to scrape selected websites efficiently. Follow these steps to utilize this tool:
        </p>
        <ol className="list-decimal ml-6">
          <li className="mb-2">Access the Dashboard: Navigate to the Dashboard Scraper by visiting the provided URL or by launching the application locally if youre running it on your machine.</li>
          <li className="mb-2">Site Selection: Upon accessing the dashboard, youll find a list of supported sites. Select the website you want to scrape from the available options.</li>
          <li className="mb-2">Configuration: After selecting a site, configure the scraping parameters such as the specific data you want to extract, the frequency of scraping, and any other relevant settings.</li>
          <li className="mb-2">Initiate Scraping: Once the configuration is complete, initiate the scraping process by clicking the &quot Scrape &quot button. The scraper will start fetching data from the chosen website according to your configured settings.</li>
          <li>Review Results: Once the scraping process is complete, review the results within the dashboard interface. You can view, analyze, and export the scraped data as needed.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Chrome Extension Scraper</h2>
        <p className="mb-4">
          The Chrome Extension Scraper is designed specifically for scraping Twitter. Follow these steps to utilize this tool effectively:
        </p>
        <ol className="list-decimal ml-6">
          <li className="mb-2">Install the Extension: Install the Chrome Extension Scraper from the Chrome Web Store or by downloading it from the provided source.</li>
          <li className="mb-2">Navigate to Twitter: Once installed, navigate to Twitter in your Chrome browser.</li>
          <li className="mb-2">Activate the Extension: Click on the extension icon in your browsers toolbar to activate it. The extension will display options for configuring the scraping process.</li>
          <li className="mb-2">Configure Scraping Options: Configure the scraping options within the extension interface. Specify parameters such as the keywords, hashtags, or user profiles you want to scrape data from.</li>
          <li className="mb-2">Initiate Scraping: After configuring the scraping options, initiate the scraping process by clicking the appropriate button within the extension interface.</li>
          <li>Review and Export Data: Once the scraping process is complete, review the scraped data directly within the extension interface. You can also export the data to a file for further analysis or processing.</li>
        </ol>
      </section>
    </div>
  );
};

export default DocsPage;
