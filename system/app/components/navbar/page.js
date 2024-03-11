'use client'
import React from "react";

const Navbar = ({ totalQueries, onRefresh }) => {
  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between">
      <div>
        <span className="font-bold text-lg">Dashboard</span>
      </div>
      <div>
        <span>Total Queries: {totalQueries}</span>
        <button
          className="bg-blue-500 text-white p-2 rounded-md mr-2"
          onClick={onRefresh}
        >
          Refresh
        </button>
        
      </div>
    </div>
  );
};

export default Navbar;
