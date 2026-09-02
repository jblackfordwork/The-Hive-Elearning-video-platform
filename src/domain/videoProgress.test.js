import test from 'node:test';
import assert from 'node:assert/strict';
import { addPlaybackSeconds, hasWatchedVideoLength } from './videoProgress.js';

test('active playback seconds accumulate and clamp to the known video duration', () => {
  assert.equal(addPlaybackSeconds({ watchedSeconds: 20, elapsedSeconds: 7.4, durationSeconds: 25 }), 25);
  assert.equal(addPlaybackSeconds({ watchedSeconds: 20, elapsedSeconds: 7.4, durationSeconds: 0 }), 27);
});

test('video length check requires a known duration and enough watched seconds', () => {
  assert.equal(hasWatchedVideoLength({ watchedSeconds: 120, durationSeconds: 120 }), true);
  assert.equal(hasWatchedVideoLength({ watchedSeconds: 119, durationSeconds: 120 }), false);
  assert.equal(hasWatchedVideoLength({ watchedSeconds: 120, durationSeconds: 0 }), false);
});
