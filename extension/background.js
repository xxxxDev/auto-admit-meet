// Opens the current call in a new tab that the content script takes into Companion mode.
chrome.action.onClicked.addListener((tab) => {
    if (!tab.url) return;
    const url = new URL(tab.url);
    // The icon does nothing away from Meet, where there is no call to open.
    if (url.hostname !== 'meet.google.com') return;
    url.searchParams.set('partner', '1');
    chrome.tabs.create({ url: url.href });
});
