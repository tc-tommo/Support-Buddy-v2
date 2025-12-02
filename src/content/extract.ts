import { MESSAGE as MODEL } from '../background/model';

export class Tweet {

    text: string; // Text of the tweet
    id: string; // Status id from url
    author: string; // Author of the tweet
    date: string; // Creation date of the tweet
    imageURLs: string; // URL of the image in the tweet
    imageCaptions: string; // Caption of the image in the tweet
    
    constructor(article: HTMLElement) {
        // get from DOM
    }
}

const classifier = chrome.runtime.connect({ name: MODEL.PORT_ID });

classifier.onDisconnect.addListener(() => {
    console.error('Classifier disconnected');
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === MODEL.PORT_ID) console.log(`Classifier connected`);
});

classifier.onMessage.addListener((message) => {
    switch (message.type) {
        case MODEL.TYPE.RESULTS:
            console.log(message.results);
            break;
        case MODEL.TYPE.ERROR:
            console.error(message.message);
            break;
        default:
            console.warn(`Unknown message type: ${message.type}`);
            break;
    }
});

let timelineObserver: MutationObserver | null = null;

const findNode = (mutations: MutationRecord[], predicate: (element: HTMLElement) => boolean): HTMLElement | undefined => {
    return mutations.find((mutation) => {
         mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && predicate(node as HTMLElement)) return node;
        });
    })?.target as HTMLElement;
}

const rootObserver = new MutationObserver(mutations => {
    const column = findNode(mutations, 
        (e) => e.matches('div') && e.attributes.getNamedItem('data-testid')?.value === 'primaryColumn');
    if (column) {
        // open timeline observer, close root observer
    }
});

rootObserver.observe(document.body, {
    childList: true,
    subtree: true,
});
