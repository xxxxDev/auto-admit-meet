// Meet's interface has no stable ids, so its buttons are recognised by their text.
// Only buttons are searched, so words in chat messages or names are never acted on.
const ADMIT_WORDS = ['接受', '全部接受', '允許加入', '允许加入', 'Admit', '承諾'];
// Current Meet shows only a "1 guest waiting" button. Pointing at it shows a small card with
// an admit button, which admits without touching the side panel.
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
let hovered = null;
let hoverTries = 0;
// Set only while the list is open because this extension opened it, so a list the user
// opened is never closed.
let openedByUs = false;
let panelCloseButton = null;
let closeButtonsBefore = [];
// Side panels the user had open (such as the chat) before the list replaced them.
let panelsBefore = [];
// Right after a meeting starts Meet may be slow to show the card, so it is pointed at for
// this many checks before the waiting list is opened instead.
const HOVER_TRIES = 8;

// Meet marks each side panel's toolbar button with data-panel-id and aria-expanded.
const openPanelButtons = () => [...document.querySelectorAll('button[data-panel-id][aria-expanded="true"]')];

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

// Meet opens and closes the card on pointer events, so it gets the ones a mouse would send.
function pointAt(element, entering) {
    const types = entering
        ? ['pointerover', 'pointerenter', 'mouseover', 'mouseenter']
        : ['pointerout', 'pointerleave', 'mouseout', 'mouseleave'];
    types.forEach((type) => element.dispatchEvent(
        new PointerEvent(type, {bubbles: type.endsWith('over') || type.endsWith('out'), pointerType: 'mouse'})));
}

function closeListWeOpened() {
    const close = panelCloseButton && panelCloseButton.isConnected
        ? panelCloseButton
        // The list opened without anyone to admit, so its close button is the one that appeared.
        : closeButtons().find((button) => !closeButtonsBefore.includes(button));
    if (close) close.click();
    // Meet shows one side panel at a time, so the one the list replaced is opened again.
    const reopen = panelsBefore;
    // A panel the user opened meanwhile is left as it is.
    setTimeout(() => {
        if (openPanelButtons().length > 0) return;
        reopen.filter((button) => button.isConnected).forEach((button) => button.click());
    }, 600);
    openedByUs = false;
    panelCloseButton = null;
    closeButtonsBefore = [];
    panelsBefore = [];
}

function autoAdmit() {
    const now = Date.now();
    const startsWithWord = (words) => (label) => words.some((word) => label.startsWith(word));
    const admitButtons = findButtons(startsWithWord(ADMIT_WORDS));
    if (admitButtons.length > 0) {
        if (openedByUs) panelCloseButton = closeButtonAround(admitButtons[0]) || panelCloseButton;
        admitButtons.forEach((button) => button.click());
        lastAdmitted = now;
        hoverTries = 0;
        if (hovered) pointAt(hovered, false);
        hovered = null;
        return;
    }
    if (hovered && (hoverTries >= HOVER_TRIES || !hovered.isConnected)) {
        // The card this extension showed goes away again.
        pointAt(hovered, false);
        hovered = null;
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
    if (!waiting) {
        if (hovered) pointAt(hovered, false);
        hovered = null;
        hoverTries = 0;
        return;
    }
    if (hoverTries < HOVER_TRIES) {
        // The pointer stays on the button between checks, the way a person's mouse would.
        hovered = waiting.querySelector('[jsaction*="pointerenter"]') || waiting;
        pointAt(hovered, true);
        hoverTries += 1;
        return;
    }
    // The card showed no admit button, so the waiting list is opened instead.
    hoverTries = 0;
    closeButtonsBefore = closeButtons();
    panelsBefore = openPanelButtons();
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
