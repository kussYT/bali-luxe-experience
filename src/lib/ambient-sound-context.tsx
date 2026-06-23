import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AMBIENT_AUDIO_SRC,
  AMBIENT_DEFAULT_VOLUME,
  AMBIENT_FADE_MS,
  writeAmbientPreference,
} from "@/lib/ambient-sound";
import { useSiteContent } from "@/lib/content-context";

type AmbientSoundContextValue = {
  enabled: boolean;
  ready: boolean;
  toggle: () => void;
  enable: () => Promise<void>;
  disable: () => void;
};

const AmbientSoundContext = createContext<AmbientSoundContextValue | null>(null);

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  onDone?: () => void,
) {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    audio.volume = from + (to - from) * t;
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

export function AmbientSoundProvider({ children }: { children: ReactNode }) {
  const { homepage } = useSiteContent();
  const audioSrc = homepage.ambientSound?.audioSrc?.trim() || AMBIENT_AUDIO_SRC;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.preload = "metadata";
    audio.volume = 0;
    audioRef.current = audio;

    const onCanPlay = () => setReady(true);
    const onError = () => setReady(false);

    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
      setEnabled(false);
    };
  }, [audioSrc]);

  const disable = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    writeAmbientPreference("off");
    setEnabled(false);
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    fadeVolume(audio, audio.volume, 0, AMBIENT_FADE_MS * 0.6, () => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  const enable = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    writeAmbientPreference("on");
    setEnabled(true);
    audio.volume = 0;
    try {
      await audio.play();
      if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
      fadeVolume(audio, 0, AMBIENT_DEFAULT_VOLUME, AMBIENT_FADE_MS);
    } catch {
      setEnabled(false);
      writeAmbientPreference("off");
    }
  }, []);

  const toggle = useCallback(() => {
    if (enabled) disable();
    else void enable();
  }, [enabled, disable, enable]);

  return (
    <AmbientSoundContext.Provider value={{ enabled, ready, toggle, enable, disable }}>
      {children}
    </AmbientSoundContext.Provider>
  );
}

export function useAmbientSound() {
  const ctx = useContext(AmbientSoundContext);
  if (!ctx) throw new Error("useAmbientSound must be used within AmbientSoundProvider");
  return ctx;
}
