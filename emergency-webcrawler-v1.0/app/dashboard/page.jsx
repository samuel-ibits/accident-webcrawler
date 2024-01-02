"use client";
// Dashboard.js

import React, { useState, useEffect } from "react";
import ScrapeForm from "../components/form/page";
import ScraperStatus from "../components/status/page";
import Navbar from "../components/navbar/page"; // Adjust the import path based on your project structure

function Dashboard() {
  const [scrappedItems, setScrappedItems] = useState([]);
  const [totalQueries, setTotalQueries] = useState(0);

  // Simulate fetching scrapped items from an API or another source
  useEffect(() => {
    // Fetch or set scrapped items
    const fetchedScrappedItems = [
      // Example scrapped items
      {
        accidentType: "Road Accident",
        location: "Main Street",
        date: "2023-01-01",
        time: "12:30 PM",
        details: "A description of the accident.",
      },
      // Add more items as needed
    ];

    setScrappedItems(fetchedScrappedItems);
    setTotalQueries((prevTotal) => prevTotal + 1);
  }, []);

  const handleRefresh = () => {
    // Implement logic to refresh data (fetch new data, reset counts, etc.)
    setTotalQueries((prevTotal) => prevTotal + 1);
  };

  // Calculate status
  const totalItems = scrappedItems.length;
  const verifiedItems = 0; // You need to implement logic for verification
  const unverifiedItems = totalItems - verifiedItems;

  return (
    <div>
      <Navbar totalQueries={totalQueries} onRefresh={handleRefresh} />
      <div className="flex">
        <div className="w-1/2 p-4">
          <ScrapeForm />
        </div>
        <div className="w-1/2 p-4">
          <ScraperStatus
            totalItems={totalItems}
            verifiedItems={verifiedItems}
            unverifiedItems={unverifiedItems}
            scrappedItems={scrappedItems}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
