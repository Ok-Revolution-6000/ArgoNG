import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  createVoiceHistory,
  GREETING_IDLE_MS,
} from '../../server/providers/openai/history.js';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'argong-history-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let key = 'test-key-a',
    time = 10000000;
  const handler = () =>
    createVoiceHistory({
      sourceRoot: root,
      resolveKey: () => key,
      now: () => time,
    });
  let handle = handler();
  return {
    root,
    key(value) {
      key = value;
    },
    advance(ms) {
      time += ms;
    },
    restart() {
      handle = handler();
    },
    async call(body, remoteAddress = '127.0.0.1') {
      const req = Readable.from(
        body ? [Buffer.from(JSON.stringify(body))] : [],
      );
      req.method = body ? 'POST' : 'GET';
      req.socket = { remoteAddress };
      let response;
      const res = {
        statusCode: 200,
        setHeader() {},
        end(text) {
          response = { code: this.statusCode, ...JSON.parse(text) };
        },
      };
      await handle(req, res);
      return response;
    },
  };
}
function snapshot(scope, id, usd) {
  return {
    action: 'usage',
    scope,
    session: {
      id,
      state: { totalUsd: usd, modelId: 'model', capUsd: 5, warnUsd: 2 },
      usage: { input: 100, output: 20, responses: 1, captions: 1 },
    },
  };
}

test('usage survives process recreation, isolates keys, and does not double count retries or stale snapshots', async (t) => {
  const f = fixture(t),
    a = await f.call();
  assert.equal(
    (await f.call(snapshot(a.scope, 'session-1', 1.25))).totalUsd,
    1.25,
  );
  assert.equal(
    (await f.call(snapshot(a.scope, 'session-1', 1.25))).totalUsd,
    1.25,
  );
  assert.equal(
    (await f.call(snapshot(a.scope, 'session-1', 0.5))).totalUsd,
    1.25,
  );
  await f.call(snapshot(a.scope, 'session-2', 0.25));
  f.restart();
  assert.equal((await f.call()).totalUsd, 1.5);
  f.key('test-key-b');
  assert.equal((await f.call()).totalUsd, 0);
  assert.equal((await f.call(snapshot(a.scope, 'wrong-key', 9))).code, 409);
  f.key('test-key-a');
  assert.equal((await f.call()).totalUsd, 1.5);
  assert.equal((await f.call(null, '192.168.0.2')).code, 403);
});
test('first-name greeting persists across refreshes and is eligible only after more than an hour inactive', async (t) => {
  const f = fixture(t),
    { scope } = await f.call();
  await f.call({ action: 'profile', scope, firstName: 'Ety' });
  const welcome = await f.call({ action: 'greet', scope });
  assert.match(welcome.greeting, /Hi Ety/);
  await f.call({ action: 'greeted', scope, reservation: welcome.reservation });
  f.restart();
  assert.equal((await f.call({ action: 'greet', scope })).greeting, null);
  f.advance(GREETING_IDLE_MS);
  assert.equal((await f.call({ action: 'greet', scope })).greeting, null);
  f.advance(GREETING_IDLE_MS + 1);
  // Clicking MIC is activity; it must not erase eligibility before the connection opens.
  await f.call({ action: 'touch', scope });
  assert.match((await f.call({ action: 'greet', scope })).greeting, /Hi Ety/);
  assert.equal((await f.call({ action: 'greet', scope })).greeting, null);
});
test('invalid names and negative usage are rejected', async (t) => {
  const f = fixture(t),
    { scope } = await f.call();
  assert.equal(
    (await f.call({ action: 'profile', scope, firstName: '<script>' })).code,
    400,
  );
  assert.equal((await f.call(snapshot(scope, 'session-1', -2))).code, 400);
  assert.equal((await f.call()).totalUsd, 0);
});

test('cancelled and expired greeting claims do not suppress the next welcome', async (t) => {
  const f = fixture(t),
    { scope } = await f.call();
  await f.call({ action: 'profile', scope, firstName: 'Ety' });
  const first = await f.call({ action: 'greet', scope });
  assert.equal((await f.call({ action: 'greet', scope })).greeting, null);
  await f.call({
    action: 'cancel-greeting',
    scope,
    reservation: first.reservation,
  });
  assert.match((await f.call({ action: 'greet', scope })).greeting, /Ety/);
  f.advance(30001);
  assert.match((await f.call({ action: 'greet', scope })).greeting, /Ety/);
});

test('usage rejects prototype names without corrupting the ledger', async (t) => {
  const f = fixture(t),
    { scope } = await f.call();
  for (const id of ['__proto__', 'constructor', 'prototype'])
    assert.equal((await f.call(snapshot(scope, id, 1))).code, 400);
  assert.equal((await f.call()).totalUsd, 0);
});

test('recovered local estimates stay separate from per-key totals', async (t) => {
  const f = fixture(t);
  const dir = path.join(f.root, '.gev-cache', 'voice-history');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, 'recovered.json'),
    JSON.stringify({
      sessions: [{ totalUsd: 0.06576 }, { totalUsd: 0.264827 }],
    }),
  );
  const data = await f.call();
  assert.equal(data.totalUsd, 0);
  assert.equal(data.sessionCount, 0);
  assert.ok(Math.abs(data.recovered.totalUsd - 0.330587) < 1e-9);
  assert.equal(data.recovered.keyAttribution, 'unknown');
  await f.call(snapshot(data.scope, 'new-session', 0.1));
  assert.equal((await f.call()).totalUsd, 0.1);
});
