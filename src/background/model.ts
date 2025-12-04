import { pipeline, TextClassificationOutput, TextClassificationPipeline } from "@huggingface/transformers";

export const MESSAGE = {
  PORT_ID: 'classifier',
  TYPE: {
    CLASSIFY: 'classify',
    ERROR: 'error',
    RESULTS: 'results',
    LOADING: 'loading',
    READY: 'ready',
    STATUS: 'status',
  },
}

export const MODEL = {
    config: [
      'text-classification',
      'Heriot-WattUniversity/gbv-classifier-roberta-base-instruct-ONNX',
      {
        dtype: 'q4',
        device: 'webgpu',
      }
    ] as const,
    format: (input: string) => `Classify the following message from a social media platform. It might contain a form of gender-based violence (GBV). Output 1 if it contains GBV, or 0 if not.  
    Text: ${input} 
    Choices: 1 for GBV, or 0 for Not GBV.
    Answer: `,  
};


type Result = {
  label: 0 | 1;
  score: number;
}

type RawModelResult = {
  label: 'GBV' | 'Not GBV' | '0' | '1';
  score: number;
}

let port: chrome.runtime.Port | null = null;

chrome.runtime.onConnect.addListener((p) => {
  if (p.name === MESSAGE.PORT_ID) {
    port = p;


    p.onMessage.addListener(async (message) => {
      switch (message.type) {
        case MESSAGE.TYPE.STATUS:
          p.postMessage({ type: classifier ? MESSAGE.TYPE.READY : MESSAGE.TYPE.LOADING });
          break;
        case MESSAGE.TYPE.CLASSIFY:
          classify(message.texts || [message.text]).then(results => {
            p.postMessage({ type: MESSAGE.TYPE.RESULTS, results });
          }).catch(error => {
            p.postMessage({
              type: MESSAGE.TYPE.ERROR,
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          });
          break;
        default:
          p.postMessage({
            type: MESSAGE.TYPE.ERROR,
            message: `Unknown message type: ${message.type}`
          });
          break;
      }
    });

  }
});

console.log('Loading classifier...');
let classifier: TextClassificationPipeline | null = null;
pipeline(...MODEL.config).then((c) => {
  port?.postMessage({ type: MESSAGE.TYPE.READY });
  classifier = c;
  console.log('Classifier loaded');
});



const normalise = (results: TextClassificationOutput | TextClassificationOutput[]): Result[] => {
  const r = results as RawModelResult[];
  const normalise = (label: 'GBV' | 'Not GBV' | '0' | '1'): 0 | 1 => {
    switch (label) {
      case 'GBV':     case '1': return 1;
      case 'Not GBV': case '0': return 0;
    }
  }
  return r.map((result: RawModelResult) => ({ label: normalise(result.label), score: result.score }));
}

const classify = (texts: string[]): Promise<Result[]> => {
  return classifier!(texts.map(MODEL.format)).then(normalise);
}









