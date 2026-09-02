export function parseVideoUrl(value) {
  if (!value) return null;
  const normalizedValue = String(value).trim();
  const relativePath = normalizedValue.split('?')[0].split('#')[0].toLowerCase();
  if (!normalizedValue.includes('://') && (relativePath.endsWith('.mp4') || relativePath.endsWith('.webm'))) {
    return { type: 'mp4', url: normalizedValue };
  }

  let url;
  try {
    url = new URL(normalizedValue);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  let youtubeId = null;

  if (host === 'youtu.be') {
    youtubeId = url.pathname.split('/').filter(Boolean)[0] || null;
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') youtubeId = url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) youtubeId = url.pathname.split('/')[2];
    if (url.pathname.startsWith('/shorts/')) youtubeId = url.pathname.split('/')[2];
  }

  if (youtubeId) return { type: 'youtube', id: youtubeId };

  const pathname = url.pathname.toLowerCase();
  if (pathname.endsWith('.mp4') || pathname.endsWith('.webm')) {
    return { type: 'mp4', url: normalizedValue };
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId, origin = '') {
  const params = new URLSearchParams({
    enablejsapi: '1',
    rel: '0',
    modestbranding: '1',
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}
