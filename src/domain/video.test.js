import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVideoUrl } from './video.js';

test('parses common YouTube URL formats', () => {
  assert.deepEqual(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), { type: 'youtube', id: 'dQw4w9WgXcQ' });
  assert.deepEqual(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=2'), { type: 'youtube', id: 'dQw4w9WgXcQ' });
  assert.deepEqual(parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'), { type: 'youtube', id: 'dQw4w9WgXcQ' });
});

test('parses directly hosted MP4 and WebM videos and rejects unsupported URLs', () => {
  assert.deepEqual(parseVideoUrl('https://example.org/training/press.mp4?download=1'), { type: 'mp4', url: 'https://example.org/training/press.mp4?download=1' });
  assert.deepEqual(parseVideoUrl('https://example.org/training/press.webm'), { type: 'mp4', url: 'https://example.org/training/press.webm' });
  assert.deepEqual(parseVideoUrl('training-videos/heat-press.mp4'), { type: 'mp4', url: 'training-videos/heat-press.mp4' });
  assert.equal(parseVideoUrl('https://example.org/page'), null);
  assert.equal(parseVideoUrl('not a url'), null);
});
