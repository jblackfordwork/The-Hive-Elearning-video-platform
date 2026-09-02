import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLessonsFromYoutubeUrlText } from './youtubeImport.js';

test('builds ordered draft lessons from pasted YouTube URLs', () => {
  const lessons = buildLessonsFromYoutubeUrlText(
    [
      'https://www.youtube.com/watch?v=abc123',
      'https://youtu.be/def456',
    ].join('\n'),
    { startingOrder: 3 },
  );

  assert.deepEqual(lessons, [
    {
      title: 'Lesson 3',
      order: 3,
      description: '',
      videoUrl: 'https://www.youtube.com/watch?v=abc123',
      videoType: 'youtube',
      passingScorePercent: 80,
      quizQuestionCount: 3,
      requireQuiz: true,
      requireVideoCompletion: true,
    },
    {
      title: 'Lesson 4',
      order: 4,
      description: '',
      videoUrl: 'https://youtu.be/def456',
      videoType: 'youtube',
      passingScorePercent: 80,
      quizQuestionCount: 3,
      requireQuiz: true,
      requireVideoCompletion: true,
    },
  ]);
});

test('uses a leading label before a YouTube URL as the lesson title', () => {
  const lessons = buildLessonsFromYoutubeUrlText('Safety intro - https://youtu.be/abc123');

  assert.equal(lessons[0].title, 'Safety intro');
});

test('rejects duplicate, blank, and unsupported pasted video lines', () => {
  assert.throws(
    () => buildLessonsFromYoutubeUrlText('https://youtu.be/abc123\nhttps://youtu.be/abc123'),
    /Duplicate YouTube URL/,
  );

  assert.throws(
    () => buildLessonsFromYoutubeUrlText('https://example.com/video.mp4'),
    /Line 1 is not a supported YouTube URL/,
  );

  assert.throws(
    () => buildLessonsFromYoutubeUrlText(''),
    /Paste at least one YouTube URL/,
  );
});
