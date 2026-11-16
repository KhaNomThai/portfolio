import { useId, useState } from "react";
import type { ProjectLabFigure } from "../data";

/**
 * กราฟและสเกลจำลองแบบโต้ตอบได้ (Interactive Lab Figure) บนการ์ดโปรเจกต์และหน้า explore
 * ใช้ตัวเลขจริงจาก repo/notebook ใน src/data.ts เท่านั้น และคุมความสูงของแต่ละโหมดให้สมดุลกันเมื่อวางคู่กันในตาราง 2 คอลัมน์
 * z-10: อยู่เหนือ stretched link (::after) ของชื่อโปรเจกต์ในการ์ด เพื่อให้กดสลับโมเดลหรือเลื่อน slider ได้โดยไม่เปิดหน้า explore ทันที
 */
export default function LabFigure({ figure, className = "" }: { figure: ProjectLabFigure; className?: string }) {
  return (
    <div className={`relative z-10 flex flex-col justify-between rounded-control border border-rule bg-paper p-3.5 print:hidden ${className}`}>
      {figure.kind === "models" && <ModelsFigure figure={figure} />}
      {figure.kind === "benchmark" && <BenchmarkFigure figure={figure} />}
      {figure.kind === "dumbbell" && <DumbbellFigure figure={figure} />}
      {figure.kind === "gauge" && <GaugeFigure figure={figure} />}
      {figure.kind === "mst" && <MstFigure figure={figure} />}
    </div>
  );
}

const PILL_BTN =
  "h-7 shrink-0 whitespace-nowrap rounded-tag border border-stroke bg-surface px-2.5 type-caption text-ink transition-colors duration-(--duration-fast) not-aria-pressed:hover:border-pen not-aria-pressed:hover:text-pen aria-pressed:border-pen aria-pressed:bg-pen aria-pressed:text-on-pen";

/** สลับดูผลเทรนจริงของแต่ละสถาปัตยกรรมโมเดล (เช่น 3 CNN ของ Derma AI หรือสถาปัตยกรรมของ This Portfolio) */
function ModelsFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "models" }> }) {
  const [activeId, setActiveId] = useState(figure.models[0].id);
  const current = figure.models.find((m) => m.id === activeId) ?? figure.models[0];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate type-caption text-ink-muted">{figure.caption}</p>
        <div role="group" aria-label="Select item" className="flex flex-wrap gap-1">
          {figure.models.map((m) => (
            <button key={m.id} type="button" aria-pressed={m.id === current.id} onClick={() => setActiveId(m.id)} className={PILL_BTN}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        <div className="rounded-tag border border-rule bg-surface px-3 py-2">
          <dt className="truncate type-caption text-ink-muted">{current.primaryLabel}</dt>
          <dd className="mt-0.5 truncate type-title tabular-nums text-ink">{current.primaryValue}</dd>
        </div>
        <div className="rounded-tag border border-rule bg-surface px-3 py-2">
          <dt className="truncate type-caption text-ink-muted">{current.secondaryLabel}</dt>
          <dd className="mt-0.5 truncate type-small font-semibold tabular-nums text-ink">{current.secondaryValue}</dd>
        </div>
      </dl>

      <p className="type-caption text-ink-muted">{current.note}</p>
    </div>
  );
}

/** เทียบ Recall และ Precision กับเส้นเกณฑ์ Baseline (Peak Electricity Day Alert — วางคู่กับ GaugeFigure) */
function BenchmarkFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "benchmark" }> }) {
  const [activeId, setActiveId] = useState(figure.models[0].id);
  const current = figure.models.find((m) => m.id === activeId) ?? figure.models[0];
  const recallDiff = current.recall - figure.baselineRecall;
  const precisionDiff = current.precision - figure.baselinePrecision;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption font-medium text-ink">Test set benchmark (2019–2020)</p>
        <div role="group" aria-label="Compare forecast models" className="flex gap-1">
          {figure.models.map((m) => (
            <button key={m.id} type="button" aria-pressed={m.id === current.id} onClick={() => setActiveId(m.id)} className={PILL_BTN}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid gap-2.5 rounded-tag border border-rule bg-surface p-2.5">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="type-caption text-ink-muted">Peak-day recall</dt>
            <dd className="whitespace-nowrap type-caption tabular-nums text-ink">
              <span className="font-semibold">{current.recall}%</span>{" "}
              <span className="text-ink-muted">
                {recallDiff === 0 ? "(baseline)" : `(${recallDiff > 0 ? "+" : ""}${recallDiff}% vs 73%)`}
              </span>
            </dd>
          </div>
          <div aria-hidden="true" className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-rule">
            <div
              className="h-full bg-pen transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none"
              style={{ width: `${current.recall}%` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-margin" style={{ left: `${figure.baselineRecall}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="type-caption text-ink-muted">Precision</dt>
            <dd className="whitespace-nowrap type-caption tabular-nums text-ink">
              <span className="font-semibold">{current.precision}%</span>{" "}
              <span className="text-ink-muted">
                {precisionDiff === 0 ? "(baseline)" : `(${precisionDiff > 0 ? "+" : ""}${precisionDiff}% vs 73%)`}
              </span>
            </dd>
          </div>
          <div aria-hidden="true" className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-rule">
            <div
              className="h-full bg-ink/75 transition-[width] duration-(--duration-base) ease-out motion-reduce:transition-none"
              style={{ width: `${current.precision}%` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-margin" style={{ left: `${figure.baselinePrecision}%` }} />
          </div>
        </div>
      </dl>

      <p className="truncate type-caption text-ink-muted" title={current.note}>
        {current.note}
      </p>
    </div>
  );
}

/** สเกลจำลองระดับน้ำเทียบล้อรถมาตรฐาน 60 cm (Smart Flood AI — วางคู่กับ BenchmarkFigure จึงคุมโครงสร้าง 3 แถวให้สูงเท่ากัน) */
function GaugeFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "gauge" }> }) {
  const sliderId = useId();
  const [depthCm, setDepthCm] = useState(figure.sampleCm);
  const pctWheel = Math.round((depthCm / figure.wheelCm) * 100);
  const status = depthCm >= figure.criticalCm ? "Critical" : depthCm >= figure.warningCm ? "Warning" : "Normal";
  const badgeTone =
    depthCm >= figure.criticalCm
      ? "border-margin bg-margin/15 text-ink"
      : depthCm >= figure.warningCm
        ? "border-on-marker/50 bg-marker text-on-marker"
        : "border-stroke bg-surface text-ink";

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={sliderId} className="type-caption font-medium text-ink">
          Wheel-depth gauge (60 cm ref)
        </label>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-tag border px-2.5 type-caption font-semibold tabular-nums ${badgeTone}`}>
            {depthCm} cm ({pctWheel}%) · {status}
          </span>
          <button
            type="button"
            onClick={() => setDepthCm(figure.sampleCm)}
            className="h-7 shrink-0 whitespace-nowrap rounded-tag border border-stroke bg-surface px-2 type-caption text-ink transition-colors duration-(--duration-fast) hover:border-pen hover:text-pen"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-2.5 rounded-tag border border-rule bg-surface p-2.5">
        <div>
          <div className="flex items-baseline justify-between gap-2 type-caption tabular-nums text-ink-muted">
            <span>0 cm</span>
            <span>{figure.warningCm} cm Warn</span>
            <span className="text-margin">{figure.criticalCm} cm Critical</span>
            <span>60 cm</span>
          </div>
          <div aria-hidden="true" className="relative mt-1 h-2.5 w-full overflow-hidden rounded-full bg-rule">
            <span
              className="absolute inset-y-0 left-0 bg-pen transition-[width] duration-(--duration-fast)"
              style={{ width: `${Math.min(100, (depthCm / figure.wheelCm) * 100)}%` }}
            />
            <span
              className="absolute inset-y-0 w-0.5 bg-stroke"
              style={{ left: `${(figure.warningCm / figure.wheelCm) * 100}%` }}
            />
            <span
              className="absolute inset-y-0 w-0.5 bg-margin"
              style={{ left: `${(figure.criticalCm / figure.wheelCm) * 100}%` }}
            />
          </div>
        </div>

        <input
          id={sliderId}
          type="range"
          min={0}
          max={55}
          step={1}
          value={depthCm}
          onChange={(e) => setDepthCm(Number(e.target.value))}
          className="h-5 w-full cursor-pointer accent-pen"
        />
      </div>

      <p className="truncate type-caption text-ink-muted">
        Submerged share × {figure.wheelCm} cm wheel · {figure.sampleLabel}
      </p>
    </div>
  );
}

/** กราฟ Dumbbell เทียบช่องว่างระหว่างสัดส่วนสองชุด (วางคู่กับ MstFigure จึงจัด 3 แถวกะทัดรัดในกล่องขนาดเท่ากัน) */
function DumbbellFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "dumbbell" }> }) {
  const [activeRow, setActiveRow] = useState(0);
  const current = figure.rows[activeRow] ?? figure.rows[0];
  const currentGap = current.student - current.model;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption font-medium text-ink">Perception vs RF weight</p>
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
      </div>

      <dl className="grid gap-1.5 rounded-tag border border-rule bg-surface p-2.5">
        {figure.rows.map((row, idx) => {
          const left = Math.min(row.student, row.model);
          const span = Math.abs(row.student - row.model);
          const selected = idx === activeRow;
          // สเกล 15–45% ขยายให้เห็นระยะห่างตรงกลางหลอดชัดเจน
          const toPct = (v: number) => `${Math.min(96, Math.max(4, ((v - 15) / 30) * 100))}%`;

          return (
            <div
              key={row.label}
              onClick={() => setActiveRow(idx)}
              className={`grid cursor-pointer grid-cols-[7.5rem_minmax(0,1fr)_5.25rem] items-center gap-2 rounded-tag px-1.5 py-1 transition-colors duration-(--duration-fast) sm:grid-cols-[9rem_minmax(0,1fr)_5.5rem] ${
                selected ? "bg-paper" : "hover:bg-paper/60"
              }`}
            >
              <dt className="truncate type-caption font-medium text-ink">{row.label}</dt>
              <div aria-hidden="true" className="relative flex h-2 items-center rounded-full bg-rule">
                <span className="absolute h-1 bg-margin" style={{ left: toPct(left), width: `${(span / 30) * 100}%` }} />
                <span
                  className="absolute size-2.5 -translate-x-1/2 rounded-full border border-on-marker bg-marker"
                  style={{ left: toPct(row.student) }}
                />
                <span className="absolute size-2.5 -translate-x-1/2 rounded-full bg-pen" style={{ left: toPct(row.model) }} />
              </div>
              <dd className="whitespace-nowrap text-right type-caption tabular-nums text-ink-muted">
                <span className="text-ink">{Math.round(row.student)}%</span> vs{" "}
                <span className="font-semibold text-pen">{Math.round(row.model)}%</span>
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="truncate type-caption text-ink-muted">
        {current.label}: students {current.student.toFixed(1)}% vs RF model {current.model.toFixed(1)}% (
        {currentGap > 0 ? `+${currentGap.toFixed(1)}%` : `${currentGap.toFixed(1)}%`} gap)
      </p>
    </div>
  );
}

/** จำลองการเลือกเส้นเชื่อม Minimum Spanning Tree ทีละขั้นจาก vertex 1 (วางคู่กับ DumbbellFigure) */
function MstFigure({ figure }: { figure: Extract<ProjectLabFigure, { kind: "mst" }> }) {
  const maxStep = figure.nodes.length - 1;
  const [step, setStep] = useState(maxStep);

  const activeEdges = figure.edges.filter((e) => e.inMstStep !== undefined && e.inMstStep <= step);
  const totalCost = activeEdges.reduce((sum, e) => sum + e.weight, 0);
  const reachedNodes = new Set<number>([1, ...activeEdges.flatMap((e) => [e.from, e.to])]);
  const latestEdge = activeEdges.find((e) => e.inMstStep === step);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-caption font-medium text-ink">Interactive MST step-by-step</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStep((s) => (s <= 0 ? maxStep : s - 1))}
            className="h-7 shrink-0 whitespace-nowrap rounded-tag border border-stroke bg-surface px-2.5 type-caption text-ink transition-colors duration-(--duration-fast) hover:border-pen hover:text-pen"
          >
            Step −
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => (s >= maxStep ? 0 : s + 1))}
            className="h-7 shrink-0 whitespace-nowrap rounded-tag border border-stroke bg-surface px-2.5 type-caption text-ink transition-colors duration-(--duration-fast) hover:border-pen hover:text-pen"
          >
            Step + ({step}/{maxStep})
          </button>
        </div>
      </div>

      <div className="flex h-[5.75rem] items-center justify-between gap-3 rounded-tag border border-rule bg-surface px-3 py-2">
        <svg viewBox="0 0 190 96" aria-hidden="true" className="h-full w-40 shrink-0 overflow-visible">
          {figure.edges.map((e) => {
            const u = figure.nodes.find((n) => n.id === e.from)!;
            const v = figure.nodes.find((n) => n.id === e.to)!;
            const chosen = e.inMstStep !== undefined && e.inMstStep <= step;
            const mx = (u.x + v.x) / 2;
            const my = (u.y + v.y) / 2;
            return (
              <g key={`${e.from}-${e.to}`}>
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  className={chosen ? "stroke-pen" : "stroke-rule"}
                  strokeWidth={chosen ? 2.5 : 1.25}
                  strokeDasharray={chosen ? undefined : "3 3"}
                />
                <text x={mx} y={my - 4} textAnchor="middle" className="fill-ink-muted text-12 tabular-nums">
                  {e.weight}
                </text>
              </g>
            );
          })}
          {figure.nodes.map((n) => {
            const active = reachedNodes.has(n.id);
            return (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={10}
                  className={active ? "fill-pen stroke-pen" : "fill-paper stroke-stroke"}
                  strokeWidth={1.5}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  className={`text-12 font-semibold tabular-nums ${active ? "fill-on-pen" : "fill-ink"}`}
                >
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="min-w-0 flex-1 text-right">
          <p className="type-caption text-ink-muted">Total MST cost</p>
          <p className="mt-0.5 whitespace-nowrap type-title tabular-nums text-ink">
            {totalCost} {figure.unit}
          </p>
          <p className="mt-0.5 whitespace-nowrap type-caption tabular-nums text-ink-muted">
            {reachedNodes.size}/{figure.nodes.length} vertices
          </p>
        </div>
      </div>

      <p className="truncate type-caption text-ink-muted">
        {latestEdge
          ? `Pass ${step}: added edge (${latestEdge.from} → ${latestEdge.to}) with weight ${latestEdge.weight} ${figure.unit}`
          : "Pass 0: starting from vertex 1 before edge selection"}
      </p>
    </div>
  );
}
