import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChatEngine } from '../src/chat/index.js';
import { chatMessages } from './fixtures/chat-messages.js';

describe('Ordering Guarantees', () => {
  it('output message IDs match sequential input order', async () => {
    const engine = ChatEngine();
    const results = await engine.processMessages(chatMessages);

    const ids = results.map((r) => r.id);
    const expected = chatMessages.map((_, i) => i);
    assert.deepEqual(ids, expected);
  });

  it('per-message event sequence is classifier:start → classifier:end → responder:start → responder:end', async () => {
    const engine = ChatEngine();
    const eventLog = [];

    engine.messageBus.on('classifier:start', (p) => eventLog.push({ type: 'classifier:start', id: p.id }));
    engine.messageBus.on('classifier:end', (p) => eventLog.push({ type: 'classifier:end', id: p.id }));
    engine.messageBus.on('responder:start', (p) => eventLog.push({ type: 'responder:start', id: p.id }));
    engine.messageBus.on('responder:end', (p) => eventLog.push({ type: 'responder:end', id: p.id }));

    await engine.processMessages(chatMessages);

    // Group events by message ID
    const byId = new Map();
    for (const entry of eventLog) {
      if (!byId.has(entry.id)) byId.set(entry.id, []);
      byId.get(entry.id).push(entry.type);
    }

    const expectedSequence = [
      'classifier:start', 'classifier:end',
      'responder:start', 'responder:end',
    ];

    for (const [id, events] of byId) {
      assert.deepEqual(
        events, expectedSequence,
        `Message ${id} had wrong event sequence: ${events.join(' → ')}`
      );
    }
  });

  it('no interleaving: classifier completes message N before starting N+1', async () => {
    const engine = ChatEngine();
    const eventLog = [];

    engine.messageBus.on('classifier:start', (p) => eventLog.push({ type: 'classifier:start', id: p.id }));
    engine.messageBus.on('classifier:end', (p) => eventLog.push({ type: 'classifier:end', id: p.id }));

    await engine.processMessages(chatMessages);

    const classifierEvents = eventLog.filter(
      (e) => e.type === 'classifier:start' || e.type === 'classifier:end'
    );

    // Verify strict alternation: start(0), end(0), start(1), end(1), ...
    for (let i = 0; i < classifierEvents.length; i += 2) {
      const start = classifierEvents[i];
      const end = classifierEvents[i + 1];
      const msgIndex = i / 2;

      assert.equal(start.type, 'classifier:start', `Expected classifier:start at position ${i}`);
      assert.equal(start.id, msgIndex, `Expected classifier:start for message ${msgIndex}`);
      assert.equal(end.type, 'classifier:end', `Expected classifier:end at position ${i + 1}`);
      assert.equal(end.id, msgIndex, `Expected classifier:end for message ${msgIndex}`);
    }
  });

  it('no interleaving: responder completes message N before starting N+1', async () => {
    const engine = ChatEngine();
    const eventLog = [];

    engine.messageBus.on('responder:start', (p) => eventLog.push({ type: 'responder:start', id: p.id }));
    engine.messageBus.on('responder:end', (p) => eventLog.push({ type: 'responder:end', id: p.id }));

    await engine.processMessages(chatMessages);

    const responderEvents = eventLog.filter(
      (e) => e.type === 'responder:start' || e.type === 'responder:end'
    );

    for (let i = 0; i < responderEvents.length; i += 2) {
      const start = responderEvents[i];
      const end = responderEvents[i + 1];
      const msgIndex = i / 2;

      assert.equal(start.type, 'responder:start', `Expected responder:start at position ${i}`);
      assert.equal(start.id, msgIndex, `Expected responder:start for message ${msgIndex}`);
      assert.equal(end.type, 'responder:end', `Expected responder:end at position ${i + 1}`);
      assert.equal(end.id, msgIndex, `Expected responder:end for message ${msgIndex}`);
    }
  });

  // Run 5 times to catch non-deterministic races
  for (let run = 1; run <= 5; run++) {
    it(`repeated ordering check (run ${run}/5)`, async () => {
      const engine = ChatEngine();
      const results = await engine.processMessages(chatMessages);

      const ids = results.map((r) => r.id);
      const expected = chatMessages.map((_, i) => i);
      assert.deepEqual(ids, expected, `Ordering failed on run ${run}`);
    });
  }
});
