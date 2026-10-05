import fs from "node:fs";
import { execSync } from "node:child_process";
function probeAudioDuration(wavPath) {
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
export function extractDurations(data) {
    console.log("[extract-durations] Probing audio durations...");
    const beats = data.narration.beats;
    for (let i = 0; i < beats.length; i++) {
        const beat = beats[i];
        if (!beat.audio_path) {
            throw new Error(`Beat ${beat.beat_id} has no audio_path. Run generate-tts first.`);
        }
        if (!fs.existsSync(beat.audio_path)) {
            throw new Error(`Audio file not found: ${beat.audio_path}`);
        }
        const dur = probeAudioDuration(beat.audio_path);
        beat.timing.actual_duration = dur;
        beat.timing.status = "ready";
        console.log(`[extract-durations] [${i + 1}/${beats.length}] ${beat.beat_id}: ${dur.toFixed(3)}s`);
    }
    console.log("[extract-durations] Done.");
    return data;
}
