import fs from "node:fs";
import path from "node:path";
import { loadTimeline } from "./types.js";
export function validateJson() {
    console.log("[validate-json] Loading timeline JSON...");
    const data = loadTimeline();
    console.log(`[validate-json] Loaded. Project: ${data.project.type}, language: ${data.project.language}`);
    console.log(`[validate-json] Pages: ${data.pages.length}, regions: ${data.regions.length}, beats: ${data.narration.beats.length}`);
    if (!data.narration.beats.length) {
        throw new Error("No beats found in timeline JSON");
    }
    for (const beat of data.narration.beats) {
        if (!beat.beat_id)
            throw new Error(`Beat missing beat_id`);
        if (!beat.text)
            throw new Error(`Beat ${beat.beat_id} missing text`);
        if (!beat.visual_match)
            throw new Error(`Beat ${beat.beat_id} missing visual_match`);
        if (!Array.isArray(beat.visual_match.focus_bbox) || beat.visual_match.focus_bbox.length !== 4) {
            throw new Error(`Beat ${beat.beat_id} has invalid focus_bbox`);
        }
        if (!beat.camera)
            throw new Error(`Beat ${beat.beat_id} missing camera`);
    }
    // Verify all referenced images exist
    for (const page of data.pages) {
        const pageId = page.page_id;
        const imgPath = path.join("input", `${pageId.replace("p", "")}.jpg`);
        if (!fs.existsSync(imgPath)) {
            console.warn(`[validate-json] Warning: image not found for ${pageId}: ${imgPath}`);
        }
    }
    console.log("[validate-json] Validation passed.");
    return data;
}
