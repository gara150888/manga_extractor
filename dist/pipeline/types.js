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
export function loadTimeline() {
    if (!fs.existsSync(TIMELINE_PATH)) {
        throw new Error(`Timeline JSON not found: ${TIMELINE_PATH}`);
    }
    const raw = fs.readFileSync(TIMELINE_PATH, "utf8");
    const data = JSON.parse(raw);
    return data;
}
export function saveTimeline(data) {
    fs.writeFileSync(TIMELINE_PATH, JSON.stringify(data, null, 2), "utf8");
}
export function getInputImagePath(pageId) {
    const num = parseInt(pageId.replace("p", ""), 10);
    return path.join(INPUT_DIR, `${num}.jpg`);
}
export function getTtsOutputPath(beatId) {
    return path.join(TTS_DIR, `${beatId}.wav`);
}
export function getBeatVideoPath(beatId) {
    return path.join(BEATS_DIR, `${beatId}.mp4`);
}
export function ensureDirs() {
    [OUTPUT_DIR, TTS_DIR, CROPS_DIR, BEATS_DIR].forEach((dir) => {
        fs.mkdirSync(dir, { recursive: true });
    });
}
export function parseFocusBbox(raw) {
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
export function computeCropForFocus(imgWidth, imgHeight, focus, targetAspect = 9 / 16, scale = 1.3) {
    const focusCx = focus.x + focus.width / 2;
    const focusCy = focus.y + focus.height / 2;
    let cropWidth;
    let cropHeight;
    if (imgWidth / imgHeight > targetAspect) {
        cropHeight = imgHeight / scale;
        cropWidth = cropHeight * targetAspect;
    }
    else {
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
export function buildConcatFile(beatFiles, outPath) {
    const lines = beatFiles
        .map((f) => `file '${f.replace(/\\/g, "/")}'`)
        .join("\n");
    fs.writeFileSync(outPath, lines, "utf8");
}
export function probeAudioDuration(wavPath) {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`;
    try {
        const out = execSync(cmd, { encoding: "utf8" }).trim();
        const dur = parseFloat(out);
        if (!Number.isFinite(dur) || dur <= 0) {
            throw new Error(`Invalid duration from ffprobe: ${out}`);
        }
        return dur;
    }
    catch (err) {
        throw new Error(`Failed to probe ${wavPath}: ${err}`);
    }
}
export function probeImageDimensions(imagePath) {
    const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${imagePath}"`;
    try {
        const out = execSync(cmd, { encoding: "utf8" }).trim();
        const [w, h] = out.split("x").map(Number);
        if (!w || !h)
            throw new Error(`Invalid dimensions: ${out}`);
        return { width: w, height: h };
    }
    catch (err) {
        throw new Error(`Failed to probe image ${imagePath}: ${err}`);
    }
}
