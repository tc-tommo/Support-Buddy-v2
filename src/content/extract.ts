import { Tweet } from './tweet';

export const MESSAGE = {
    PORT_ID: 'classifier',
    TYPE: {
        CLASSIFY: 'classify',
        ERROR: 'error',
        RESULTS: 'results',
        LOADING: 'loading',
        READY: 'ready',
        STATUS: 'status'
    },
}

console.log('Extraction script loaded');
const classifier = chrome.runtime.connect({ name: MESSAGE.PORT_ID });
console.log('Requesting classifier status');
classifier.postMessage({ type: MESSAGE.TYPE.STATUS });

classifier.onMessage.addListener((message) => {
    switch (message.type) {
        case MESSAGE.TYPE.LOADING:
            console.log('Classifier loading');
            break;
        case MESSAGE.TYPE.READY:
            console.log('Classifier ready');
            break;
    }
});
classifier.onDisconnect.addListener(() => {
    console.error('Classifier disconnected');
});

const port = chrome.runtime.connect({ name: MESSAGE.PORT_ID });

let observedIds = new Set<string>();

// Find the virtual scroll container (the div with position:relative inside timeline)
function findVirtualScrollContainer(): HTMLElement | null {
    const timeline = document.querySelector('div[aria-label="Timeline: Your Home Timeline"]');
    if (!timeline) return null;
    
    // The virtual scroll container is the direct child div with position:relative
    const container = timeline.querySelector(':scope > div[style*="position: relative"]');
    return container as HTMLElement | null;
}

// Extract articles from a cellInnerDiv
function extractArticlesFromCell(cell: HTMLElement): void {
    const articles = cell.querySelectorAll('article[data-testid="tweet"]');
    articles.forEach(article => {
        const statusId = Tweet.statusIdFromElement(article);
        if (!statusId) return;
        if (observedIds.has(statusId)) return;
        observedIds.add(statusId);
        const tweet = Tweet.fromElement(article);
        if (!tweet) return;
        // classifier.postMessage({ type: MESSAGE.TYPE.CLASSIFY, text: tweet.text });
    });
}

// Observer for the virtual scroll container - watches for new cellInnerDiv additions
const virtualScrollObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement && node.getAttribute('data-testid') === 'cellInnerDiv') {
                // New cell container added - extract articles immediately
                extractArticlesFromCell(node);
            }
        });
    });
});

// Root observer to find and set up observation on the virtual scroll container
const rootObserver = new MutationObserver(() => {
    const container = findVirtualScrollContainer();
    if (container) {
        console.log('Virtual scroll container found:', container);
        
        // Observe only childList changes (when cellInnerDiv elements are added/removed)
        // This is more efficient than subtree since we only care about direct children
        virtualScrollObserver.observe(container, { 
            childList: true,  // Only watch for added/removed children
            // subtree: false - not needed since cellInnerDiv is direct child
        });
        
        // Extract any existing articles on initial load
        const existingCells = container.querySelectorAll('div[data-testid="cellInnerDiv"]');
        existingCells.forEach(cell => extractArticlesFromCell(cell as HTMLElement));
        
        rootObserver.disconnect();
        console.log('Virtual scroll observer started');
    }
});

console.log('Starting root observer');
rootObserver.observe(document.body, {
    childList: true,
    subtree: true,
});

// Also try to find container immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    const container = findVirtualScrollContainer();
    if (container) {
        virtualScrollObserver.observe(container, { childList: true });
        const existingCells = container.querySelectorAll('div[data-testid="cellInnerDiv"]');
        existingCells.forEach(cell => extractArticlesFromCell(cell as HTMLElement));
        rootObserver.disconnect();
    }
}
