chrome.tabs.onActivated.addListener(function () {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tab) {
    if (!tab[0].url.includes('shop.kz/offer')) {
      chrome.action.setPopup({ popup: 'placeholder.html' });
    } else chrome.action.setPopup({ popup: 'popup.html' });
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.active) {
    if (!tab.url.includes('shop.kz/offer')) {
      chrome.action.setPopup({ popup: 'placeholder.html' });
    } else chrome.action.setPopup({ popup: 'popup.html' });
  }
});
