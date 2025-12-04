
export class Tweet {
    element: Element;
    text: string;
    statusId: string;
    author: string;
    createdAt: string;
    imageUrls?: string[];
    imageCaption?: string;
    videoUrl?: string;
    classification?: number;

    constructor(
        element: Element,
        text: string,
        statusId: string,
        author: string,
        createdAt: string,
        imageUrls?: string[],
        imageCaption?: string,
        videoUrl?: string,
        classification?: number
    ) {
        this.element = element;
        this.text = text;
        this.statusId = statusId;
        this.author = author;
        this.createdAt = createdAt;
        this.imageUrls = imageUrls;
        this.imageCaption = imageCaption;
        this.videoUrl = videoUrl;
        this.classification = classification;
    }

    private static extractImageCaptions(article: Element): string[] {
        const imageCaptions: string[] = [];
        for (const img of article.querySelectorAll('img')) {
            imageCaptions.push(img.alt);
        }
        return imageCaptions;
    }

    private static extractTweetText(tweetText: Element): string {
        let text = '';
        tweetText.childNodes.forEach(element => {
            if (element.nodeName === 'SPAN') {
                text += element.textContent;
            } else if (element.nodeName === 'IMG') {
                text += (element as HTMLImageElement).alt;
            }
        });
        return text;
    }

    static statusIdFromElement(article: Element): string | null {
        // Twitter Snowflake IDs are 64-bit integers, max value is 20 digits when stringified
        // Maximum: 18,446,744,073,709,551,615 (2^64 - 1) = 20 digits


        const a = article.querySelector('a[href*="/status/"][href*="/analytics"]');
        if (!a) return null;
        // /author/status/1990849576811499961/analytics
        const split = a.getAttribute('href')?.split('/');
        return split?.[3] || '';
    }

    static fromElement(article: Element): Tweet | null {
        const imageUrls: string[] = [];
        let imageCaption: string | undefined;

        const a = article.querySelector('a[href*="/status/"][href*="/analytics"]');
        if (!a) return null;
        const statusUrl = a.getAttribute('href') || '';


        // /[author]/status/[statusId]/analytics
        const [, author, , statusId] = statusUrl.split('/') || [];

        const tweetText = article.querySelector('[data-testid="tweetText"]');
        if (!tweetText || !statusId) return null;

        const text = Tweet.extractTweetText(tweetText);
        const tweet = new Tweet(
            article,
            text,
            statusId,
            author,
            '', // createdAt - not extracted in original code
            imageUrls.length > 0 ? imageUrls : undefined,
            imageCaption,
            undefined, // videoUrl
            undefined // classification
        );

        console.log("🐦:\n", tweet);

        return tweet;
    }
}