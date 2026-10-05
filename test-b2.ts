import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { Timeline, loadTimeline, ensureDirs, getInputImagePath, getBeatVideoPath, probeImageDimensions, probeAudioDuration } from "./pipeline/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildFilter(
  crop: { x: number; y: number; width: number; height: number },
  motion: string,
  duration: number,
  imgWidth: number,
  imgHeight: number,
  targetWidth: number = 1080,
  targetHeight: number = 1920
): string {
  const fps = 30;
  const N = Math.max(1, Math.ceil(duration * fps));

  const cropX = Math.round(crop.x);
  const cropY = Math.round(crop.y);
  const cropW = Math.round(crop.width);
  const cropH = Math.round(crop.height);

  const focusRelX = crop.x + crop.width / 2 - cropX;
  const focusRelY = crop.y + crop.height / 2 - cropY;

  const UP = 2;
  const upW = cropW * UP;
  const upH = cropH * UP;
  const upFocusX = focusRelX * UP;
  const upFocusY = focusRelY * UP;

  const MAX_ZOOM = 1.15;

  let zExpr: string;
  let xExpr: string;
  let yExpr: string;

  switch (motion) {
    case "zoom_in": {
      const z0 = 1.0;
      const z1 = MAX_ZOOM;
      const dz = z1 - z0;
      zExpr = `${z0.toFixed(2)}+n/${N}*${dz.toFixed(2)}`;
      const x1 = Math.max(0, Math.min(upFocusX - upW / z1 / 2, upW - upW / z1));
      const y1 = Math.max(0, Math.min(upFocusY - upH / z1 / 2, upH - upH / z1));
      xExpr = `0+n/${N}*${x1.toFixed(1)}`;
      yExpr = `0+n/${N}*${y1.toFixed(1)}`;
      break;
    }
    case "zoom_out": {
      const z0 = MAX_ZOOM;
      const z1 = 1.0;
      const dz = z0 - z1;
      zExpr = `${z1.toFixed(2)}+n/${N}*${dz.toFixed(2)}`;
      const x0 = Math.max(0, Math.min(upFocusX - upW / z0 / 2, upW - upW / z0));
      const y0 = Math.max(0, Math.min(upFocusY - upH / z0 / 2, upH - upH / z0));
      xExpr = `0+n/${N}*${x0.toFixed(1)}`;
      yExpr = `0+n/${N}*${y0.toFixed(1)}`;
      break;
    }
    case "pan_left":
    case "pan_right": {
      const z = 1.05;
      zExpr = z.toFixed(2);
      const viewW = upW / z;
      const viewH = upH / z;
      const xCenter = upFocusX - viewW / 2;
      const yCenter = upFocusY - viewH / 2;
      const panW = viewW * 0.1;

      if (motion === "pan_left") {
        const x0 = Math.max(0, xCenter - panW);
        const x1 = Math.min(upW - viewW, xCenter + panW);
        xExpr = `${x0.toFixed(1)}+n/${N}*${(x1 - x0).toFixed(1)}`;
      } else {
        const x0 = Math.min(upW - viewW, xCenter + panW);
        const x1 = Math.max(0, xCenter - panW);
        xExpr = `${x0.toFixed(1)}+n/${N}*${(x1 - x0).toFixed(1)}`;
      }
      yExpr = Math.max(0, Math.min(yCenter, upH - viewH)).toFixed(1);
      break;
    }
    default: {
      zExpr = "1.00";
      xExpr = "0";
      yExpr = "0";
    }
  }

  const maxX = (upW - upW / MAX_ZOOM).toFixed(1);
  const maxY = (upH - upH / MAX_ZOOM).toFixed(1);
  xExpr = `min(max(${xExpr},0),${maxX})`;
  yExpr = `min(max(${yExpr},0),${maxY})`;

  return `crop=${cropW}:${cropH}:${cropX}:${cropY},scale=${upW}:${upH},zoompan=z='${zExpr}':x='${xExpr}':y='${yExpr}':fps=${fps},scale=${targetWidth}:${targetHeight}`;
}

function renderBeat(beatId: string) {
  const data = loadTimeline();
  ensureDirs();
  const beat = data.narration.beats.find((b) => b.beat_id === beatId);
  if (!beat) throw new Error(`Beat ${beatId} not found`);
  if (!beat.audio_path || !fs.existsSync(beat.audio_path)) throw new Error(`Audio missing for ${beatId}`);
  if (!beat.crop_bbox) throw new Error(`Crop missing for ${beatId}`);

  const imgPath = getInputImagePath(beat.visual_match.page_id);
  if (!fs.existsSync(imgPath)) throw new Error(`Image not found: ${imgPath}`);

  const outPath = getBeatVideoPath(beat.beat_id);
  const crop = { x: beat.crop_bbox[0], y: beat.crop_bbox[1], width: beat.crop_bbox[2], height: beat.crop_bbox[3] };
  const dims = probeImageDimensions(imgPath);
  const audioDuration = probeAudioDuration(beat.audio_path);
  const duration = audioDuration;
  const filter = buildFilter(crop, beat.camera.motion, duration, dims.width, dims.height);

  console.log(`Rendering ${beatId}...`);
  console.log(`  image: ${dims.width}x${dims.height}`);
  console.log(`  crop: (${crop.x},${crop.y},${crop.width},${crop.height})`);
  console.log(`  audio: ${audioDuration.toFixed(3)}s`);
  console.log(`  motion: ${beat.camera.motion}`);
  console.log(`  filter: ${filter}`);

  const fps = 30;
  const cmd = `ffmpeg -y -loop 1 -framerate ${fps} -i "${imgPath}" -i "${beat.audio_path}" -tune stillimage -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -vf "${filter}" -t ${duration.toFixed(3)} "${outPath}"`;
  console.log(`  cmd: ${cmd}`);
  execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  console.log(`Done: ${outPath}`);
}

renderBeat("b2");
