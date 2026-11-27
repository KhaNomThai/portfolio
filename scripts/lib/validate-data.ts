import { createFile } from "mp4box";
import type { ProjectLabFigure } from "../../src/data.ts";
import { VIDEO_SIZE } from "../../src/config/experienceMedia.ts";
import { primOrder } from "../../src/lib/prim.ts";

export function labFigureErrors(id: string, f: ProjectLabFigure) {
  const errors: string[] = [];
  if (f.kind === "models" || f.kind === "benchmark") {
    if (!f.models.length || new Set(f.models.map(({ id }) => id)).size !== f.models.length) {
      errors.push(`labFigure ของ ${id} ต้องมีโมเดลและ id ต้องไม่ซ้ำ`);
    }
  }
  if (f.kind === "benchmark") {
    const values = [f.baselineRecall, f.baselinePrecision, ...f.models.flatMap(({ recall, precision }) => [recall, precision])];
    if (values.some((value) => !(value >= 0 && value <= 100))) {
      errors.push(`Recall และ precision ใน labFigure ของ ${id} ต้องอยู่ในช่วง 0–100`);
    }
  }
  if (f.kind === "gauge" && !(0 < f.warningCm && f.warningCm < f.criticalCm && f.criticalCm <= f.wheelCm && f.sampleCm >= 0 && f.sampleCm <= f.wheelCm)) {
    errors.push(`ลำดับเกณฑ์หรือค่าตัวอย่างของ gauge ใน ${id} ไม่ถูกต้อง`);
  }
  // ค่านอกช่วงแกนจะถูกวาดหลุดกรอบของ dumbbell
  if (f.kind === "dumbbell") {
    const [min, max] = f.scale;
    if (!f.rows.length || !(min < max)) errors.push(`dumbbell ของ ${id} ต้องมีข้อมูลและช่วงแกนที่ถูกต้อง`);
    for (const row of f.rows) {
      if ([row.student, row.model].some((v) => !(v >= min && v <= max))) errors.push(`"${row.label}" ใน labFigure ของ ${id} อยู่นอกช่วง ${min}–${max}`);
    }
  }
  if (f.kind !== "mst") return errors;
  const ids = new Set(f.nodes.map((n) => n.id));
  if (!ids.size || ids.size !== f.nodes.length) {
    errors.push(`กราฟ MST ของ ${id} ต้องมี vertex และ id ต้องไม่ซ้ำ`);
    return errors;
  }
  for (const e of f.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) errors.push(`เส้น ${e.from}-${e.to} ใน labFigure ของ ${id} ชี้ไป vertex ที่ไม่มี`);
  }
  if (primOrder(f.nodes[0].id, f.nodes.length, f.edges).length !== f.nodes.length - 1) errors.push(`กราฟ MST ของ ${id} ไม่เชื่อมกันครบทุก vertex`);
  return errors;
}

/** ตรวจ metadata ของไฟล์ที่ lightbox ต้องเล่น ใช้ Node เหมือนกันทั้งเครื่องและ CI */
export function validFieldVideo(buffer: Uint8Array) {
  try {
    const mp4 = createFile();
    mp4.appendBuffer(Object.assign(Uint8Array.from(buffer).buffer, { fileStart: 0 }));
    mp4.flush();
    const movie = mp4.getInfo();
    const [track] = movie.videoTracks;
    return movie.tracks.length === 1 && track !== undefined && track.nb_samples > 0 &&
      track.codec.startsWith("avc1.") && track.video?.width === VIDEO_SIZE.width && track.video.height === VIDEO_SIZE.height;
  } catch {
    return false;
  }
}
