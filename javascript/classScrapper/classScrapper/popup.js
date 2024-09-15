document.addEventListener("DOMContentLoaded", function () {
  const scrapeButton = document.getElementById("scrapeButton");
  const resultDiv = document.getElementById("result");

  scrapeButton.addEventListener("click", function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
              action: "scrapeAllTweets"
          });
      });
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === "displayResults") {
          displayResults(request.results);
      }
  });

  function displayResults(results) {
      resultDiv.innerHTML = "";
      if (results.count > 0) {
          results.texts.forEach(text => {
              const elementDiv = document.createElement("div");
              elementDiv.textContent = text;
              resultDiv.appendChild(elementDiv);
          });
      } else {
          resultDiv.textContent = "No tweets found.";
      }
  }
});
