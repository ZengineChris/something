import { FlowEngineBuilder } from '../flow-engine/index.js';
import { ClassifierNode, ResponseNode } from './nodes/index.js';

export function ChatEngine() {
  return new FlowEngineBuilder()
    .addNode('classifier', ClassifierNode)
    .addNode('responder', ResponseNode)
    .build();
}

export function createChatStream() {
  const engine = ChatEngine();
  return engine.createStream();
}
