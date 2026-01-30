import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MessageBus } from '../src/flow-engine/message-bus.js';

describe('MessageBus', () => {
  it('dispatches events in FIFO order', async () => {
    const bus = MessageBus();
    const received = [];

    bus.on('msg', (payload) => received.push(payload));

    bus.dispatch('msg', 'first');
    bus.dispatch('msg', 'second');
    bus.dispatch('msg', 'third');

    // Events haven't fired yet (queued via process.nextTick)
    assert.equal(received.length, 0);

    // Wait for the microtask queue to flush
    await new Promise((resolve) => process.nextTick(resolve));

    assert.deepEqual(received, ['first', 'second', 'third']);
  });

  it('batches multiple synchronous dispatches into a single flush', async () => {
    const bus = MessageBus();
    const received = [];
    let ticksBetweenEvents = 0;

    bus.on('msg', (payload) => {
      received.push(payload);
    });

    bus.dispatch('msg', 'a');
    bus.dispatch('msg', 'b');
    bus.dispatch('msg', 'c');

    // Before nextTick fires, nothing has been received yet
    assert.equal(received.length, 0, 'events should not fire synchronously');

    // Schedule a tick check between dispatches — if batching works,
    // all 3 events arrive in the same tick, so this runs after them
    process.nextTick(() => {
      // By the time this second nextTick runs, all 3 should already be delivered
      ticksBetweenEvents = received.length;
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(received.length, 3, 'all three events should be received');
    assert.equal(ticksBetweenEvents, 3, 'all events should flush in a single tick before the next nextTick');
  });

  it('handles separate flush cycles for non-synchronous dispatches', async () => {
    const bus = MessageBus();
    const received = [];

    bus.on('msg', (payload) => received.push(payload));

    bus.dispatch('msg', 'batch1');

    await new Promise((resolve) => process.nextTick(resolve));
    assert.deepEqual(received, ['batch1']);

    bus.dispatch('msg', 'batch2');

    await new Promise((resolve) => process.nextTick(resolve));
    assert.deepEqual(received, ['batch1', 'batch2']);
  });

  it('waitFor resolves when the event fires', async () => {
    const bus = MessageBus();

    const promise = bus.waitFor('done');
    bus.dispatch('done', { result: 42 });

    const payload = await promise;
    assert.deepEqual(payload, { result: 42 });
  });

  it('waitFor rejects on timeout', async () => {
    const bus = MessageBus();

    await assert.rejects(
      () => bus.waitFor('never', 50),
      { message: /timed out/ }
    );
  });

  it('dispatches different event types independently', async () => {
    const bus = MessageBus();
    const aEvents = [];
    const bEvents = [];

    bus.on('a', (p) => aEvents.push(p));
    bus.on('b', (p) => bEvents.push(p));

    bus.dispatch('a', 1);
    bus.dispatch('b', 2);
    bus.dispatch('a', 3);

    await new Promise((resolve) => process.nextTick(resolve));

    assert.deepEqual(aEvents, [1, 3]);
    assert.deepEqual(bEvents, [2]);
  });
});
