import test from 'node:test';
import assert from 'node:assert/strict';
import { CockpitCoordinator } from './cockpitCoordinator.js';

function fixture(active, exit) {
  const cockpitView = {
    active,
    exit() {
      return exit.call(this);
    },
  };
  const coordinator = {
    services: {},
    cockpitView,
    getCockpitState: () => ({ active: cockpitView.active }),
  };
  return () =>
    CockpitCoordinator.prototype.controlCockpit.call(coordinator, 'exit');
}
test('already inactive cockpit fulfills exit without a false failure', () => {
  const result = fixture(false, function () {
    return false;
  })();
  assert.equal(result.ok, true);
  assert.equal(result.alreadyInactive, true);
  assert.equal(result.changed, false);
  assert.equal(result.error, null);
});
test('cockpit exit is verified against resulting state', () => {
  const result = fixture(true, function () {
    this.active = false;
    return true;
  })();
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  assert.equal(result.alreadyInactive, false);
});
test('a controller claiming exit while still active remains a failure', () => {
  const result = fixture(true, function () {
    return true;
  })();
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Cockpit did not exit');
});
