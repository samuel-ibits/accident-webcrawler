document.addEventListener('DOMContentLoaded', function() {
  const classInput = document.getElementById('classInput');
  const elementSelect = document.getElementById('elementSelect');
  const checkButton = document.getElementById('checkButton');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const resultDiv = document.getElementById('result');
  const saveButton = document.getElementById('saveButton');
  const inputValidation = document.getElementById('inputValidation');

  let resultsData = null;

  const validateInput = () => {
      const inputValue = classInput.value.trim();
      const isValid = /^[a-zA-Z0-9-_ ]+$/.test(inputValue);
      const isElementSelected = elementSelect.value !== '';

      if (isValid && isElementSelected) {
          inputValidation.innerHTML = '';
          classInput.classList.remove('border-red-500');
          classInput.classList.add('border-indigo-300');
          elementSelect.classList.remove('border-red-500');
          elementSelect.classList.add('border-indigo-300');
      } else {
          if (!isValid) {
              inputValidation.innerHTML = '<div class="h-5 w-5 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></div>';
              classInput.classList.add('border-red-500');
              classInput.classList.remove('border-indigo-300');
          }
          if (!isElementSelected) {
              elementSelect.classList.add('border-red-500');
              elementSelect.classList.remove('border-indigo-300');
          }
      }

      return isValid && isElementSelected;
  };

  const checkClass = async () => {
      if (validateInput()) {
          loadingSpinner.classList.remove('hidden');
          checkButton.disabled = true;

          const className = classInput.value.trim();
          const elementType = elementSelect.value;
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'checkClass', className: className, elementType: elementType });
          });
      }
  };

  const saveResults = () => {
      if (resultsData) {
          let fileName = prompt("Please enter a name for the file:");
          if (fileName) {
              let blob = new Blob([JSON.stringify(resultsData)], {type: "application/json"});
              let url = URL.createObjectURL(blob);
              chrome.downloads.download({
                  url: url,
                  filename: fileName + '.json'
              });
          }
      } else {
          alert('No results to save.');
      }
  };

  const isFullSentence = (text) => {
      const sentencePattern = /^(?:[A-Z]|"[^"]+").*?[.!?]$/;
      const excludePatterns = [
          /^[\w\s]+\\n$/,  // Exclude elements like "WebDevelopment\n", "Cybersecurity\n"
          /^"Show more"$/i, // Exclude the string "Show more" (case-insensitive)
          /^\d+(\.\d+)?[kK]?$/ // Exclude numeric values like "435", "329", "2.4K", "156K"
      ];

      return sentencePattern.test(text) && !excludePatterns.some(pattern => pattern.test(text));
  };

  const displayResults = (results) => {
      resultDiv.innerHTML = '';

      if (results.count > 0) {
          let countDiv = document.createElement('div');
          countDiv.textContent = `Number of results: ${results.count}`;
          resultDiv.appendChild(countDiv);

          for (let textContent of results.texts) {
              if (isFullSentence(textContent)) {
                  let elementDiv = document.createElement('div');
                  elementDiv.textContent = textContent;
                  elementDiv.className = 'result-item';
                  resultDiv.appendChild(elementDiv);
              }
          }
      } else {
          resultDiv.textContent = 'No elements found with the specified class and element type.';
      }

      resultDiv.classList.remove('hidden');
      loadingSpinner.classList.add('hidden');
      checkButton.disabled = false;
  };

  checkButton.addEventListener('click', checkClass);
  saveButton.addEventListener('click', saveResults);
  classInput.addEventListener('input', validateInput);
  elementSelect.addEventListener('change', validateInput);

  document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
          checkClass();
      }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.action === 'displayResults') {
          displayResults(request.results);
          resultsData = request.results;
      }
  });
});