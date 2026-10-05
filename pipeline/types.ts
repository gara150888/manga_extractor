import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = "C:\\Users\\vg312\\OneDrive\\Documents\\ultra";
const INPUT_DIR = path.join(ROOT, "input");
const OUTPUT_DIR = path.join(ROOT, "output");
export const TTS_DIR = path.join(OUTPUT_DIR, "tts");
export const CROPS_DIR = path.join(OUTPUT_DIR, "crops");
export const BEATS_DIR = path.join(OUTPUT_DIR, "beats");
const TIMELINE_PATH = path.join(OUTPUT_DIR, "timeline.json");

export interface FocusBbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BeatTiming {
  start: number | null;
  end: number | null;
  estimated_duration: number;
  status: string;
  actual_duration?: number;
}

export interface Camera {
  motion: string;
  start_scale: number;
  end_scale: number;
  focus_x: number;
  focus_y: number;
}

export interface VisualMatch {
  page_id: string;
  panel_id: string;
  region_id: string;
  confidence: number;
  reason: string;
  focus_bbox: number[];
}

export interface Beat {
  beat_id: string;
  text: string;
  source_char_start: number;
  source_char_end: number;
  visual_match: VisualMatch;
  timing: BeatTiming;
  camera: Camera;
  audio_path?: string;
  crop_bbox?: number[];
}

export interface Timeline {
  project: Record<string, unknown>;
  story: Record<string, unknown>;
  pages: Record<string, unknown>[];
  panels: Record<string, unknown>[];
  regions: Record<string, unknown>[];
  narration: {
    full_script: string;
    beats: Beat[];
  };
  timeline: Array<Record<string, unknown>>;
  global_notes: string[];
}

export function loadTimeline(): Timeline {
  if (!fs.existsSync(TIMELINE_PATH)) {
    throw new Error(`Timeline JSON not found: ${TIMELINE_PATH}`);
  }
  const raw = fs.readFileSync(TIMELINE_PATH, "utf8");
  const data = JSON.parse(raw) as Timeline;
  return data;
}

export function saveTimeline(data: Timeline) {
  fs.writeFileSync(TIMELINE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function getInputImagePath(pageId: string): string {
  const num = parseInt(pageId.replace("p", ""), 10);
  return path.join(INPUT_DIR, `${num}.jpg`);
}

export function getTtsOutputPath(beatId: string): string {
  return path.join(TTS_DIR, `${beatId}.wav`);
}

export function getBeatVideoPath(beatId: string): string {
  return path.join(BEATS_DIR, `${beatId}.mp4`);
}

export function ensureDirs() {
  [OUTPUT_DIR, TTS_DIR, CROPS_DIR, BEATS_DIR].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
}

export function parseFocusBbox(raw: number[]): FocusBbox {
  if (!Array.isArray(raw) || raw.length !== 4) {
    throw new Error(`Invalid focus_bbox: ${JSON.stringify(raw)}`);
  }
  return {
    x: raw[0],
    y: raw[1],
    width: raw[2],
    height: raw[3],
  };
}

export function computeCropForFocus(
  imgWidth: number,
  imgHeight: number,
  focus: FocusBbox,
  targetAspect: number = 9 / 16,
  scale: number = 1.3
): { x: number; y: number; width: number; height: number } {
  const focusCx = focus.x + focus.width / 2;
  const focusCy = focus.y + focus.height / 2;

  let cropWidth: number;
  let cropHeight: number;

  if (imgWidth / imgHeight > targetAspect) {
    cropHeight = imgHeight / scale;
    cropWidth = cropHeight * targetAspect;
  } else {
    cropWidth = imgWidth / scale;
    cropHeight = cropWidth / targetAspect;
  }

  cropWidth = Math.min(cropWidth, imgWidth);
  cropHeight = Math.min(cropHeight, imgHeight);

  let cropX = focusCx - cropWidth / 2;
  let cropY = focusCy - cropHeight / 2;

  cropX = Math.max(0, Math.min(cropX, imgWidth - cropWidth));
  cropY = Math.max(0, Math.min(cropY, imgHeight - cropHeight));

  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}

export function buildConcatFile(beatFiles: string[], outPath: string) {
  const lines = beatFiles
    .map((f) => `file '${f.replace(/\\/g, "/")}'`)
    .join("\n");
  fs.writeFileSync(outPath, lines, "utf8");
}

export function probeAudioDuration(wavPath: string): number {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`;
  try {
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    const dur = parseFloat(out);
    if (!Number.isFinite(dur) || dur <= 0) {
      throw new Error(`Invalid duration from ffprobe: ${out}`);
    }
    return dur;
  } catch (err) {
    throw new Error(`Failed to probe ${wavPath}: ${err}`);
  }
}

export function probeImageDimensions(imagePath: string): { width: number; height: number } {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${imagePath}"`;
  try {
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    const [w, h] = out.split("x").map(Number);
    if (!w || !h) throw new Error(`Invalid dimensions: ${out}`);
    return { width: w, height: h };
  } catch (err) {
    throw new Error(`Failed to probe image ${imagePath}: ${err}`);
  }
}
