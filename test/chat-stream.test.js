import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createChatStream, ChatEngine } from '../src/chat/index.js';

describe('Chat Stream Interface', () => {
  describe('createChatStream()', () => {
    it('returns a duplex stream', () => {
      const stream = createChatStream();
      assert.ok(stream.writable, 'Stream should be writable');
      assert.ok(stream.readable, 'Stream should be readable');
      stream.destroy();
    });

    it('processes a single message through the pipeline', async () => {
      const stream = createChatStream();
      const results = [];

      stream.on('data', (chunk) => results.push(chunk));

      const done = new Promise((resolve) => {
        stream.on('end', resolve);
      });

      stream.write('Hello');
      stream.end();

      await done;

      assert.equal(results.length, 1);
      assert.equal(results[0].text, 'Hello');
      assert.equal(results[0].classification, 'greeting');
      assert.ok(results[0].response.length > 0);
    });

    it('processes multiple messages in order', async () => {
      const stream = createChatStream();
      const results = [];

      stream.on('data', (chunk) => results.push(chunk));

      const done = new Promise((resolve) => {
        stream.on('end', resolve);
      });

      stream.write('Hello');
      stream.write('What is your name?');
      stream.write('Goodbye');
      stream.end();

      await done;

      assert.equal(results.length, 3);
      assert.equal(results[0].id, 0);
      assert.equal(results[0].classification, 'greeting');
      assert.equal(results[1].id, 1);
      assert.equal(results[1].classification, 'question');
      assert.equal(results[2].id, 2);
      assert.equal(results[2].classification, 'farewell');
    });

    it('assigns sequential IDs to messages', async () => {
      const stream = createChatStream();
      const results = [];

      stream.on('data', (chunk) => results.push(chunk));

      const done = new Promise((resolve) => {
        stream.on('end', resolve);
      });

      stream.write('First');
      stream.write('Second');
      stream.write('Third');
      stream.end();

      await done;

      assert.deepEqual(
        results.map((r) => r.id),
        [0, 1, 2]
      );
    });

    it('accepts object chunks with text property', async () => {
      const stream = createChatStream();
      const results = [];

      stream.on('data', (chunk) => results.push(chunk));

      const done = new Promise((resolve) => {
        stream.on('end', resolve);
      });

      stream.write({ text: 'Hello from object' });
      stream.end();

      await done;

      assert.equal(results.length, 1);
      assert.equal(results[0].text, 'Hello from object');
    });
  });

  describe('ChatEngine().createStream()', () => {
    it('returns a duplex stream', () => {
      const engine = ChatEngine();
      const stream = engine.createStream();
      assert.ok(stream.writable, 'Stream should be writable');
      assert.ok(stream.readable, 'Stream should be readable');
      stream.destroy();
    });

    it('processes messages like processMessages', async () => {
      const engine = ChatEngine();
      const stream = engine.createStream();
      const results = [];

      stream.on('data', (chunk) => results.push(chunk));

      const done = new Promise((resolve) => {
        stream.on('end', resolve);
      });

      stream.write('Thanks for helping!');
      stream.end();

      await done;

      assert.equal(results.length, 1);
      assert.equal(results[0].classification, 'gratitude');
      assert.ok(results[0].response.includes('welcome'));
    });
  });

  describe('backward compatibility', () => {
    it('FlowEngine alias works with processMessages', async () => {
      const { FlowEngine } = await import('../src/index.js');
      const engine = FlowEngine();
      const results = await engine.processMessages(['Hello']);

      assert.equal(results.length, 1);
      assert.equal(results[0].classification, 'greeting');
    });

    it('FlowEngine alias works with createStream', async () => {
      const { FlowEngine } = await import('../src/index.js');
      const engine = FlowEngine();
      const stream = engine.createStream();

      const results = [];
      stream.on('data', (chunk) => results.push(chunk));

      const done = new Promise((resolve) => {
        stream.on('end', resolve);
      });

      stream.write('Hi');
      stream.end();

      await done;

      assert.equal(results.length, 1);
      assert.equal(results[0].classification, 'greeting');
    });
  });
});
