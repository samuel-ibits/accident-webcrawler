"use client";

import React, { useEffect, useState } from "react";

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
  const fetchData = async (token) => {
    const endpoint = 'https://dev.mysecureview.com/api/live/incident_categories'; 
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      console.log(data)
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  };
  
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_SECURE_VIEW_BEARER_TOKEN; // Retrieve the token from environment variable
  
    if (!token) {
      console.error('Bearer token not found in environment variable.');
      
      return;
    }
   
  
    fetchData(token)
      .then(data => {
        if (data) {
          console.log('Data fetched successfully:', data);
          setOptions(data);
         
        } else {
          console.error('No data received from the API.');
        }
      })
      .catch(error => {
        console.error('Error fetching data from the API:', error);
      });
  }, []);

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
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
          <button
          type="button"
          className={`bg-blue-500 text-white p-3 rounded-md `}
          onClick={setFormSuccess(false)}>New Request</button>
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
               Incident Category
            </label>
         

            <select 
            id="emergencyType"
            name="emergencyType"
            onChange={handleInput}
              value={formData.emergencyType}
            className="text-gray-600 mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring focus:border-blue-500"
            >
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={index} value={option.name}>{option.name}</option>
              ))}
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
            className={`bg-blue-500 text-white p-3 rounded-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
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
