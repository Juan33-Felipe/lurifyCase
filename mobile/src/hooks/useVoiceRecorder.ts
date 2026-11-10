import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';

export type RecordingState = 'idle' | 'recording' | 'processing';

export interface RecordedAudioResult {
  uri: string;
  base64: string;
  durationSec: number;
  mimeType: string;
}

async function readUriAsBase64(uri: string): Promise<string> {
  if (Platform.OS !== 'web') {
    try {
      const file = new File(uri);
      const b64 = await file.base64();
      if (b64) return b64;
    } catch {
      // Fallback to fetch + FileReader below
    }
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob'));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder() {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 120);

  const [state, setState] = useState<RecordingState>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [audioResult, setAudioResult] = useState<RecordedAudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  // Smooth 1-second timer while recording
  useEffect(() => {
    if (state !== 'recording') return;
    const interval = setInterval(() => {
      if (startTimestampRef.current) {
        const diff = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        setElapsedSec(diff);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [state]);

  const durationSec =
    state === 'recording'
      ? Math.max(elapsedSec, Math.floor((recorderState.durationMillis ?? 0) / 1000))
      : (audioResult?.durationSec ?? elapsedSec);

  // Normalize metering (-60dB..0dB -> 0..1)
  const metering = (() => {
    if (state !== 'recording') return 0;
    if (typeof recorderState.metering === 'number') {
      const clamped = Math.max(-60, Math.min(0, recorderState.metering));
      return (clamped + 60) / 60;
    }
    return 0.45;
  })();

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('permission_denied');
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      startTimestampRef.current = Date.now();
      setElapsedSec(0);
      setAudioResult(null);
      setState('recording');
      return true;
    } catch (err: any) {
      setError(err?.message || 'recording_error');
      setState('idle');
      return false;
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<RecordedAudioResult | null> => {
    if (state !== 'recording' && !recorder.isRecording) {
      return audioResult;
    }

    setState('processing');
    const recordedDuration = startTimestampRef.current
      ? Math.max(1, Math.round((Date.now() - startTimestampRef.current) / 1000))
      : Math.max(1, elapsedSec);
    startTimestampRef.current = null;

    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => {});

      const uri = recorder.uri || recorderState.url;
      if (!uri) {
        setState('idle');
        setError('empty_recording');
        return null;
      }

      const base64 = await readUriAsBase64(uri);
      const ext = uri.split('.').pop()?.toLowerCase();
      const mimeType =
        ext === 'wav'
          ? 'audio/wav'
          : ext === 'webm'
            ? 'audio/webm'
            : ext === '3gp'
              ? 'audio/3gpp'
              : 'audio/mp4';

      const result: RecordedAudioResult = {
        uri,
        base64,
        durationSec: recordedDuration,
        mimeType,
      };
      setAudioResult(result);
      setState('idle');
      return result;
    } catch (err: any) {
      setError(err?.message || 'stop_error');
      setState('idle');
      return null;
    }
  }, [audioResult, elapsedSec, recorder, recorderState.url, state]);

  const resetRecording = useCallback(async () => {
    if (recorder.isRecording) {
      try {
        await recorder.stop();
      } catch {
        // ignore
      }
    }
    startTimestampRef.current = null;
    setElapsedSec(0);
    setAudioResult(null);
    setError(null);
    setState('idle');
  }, [recorder]);

  return {
    state,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    durationSec,
    metering,
    audioResult,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
