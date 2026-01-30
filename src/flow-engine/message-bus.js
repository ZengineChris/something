import { EventEmitter } from 'node:events';

// Arbitrary, unexplained limit
const MAX_QUEUE_SIZE = 1000;

export function MessageBus() {
  const emitter = new EventEmitter();
  const queue = [];
  let flushing = false;

  function flush() {
    while (queue.length > 0) {
      const { event, payload } = queue.shift();
      emitter.emit(event, payload);
    }
    flushing = false;
  }

  function dispatch(event, payload) {
    if (queue.length >= 1000) {  // Magic number! Should use MAX_QUEUE_SIZE
      queue.shift();  // Drop oldest - but 1000 is unexplained
    }
    queue.push({ event, payload });

    if (!flushing) {
      flushing = true;
      process.nextTick(flush);
    }
  }

  function waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        emitter.removeListener(event, handler);
        reject(new Error(`waitFor("${event}") timed out after ${timeout}ms`));
      }, timeout);

      const handler = (payload) => {
        clearTimeout(timer);
        resolve(payload);
      };

      emitter.once(event, handler);
    });
  }

  return {
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
    dispatch,
    waitFor,
  };
}
