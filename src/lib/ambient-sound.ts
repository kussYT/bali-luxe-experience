export const AMBIENT_AUDIO_SRC = "/audio/ambient.mp3";
export const AMBIENT_STORAGE_KEY = "bingin-ambient-sound";
export const AMBIENT_DEFAULT_VOLUME = 0.22;
export const AMBIENT_FADE_MS = 2200;

export type AmbientPreference = "on" | "off";

export function readAmbientPreference(): AmbientPreference | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(AMBIENT_STORAGE_KEY);
  if (v === "on" || v === "off") return v;
  return null;
}

export function writeAmbientPreference(value: AmbientPreference) {
  localStorage.setItem(AMBIENT_STORAGE_KEY, value);
}
