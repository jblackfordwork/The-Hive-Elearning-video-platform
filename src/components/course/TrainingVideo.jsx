import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Video, AlertCircle } from 'lucide-react';
import { getYouTubeEmbedUrl, parseVideoUrl } from '../../domain/video';
import { addPlaybackSeconds, formatDuration, hasWatchedVideoLength } from '../../domain/videoProgress';
import { useAuth } from '../../hooks/useAuth';

let youtubePromise;
function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube is unavailable.'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubePromise) return youtubePromise;
  youtubePromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };
    const existing = document.querySelector('script[data-hive-youtube-api]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.hiveYoutubeApi = 'true';
      script.onerror = () => reject(new Error('Unable to load the YouTube player.'));
      document.head.appendChild(script);
    }
  });
  return youtubePromise;
}

export default function TrainingVideo({ videoUrl, completed = false, watchedSeconds = 0, durationSeconds = 0, onComplete, onWatchProgress }) {
  const { isAdmin } = useAuth();
  const youtubeFrameRef = useRef(null);
  const htmlVideoRef = useRef(null);
  const completedRef = useRef(completed);
  const onCompleteRef = useRef(onComplete);
  const onWatchProgressRef = useRef(onWatchProgress);
  const watchRef = useRef({
    durationSeconds: Number(durationSeconds || 0),
    lastTickAt: null,
    lastSavedAt: 0,
    playing: false,
    watchedSeconds: Number(watchedSeconds || 0),
  });
  const [error, setError] = useState('');
  const [watchState, setWatchState] = useState({
    durationSeconds: Number(durationSeconds || 0),
    watchedSeconds: Number(watchedSeconds || 0),
  });
  const parsed = parseVideoUrl(videoUrl);
  const videoType = parsed?.type;
  const youtubeId = parsed?.id;
  const videoSrc = parsed?.url;
  const youtubeEmbedUrl = youtubeId
    ? getYouTubeEmbedUrl(youtubeId, typeof window === 'undefined' ? '' : window.location.origin)
    : '';

  useEffect(() => { completedRef.current = completed; }, [completed]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onWatchProgressRef.current = onWatchProgress; }, [onWatchProgress]);

  useEffect(() => {
    watchRef.current.watchedSeconds = Math.max(watchRef.current.watchedSeconds, Number(watchedSeconds || 0));
    watchRef.current.durationSeconds = Math.max(watchRef.current.durationSeconds, Number(durationSeconds || 0));
    setWatchState({
      watchedSeconds: watchRef.current.watchedSeconds,
      durationSeconds: watchRef.current.durationSeconds,
    });
  }, [watchedSeconds, durationSeconds]);

  const saveWatchProgress = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - watchRef.current.lastSavedAt < 10000) return;
    watchRef.current.lastSavedAt = now;
    onWatchProgressRef.current?.({
      watchedSeconds: watchRef.current.watchedSeconds,
      durationSeconds: watchRef.current.durationSeconds,
    });
  }, []);

  const tickWatchTime = useCallback(() => {
    const now = Date.now();
    const visible = typeof document === 'undefined' || !document.hidden;
    if (watchRef.current.playing && visible && watchRef.current.lastTickAt) {
      const elapsedSeconds = Math.max(0, (now - watchRef.current.lastTickAt) / 1000);
      watchRef.current.watchedSeconds = addPlaybackSeconds({
        watchedSeconds: watchRef.current.watchedSeconds,
        elapsedSeconds,
        durationSeconds: watchRef.current.durationSeconds,
      });
      setWatchState({
        watchedSeconds: watchRef.current.watchedSeconds,
        durationSeconds: watchRef.current.durationSeconds,
      });
      saveWatchProgress(false);
    }
    watchRef.current.lastTickAt = now;
  }, [saveWatchProgress]);

  const setPlaying = useCallback((playing) => {
    tickWatchTime();
    watchRef.current.playing = playing;
    watchRef.current.lastTickAt = playing ? Date.now() : null;
    if (!playing) saveWatchProgress(true);
  }, [saveWatchProgress, tickWatchTime]);

  const setDuration = useCallback((seconds) => {
    const duration = Math.round(Number(seconds || 0));
    if (duration > watchRef.current.durationSeconds) {
      watchRef.current.durationSeconds = duration;
      setWatchState({
        watchedSeconds: watchRef.current.watchedSeconds,
        durationSeconds: watchRef.current.durationSeconds,
      });
      saveWatchProgress(false);
    }
  }, [saveWatchProgress]);

  useEffect(() => {
    const interval = window.setInterval(tickWatchTime, 1000);
    const handleVisibility = () => {
      if (document.hidden) {
        tickWatchTime();
        watchRef.current.lastTickAt = null;
        saveWatchProgress(true);
      } else if (watchRef.current.playing) {
        watchRef.current.lastTickAt = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      tickWatchTime();
      saveWatchProgress(true);
    };
  }, [saveWatchProgress, tickWatchTime]);

  useEffect(() => {
    if (videoType !== 'youtube' || !youtubeId || !youtubeFrameRef.current) return undefined;
    let player;
    let active = true;
    loadYouTubeApi().then((YT) => {
      if (!active || !youtubeFrameRef.current) return;
      player = new YT.Player(youtubeFrameRef.current, {
        events: {
          onReady: (event) => setDuration(event.target.getDuration()),
          onStateChange: (event) => {
            setDuration(event.target.getDuration());
            if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
            if ([YT.PlayerState.PAUSED, YT.PlayerState.BUFFERING, YT.PlayerState.CUED].includes(event.data)) setPlaying(false);
            if (event.data === YT.PlayerState.ENDED && !completedRef.current) {
              setPlaying(false);
              setWatchState({
                watchedSeconds: watchRef.current.watchedSeconds,
                durationSeconds: watchRef.current.durationSeconds,
              });
              saveWatchProgress(true);
              completedRef.current = true;
              onCompleteRef.current?.();
            }
          },
          onError: () => setError('This YouTube video could not be played.'),
        },
      });
    }).catch((err) => setError(err.message));
    return () => {
      active = false;
      if (player?.destroy) player.destroy();
    };
  }, [videoType, youtubeId, saveWatchProgress, setDuration, setPlaying]);

  if (!parsed) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 flex gap-3"><AlertCircle /> This lesson does not have a supported video URL.</div>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-black shadow-xl aspect-video">
        {videoType === 'youtube' ? (
          <iframe
            ref={youtubeFrameRef}
            className="h-full w-full"
            src={youtubeEmbedUrl}
            title="Training video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : <video ref={htmlVideoRef} src={videoSrc} className="h-full w-full" controls onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={(event) => { setDuration(event.currentTarget.duration); setPlaying(false); setWatchState({ watchedSeconds: watchRef.current.watchedSeconds, durationSeconds: watchRef.current.durationSeconds }); saveWatchProgress(true); onCompleteRef.current?.(); }} />}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{completed ? <CheckCircle2 size={17} /> : <Video size={17} />}{completed ? 'Video requirement complete' : 'Watch through the end to unlock the quiz'}</div>
        <div className={`rounded-full px-3 py-1.5 text-sm font-bold ${hasWatchedVideoLength(watchState) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{formatDuration(watchState.watchedSeconds)} watched{watchState.durationSeconds ? ` / ${formatDuration(watchState.durationSeconds)}` : ''}</div>
        {isAdmin && !completed && <button type="button" onClick={() => onCompleteRef.current?.()} className="hive-secondary-button text-xs">Admin: mark video complete</button>}
      </div>
      {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
