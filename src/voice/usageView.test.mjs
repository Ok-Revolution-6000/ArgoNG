import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voiceUsageView } from './usageView.js';
import { RealtimeCost } from './realtimeCost.js';

const usage = { input: 1200, output: 300, responses: 2, captions: 1 };
const state = {
  totalUsd: 1.25,
  capUsd: 5,
  warnUsd: 3,
  display: '~$1.25',
  modelId: 'live-model',
  level: 'ok',
};
const view = (overrides = {}) =>
  voiceUsageView({
    state,
    usage,
    auth: 'api-key',
    pendingModelId: 'live-model',
    ...overrides,
  });

test('API session shows estimated spend against its cap, with separate response and caption counts', () => {
  const result = view();
  assert.equal(result.percent, 25);
  assert.equal(result.fields.budget, '25% of $5.00 session cap');
  assert.equal(result.fields.input, '1,200');
  assert.equal(result.fields.responses, '2');
  assert.equal(result.fields.captions, '1');
});
test('OAuth reports usage without inventing cost, cap or quota reset time', () => {
  const result = view({ auth: 'oauth' });
  assert.equal(result.percent, null);
  assert.equal(result.fields.cost, 'Unavailable');
  assert.equal(result.compact, '1,500 tokens');
  assert.equal(result.fields.budget, 'Account quota is not reported');
});
test('disabled cap, incomplete accounting and over-cap spend remain explicit', () => {
  assert.equal(view({ state: { ...state, capUsd: Infinity } }).percent, null);
  assert.match(
    view({ state: { ...state, incomplete: true } }).compact,
    /partial/,
  );
  const over = view({ state: { ...state, totalUsd: 6 } });
  assert.equal(over.percent, 100);
  assert.match(over.fields.budget, /120%/);
  assert.equal(
    view({ pendingModelId: 'next-model' }).fields.model,
    'live-model',
  );
  assert.equal(
    view({ pendingModelId: 'next-model' }).fields.next,
    'Next session: next-model',
  );
});
test('session aggregation counts responses independently of caption billing and resets on next session', () => {
  const meter = new RealtimeCost({
    readUi: () => null,
    readStatus: () => 'listening',
    operations: {
      isActive: () => true,
      isVoiceSessionSettled: () => false,
      debugLog() {},
      setStatus() {},
      stop() {},
    },
  });
  meter.recordUsage({ input_tokens: 100, output_tokens: 20 });
  meter.recordUsage({ input_tokens: NaN, output_tokens: -1 });
  meter.recordTranscriptionUsage({ seconds: 1 });
  assert.deepEqual(meter.apiUsage, {
    input: 100,
    output: 20,
    responses: 2,
    captions: 1,
  });
  meter.setVoiceTier('mini');
  assert.equal(meter.apiUsage.responses, 2);
  meter.prepareSession();
  assert.deepEqual(meter.apiUsage, {
    input: 0,
    output: 0,
    responses: 0,
    captions: 0,
  });
  meter.sessionCloudVoiceAuth = 'oauth';
  meter.recordUsage({ input_tokens: 40, output_tokens: 10 });
  assert.equal(meter.oauthUsage.responses, 1);
  assert.equal(meter.apiUsage.responses, 0);
});
