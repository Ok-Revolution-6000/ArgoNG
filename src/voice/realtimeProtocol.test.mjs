import test from 'node:test';
import assert from 'node:assert/strict';
import { responseInstructionForToolResult } from './realtimeProtocol.js';

test('failed tools never receive a completed-action narration instruction', () => {
  for (const action of [
    'control_cockpit',
    'fly_route',
    'clear_annotations',
    'adjust_camera_zoom',
  ]) {
    const instruction = responseInstructionForToolResult({
      action,
      ok: false,
      error: 'unavailable',
    });
    assert.match(instruction, /action failed or was cancelled/);
    assert.match(instruction, /do not claim this action completed/);
    assert.doesNotMatch(instruction, /Briefly confirm the completed/);
  }
});

test('a successfully drawn fallback still cannot authorize route flight', () => {
  const instruction = responseInstructionForToolResult({
    action: 'annotate_map',
    ok: true,
    routeFallback: true,
  });
  assert.match(instruction, /do not call fly_route/);
  assert.match(instruction, /not a verified walking or driving route/);
});
