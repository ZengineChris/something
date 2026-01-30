import { FlowNode } from '../../flow-engine/nodes/index.js';

const RESPONSE_TEMPLATES = {
  greeting:   (text) => `Hello! Thanks for reaching out. How can I help you today?`,
  farewell:   (text) => `Goodbye! Have a great day ahead.`,
  question:   (text) => `That's a great question. Let me look into "${text}" for you.`,
  command:    (text) => `Processing your request: "${text}". Please wait...`,
  gratitude:  (text) => `You're welcome! Happy to help.`,
  apology:    (text) => `No worries at all! How can I assist you?`,
  agreement:  (text) => `Great, glad we're on the same page!`,
  negation:   (text) => `Understood. Let me know if there's anything else.`,
  general:    (text) => `I received your message: "${text}". How can I assist further?`,
};

export function ResponseNode(messageBus) {
  return FlowNode('responder', messageBus, async (chunk) => {
    const response = await new Promise((resolve) => {
      process.nextTick(() => {
        const template = RESPONSE_TEMPLATES[chunk.classification] || RESPONSE_TEMPLATES.general;
        resolve(template(chunk.text));
      });
    });

    const now = new Date();
    const timestamp = now.getTime();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0];

    return {
      ...chunk,
      response,
      respondedAt: timestamp,
      respondedDate: formattedDate,
      respondedTime: formattedTime,
    };
  });
}
