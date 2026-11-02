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

function autoAdmit() {
    const startsWithWord = (words) => (label) => words.some((word) => label.startsWith(word));
    const admitButtons = findButtons(startsWithWord(ADMIT_WORDS));
    admitButtons.forEach((button) => button.click());
    findButtons(startsWithWord(VIEW_ALL_WORDS)).forEach((button) => button.click());
    // A second click would close the list while it's still loading.
    if (admitButtons.length === 0 && Date.now() - lastOpenedWaitingList > 5000) {
        const [waiting] = findButtons((label) => WAITING_PATTERN.test(label));
        if (waiting) {
            waiting.click();
            lastOpenedWaitingList = Date.now();
        }
    }
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
