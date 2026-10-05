import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { Timeline, getBeatVideoPath, BEATS_DIR } from "./types.js";

export function mergeClips(data: Timeline): string {
  console.log("[merge] Concatenating clips into final.mp4...");
  const beats = data.narration.beats;
  const finalPath = path.join(BEATS_DIR, "..", "final.mp4");
  const concatListPath = path.join(BEATS_DIR, "concat.txt");

  const files: string[] = [];
  for (const beat of beats) {
    const v = getBeatVideoPath(beat.beat_id);
    if (!fs.existsSync(v)) {
      throw new Error(`Beat video missing: ${v}`);
    }
    files.push(v);
  }

  // Build concat file
  const lines = files.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(concatListPath, lines, "utf8");

  try {
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${finalPath}"`;
    execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  } catch (err) {
    console.error("[merge] concat copy failed, trying re-encode...");
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p "${finalPath}"`;
    execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  }

  const finalSize = fs.statSync(finalPath).size;
  console.log(`[merge] final.mp4 written: ${(finalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[merge] Path: ${finalPath}`);
  return finalPath;
}
