"use client";

import React, { useState } from "react";

export default function ScrapeForm() {
  const [formData, setFormData] = useState({
    emergencyType: "",
    fromDate: "",
    toDate: "",
    specialParameters: "",
    searchBase: "",
  });

  const [formSuccess, setFormSuccess] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInput = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    setFormData((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue,
    }));

       JSON.stringify(formData);

  };

  const submitForm = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // alert(JSON.stringify(formData));
    const formURL = "http://localhost:3000/api/scrape/run";

    fetch(formURL, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setFormData({
          emergencyType: "",
          fromDate: "",
          toDate: "",
          specialParameters: "",
          searchBase: "",
        });

        setFormSuccess(true);
        setFormSuccessMessage(data.message);
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        // Handle error state or display an error message to the user
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  return (
    <div className="max-w-md mx-auto mt-8 p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl text-gray-800 font-semibold mb-6">
        Emergency Webscraper
      </h1>
      <p className="text-gray-600 mb-6">
        Please fill in the information below:
      </p>

      {formSuccess ? (
        <div className="text-gray-600 bg-green-100 border-l-4 border-green-500 p-4 mb-6">
          {formSuccessMessage}
        </div>
      ) : (
        <form onSubmit={submitForm}>
          <div className="mb-6">
            <label
              htmlFor="searchBase"
              className="block text-sm font-medium text-gray-600"
            >
              Search Base
            </label>
            <select
              id="searchBase"
              name="searchBase"
              onChange={handleInput}
              value={formData.searchBase}
              className="text-gray-600 mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="test">Select Search Base</option>
              <option value="google">Google.com</option>
              <option value="vanguard">Vanguard News</option>
              <option value="punch">Punch newspaper</option>
              <option value="daily">Daily trust</option>
              <option value="guyana">News Room Guyana</option>
              <option value="ewn">Ewn Traffic</option>
              <option value="sowetanlive">Sowetanlive</option>

              {/* Add more options as needed */}
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="emergencyType"
              className="block text-sm font-medium text-gray-600"
            >
              Emergency Type
            </label>
            <select
              id="emergencyType"
              name="emergencyType"
              onChange={handleInput}
              value={formData.emergencyType}
              className="text-gray-600 mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="">Select Emergency Type</option>
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="roadAccident">Road Accident</option>
              <option value="all">All</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="fromDate"
              className="block text-sm font-medium text-gray-600"
            >
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              onChange={handleInput}
              value={formData.fromDate}
              className="text-gray-600 mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="toDate"
              className="block text-sm font-medium text-gray-600"
            >
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              onChange={handleInput}
              value={formData.toDate}
              className="text-gray-600 mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="specialParameters"
              className="block text-sm font-medium text-gray-600"
            >
              Special Parameters
            </label>
            <textarea
              id="specialParameters"
              name="specialParameters"
              onChange={handleInput}
              value={formData.specialParameters}
              className="text-gray-600 mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:border-blue-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className={`bg-blue-500 text-white p-3 rounded-md ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting Scrapping..." : "Start Scrapping"}
          </button>
        </form>
      )}
    </div>
  );
}
