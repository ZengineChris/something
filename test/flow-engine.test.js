import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChatEngine } from '../src/chat/index.js';
import { chatMessages } from './fixtures/chat-messages.js';

const VALID_CATEGORIES = [
  'greeting', 'farewell', 'question', 'command',
  'gratitude', 'apology', 'agreement', 'negation', 'general',
];

describe('FlowEngine — Integration', () => {
  let results;

  it('processes all 50 messages without dropping any', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);
    assert.equal(results.length, 50);
  });

  it('preserves input text on every result', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 0; i < chatMessages.length; i++) {
      assert.equal(results[i].text, chatMessages[i]);
    }
  });

  it('classifies every message into a valid category', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (const r of results) {
      assert.ok(
        VALID_CATEGORIES.includes(r.classification),
        `"${r.text}" classified as "${r.classification}" which is not a valid category`
      );
    }
  });

  it('classifies greetings correctly (indices 0-5)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 0; i <= 5; i++) {
      assert.equal(
        results[i].classification, 'greeting',
        `Expected greeting at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies questions correctly (indices 6-12)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 6; i <= 12; i++) {
      assert.equal(
        results[i].classification, 'question',
        `Expected question at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies commands correctly (indices 13-19)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 13; i <= 19; i++) {
      assert.equal(
        results[i].classification, 'command',
        `Expected command at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies farewells correctly (indices 20-24)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 20; i <= 24; i++) {
      assert.equal(
        results[i].classification, 'farewell',
        `Expected farewell at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies gratitude correctly (indices 25-29)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 25; i <= 29; i++) {
      assert.equal(
        results[i].classification, 'gratitude',
        `Expected gratitude at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies apologies correctly (indices 30-33)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 30; i <= 33; i++) {
      assert.equal(
        results[i].classification, 'apology',
        `Expected apology at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies agreement correctly (indices 34-37)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 34; i <= 37; i++) {
      assert.equal(
        results[i].classification, 'agreement',
        `Expected agreement at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies negation correctly (indices 38-41)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 38; i <= 41; i++) {
      assert.equal(
        results[i].classification, 'negation',
        `Expected negation at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('classifies general messages correctly (indices 42-49)', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (let i = 42; i <= 49; i++) {
      assert.equal(
        results[i].classification, 'general',
        `Expected general at index ${i} ("${results[i].text}"), got "${results[i].classification}"`
      );
    }
  });

  it('generates a response string for every message', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (const r of results) {
      assert.ok(
        typeof r.response === 'string' && r.response.length > 0,
        `Missing response for "${r.text}"`
      );
    }
  });

  it('ensures classifiedAt <= respondedAt for every message', async () => {
    const engine = ChatEngine();
    results = await engine.processMessages(chatMessages);

    for (const r of results) {
      assert.ok(
        r.classifiedAt <= r.respondedAt,
        `Timing violation for "${r.text}": classifiedAt=${r.classifiedAt}, respondedAt=${r.respondedAt}`
      );
    }
  });
});
