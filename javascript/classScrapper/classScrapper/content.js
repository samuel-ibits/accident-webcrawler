chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'checkClass') {
    let className = request.className;
    let elements = document.getElementsByClassName(className);
    let results = {
      count: elements.length,
      texts: []
    };

    for (let i = 0; i < elements.length; i++) {
      results.texts.push(elements[i].textContent);
    }

    chrome.runtime.sendMessage({ action: 'displayResults', results: results });
  }
});
