import { parseVideoUrl } from './video.js';

const urlPattern = /https?:\/\/[^\s]+/i;

function cleanTitle(value, fallback) {
  const title = String(value || '')
    .replace(/[-:|–—]+$/g, '')
    .trim();
  return title || fallback;
}

export function buildLessonsFromYoutubeUrlText(text, { startingOrder = 1 } = {}) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) throw new Error('Paste at least one YouTube URL.');

  const seen = new Set();

  return lines.map((line, index) => {
    const match = line.match(urlPattern);
    const url = match?.[0]?.replace(/[),.;]+$/g, '') || '';
    const parsed = parseVideoUrl(url);

    if (parsed?.type !== 'youtube') {
      throw new Error(`Line ${index + 1} is not a supported YouTube URL.`);
    }

    if (seen.has(parsed.id)) {
      throw new Error(`Duplicate YouTube URL on line ${index + 1}.`);
    }
    seen.add(parsed.id);

    const order = Number(startingOrder) + index;
    const titlePrefix = line.slice(0, match.index).trim();

    return {
      title: cleanTitle(titlePrefix, `Lesson ${order}`),
      order,
      description: '',
      videoUrl: url,
      videoType: 'youtube',
      passingScorePercent: 80,
      quizQuestionCount: 3,
      requireQuiz: true,
      requireVideoCompletion: true,
    };
  });
}
