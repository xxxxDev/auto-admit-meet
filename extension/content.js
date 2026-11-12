// Meet's interface has no stable ids, so its buttons are recognised by their text.
// Only buttons are searched, so words in chat messages or names are never acted on.
const ADMIT_WORDS = ['接受', '全部接受', '允許加入', '允许加入', 'Admit', '承諾'];
const VIEW_ALL_WORDS = ['查看全部', 'View all', '一覧を表示'];
// Current Meet shows only a "1 guest waiting" button until its list is opened.
const WAITING_PATTERN = /^\d+\s*\S*.*(waiting|等待|待っ)/i;
const COMPANION_WORDS = ['使用夥伴模式', 'Use Companion mode', 'コンパニオン モードを使用'];

// Meet writes an icon's name into the button's text, so a label sits at the end for
// some buttons and at the start for others. Spans hold the label alone.
function buttonLabels(button) {
    return [button, ...button.querySelectorAll('span')].map((el) => el.textContent.trim());
}

function findButtons(matches) {
    return [...document.querySelectorAll('button, [role="button"]')]
        .filter((button) => buttonLabels(button).some(matches));
}

let lastOpenedWaitingList = 0;
let lastAdmitted = 0;
// Set only while the list is open because this extension opened it, so a list the user
// opened is never closed.
let openedByUs = false;
let panelCloseButton = null;
let closeButtonsBefore = [];

// The panel's close button shows the icon name "close" in every interface language.
const closeButtons = () => findButtons((label) => label === 'close');

// The nearest close button around the admit button is the panel's, so other close
// buttons on the page are left alone.
function closeButtonAround(element) {
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
        const [close] = [...node.querySelectorAll('button, [role="button"]')]
            .filter((button) => buttonLabels(button).includes('close'));
        if (close) return close;
    }
    return null;
}

function closeListWeOpened() {
    const close = panelCloseButton && panelCloseButton.isConnected
        ? panelCloseButton
        // The list opened without anyone to admit, so its close button is the one that appeared.
        : closeButtons().find((button) => !closeButtonsBefore.includes(button));
    if (close) close.click();
    openedByUs = false;
    panelCloseButton = null;
    closeButtonsBefore = [];
}

function autoAdmit() {
    const now = Date.now();
    const startsWithWord = (words) => (label) => words.some((word) => label.startsWith(word));
    const admitButtons = findButtons(startsWithWord(ADMIT_WORDS));
    findButtons(startsWithWord(VIEW_ALL_WORDS)).forEach((button) => button.click());
    if (admitButtons.length > 0) {
        if (openedByUs) panelCloseButton = closeButtonAround(admitButtons[0]) || panelCloseButton;
        admitButtons.forEach((button) => button.click());
        lastAdmitted = now;
        return;
    }
    if (openedByUs) {
        // Everyone in the list is admitted, so it goes back to how the user had it.
        if (lastAdmitted > lastOpenedWaitingList || now - lastOpenedWaitingList > 5000) closeListWeOpened();
        return;
    }
    // Meet keeps showing the waiting button for a few seconds after someone is admitted, and
    // a second click would close the list while it's still loading.
    if (now - lastAdmitted < 12000 || now - lastOpenedWaitingList < 5000) return;
    const [waiting] = findButtons((label) => WAITING_PATTERN.test(label));
    if (!waiting) return;
    closeButtonsBefore = closeButtons();
    waiting.click();
    lastOpenedWaitingList = now;
    openedByUs = true;
}

function openCompanionMode() {
    const url = new URL(location.href);
    if (url.searchParams.get('partner') !== '1') return;
    const [button] = findButtons((label) => COMPANION_WORDS.includes(label));
    if (!button) return;
    button.click();
    // The address stays clean, and a reload doesn't take the tab into Companion mode again.
    url.searchParams.delete('partner');
    history.replaceState(null, '', url.href);
}

setInterval(() => {
    autoAdmit();
    openCompanionMode();
}, 1500);
