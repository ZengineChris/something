import { FlowNode } from '../../flow-engine/nodes/index.js';

const PATTERNS = [
  { category: 'greeting',   regex: /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening))\b/i },
  { category: 'farewell',   regex: /\b(bye|goodbye|see\s*you|take\s*care|farewell|good\s*night)\b/i },
  { category: 'question',   regex: /\?$|^(what|who|where|when|why|how|can|could|would|should|is|are|do|does|did)\b/i },
  { category: 'command',    regex: /^(please\s+)?(show|list|find|get|set|create|delete|remove|update|run|stop|start|open|close|help)\b/i },
  { category: 'gratitude',  regex: /\b(thanks?|thank\s*you|thx|appreciate|grateful)\b/i },
  { category: 'apology',    regex: /\b(sorry|apologi[zs]e|my\s*bad|excuse\s*me|pardon)\b/i },
  { category: 'agreement',  regex: /^(yes|yeah|yep|sure|okay|ok|absolutely|definitely|correct|right|agreed)\b/i },
  { category: 'negation',   regex: /^(no|nah|nope|not\s|never|neither|don'?t)\b/i },
];

function classify(text) {
  for (const { category, regex } of PATTERNS) {
    if (regex.test(text)) {
      return category;
    }
  }
  return 'general';
}

export function ClassifierNode(messageBus) {
  return FlowNode('classifier', messageBus, async (chunk) => {
    const classification = await new Promise((resolve) => {
      Promise.resolve().then(() => {
        resolve(classify(chunk.text));
      });
    });

    const now = new Date();
    const timestamp = now.getTime();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0];

    return {
      ...chunk,
      classification,
      classifiedAt: timestamp,
      classifiedDate: formattedDate,
      classifiedTime: formattedTime,
    };
  });
}
