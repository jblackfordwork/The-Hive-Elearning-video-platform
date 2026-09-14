import { useStudentView } from '../../hooks/useStudentView';
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

export default function TrainingVideo(props) {
  return <VideoSession key={props.videoUrl} {...props} />;
}

function VideoSession({ videoUrl, completed = false, watchedSeconds = 0, durationSeconds = 0, onComplete, onWatchProgress }) {
  const { isAdmin } = useAuth();
  const { readOnly } = useStudentView();
  const youtubeFrameRef = useRef(null);
  const htmlVideoRef = useRef(null);
  const finishingRef = useRef(false);
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
    return onWatchProgressRef.current?.({
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

  const finishVideo = useCallback(async () => {
    setPlaying(false);
    if (completedRef.current || finishingRef.current) return;
    if (!hasWatchedVideoLength(watchRef.current)) {
      setError('This video has not met its watch-time requirement yet. Please continue watching or replay the remaining time.');
      return;
    }
    finishingRef.current = true;
    setError('');
    try {
      await saveWatchProgress(true);
      await onCompleteRef.current?.();
      completedRef.current = true;
    } catch (err) {
      setError(err.message || 'Unable to save video completion. Please try again.');
    } finally {
      finishingRef.current = false;
    }
  }, [saveWatchProgress, setPlaying]);

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
    const host = youtubeFrameRef.current;
    const frame = document.createElement('iframe');
    frame.className = 'h-full w-full';
    frame.src = youtubeEmbedUrl;
    frame.title = 'Training video';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    host.replaceChildren(frame);
    loadYouTubeApi().then((YT) => {
      if (!active || !youtubeFrameRef.current) return;
      player = new YT.Player(frame, {
        events: {
          onReady: (event) => { if (active) setDuration(event.target.getDuration()); },
          onStateChange: (event) => {
            if (!active) return;
            setDuration(event.target.getDuration());
            if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
            if ([YT.PlayerState.PAUSED, YT.PlayerState.BUFFERING, YT.PlayerState.CUED].includes(event.data)) setPlaying(false);
            if (event.data === YT.PlayerState.ENDED) void finishVideo();
          },
          onError: () => { if (active) { setPlaying(false); setError('This YouTube video could not be played.'); } },
        },
      });
    }).catch((err) => { if (active) setError(err.message); });
    return () => {
      active = false;
      if (player?.destroy) player.destroy();
      host.replaceChildren();
    };
  }, [videoType, youtubeId, youtubeEmbedUrl, finishVideo, setDuration, setPlaying]);

  if (!parsed) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 flex gap-3"><AlertCircle /> This lesson does not have a supported video URL.</div>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-black shadow-xl aspect-video">
        {videoType === 'youtube' ? (
          <div ref={youtubeFrameRef} className="h-full w-full" />
        ) : <video ref={htmlVideoRef} src={videoSrc} className="h-full w-full" controls onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onPlaying={() => setPlaying(true)} onWaiting={() => setPlaying(false)} onSeeking={() => setPlaying(false)} onPause={() => setPlaying(false)} onEnded={(event) => { setDuration(event.currentTarget.duration); void finishVideo(); }} />}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{completed ? <CheckCircle2 size={17} /> : <Video size={17} />}{completed ? 'Video requirement complete' : 'Watch through the end to unlock the quiz'}</div>
        <div className={`rounded-full px-3 py-1.5 text-sm font-bold ${hasWatchedVideoLength(watchState) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{formatDuration(watchState.watchedSeconds)} watched{watchState.durationSeconds ? ` / ${formatDuration(watchState.durationSeconds)}` : ''}</div>
        {isAdmin && !readOnly && !completed && <button type="button" onClick={() => Promise.resolve(onCompleteRef.current?.()).catch(err => setError(err.message))} className="hive-secondary-button text-xs">Admin: mark video complete</button>}
      </div>
      {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
