'use client'
import React, { useState } from 'react';



  

const ScraperStatus = ({
  scrappedItems,
  verifiedItems,
  unverifiedItems,
  totalItems,
  fetchData
}) => {


  
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = scrappedItems.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Filter the current items based on the search query
  const filteredItems = scrappedItems
  .filter((item) =>
    item.accidentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);


  const handleRefresh = () => {
    setCurrentPage(1); // Reset pagination to first page
    setSearchQuery(''); // Reset search query
    fetchData(); // Fetch data again
  };

  //update tempdb
  const validate = async (body, data) => {
console.log("some body returned")

    const {_id}=body;
    const { newStatus } = data;
    // alert(newStatus)ta
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/scrape/${_id}`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ newStatus }),
      });
      if (!res.ok) {
        throw new Error("failed to update tempdb");
      }

      const responseDa = await res.json();

      console.log("validate",responseDa)
      alert("updated tempdp", responseDa)


// send to secure view db
const endpoint=`${process.env.NEXT_PUBLIC_URL}/api/scrape/submit`
const ress =await fetch(endpoint, {
  method: 'POST',
  headers: {
    // "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SECURE_VIEW_BEARER_TOKEN}`,
    "Content-Type": "application/json"
  },
body: JSON.stringify(body),
});
const responseData = await ress.json();
console.log("validate",responseData)
alert("sent to secureview", responseData)


      return "done";
    } catch (error) {
      console.log("errorloading tempdb", error);
    }
  };






  const handleAccept = async(index, body) => {
    // alert(body._id)
        // Implement logic for accepting an item
    const action = await validate(body, { newStatus: "Accepted" });
    // alert("Accept item at index" + index + id + action);
  };

  const handleReject = async(index, id) => {
    // Implement logic for rejecting an item
    const action = await validate(id, { newStatus: "Rejected" });

    // alert("Reject item at index" + index + id + action);
    alert("deleted")

  };



  return (  
  <div className="text-gray-800 max-w-md mx-auto mt-8 p-4 bg-white shadow-md rounded ">
  <h1 className="text-2xl text-gray-800 font-semibold mb-4">
    Scraper Status
  </h1>



      <div className="flex justify-between mb-4">
        <div>
          <strong>Total Items:</strong> {totalItems}
        </div>
        <div>
          <strong>Verified Items:</strong> {verifiedItems}
        </div>
        <div>
          <strong>Unverified Items:</strong> {unverifiedItems}
        </div>
      </div> 
      {/* Search input field */}
      <input
        type="text"
        placeholder="Search by accident type..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 px-4 py-2 border border-gray-300 rounded"
      />

       {/* Refresh button */}
       
        {/* <button
          className="bg-gray-500 text-white p-2 rounded"
          onClick={handleRefresh}
        >
          Refresh
        </button> */}
   


      <h2 className="text-xl font-semibold mb-2 n">Scrapped Items</h2>

      <ul>
        {currentItems.map((item, index) => (
             <li key={index} className="mb-4 p-4 border border-gray-300 rounded">
              {item.category_id}
             <strong>Accident Type:</strong> {item.accidentType}
             <br />
             <strong>Location:</strong> {item.location}
             <br />
             <strong>Date of Occurrence:</strong> {item.dateOfOccurance}
             <br />
             <strong>Time:</strong> {item.timeOfOcccurance}
             <br />
             <strong>Accident Details:</strong> {item.accidentDetails}
             <br />
             <div className="mt-2 flex items-center">
               <button
                 className="bg-green-500 text-white p-2 rounded mr-2"
                 onClick={() => handleAccept(index, item)}
               >
                 Accept
               </button>
               <button
                 className="bg-red-500 text-white p-2 rounded"
                 onClick={() => handleReject(index, item._id)}
               >
                 Reject
               </button>
             </div>
           </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="mt-4">
        <nav className="flex justify-center">
          {[...Array(Math.ceil(filteredItems.length / itemsPerPage))].map((_, index) => (
            <button
              key={index}
              className={`mx-1 px-3 py-2 rounded ${
                currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default ScraperStatus;

