import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import TrainingVideo from '../../src/components/course/TrainingVideo';
vi.mock('../../src/hooks/useAuth', () => ({ useAuth: () => ({ isAdmin: false }) }));
let players;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
  players = [];
  window.YT = { PlayerState: { PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5, ENDED: 0 }, Player: class {
    constructor(frame, options) { this.frame = frame; this.events = options.events; players.push(this); }
    getDuration() { return 10; }
    destroy() { this.frame.remove(); }
  } };
});
afterEach(() => { cleanup(); vi.useRealTimers(); delete window.YT; });
async function state(player, value) { await act(async () => player.events.onStateChange({ target: player, data: value })); }
test('switching videos creates a usable iframe and resets the watch counter', async () => {
  const oldSave = vi.fn(); const newSave = vi.fn();
  const { rerender } = render(<TrainingVideo videoUrl="https://youtu.be/abcdefghijk" watchedSeconds={8} durationSeconds={10} onWatchProgress={oldSave} />);
  await act(async () => {});
  const oldFrame = screen.getByTitle('Training video');
  rerender(<TrainingVideo videoUrl="https://youtu.be/lmnopqrstuv" watchedSeconds={0} durationSeconds={10} onWatchProgress={newSave} />);
  await act(async () => {});
  expect(screen.getByTitle('Training video').isConnected).toBe(true);
  expect(screen.getByTitle('Training video')).not.toBe(oldFrame);
  expect(screen.getByText('0:00 watched / 0:10')).toBeTruthy();
  await state(players.at(-1), 1);
  await act(async () => vi.advanceTimersByTime(2000));
  expect(screen.getByText('0:02 watched / 0:10')).toBeTruthy();
});
test('seeking to the end cannot complete a video before its watch time is met', async () => {
  const complete = vi.fn();
  render(<TrainingVideo videoUrl="https://youtu.be/abcdefghijk" onComplete={complete} onWatchProgress={vi.fn()} />);
  await act(async () => {});
  await state(players[0], 1);
  await act(async () => vi.advanceTimersByTime(2000));
  await state(players[0], 0);
  expect(complete).not.toHaveBeenCalled();
  await state(players[0], 1);
  await act(async () => vi.advanceTimersByTime(8000));
  await state(players[0], 0);
  expect(complete).toHaveBeenCalledTimes(1);
});
test('native video does not count buffering time and requires full watch time', async () => {
  const complete = vi.fn();
  const { container } = render(<TrainingVideo videoUrl="https://example.com/video.mp4" onComplete={complete} onWatchProgress={vi.fn()} />);
  const video = container.querySelector('video');
  Object.defineProperty(video, 'duration', { value: 10 });
  fireEvent.loadedMetadata(video); fireEvent.playing(video);
  await act(async () => vi.advanceTimersByTime(2000));
  fireEvent.waiting(video);
  await act(async () => vi.advanceTimersByTime(20000));
  fireEvent.ended(video);
  expect(complete).not.toHaveBeenCalled();
  expect(screen.getByText('0:02 watched / 0:10')).toBeTruthy();
});

test('native buffered playback keeps counting when network fetching stalls', async () => {
  const complete = vi.fn();
  const { container } = render(<TrainingVideo videoUrl="https://example.com/video.mp4" onComplete={complete} onWatchProgress={vi.fn()} />);
  const video = container.querySelector('video');
  Object.defineProperty(video, 'duration', { value: 10 });
  fireEvent.loadedMetadata(video); fireEvent.playing(video);
  await act(async () => vi.advanceTimersByTime(2000));
  fireEvent.stalled(video);
  await act(async () => vi.advanceTimersByTime(8000));
  await act(async () => fireEvent.ended(video));
  expect(complete).toHaveBeenCalledTimes(1);
});
