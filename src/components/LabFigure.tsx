import { useId, useState, type ReactNode } from "react";
import type { ProjectLabFigure } from "../data";
import { primOrder } from "../lib/prim";

/**
 * กราฟและสเกลจำลองแบบโต้ตอบได้ (Interactive Lab Figure) บนการ์ดโปรเจกต์และหน้า explore
 * ข้อความและตัวเลขทั้งหมดมาจาก labFigure ใน src/data.ts (หัวกราฟคือ caption) component ไม่เติมตัวเลขเอง
 * ข้อความไม่ตัดด้วย truncate: ตัวเลขผลลัพธ์อยู่ในประโยคท้าย ตัดแล้วหลักฐานหาย และ title ใช้ไม่ได้บนจอสัมผัส
 * z-10: อยู่เหนือ stretched link (::after) ของชื่อโปรเจกต์ในการ์ด เพื่อให้กดปุ่มหรือเลื่อน slider ได้โดยไม่เปิดหน้า explore
 */
export default function LabFigure({ figure, className = "" }: { figure: ProjectLabFigure; className?: string }) {
  return (
    <div className={`relative z-10 rounded-control border border-rule bg-paper p-3.5 print:hidden ${className}`}>
      {figure.kind === "models" && <ModelsFigure figure={figure} />}
      {figure.kind === "benchmark" && <BenchmarkFigure figure={figure} />}
      {figure.kind === "dumbbell" && <DumbbellFigure figure={figure} />}
      {figure.kind === "gauge" && <GaugeFigure figure={figure} />}
      {figure.kind === "mst" && <MstFigure figure={figure} />}
    </div>
  );
}

/**
 * ปุ่มเล็กในกราฟ: ตัวปุ่มสูง 28px ให้กราฟยังกะทัดรัด แต่พื้นที่กด (::after) ยืดขึ้นลงข้างละ 8px เป็น 44px ตาม --target-min
 * ปุ่มเรียงแถวเดียวกันและเหนือ/ใต้ไม่มีสิ่งที่กดได้อื่นในระยะ 8px พื้นที่กดจึงไม่ทับกัน
 */
const BTN_BASE =
  "relative h-7 shrink-0 whitespace-nowrap rounded-tag border border-stroke bg-surface px-2.5 type-caption text-ink transition-colors duration-(--duration-fast) after:absolute after:inset-x-0 after:-inset-y-2";
const SMALL_BTN = `${BTN_BASE} enabled:hover:border-pen enabled:hover:text-pen disabled:opacity-60`;
const PILL_BTN = `${BTN_BASE} not-aria-pressed:hover:border-pen not-aria-pressed:hover:text-pen aria-pressed:border-pen aria-pressed:bg-pen aria-pressed:text-on-pen`;

/** หัวกราฟ: caption จาก data.ts ซ้าย ปุ่มหรือ legend ขวา (ตกบรรทัดได้เมื่อการ์ดแคบ) */
function FigureHeader({ caption, children, labelFor }: { caption: string; children?: ReactNode; labelFor?: string }) {
  const Caption = labelFor ? "label" : "p";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <Caption htmlFor={labelFor} className="min-w-0 flex-1 basis-48 type-caption font-medium text-ink">
        {caption}
      </Caption>
      {children}
    </div>
  );
}

/** แถบเปอร์เซ็นต์: ขยายด้วย scaleX (transform) ไม่เปลี่ยน layout ตอนสลับค่า */
function Bar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <span
      className={`absolute inset-0 origin-left transition-transform duration-(--duration-base) ease-out motion-reduce:transition-none ${tone}`}
      style={{ transform: `scaleX(${Math.min(100, Math.max(0, pct)) / 100})` }}
    />
  );
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${Number.isInteger(n) ? n : n.toFixed(1)}`;

/** สลับดูค่าของแต่ละโมเดลหรือส่วนประกอบ (เช่น 3 CNN ของ Derma AI หรือสถาปัตยกรรมของ This Portfolio) */
function ModelsFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "models" }> }) {
  const [activeId, setActiveId] = useState(figure.models[0].id);
  const current = figure.models.find((m) => m.id === activeId) ?? figure.models[0];

  return (
    <div className="grid gap-3">
      <FigureHeader caption={figure.caption}>
        <div role="group" aria-label="Select item" className="flex flex-wrap gap-1">
          {figure.models.map((m) => (
            <button key={m.id} type="button" aria-pressed={m.id === current.id} onClick={() => setActiveId(m.id)} className={PILL_BTN}>
              {m.name}
            </button>
          ))}
        </div>
      </FigureHeader>

      <dl className="grid grid-cols-2 gap-2.5">
        <div className="rounded-tag border border-rule bg-surface px-3 py-2">
          <dt className="type-caption text-ink-muted">{current.primaryLabel}</dt>
          <dd className="mt-0.5 break-words type-title tabular-nums text-ink">{current.primaryValue}</dd>
        </div>
        <div className="rounded-tag border border-rule bg-surface px-3 py-2">
          <dt className="type-caption text-ink-muted">{current.secondaryLabel}</dt>
          <dd className="mt-0.5 break-words type-small font-semibold tabular-nums text-ink">{current.secondaryValue}</dd>
        </div>
      </dl>

      <p className="type-caption text-ink-muted">{current.note}</p>
    </div>
  );
}

/** เทียบ Recall และ Precision ของแต่ละโมเดลกับเส้น baseline (Peak Electricity Day Alert) */
function BenchmarkFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "benchmark" }> }) {
  const [activeId, setActiveId] = useState(figure.models[0].id);
  const current = figure.models.find((m) => m.id === activeId) ?? figure.models[0];
  const rows = [
    { label: "Peak-day recall", value: current.recall, baseline: figure.baselineRecall, tone: "bg-pen" },
    { label: "Precision", value: current.precision, baseline: figure.baselinePrecision, tone: "bg-ink/75" },
  ];

  return (
    <div className="grid gap-3">
      <FigureHeader caption={figure.caption}>
        <div role="group" aria-label="Compare forecast models" className="flex flex-wrap gap-1">
          {figure.models.map((m) => (
            <button key={m.id} type="button" aria-pressed={m.id === current.id} onClick={() => setActiveId(m.id)} className={PILL_BTN}>
              {m.name}
            </button>
          ))}
        </div>
      </FigureHeader>

      <div className="grid gap-2.5 rounded-tag border border-rule bg-surface p-2.5">
        {rows.map((row) => {
          const diff = row.value - row.baseline;
          return (
            <div key={row.label}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-2 type-caption">
                <span className="text-ink-muted">{row.label}</span>
                <span className="tabular-nums text-ink">
                  <span className="font-semibold">{row.value}%</span>{" "}
                  <span className="text-ink-muted">
                    {diff === 0 ? "(= baseline)" : `(${signed(diff)} pts vs ${row.baseline}%)`}
                  </span>
                </span>
              </p>
              {/* เส้นแดงบาง = ค่า baseline */}
              <span aria-hidden="true" className="relative mt-1 block h-2 w-full overflow-hidden rounded-full bg-rule">
                <Bar pct={row.value} tone={row.tone} />
                <span className="absolute inset-y-0 w-0.5 bg-margin" style={{ left: `${row.baseline}%` }} />
              </span>
            </div>
          );
        })}
      </div>

      <p className="type-caption text-ink-muted">{current.note}</p>
    </div>
  );
}

/** สเกลจำลองระดับน้ำเทียบล้อรถอ้างอิง (Smart Flood AI): ลาก slider แล้วเห็นสถานะตามเกณฑ์จริงของระบบ */
function GaugeFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "gauge" }> }) {
  const sliderId = useId();
  const [depthCm, setDepthCm] = useState(figure.sampleCm);
  const { wheelCm, warningCm, criticalCm } = figure;
  const pctWheel = Math.round((depthCm / wheelCm) * 100);
  const status = depthCm >= criticalCm ? "Critical" : depthCm >= warningCm ? "Warning" : "Normal";
  const badgeTone =
    status === "Critical"
      ? "border-margin bg-margin/15 text-ink"
      : status === "Warning"
        ? "border-on-marker/50 bg-marker text-on-marker"
        : "border-stroke bg-surface text-ink";
  const at = (cm: number) => `${(cm / wheelCm) * 100}%`;

  return (
    <div className="grid gap-3">
      <FigureHeader caption={figure.caption} labelFor={sliderId}>
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`inline-flex h-7 items-center whitespace-nowrap rounded-tag border px-2.5 type-caption font-semibold tabular-nums ${badgeTone}`}
          >
            {depthCm} cm ({pctWheel}%) · {status}
          </span>
          <button type="button" onClick={() => setDepthCm(figure.sampleCm)} className={SMALL_BTN}>
            Reset
          </button>
        </div>
      </FigureHeader>

      <div className="rounded-tag border border-rule bg-surface px-2.5 pt-2.5">
        {/* ป้ายตัวเลขวางตรงตำแหน่ง tick จริง (ไม่ใช่ justify-between) */}
        <div aria-hidden="true" className="relative h-4 type-caption tabular-nums text-ink-muted">
          <span className="absolute left-0">0</span>
          <span className="absolute -translate-x-1/2" style={{ left: at(warningCm) }}>
            {warningCm}
          </span>
          <span className="absolute -translate-x-1/2 font-semibold text-ink" style={{ left: at(criticalCm) }}>
            {criticalCm}
          </span>
          <span className="absolute right-0">{wheelCm} cm</span>
        </div>
        <span aria-hidden="true" className="relative mt-1 block h-2.5 w-full overflow-hidden rounded-full bg-rule">
          <Bar pct={(depthCm / wheelCm) * 100} tone="bg-pen" />
          <span className="absolute inset-y-0 w-0.5 bg-stroke" style={{ left: at(warningCm) }} />
          <span className="absolute inset-y-0 w-0.5 bg-margin" style={{ left: at(criticalCm) }} />
        </span>
        {/* h-11: ตัว slider สูงเท่า --target-min สเกล 0–wheelCm เดียวกับแถบข้างบน ปุ่มลากจึงตรงปลายแถบ */}
        <input
          id={sliderId}
          type="range"
          min={0}
          max={wheelCm}
          step={1}
          value={depthCm}
          aria-valuetext={`${depthCm} cm, ${pctWheel}% of the wheel, ${status}`}
          onChange={(e) => setDepthCm(Number(e.target.value))}
          className="block h-11 w-full cursor-pointer accent-pen"
        />
      </div>

      <p className="type-caption text-ink-muted">
        Warning from {warningCm} cm · critical from {criticalCm} cm · {figure.sampleLabel}
      </p>
    </div>
  );
}

/** Dumbbell เทียบสองสัดส่วนต่อหัวข้อ: อ่านครบในครั้งเดียว ไม่ต้องกด ประโยคท้ายสรุปช่องว่างที่กว้างที่สุด */
function DumbbellFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "dumbbell" }> }) {
  const widest = figure.rows.reduce((a, b) => (Math.abs(b.student - b.model) > Math.abs(a.student - a.model) ? b : a));
  // สเกล 15–45% ขยายให้เห็นระยะห่างชัด ค่าทั้งหมดในข้อมูลอยู่ในช่วงนี้
  const toPct = (v: number) => Math.min(96, Math.max(4, ((v - 15) / 30) * 100));

  return (
    <div className="grid gap-3">
      <FigureHeader caption={figure.caption}>
        <div aria-hidden="true" className="flex items-center gap-2.5 type-caption text-ink-muted">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="size-2.5 rounded-full border border-on-marker bg-marker" />
            {figure.leftLegend}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <span className="size-2.5 rounded-full bg-pen" />
            {figure.rightLegend}
          </span>
        </div>
      </FigureHeader>

      <ul className="grid gap-1.5 rounded-tag border border-rule bg-surface p-2.5">
        {figure.rows.map((row) => {
          const left = toPct(Math.min(row.student, row.model));
          const right = toPct(Math.max(row.student, row.model));
          return (
            // จอแคบ: ชื่อหัวข้ออยู่บรรทัดบน แถบได้ความกว้างเต็ม (ถ้าวางสามคอลัมน์ แถบเหลือไม่กี่ px)
            <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-1.5 py-1 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
              <span className="col-span-2 type-caption font-medium text-ink sm:col-span-1">{row.label}</span>
              <span aria-hidden="true" className="relative flex h-2 items-center rounded-full bg-rule">
                <span className="absolute h-1 bg-margin" style={{ left: `${left}%`, width: `${right - left}%` }} />
                <span
                  className="absolute size-2.5 -translate-x-1/2 rounded-full border border-on-marker bg-marker"
                  style={{ left: `${toPct(row.student)}%` }}
                />
                <span className="absolute size-2.5 -translate-x-1/2 rounded-full bg-pen" style={{ left: `${toPct(row.model)}%` }} />
              </span>
              <span className="whitespace-nowrap text-right type-caption tabular-nums text-ink-muted">
                <span className="sr-only">{figure.leftLegend}: </span>
                <span className="text-ink">{Math.round(row.student)}%</span> vs <span className="sr-only">{figure.rightLegend}: </span>
                <span className="font-semibold text-pen">{Math.round(row.model)}%</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="type-caption text-ink-muted">
        Widest gap — {widest.label}: students {widest.student.toFixed(1)}% vs model {widest.model.toFixed(1)}% (
        {signed(Number((widest.student - widest.model).toFixed(1)))} pts)
      </p>
    </div>
  );
}

/** เดินทีละขั้นของ Prim บนกราฟตัวอย่าง (Prim's Algorithm Visualizer) */
function MstFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "mst" }> }) {
  const startId = figure.nodes[0].id;
  const order = primOrder(startId, figure.nodes.length, figure.edges);
  const maxStep = order.length;
  const [step, setStep] = useState(maxStep);

  const chosen = order.slice(0, step);
  const chosenEdges = new Set(chosen.map((c) => c.edge));
  const totalCost = chosen.reduce((sum, c) => sum + c.edge.weight, 0);
  const reached = new Set([startId, ...chosen.map((c) => c.to)]);
  const latest = chosen.at(-1);
  const node = (id: number) => figure.nodes.find((n) => n.id === id)!;

  return (
    <div className="grid gap-3">
      <FigureHeader caption={figure.caption}>
        <div role="group" aria-label="Algorithm step" className="flex items-center gap-1">
          <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className={SMALL_BTN}>
            <span aria-hidden="true">←</span> Back
          </button>
          <button type="button" disabled={step === maxStep} onClick={() => setStep((s) => s + 1)} className={SMALL_BTN}>
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
      </FigureHeader>

      <div className="flex items-center justify-between gap-3 rounded-tag border border-rule bg-surface px-3 py-2">
        <svg viewBox="0 0 190 96" aria-hidden="true" className="h-[5rem] w-40 shrink-0 overflow-visible">
          {figure.edges.map((e) => {
            const u = node(e.from);
            const v = node(e.to);
            const inTree = chosenEdges.has(e);
            return (
              <g key={`${e.from}-${e.to}`}>
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  className={inTree ? "stroke-pen" : "stroke-stroke"}
                  strokeWidth={inTree ? 2.5 : 1.25}
                  strokeDasharray={inTree ? undefined : "3 3"}
                />
                <text x={(u.x + v.x) / 2} y={(u.y + v.y) / 2 - 4} textAnchor="middle" className="fill-ink-muted text-12 tabular-nums">
                  {e.weight}
                </text>
              </g>
            );
          })}
          {figure.nodes.map((n) => {
            const active = reached.has(n.id);
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={10} className={active ? "fill-pen stroke-pen" : "fill-paper stroke-stroke"} strokeWidth={1.5} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" className={`text-12 font-semibold tabular-nums ${active ? "fill-on-pen" : "fill-ink"}`}>
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="min-w-0 flex-1 text-right">
          <p className="type-caption text-ink-muted">Tree cost</p>
          <p className="mt-0.5 whitespace-nowrap type-title tabular-nums text-ink">
            {totalCost} {figure.unit}
          </p>
          <p className="mt-0.5 whitespace-nowrap type-caption tabular-nums text-ink-muted">
            {reached.size}/{figure.nodes.length} vertices
          </p>
        </div>
      </div>

      {/* aria-live: กด Back/Next แล้ว screen reader อ่านขั้นที่เพิ่งเปลี่ยน */}
      <p aria-live="polite" className="type-caption text-ink-muted">
        {latest
          ? `Step ${step}/${maxStep}: cheapest edge leaving the tree is ${latest.from} → ${latest.to} (${latest.edge.weight} ${figure.unit})`
          : `Step 0/${maxStep}: start from vertex ${startId}`}
      </p>
    </div>
  );
}
