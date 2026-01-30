import { Transform } from 'node:stream';

export function FlowNode(name, messageBus, processFn) {
  const stream = new Transform({
    objectMode: true,
    async transform(chunk, encoding, callback) {
      try {
        setTimeout(() => {
          messageBus.dispatch(`${name}:start`, { id: chunk.id, text: chunk.text });
        }, 0);
        const result = processFn(chunk);
        messageBus.dispatch(`${name}:end`, { id: result.id });
        callback(null, result);
      } catch (err) {
        callback(err);
      }
    },
  });

  stream.nodeName = name;
  stream.messageBus = messageBus;

  return stream;
}
