import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { createAudioPlayer } from 'expo-audio';

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  togglePlay: () => Promise<void>;
  seekTo: (sec: number) => void;
  stop: () => void;
}

export function useAudioPlayback(
  uri?: string | null,
  initialDurationSec?: number
): AudioPlaybackState {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDurationSec ?? 0);
  const isLoaded = Boolean(uri);

  const nativePlayerRef = useRef<any>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize playback instance and cleanup on unmount or uri change
  useEffect(() => {
    if (!uri) {
      return;
    }

    let isMounted = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
      try {
        const audio = new window.Audio(uri);
        webAudioRef.current = audio;

        audio.onloadedmetadata = () => {
          if (!isMounted) return;
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setDuration(Math.round(audio.duration));
          }
        };

        audio.ontimeupdate = () => {
          if (!isMounted) return;
          setCurrentTime(Math.floor(audio.currentTime));
        };

        audio.onended = () => {
          if (!isMounted) return;
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audio.onerror = () => {
          if (!isMounted) return;
          setIsPlaying(false);
        };
      } catch {
        // Fallback or ignore
      }
    } else {
      try {
        const player = createAudioPlayer({ uri });
        nativePlayerRef.current = player;

        const sub = (player as any).addListener?.('playbackStatusUpdate', (status: any) => {
          if (!isMounted || !status) return;
          if (typeof status.currentTime === 'number') {
            setCurrentTime(Math.floor(status.currentTime));
          }
          if (typeof status.duration === 'number' && status.duration > 0) {
            setDuration(Math.floor(status.duration));
          }
          if (typeof status.playing === 'boolean') {
            setIsPlaying(status.playing);
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        });

        return () => {
          isMounted = false;
          sub?.remove?.();
          if (timerRef.current) clearInterval(timerRef.current);
          if (nativePlayerRef.current) {
            try {
              nativePlayerRef.current.pause();
              nativePlayerRef.current.remove?.();
            } catch {
              // ignore
            }
            nativePlayerRef.current = null;
          }
          setIsPlaying(false);
          setCurrentTime(0);
        };
      } catch {
        // Fallback
      }
    }

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = '';
        webAudioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };
  }, [uri]);

  // Polling fallback to keep currentTime smooth if status updates lag
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (webAudioRef.current) {
          setCurrentTime(Math.floor(webAudioRef.current.currentTime));
        } else if (nativePlayerRef.current) {
          const ct = nativePlayerRef.current.currentTime;
          if (typeof ct === 'number') {
            setCurrentTime(Math.floor(ct));
          }
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    if (webAudioRef.current) {
      const audio = webAudioRef.current;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
      return;
    }

    if (nativePlayerRef.current) {
      const player = nativePlayerRef.current;
      try {
        if (isPlaying) {
          player.pause();
          setIsPlaying(false);
        } else {
          player.play();
          setIsPlaying(true);
        }
      } catch {
        setIsPlaying(false);
      }
    }
  }, [isPlaying]);

  const seekTo = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(sec, duration || 9999));
      setCurrentTime(clamped);
      if (webAudioRef.current) {
        webAudioRef.current.currentTime = clamped;
      } else if (nativePlayerRef.current) {
        try {
          nativePlayerRef.current.seekTo?.(clamped);
        } catch {
          // ignore
        }
      }
    },
    [duration]
  );

  const stop = useCallback(() => {
    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current.currentTime = 0;
    } else if (nativePlayerRef.current) {
      try {
        nativePlayerRef.current.pause();
        nativePlayerRef.current.seekTo?.(0);
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  return {
    isPlaying,
    currentTime,
    duration: duration > 0 ? duration : (initialDurationSec ?? 0),
    isLoaded,
    togglePlay,
    seekTo,
    stop,
  };
}
