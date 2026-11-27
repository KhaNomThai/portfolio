import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { primOrder } from "../../src/lib/prim.ts";
import { labFigureErrors, validFieldVideo } from "./validate-data.ts";

test("ตรวจข้อมูลกราฟว่าง ค่าซ้ำ และค่านอกช่วงที่ UI ใช้", () => {
  const model = { id: "a", name: "A", recall: 65, precision: 95, note: "" };
  const benchmark = { kind: "benchmark" as const, caption: "", recallLabel: "Recall", precisionLabel: "Precision", baselineRecall: 50, baselinePrecision: 90 };
  assert.deepEqual(labFigureErrors("benchmark", { ...benchmark, models: [model] }), []);
  assert.match(labFigureErrors("benchmark", { ...benchmark, models: [] }).join(), /ต้องมีโมเดล/);
  assert.match(labFigureErrors("benchmark", { ...benchmark, models: [model, model] }).join(), /id ต้องไม่ซ้ำ/);
  assert.match(labFigureErrors("benchmark", { ...benchmark, models: [{ ...model, recall: 101 }] }).join(), /0–100/);
  assert.match(labFigureErrors("gauge", { kind: "gauge", caption: "", sampleLabel: "", sampleCm: 20, wheelCm: 60, warningCm: 40, criticalCm: 30 }).join(), /ลำดับเกณฑ์/);
  assert.match(labFigureErrors("dumbbell", { kind: "dumbbell", caption: "", leftLegend: "", rightLegend: "", scale: [10, 20], rows: [{ label: "A", student: 21, model: 15 }] }).join(), /อยู่นอกช่วง/);
});

test("ตรวจลำดับ Prim และปฏิเสธกราฟว่างหรือกราฟที่เชื่อมไม่ครบ", () => {
  const nodes = [1, 2, 3].map((id) => ({ id, x: 0, y: 0 }));
  const edges = [{ from: 1, to: 2, weight: 5 }, { from: 1, to: 3, weight: 1 }, { from: 2, to: 3, weight: 2 }];
  const mst = { kind: "mst" as const, caption: "", unit: "", nodes, edges };
  assert.deepEqual(primOrder(1, 3, edges).map(({ from, to }) => [from, to]), [[1, 3], [3, 2]]);
  assert.deepEqual(labFigureErrors("mst", mst), []);
  assert.match(labFigureErrors("mst", { ...mst, nodes: [] }).join(), /ต้องมี vertex/);
  assert.match(labFigureErrors("mst", { ...mst, edges: edges.slice(0, 1) }).join(), /ไม่เชื่อมกัน/);
});

test("ตรวจวิดีโอที่ใช้จริงและปฏิเสธไฟล์ที่ไม่ใช่ MP4", () => {
  const source = readFileSync(new URL("../../src/assets/videos/katang/kbtg-mascot-1.mp4", import.meta.url));
  assert.equal(validFieldVideo(source), true);
  assert.equal(validFieldVideo(Buffer.from("not a video")), false);
});
