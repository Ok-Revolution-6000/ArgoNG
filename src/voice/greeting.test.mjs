import test from 'node:test';
import assert from 'node:assert/strict';
import { RealtimeTurns } from './realtimeTurns.js';

test('welcome sends one response, treats name as input, and disables tools', () => {
  const events = [];
  const turns = new RealtimeTurns({
    readChannel: () => ({ readyState: 'open' }),
    operations: {
      progressGenerating: () => false,
      sendRealtimeEvent: (event) => {
        events.push(event);
        return true;
      },
    },
  });
  assert.equal(
    turns.speakGreeting('Hi Ety, Jason here. How can I help?'),
    true,
  );
  assert.equal(turns.speakGreeting('Hi Ety'), false);
  assert.equal(events.length, 1);
  assert.equal(events[0].response.tool_choice, 'none');
  assert.match(events[0].response.input[0].content[0].text, /Hi Ety/);
  assert.doesNotMatch(events[0].response.instructions, /Ety/);
});

test('unsent welcome allows retry and never interrupts active speech', () => {
  const turns = new RealtimeTurns({
    readChannel: () => ({ readyState: 'open' }),
    operations: {
      progressGenerating: () => false,
      sendRealtimeEvent: () => false,
    },
  });
  assert.equal(turns.speakGreeting('Hi Ety'), false);
  assert.equal(turns.responseCreatePending, false);
  turns.responseActive = true;
  assert.equal(turns.speakGreeting('Hi Ety'), false);
});
