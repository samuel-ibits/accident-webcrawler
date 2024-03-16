document.addEventListener("DOMContentLoaded", function () {
  var classInput = document.getElementById("classInput");

  setTimeout(function () {
    var inputValue = "css-1qaijid r-bcqeeo r-qvutc0 r-poiln3";
    classInput.value = inputValue;

    console.log("Class input dynamically set to:", inputValue);
  }, 10);

  classInput.addEventListener("input", function () {
    var inputValue = classInput.value;
    console.log("Class input value:", inputValue);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var elementSelect = document.getElementById("elementSelect");

  setTimeout(function () {
    elementSelect.selectedIndex = 1;

    console.log("Element type dynamically set to: span");
  }, 10);

  elementSelect.addEventListener("change", function () {
    var selectedValue = elementSelect.value;
    console.log("Selected element type:", selectedValue);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const classInput = document.getElementById("classInput");
  const elementSelect = document.getElementById("elementSelect");
  const accidentTypeSelect = document.getElementById("searchQuery");
  const checkButton = document.getElementById("checkButton");
  const clearButton = document.getElementById("clearButton");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const resultDiv = document.getElementById("result");
  const saveButton = document.getElementById("saveButton");
  const copyButton = document.getElementById("copyButton");
  const inputValidation = document.getElementById("inputValidation");
  const searchHistoryList = document.getElementById("searchHistoryList");

  let resultsData = null;
  let searchHistory = [];

  // Load search history from local storage
  const savedSearchHistory = localStorage.getItem("searchHistory");
  if (savedSearchHistory) {
    searchHistory = JSON.parse(savedSearchHistory);
  }

  const filterResultsByCategory = (results, category) => {
    const lowerCategory = category.toLowerCase();
    return results.texts.filter((text) =>
      text.toLowerCase().includes(lowerCategory)
    );
  };

  const validateInput = () => {
    const inputValue = classInput.value.trim();
    const isValid = /^[a-zA-Z0-9\-_!@#$%^&*()+=?.,<>{}|[\]:;'"`~ ]+$/.test(
      inputValue
    );
    const isElementSelected = elementSelect.value !== "";
    const isAccidentTypeSelected =
      accidentTypeSelect.value !== "Select Accident Type";

    if (isValid && isElementSelected && isAccidentTypeSelected) {
      inputValidation.innerHTML = "";
      classInput.classList.remove("border-red-500");
      classInput.classList.add("border-indigo-300");
      elementSelect.classList.remove("border-red-500");
      elementSelect.classList.add("border-indigo-300");
      accidentTypeSelect.classList.remove("border-red-500");
      accidentTypeSelect.classList.add("border-indigo-300");
    } else {
      if (!isValid) {
        inputValidation.innerHTML =
          '<div class="h-5 w-5 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></div>';
        classInput.classList.add("border-red-500");
        classInput.classList.remove("border-indigo-300");
      }
      if (!isElementSelected) {
        elementSelect.classList.add("border-red-500");
        elementSelect.classList.remove("border-indigo-300");
      }
      if (!isAccidentTypeSelected) {
        accidentTypeSelect.classList.add("border-red-500");
        accidentTypeSelect.classList.remove("border-indigo-300");
      }
    }

    return isValid && isElementSelected && isAccidentTypeSelected;
  };

  const checkClass = async () => {
    if (validateInput()) {
      loadingSpinner.classList.remove("hidden");
      checkButton.disabled = true;
      clearButton.disabled = true;

      const className = classInput.value.trim();
      const elementType = elementSelect.value;
      const accidentType = accidentTypeSelect.value;
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "checkClass",
          className: className,
          elementType: elementType,
          accidentType: accidentType,
        });
      });

      addToSearchHistory(className, elementType, accidentType);
    }
  };

  const sendDataToAPI = async (data) => {
    const url = 'https://dev.mysecureview.com/api/live/store_incident?category_id=4&title=Fire';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const responseData = await response.json();
        console.log('Data sent successfully:', responseData);
    } catch (error) {
        console.error('Error sending data to API:', error);
    }
};

const saveResults = () => {
    if (resultsData) {
        const filteredResults = filterResultsByCategory(resultsData, accidentTypeSelect.value);

        if (filteredResults.length > 0) {
            // Prepare the data to be sent to the API
            const dataToSend = { texts: filteredResults };
            // Call the function to send data to the API
            sendDataToAPI(dataToSend);
        } else {
            alert('No results matching the selected category to save.');
        }
    } else {
        alert('No results to save.');
    }
};


//   const saveResults = () => {
//     if (resultsData) {
//       const filteredResults = filterResultsByCategory(
//         resultsData,
//         accidentTypeSelect.value
//       );

//       if (filteredResults.length > 0) {
//         let fileName = prompt("Please enter a name for the file:");
//         if (fileName) {
//           let blob = new Blob([JSON.stringify({ texts: filteredResults })], {
//             type: "application/json",
//           });
//           let url = URL.createObjectURL(blob);
//           chrome.downloads.download({
//             url: url,
//             filename: fileName + ".json",
//           });
//         }
//       } else {
//         alert("No results matching the selected category to save.");
//       }
//     } else {
//       alert("No results to save.");
//     }
//   };

  const copyToClipboard = () => {
    if (resultsData && resultsData.texts.length > 0) {
      const textToCopy = resultsData.texts.join("\n\n");
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => alert("Results copied to clipboard."))
        .catch((err) => alert("Failed to copy results to clipboard."));
    } else {
      alert("No results to copy.");
    }
  };

  const isFullSentence = (text) => {
    const sentencePattern = /^(?:[A-Z]|"[^"]+").*?[.!?]$/;
    const excludePatterns = [/^"Show more"$/i, /^\d+(\.\d+)?[kK]?$/];

    return (
      sentencePattern.test(text) &&
      !excludePatterns.some((pattern) => pattern.test(text))
    );
  };

  const highlightText = (text, pattern) => {
    const escapedPattern = pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(escapedPattern, "gi");
    return text.replace(
      regex,
      (match) => `<span class="bg-yellow-200">${match}</span>`
    );
  };

  const displayResults = (results) => {
    resultDiv.innerHTML = "";

    const accidentType = accidentTypeSelect.value;

    if (results.count > 0) {
      let countDiv = document.createElement("div");
      countDiv.textContent = `Number of results: ${results.count}`;
      resultDiv.appendChild(countDiv);

      for (let textContent of results.texts) {
        if (isFullSentence(textContent)) {
          let highlightedText = highlightText(textContent, accidentType);
          let elementDiv = document.createElement("div");
          elementDiv.innerHTML = highlightedText;
          elementDiv.className = "result-item";
          resultDiv.appendChild(elementDiv);
        }
      }
    } else {
      resultDiv.textContent =
        "No elements found with the specified class, element type, and accident type.";
    }

    resultDiv.classList.remove("hidden");
    loadingSpinner.classList.add("hidden");
    checkButton.disabled = false;
    clearButton.disabled = false;
  };

  const clearResults = () => {
    resultDiv.innerHTML = "";
    resultsData = null;
    checkButton.disabled = false;
    clearButton.disabled = false;
    loadingSpinner.classList.add("hidden");
  };

  const addToSearchHistory = (className, elementType, accidentType) => {
    const searchItem = `${className} (${elementType}) - ${accidentType}`;
    searchHistory.unshift(searchItem);
    searchHistory = searchHistory.slice(0, 5); // Keep only the last 5 searches
    updateSearchHistoryList();
    // Save updated search history to local storage
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  };

  const updateSearchHistoryList = () => {
    searchHistoryList.innerHTML = "";
    searchHistory.forEach((searchItem) => {
      const li = document.createElement("li");
      li.textContent = searchItem;
      li.classList.add("cursor-pointer", "hover:text-indigo-600");
      li.addEventListener("click", () => {
        const [className, elementType, accidentType] = searchItem.split(" - ");
        const [, elementTypePart] = className.match(/\((.+)\)/) || [];
        classInput.value = className.replace(` (${elementTypePart})`, "");
        elementSelect.value = elementTypePart;
        accidentTypeSelect.value = accidentType;
        checkClass();
      });
      searchHistoryList.appendChild(li);
    });
  };

  checkButton.addEventListener("click", checkClass);
  clearButton.addEventListener("click", clearResults);
  saveButton.addEventListener("click", saveResults);
  copyButton.addEventListener("click", copyToClipboard);
  classInput.addEventListener("input", validateInput);
  elementSelect.addEventListener("change", validateInput);
  accidentTypeSelect.addEventListener("change", validateInput);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      checkClass();
    }
  });

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "displayResults") {
      displayResults(request.results);
      resultsData = request.results;
    }
  });

  // Save current search values to local storage
  const saveLastSearch = () => {
    const lastSearchValues = {
      className: classInput.value.trim(),
      elementType: elementSelect.value,
      accidentType: accidentTypeSelect.value,
    };
    localStorage.setItem("lastSearch", JSON.stringify(lastSearchValues));
  };

  // Save current search values when the extension is closed
  window.addEventListener("beforeunload", saveLastSearch);

  // Load last search values from local storage
  const lastSearch = JSON.parse(localStorage.getItem("lastSearch")) || {};
  classInput.value = lastSearch.className || "";
  elementSelect.value = lastSearch.elementType || "";
  accidentTypeSelect.value = lastSearch.accidentType || "";
});
