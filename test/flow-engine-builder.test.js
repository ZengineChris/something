import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FlowEngineBuilder } from '../src/flow-engine/flow-engine-builder.js';
import { FlowNode } from '../src/flow-engine/nodes/flow-node.js';

describe('FlowEngineBuilder', () => {
  describe('addNode()', () => {
    it('returns the builder for chaining', () => {
      const builder = new FlowEngineBuilder();
      const result = builder.addNode('test', () => {});
      assert.strictEqual(result, builder);
    });

    it('throws on empty name', () => {
      const builder = new FlowEngineBuilder();
      assert.throws(
        () => builder.addNode('', () => {}),
        { message: 'Node name must be a non-empty string' }
      );
    });

    it('throws on whitespace-only name', () => {
      const builder = new FlowEngineBuilder();
      assert.throws(
        () => builder.addNode('   ', () => {}),
        { message: 'Node name must be a non-empty string' }
      );
    });

    it('throws on non-string name', () => {
      const builder = new FlowEngineBuilder();
      assert.throws(
        () => builder.addNode(123, () => {}),
        { message: 'Node name must be a non-empty string' }
      );
    });

    it('throws on non-function factory', () => {
      const builder = new FlowEngineBuilder();
      assert.throws(
        () => builder.addNode('test', 'not a function'),
        { message: 'Node factory for "test" must be a function' }
      );
    });

    it('throws on null factory', () => {
      const builder = new FlowEngineBuilder();
      assert.throws(
        () => builder.addNode('test', null),
        { message: 'Node factory for "test" must be a function' }
      );
    });
  });

  describe('build()', () => {
    it('throws on empty pipeline', () => {
      const builder = new FlowEngineBuilder();
      assert.throws(
        () => builder.build(),
        { message: 'Cannot build FlowEngine with empty pipeline. Add at least one node.' }
      );
    });

    it('returns engine with messageBus and processMessages', () => {
      const builder = new FlowEngineBuilder();
      builder.addNode('passthrough', (bus) => FlowNode('passthrough', bus, async (c) => c));

      const engine = builder.build();

      assert.ok(engine.messageBus, 'Engine should have messageBus');
      assert.ok(typeof engine.messageBus.on === 'function', 'messageBus should have on method');
      assert.ok(typeof engine.messageBus.dispatch === 'function', 'messageBus should have dispatch method');
      assert.ok(typeof engine.processMessages === 'function', 'Engine should have processMessages function');
    });

    it('returns engine with createStream method', () => {
      const builder = new FlowEngineBuilder();
      builder.addNode('passthrough', (bus) => FlowNode('passthrough', bus, async (c) => c));

      const engine = builder.build();

      assert.ok(typeof engine.createStream === 'function', 'Engine should have createStream function');
    });
  });

  describe('pipeline processing', () => {
    it('processes messages through a single registered node', async () => {
      const engine = new FlowEngineBuilder()
        .addNode('upper', (bus) => FlowNode('upper', bus, async (chunk) => ({
          ...chunk,
          text: chunk.text.toUpperCase(),
        })))
        .build();

      const results = await engine.processMessages(['hello', 'world']);

      assert.equal(results.length, 2);
      assert.equal(results[0].text, 'HELLO');
      assert.equal(results[1].text, 'WORLD');
    });

    it('chains multiple nodes in registration order', async () => {
      const engine = new FlowEngineBuilder()
        .addNode('addPrefix', (bus) => FlowNode('addPrefix', bus, async (chunk) => ({
          ...chunk,
          text: 'PREFIX:' + chunk.text,
        })))
        .addNode('addSuffix', (bus) => FlowNode('addSuffix', bus, async (chunk) => ({
          ...chunk,
          text: chunk.text + ':SUFFIX',
        })))
        .build();

      const results = await engine.processMessages(['test']);

      assert.equal(results[0].text, 'PREFIX:test:SUFFIX');
    });

    it('preserves message ids', async () => {
      const engine = new FlowEngineBuilder()
        .addNode('identity', (bus) => FlowNode('identity', bus, async (c) => c))
        .build();

      const results = await engine.processMessages(['a', 'b', 'c']);

      assert.equal(results[0].id, 0);
      assert.equal(results[1].id, 1);
      assert.equal(results[2].id, 2);
    });
  });

  describe('messageBus events', () => {
    it('fires events on shared messageBus', async () => {
      const events = [];

      const engine = new FlowEngineBuilder()
        .addNode('tracker', (bus) => FlowNode('tracker', bus, async (c) => c))
        .build();

      engine.messageBus.on('tracker:start', (data) => events.push({ type: 'start', ...data }));
      engine.messageBus.on('tracker:end', (data) => events.push({ type: 'end', ...data }));

      await engine.processMessages(['hello']);

      assert.equal(events.length, 2);
      assert.equal(events[0].type, 'start');
      assert.equal(events[0].text, 'hello');
      assert.equal(events[1].type, 'end');
      assert.equal(events[1].id, 0);
    });

    it('fires events for all nodes in pipeline', async () => {
      const events = [];

      const engine = new FlowEngineBuilder()
        .addNode('first', (bus) => FlowNode('first', bus, async (c) => c))
        .addNode('second', (bus) => FlowNode('second', bus, async (c) => c))
        .build();

      engine.messageBus.on('first:start', () => events.push('first:start'));
      engine.messageBus.on('first:end', () => events.push('first:end'));
      engine.messageBus.on('second:start', () => events.push('second:start'));
      engine.messageBus.on('second:end', () => events.push('second:end'));

      await engine.processMessages(['test']);

      assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
    });
  });
});
