import fs from "node:fs";
import { execSync } from "node:child_process";
import { getInputImagePath, computeCropForFocus, parseFocusBbox } from "./types.js";
function probeImageDimensions(imagePath) {
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
export function computeCrops(data) {
    console.log("[compute-crops] Calculating 9:16 focus crops...");
    const beats = data.narration.beats;
    // Cache image dimensions
    const dimCache = new Map();
    for (let i = 0; i < beats.length; i++) {
        const beat = beats[i];
        const pageId = beat.visual_match.page_id;
        let dims = dimCache.get(pageId);
        if (!dims) {
            const imgPath = getInputImagePath(pageId);
            if (!fs.existsSync(imgPath)) {
                throw new Error(`Image not found for page ${pageId}: ${imgPath}`);
            }
            dims = probeImageDimensions(imgPath);
            dimCache.set(pageId, dims);
        }
        const focus = parseFocusBbox(beat.visual_match.focus_bbox);
        const crop = computeCropForFocus(dims.width, dims.height, focus, 9 / 16, 1.3);
        beat.crop_bbox = [crop.x, crop.y, crop.width, crop.height];
        console.log(`[compute-crops] [${i + 1}/${beats.length}] ${beat.beat_id}: page=${pageId} img=${dims.width}x${dims.height} crop=(${crop.x},${crop.y},${crop.width},${crop.height})`);
    }
    console.log("[compute-crops] Done.");
    return data;
}
