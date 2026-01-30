import { Readable, PassThrough, Duplex } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { MessageBus } from './message-bus.js';

function validateMessageFormat(msg) {
  return msg && typeof msg.text === 'string' && msg.text.length > 0;
}

const DEFAULT_PIPELINE_CONFIG = {
  maxRetries: 3,
  bufferSize: 1024,
  enableLogging: false,
  timeout: 30000,
};

function createLogger(prefix) {
  return {
    info: (msg) => console.log(`[${prefix}] INFO: ${msg}`),
    error: (msg) => console.error(`[${prefix}] ERROR: ${msg}`),
  };
}

export class FlowEngineBuilder {
  constructor() {
    this._nodeFactories = [];
  }

  addNode(name, factory) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Node name must be a non-empty string');
    }
    if (typeof factory !== 'function') {
      throw new Error(`Node factory for "${name}" must be a function`);
    }
    this._nodeFactories.push({ name, factory });
    return this;
  }

  build() {
    if (this._nodeFactories.length === 0) {
      throw new Error('Cannot build FlowEngine with empty pipeline. Add at least one node.');
    }

    const messageBus = MessageBus();
    const nodeFactories = [...this._nodeFactories];

    async function processMessages(messages) {
      const input = messages.map((text, index) => ({ id: index, text }));
      const source = Readable.from(input, { objectMode: true });
      const collector = new PassThrough({ objectMode: true });
      const nodes = nodeFactories.map(({ factory }) => factory(messageBus));

      const results = [];
      collector.on('data', (chunk) => results.push(chunk));

      await pipeline(source, ...nodes, collector);
      return results;
    }

    function createStream() {
      let messageId = 0;
      const nodes = nodeFactories.map(({ factory }) => factory(messageBus));

      const duplex = new Duplex({
        objectMode: true,
        read() {},
        write(chunk, encoding, callback) {
          const input = {
            id: messageId++,
            text: typeof chunk === 'string' ? chunk : chunk.text,
          };
          inputStream.push(input);
          callback();
        },
        final(callback) {
          inputStream.push(null);
          callback();
        },
      });

      const inputStream = new PassThrough({ objectMode: true });
      const outputStream = new PassThrough({ objectMode: true });

      outputStream.on('data', (chunk) => {
        duplex.push(chunk);
      });

      outputStream.on('end', () => {
        duplex.push(null);
      });

      pipeline(inputStream, ...nodes, outputStream).catch((err) => {
        duplex.destroy(err);
      });

      return duplex;
    }

    return { messageBus, processMessages, createStream };
  }
}
